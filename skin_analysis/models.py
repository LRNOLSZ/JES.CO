from decimal import Decimal
from django.db import models

# Universal single price, quoted in USD as the standard reference amount — shown
# to every visitor regardless of region. Paystack (Ghana account) can only ever
# settle in GHS, so the actual charge is converted to GHS at today's rate right
# before payment, same mechanism as the shop checkout (see products/views.py /
# CartPage.jsx) — the GHS amount charged will vary slightly day to day, the USD
# price does not.
SKIN_ANALYSIS_PRICE_USD = Decimal('100.00')


class SkinAnalysisSubmission(models.Model):

    SKIN_TONE_CHOICES = [
        ('fair',       'Fair'),
        ('light',      'Light'),
        ('medium',     'Medium'),
        ('tan',        'Tan'),
        ('deep',       'Deep'),
        ('very_deep',  'Very Deep'),
    ]
    UNDERTONE_CHOICES = [
        ('warm',     'Warm'),
        ('cool',     'Cool'),
        ('neutral',  'Neutral'),
        ('not_sure', 'Not sure'),
    ]
    SKIN_TYPE_CHOICES = [
        ('oily',        'Oily'),
        ('dry',         'Dry'),
        ('combination', 'Combination'),
        ('normal',      'Normal'),
        ('sensitive',   'Sensitive'),
    ]
    SKIN_CONCERN_CHOICES = [
        ('acne',            'Acne/breakouts'),
        ('hyperpigmentation','Hyperpigmentation'),
        ('dryness',         'Dryness'),
        ('aging',           'Fine lines/aging'),
        ('uneven_texture',  'Uneven texture'),
        ('other',           'Other'),
    ]
    ALLERGIES_CHOICES = [
        ('yes', 'Yes'),
        ('no',  'No'),
    ]
    MAKEUP_ROUTINE_CHOICES = [
        ('full_glam',         'Full glam'),
        ('natural_everyday',  'Natural everyday'),
        ('special_occasions', 'Special occasions only'),
        ('none',              "Don't wear makeup"),
    ]
    FOUNDATION_FINISH_CHOICES = [
        ('matte',         'Matte'),
        ('dewy',          'Dewy'),
        ('natural_satin', 'Natural-satin'),
        ('not_sure',      'Not sure'),
    ]
    OCCASION_CHOICES = [
        ('everyday',         'Everyday wear'),
        ('bridal',           'Bridal'),
        ('photoshoot',       'Photoshoot/editorial'),
        ('event',            'Event/party'),
        ('skincare_routine', 'General skincare routine'),
    ]
    BUDGET_CHOICES = [
        ('budget_friendly', 'Budget-friendly'),
        ('mid_range',       'Mid-range'),
        ('luxury',          'Luxury'),
        ('no_preference',   'No preference'),
    ]

    full_name         = models.CharField(max_length=200, blank=True)
    email             = models.EmailField()

    skin_tone         = models.CharField(max_length=20, choices=SKIN_TONE_CHOICES)
    undertone         = models.CharField(max_length=20, choices=UNDERTONE_CHOICES)
    skin_type         = models.CharField(max_length=20, choices=SKIN_TYPE_CHOICES)
    skin_concern      = models.CharField(max_length=20, choices=SKIN_CONCERN_CHOICES)
    allergies         = models.CharField(max_length=10, choices=ALLERGIES_CHOICES)
    allergies_detail  = models.CharField(max_length=300, blank=True, help_text='Only used if allergies = Yes')
    makeup_routine    = models.CharField(max_length=20, choices=MAKEUP_ROUTINE_CHOICES)
    foundation_finish = models.CharField(max_length=20, choices=FOUNDATION_FINISH_CHOICES)
    occasion          = models.CharField(max_length=20, choices=OCCASION_CHOICES)
    budget            = models.CharField(max_length=20, choices=BUDGET_CHOICES)
    additional_notes  = models.TextField(blank=True, max_length=1000)

    is_paid           = models.BooleanField(default=False)
    paystack_reference = models.CharField(max_length=100, blank=True)
    amount_paid       = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    replied           = models.BooleanField(default=False,
                          help_text="Tick once you've personally emailed this customer your recommendation.")
    created_at        = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering            = ['-created_at']
        verbose_name        = 'Skin Analysis Submission'
        verbose_name_plural = 'Skin Analysis Submissions'

    def __str__(self):
        return f'{self.email} — {"Paid" if self.is_paid else "Unpaid"} ({self.created_at:%Y-%m-%d})'
