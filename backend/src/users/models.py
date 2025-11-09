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