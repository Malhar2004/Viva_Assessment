# Generated by Django 5.1.2 on 2024-10-25 07:49

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('Viva', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='profile',
            name='auth_token',
        ),
    ]
