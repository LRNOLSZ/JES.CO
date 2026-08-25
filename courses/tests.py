from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from .models import Course, CourseComment, CoursePurchase, CourseSession, CourseTier, VideoHeartbeat, ProcessedPaymentEvent
from .views import _process_course_charge


# F-05 regression tests — the "max 2 concurrent streams" limit must be scoped
# to the requesting student's own devices, never other students' viewers.
class VideoHeartbeatTests(TestCase):
    def setUp(self):
        tier = CourseTier.objects.create(name='Basic')
        self.course = Course.objects.create(
            title='Test Course', description='d', category='foundation', tier=tier, is_active=True,
        )

    def _stream(self, email):
        """Simulate an actively-streaming student: a valid purchase, a CourseSession,
        and a fresh VideoHeartbeat for that session."""
        CoursePurchase.objects.create(
            email=email, course=self.course, expires_at=timezone.now() + timezone.timedelta(days=1),
        )
        session = CourseSession.create_for_email(email)
        VideoHeartbeat.objects.create(session_key=session.session_key, course=self.course, ip_address='127.0.0.1')
        return session

    def _heartbeat(self, session):
        url = reverse('course-heartbeat', kwargs={'slug': self.course.slug})
        return self.client.post(url, HTTP_X_COURSE_SESSION=session.session_key)

    def test_other_students_streaming_does_not_block_a_new_student(self):
        self._stream('student-a@example.com')
        self._stream('student-b@example.com')

        purchaser = CourseSession.create_for_email('student-c@example.com')
        CoursePurchase.objects.create(
            email='student-c@example.com', course=self.course,
            expires_at=timezone.now() + timezone.timedelta(days=1),
        )

        response = self._heartbeat(purchaser)
        self.assertTrue(response.data['allowed'])

    def test_same_student_third_device_is_still_blocked(self):
        email = 'student-d@example.com'
        CoursePurchase.objects.create(
            email=email, course=self.course, expires_at=timezone.now() + timezone.timedelta(days=1),
        )
        # Two devices already streaming (CourseSession.MAX_SESSIONS == 2, so a
        # 3rd create_for_email() call below evicts the oldest of these).
        session_1 = CourseSession.create_for_email(email)
        VideoHeartbeat.objects.create(session_key=session_1.session_key, course=self.course, ip_address='127.0.0.1')
        session_2 = CourseSession.create_for_email(email)
        VideoHeartbeat.objects.create(session_key=session_2.session_key, course=self.course, ip_address='127.0.0.1')

        # A 3rd concurrent heartbeat from the same email, on a still-active
        # session distinct from the two already streaming, must be blocked.
        session_3 = CourseSession.objects.create(
            email=email, session_key='third-device-session-key',
            expires_at=timezone.now() + timezone.timedelta(hours=8),
        )
        response = self._heartbeat(session_3)
        self.assertFalse(response.data['allowed'])


# F-11 regression tests — a delayed/duplicate Paystack webhook retry must never
# re-extend access, and price_paid must record the amount actually charged, not
# just the current catalog price. send_branded_email is mocked so these tests
# never make a real network call.
@patch('courses.views.send_branded_email')
class ProcessCourseChargeIdempotencyTests(TestCase):
    def setUp(self):
        tier = CourseTier.objects.create(name='Basic')
        self.course = Course.objects.create(
            title='Test Course', description='d', category='foundation', tier=tier,
            is_active=True, price=500,
        )

    def _charge_data(self, amount_pesewas, reference):
        return {
            'customer': {'email': 'student@example.com'},
            'reference': reference,
            'amount': amount_pesewas,
            'metadata': {'course_slug': self.course.slug},
        }

    def test_webhook_replay_after_renewal_does_not_re_extend_access(self, mock_email):
        # Initial purchase: reference A.
        _process_course_charge(self._charge_data(50000, 'ref-a'))
        purchase = CoursePurchase.objects.get(email='student@example.com', course=self.course)
        expires_after_initial = purchase.expires_at

        # Renewal: reference B overwrites the same row (unique_together email+course).
        _process_course_charge(self._charge_data(50000, 'ref-b'))
        purchase.refresh_from_db()
        expires_after_renewal = purchase.expires_at
        self.assertGreater(expires_after_renewal, expires_after_initial)

        # A delayed retry of the original reference A payload arrives late —
        # must be a no-op, not another 180-day extension.
        _process_course_charge(self._charge_data(50000, 'ref-a'))
        purchase.refresh_from_db()
        self.assertEqual(purchase.expires_at, expires_after_renewal)
        self.assertEqual(ProcessedPaymentEvent.objects.count(), 2)

    def test_price_paid_records_actual_amount_charged(self, mock_email):
        # Course catalog price is 500 GHS, but this transaction actually settled
        # at 550 GHS (e.g. a price bump mid-checkout) — price_paid must reflect
        # what was really charged, not course.price.
        _process_course_charge(self._charge_data(55000, 'ref-actual'))
        purchase = CoursePurchase.objects.get(email='student@example.com', course=self.course)
        self.assertEqual(purchase.price_paid, 550)


# F-17 regression tests — a course accidentally left at its default price=0 must
# never silently grant access, regardless of what amount was actually paid.
@patch('courses.views.send_branded_email')
@override_settings(MAAME_AMA_EMAIL='admin@example.com')
class ZeroPriceCourseGuardTests(TestCase):
    def setUp(self):
        # The zero-price alert is deliberately deduped per-course for 24h — clear
        # the cache so one test's alert doesn't suppress the next test's (both
        # tests use the same course slug, sharing the same dedup cache key).
        cache.clear()
        tier = CourseTier.objects.create(name='Basic')
        self.course = Course.objects.create(
            title='Misconfigured Course', description='d', category='foundation', tier=tier,
            is_active=True, price=0,
        )

    def _charge_data(self, amount_pesewas, reference):
        return {
            'customer': {'email': 'student@example.com'},
            'reference': reference,
            'amount': amount_pesewas,
            'metadata': {'course_slug': self.course.slug},
        }

    def test_zero_amount_against_zero_price_course_is_blocked(self, mock_email):
        response = _process_course_charge(self._charge_data(0, 'ref-zero'))
        self.assertEqual(response.data, {'detail': 'Flagged for review.'})
        self.assertFalse(CoursePurchase.objects.filter(course=self.course).exists())
        self.assertTrue(mock_email.called)

    def test_real_payment_against_zero_price_course_is_still_blocked(self, mock_email):
        # A genuine nonzero payment must not slip through just because it's
        # technically "more than" the broken GHS 0 expectation.
        response = _process_course_charge(self._charge_data(10000, 'ref-real-payment'))
        self.assertEqual(response.data, {'detail': 'Flagged for review.'})
        self.assertFalse(CoursePurchase.objects.filter(course=self.course).exists())


# F-12 regression tests — the public course-detail endpoint must never expose a
# commenter's raw email (reviews now live solely on the testimonial pipeline,
# not inline on the course page), and a nickname is required for every new
# comment submission going forward.
class CourseCommentPublicApiTests(TestCase):
    def setUp(self):
        tier = CourseTier.objects.create(name='Basic')
        self.course = Course.objects.create(
            title='Test Course', description='d', category='foundation', tier=tier, is_active=True,
        )
        CourseComment.objects.create(
            course=self.course, email='leaked@example.com', name='Kojo',
            body='Great course!', is_approved=True,
        )

    def test_course_detail_does_not_expose_comment_email(self):
        url = reverse('course-detail', kwargs={'slug': self.course.slug})
        response = self.client.get(url)
        self.assertNotIn('approved_comments', response.data)
        self.assertNotIn('leaked@example.com', response.content.decode())

    def test_comment_submission_requires_nickname(self):
        email = 'student@example.com'
        CoursePurchase.objects.create(
            email=email, course=self.course, expires_at=timezone.now() + timezone.timedelta(days=1),
        )
        session = CourseSession.create_for_email(email)
        url = reverse('course-comment', kwargs={'slug': self.course.slug})
        response = self.client.post(
            url, {'body': 'no nickname given'}, HTTP_X_COURSE_SESSION=session.session_key,
        )
        self.assertEqual(response.status_code, 400)


# F-14 regression test — the magic-link request endpoint must never let a
# response shape (status code / body) reveal whether a given email has course
# access. send_branded_email is mocked so no real network call happens; its
# call count is the real signal for "was an email actually sent."
@patch('courses.views.send_branded_email')
class RequestAccessLinkEnumerationTests(TestCase):
    def setUp(self):
        tier = CourseTier.objects.create(name='Basic')
        self.course = Course.objects.create(
            title='Test Course', description='d', category='foundation', tier=tier, is_active=True,
        )
        CoursePurchase.objects.create(
            email='real-student@example.com', course=self.course,
            expires_at=timezone.now() + timezone.timedelta(days=1),
        )

    def _request(self, email):
        url = reverse('course-access-request')
        return self.client.post(url, {'email': email}, content_type='application/json')

    def test_known_and_unknown_email_get_identical_response(self, mock_email):
        known_response   = self._request('real-student@example.com')
        unknown_response = self._request('nobody@example.com')

        self.assertEqual(known_response.status_code, 200)
        self.assertEqual(unknown_response.status_code, 200)
        self.assertEqual(known_response.data, unknown_response.data)

    def test_email_only_sent_for_email_with_actual_access(self, mock_email):
        self._request('nobody@example.com')
        self.assertFalse(mock_email.called)

        self._request('real-student@example.com')
        self.assertTrue(mock_email.called)
