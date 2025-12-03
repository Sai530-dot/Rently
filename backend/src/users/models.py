from django.db import models
from django.contrib.auth.models import AbstractUser


class CustomUser(AbstractUser):
    USER_TYPE_CHOICES = (
        ('student', 'Student'),
        ('landlord', 'Landlord'),
    )
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES)
    phone = models.CharField(max_length=20, blank=True, null=True)
    university = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.email} ({self.user_type})"


class RoommateProfile(models.Model):
    CLEANLINESS_CHOICES = (
        ('messy', 'Messy'),
        ('moderate', 'Moderate'),
        ('clean', 'Clean'),
        ('very_clean', 'Very Clean'),
    )
    SLEEP_CHOICES = (
        ('early_bird', 'Early Bird'),
        ('night_owl', 'Night Owl'),
        ('flexible', 'Flexible'),
    )

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='roommate_profile')
    budget_max = models.FloatField(default=0)
    rent_ask = models.FloatField(default=0)  # what they'd like to pay
    cleanliness = models.CharField(max_length=20, choices=CLEANLINESS_CHOICES, default='moderate')
    sleep_schedule = models.CharField(max_length=20, choices=SLEEP_CHOICES, default='flexible')
    interests = models.JSONField(default=list, blank=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    major = models.CharField(max_length=100, blank=True, null=True)
    avatar = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Roommate profile for {self.user.email}"
