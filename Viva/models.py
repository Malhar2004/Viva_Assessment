from django.db import models
from django.contrib.auth.models import User

# Optional: If you want to extend the User model
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    # Add additional fields here, for example:
    # bio = models.TextField(blank=True)
