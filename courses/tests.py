from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from .models import Course, CoursePurchase, CourseSession, CourseTier, VideoHeartbeat


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
