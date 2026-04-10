from .database import db
from .models import Notification

def send_sms(user_id, phone, message):
    """
    Sends a fake SMS by printing it to the console and saving it to the database.
    Can be replaced with Twilio or another SMS provider later.
    """
    print("\n" + "[SMS]" + "="*35)
    print(f" FAKE SMS SENT TO: {phone}")
    print(f" MESSAGE: {message}")
    print("="*40 + "\n")
    
    # Save a record of the notification
    n = Notification(user_id=user_id, message=message, channel='SMS', is_read=True)
    db.session.add(n)
    db.session.commit()
    return True

def send_email(user_id, email, subject, body):
    """
    Sends a fake Email by printing it to the console and saving it to the database.
    Can be replaced with SendGrid or another Email provider later.
    """
    print("\n" + "[EMAIL]" + "="*33)
    print(f" FAKE EMAIL SENT TO: {email}")
    print(f" SUBJECT: {subject}")
    print(f" BODY: {body}")
    print("="*40 + "\n")
    
    # Save a record of the notification
    n = Notification(user_id=user_id, message=f"[{subject}] {body}", channel='EMAIL', is_read=True)
    db.session.add(n)
    db.session.commit()
    return True
