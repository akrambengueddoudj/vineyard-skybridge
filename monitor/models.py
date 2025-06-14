from django.db import models
from django.utils import timezone

class SprayedCell(models.Model):
    x = models.IntegerField()  # Column (0-14)
    y = models.IntegerField()  # Row (0-9)
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['x', 'y']),
        ]

class DailySpray(models.Model):
    date = models.DateField(unique=True)
    count = models.IntegerField(default=0)
    exceeded_threshold = models.BooleanField(default=False)
    most_sprayed_column = models.IntegerField(null=True, blank=True)
    spray_pattern = models.JSONField(default=dict)  # Stores {column: count}
    
    class Meta:
        ordering = ['-date']