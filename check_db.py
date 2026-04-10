import os
import sys

# Ensure backend/ is on sys.path
sys.path.insert(0, os.path.join(os.getcwd(), "backend"))

from backend.app import create_app
from backend.models import Notification, Appointment
from backend.database import db

app = create_app()
with app.app_context():
    notifications = Notification.query.all()
    print(f"Total Notifications in DB: {len(notifications)}")
    for n in notifications:
        print(f"[{n.channel}] to User {n.user_id}: {n.message}")
    
    # Also check if appointment was updated
    appts = Appointment.query.all()
    for appt in appts:
        print(f"Appointment {appt.id}: Reminder={appt.reminder_sent}, ReviewPrompt={appt.review_prompt_sent}")
