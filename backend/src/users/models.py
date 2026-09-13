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
    company = models.CharField(max_length=255, blank=True)

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
    bio = models.CharField(max_length=500, blank=True)
    num_roommates = models.PositiveSmallIntegerField(default=1)
    completed = models.BooleanField(default=False)

    def __str__(self):
        return f"Roommate profile for {self.user.email}"


class Property(models.Model):
    LISTING_STATUS_CHOICES = [
        ('active', 'Active at source'),
        ('unavailable', 'Unavailable at source'),
        ('unknown', 'Source availability unknown'),
    ]

    owner = models.ForeignKey(CustomUser, null=True, blank=True, on_delete=models.CASCADE, related_name='properties')
    title = models.CharField(max_length=200)
    address = models.CharField(max_length=300)
    city = models.CharField(max_length=100)
    province = models.CharField(max_length=2, blank=True)
    rent = models.DecimalField(max_digits=10, decimal_places=2)
    bedrooms = models.PositiveSmallIntegerField(default=1, null=True, blank=True)
    bathrooms = models.DecimalField(max_digits=3, decimal_places=1, default=1, null=True, blank=True)
    property_type = models.CharField(max_length=30, default='Apartment')
    description = models.TextField(blank=True)
    # `image` remains the backwards-compatible card thumbnail. Imported image
    # galleries are stored separately so a source snapshot does not depend on
    # the marketplace page remaining available.
    image = models.URLField(max_length=2000, blank=True)
    images = models.JSONField(default=list, blank=True)
    square_feet = models.PositiveIntegerField(null=True, blank=True)
    parking = models.CharField(max_length=200, blank=True)
    pets = models.CharField(max_length=200, blank=True)
    utilities = models.JSONField(default=list, blank=True)
    appliances = models.JSONField(default=list, blank=True)
    features = models.JSONField(default=list, blank=True)
    lease_term = models.CharField(max_length=200, blank=True)
    available_date = models.CharField(max_length=200, blank=True)
    lat = models.FloatField(null=True, blank=True)
    lon = models.FloatField(null=True, blank=True)
    active = models.BooleanField(default=True)
    source_url = models.URLField(max_length=2000, blank=True)
    source_key = models.CharField(max_length=64, unique=True, null=True, blank=True)
    source_listing_id = models.CharField(max_length=200, blank=True)
    listing_status = models.CharField(max_length=20, choices=LISTING_STATUS_CHOICES, default='unknown')
    last_checked = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class SavedProperty(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='saved_properties')
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['user', 'property'], name='unique_saved_property')]


class RoommateDecision(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='roommate_decisions')
    candidate = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='received_decisions')
    liked = models.BooleanField()

    class Meta:
        constraints = [models.UniqueConstraint(fields=['user', 'candidate'], name='unique_roommate_decision')]


class Conversation(models.Model):
    # Canonical ordering makes starting a conversation idempotent from either account.
    user_low = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='conversations_low')
    user_high = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='conversations_high')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['user_low', 'user_high'], name='unique_conversation')]


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['created_at', 'id']
