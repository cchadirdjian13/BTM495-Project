"""
app.py - Flask REST API for the Barber Shop Appointment System.

Now backed by a local SQLite database using Flask-SQLAlchemy instead of in-memory state.
"""

import os
from datetime import datetime, timedelta, date
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_apscheduler import APScheduler

from .database import db
from .models import User, Service, Availability, Appointment, Payment, Review, Notification
from .notifications import send_sms, send_email

app = Flask(__name__)
app.secret_key = "barber-shop-secret-2026"

scheduler = APScheduler()

# Configure SQLite Database
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'barbershop.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
CORS(app, supports_credentials=True)


# ── helpers ──────────────────────────────────────────────────────────

def ok(data=None, status=200):
    return jsonify({"ok": True, "data": data}), status


def err(msg, status=400):
    return jsonify({"ok": False, "error": msg}), status


def current_user():
    uid = session.get("user_id")
    if uid is None:
        return None
    return User.query.get(uid)


def require_auth():
    u = current_user()
    if u is None:
        return None, err("Not authenticated", 401)
    return u, None


def push_notification(user_id, message):
    n = Notification(user_id=user_id, message=message)
    db.session.add(n)
    db.session.commit()
    return n

# ── serializers ──────────────────────────────────────────────────────

def serialise_user(user: User) -> dict:
    d = {
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
    }
    if user.role == "barber":
        d["rating"] = round(user.rating, 2) if user.rating else 0.0
        d["specialties"] = user.specialties.split(",") if user.specialties else []
    return d


def serialise_appointment(appt: Appointment) -> dict:
    return {
        "appointment_id": appt.id,
        "client": serialise_user(appt.client),
        "barber": serialise_user(appt.barber),
        "service": {
            "service_id": appt.service.id,
            "name": appt.service.name,
            "duration": appt.service.duration,
            "price": appt.service.price,
        },
        "datetime": appt.datetime.isoformat(),
        "status": appt.status,
        "payments": [serialise_payment(p) for p in appt.payments],
    }


def serialise_payment(pmt: Payment) -> dict:
    return {
        "payment_id": pmt.id,
        "appointment_id": pmt.appointment_id,
        "amount": pmt.amount,
        "method": pmt.method,
        "status": pmt.status,
        "timestamp": pmt.timestamp.isoformat() if pmt.timestamp else None,
    }


def serialise_review(rev: Review) -> dict:
    client = User.query.get(rev.client_id)
    return {
        "review_id": rev.id,
        "client_id": rev.client_id,
        "client_name": client.name if client else "Unknown Client",
        "barber_id": rev.barber_id,
        "rating": rev.rating,
        "comment": rev.comment,
        "timestamp": rev.timestamp.isoformat() if rev.timestamp else None,
    }


def serialise_slot(slot: Availability) -> dict:
    return {
        "slot_id": slot.id,
        "barber_id": slot.barber_id,
        "date": slot.date,
        "start_time": slot.start_time,
        "end_time": slot.end_time,
        "is_booked": slot.is_booked,
    }


def serialise_notification(n: Notification) -> dict:
    return {
        "notification_id": n.id,
        "user_id": n.user_id,
        "message": n.message,
        "is_read": n.is_read,
        "timestamp": n.timestamp.isoformat() if n.timestamp else None,
    }


# ══════════════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════════════

@app.route("/api/auth/register", methods=["POST"])
def register():
    body = request.get_json() or {}
    required = ("name", "email", "password", "phone", "role")
    if missing := [f for f in required if not body.get(f)]:
        return err(f"Missing fields: {', '.join(missing)}")
        
    if User.query.filter_by(email=body["email"].lower()).first():
        return err("Email already registered")
        
    user = User(
        name=body["name"],
        email=body["email"].lower(),
        password=body["password"], # In a real app, hash this!
        phone=body["phone"],
        role=body["role"]
    )
    db.session.add(user)
    db.session.commit()
    
    session["user_id"] = user.id
    session["user_email"] = user.email
    return ok(serialise_user(user), 201)


@app.route("/api/auth/login", methods=["POST"])
def login():
    body = request.get_json() or {}
    email = (body.get("email") or "").strip().lower()
    password = body.get("password", "")

    if not email or not password:
        return err("Email and password required")

    user = User.query.filter_by(email=email).first()
    if not user or user.password != password:
        return err("Invalid email or password", 401)

    session["user_id"] = user.id
    session["user_email"] = user.email
    return ok(serialise_user(user))


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return ok()


@app.route("/api/auth/me", methods=["GET"])
def me():
    u, e = require_auth()
    if e:
        return e
    return ok(serialise_user(u))


# ══════════════════════════════════════════════════════════════════════
# SERVICES & BARBERS
# ══════════════════════════════════════════════════════════════════════

@app.route("/api/services", methods=["GET"])
def list_services():
    services = Service.query.all()
    return ok([{
        "service_id": s.id,
        "name": s.name,
        "duration": s.duration,
        "price": s.price,
    } for s in services])


@app.route("/api/barbers", methods=["GET"])
def list_barbers():
    barbers = User.query.filter_by(role="barber").all()
    return ok([serialise_user(b) for b in barbers])


@app.route("/api/barbers/<int:barber_id>", methods=["GET"])
def get_barber(barber_id):
    barber = User.query.filter_by(id=barber_id, role="barber").first()
    if not barber:
        return err("Barber not found", 404)
    return ok(serialise_user(barber))


# ══════════════════════════════════════════════════════════════════════
# AVAILABILITY
# ══════════════════════════════════════════════════════════════════════

@app.route("/api/barbers/<int:barber_id>/availability", methods=["GET"])
def get_availability(barber_id):
    date_filter = request.args.get("date")
    q = Availability.query.filter_by(barber_id=barber_id)
    if date_filter:
        q = q.filter_by(date=date_filter)
        
    slots = q.order_by(Availability.date, Availability.start_time).all()
    return ok([serialise_slot(s) for s in slots])


@app.route("/api/availability", methods=["POST"])
def add_availability():
    u, e = require_auth()
    if e: return e
    if u.role != "barber":
        return err("Only barbers can set availability", 403)

    body = request.get_json() or {}
    required = ("date", "start_time", "end_time")
    if missing := [f for f in required if not body.get(f)]:
        return err(f"Missing fields: {', '.join(missing)}")

    slot = Availability(
        barber_id=u.id,
        date=body["date"],
        start_time=body["start_time"],
        end_time=body["end_time"],
    )
    db.session.add(slot)
    db.session.commit()
    return ok(serialise_slot(slot), 201)


# ══════════════════════════════════════════════════════════════════════
# APPOINTMENTS
# ══════════════════════════════════════════════════════════════════════

@app.route("/api/appointments", methods=["GET"])
def list_appointments():
    u, e = require_auth()
    if e: return e

    if u.role == "barber":
        appts = Appointment.query.filter_by(barber_id=u.id).order_by(Appointment.datetime.desc()).all()
    else:
        appts = Appointment.query.filter_by(client_id=u.id).order_by(Appointment.datetime.desc()).all()
        
    return ok([serialise_appointment(a) for a in appts])


@app.route("/api/appointments", methods=["POST"])
def book_appointment():
    u, e = require_auth()
    if e: return e
    if u.role == "barber":
        return err("Barbers cannot book appointments", 403)

    body = request.get_json() or {}
    required = ("barber_id", "service_id", "slot_id", "datetime")
    if missing := [f for f in required if not body.get(f)]:
        return err(f"Missing fields: {', '.join(missing)}")

    barber = User.query.filter_by(id=body["barber_id"], role="barber").first()
    if not barber: return err("Barber not found", 404)

    svc = Service.query.get(body["service_id"])
    if not svc: return err("Service not found", 404)

    slot = Availability.query.get(body["slot_id"])
    if not slot: return err("Slot not found", 404)
    if slot.is_booked: return err("Slot already booked", 409)

    try:
        dt = datetime.fromisoformat(body["datetime"])
    except ValueError:
        return err("Invalid datetime format")

    slot.is_booked = True
    appt = Appointment(
        client_id=u.id,
        barber_id=barber.id,
        service_id=svc.id,
        datetime=dt,
        status="Confirmed" # Auto-confirm for demo
    )
    db.session.add(appt)
    db.session.commit()

    # Notify the barber
    push_notification(barber.id, f"New appointment booked by {u.name} on {dt.strftime('%b %d at %H:%M')}.")

    return ok(serialise_appointment(appt), 201)


@app.route("/api/appointments/<int:appt_id>/confirm", methods=["PATCH"])
def confirm_appointment(appt_id):
    u, e = require_auth()
    if e: return e
    appt = Appointment.query.get(appt_id)
    if not appt: return err("Appointment not found", 404)
    
    appt.status = "Confirmed"
    db.session.commit()
    
    push_notification(appt.client_id, f"Your appointment on {appt.datetime.strftime('%b %d at %H:%M')} has been confirmed!")
    return ok(serialise_appointment(appt))


@app.route("/api/appointments/<int:appt_id>/complete", methods=["PATCH"])
def complete_appointment(appt_id):
    u, e = require_auth()
    if e: return e
    appt = Appointment.query.get(appt_id)
    if not appt: return err("Appointment not found", 404)
    
    appt.status = "Completed"
    db.session.commit()
    
    push_notification(appt.client_id, f"Your appointment on {appt.datetime.strftime('%b %d at %H:%M')} is complete. Thank you!")
    return ok(serialise_appointment(appt))


@app.route("/api/appointments/<int:appt_id>/cancel", methods=["PATCH"])
def cancel_appointment(appt_id):
    u, e = require_auth()
    if e: return e
    appt = Appointment.query.get(appt_id)
    if not appt: return err("Appointment not found", 404)
    
    appt.status = "Cancelled"
    
    # Free the slot
    dt_str = appt.datetime.strftime("%Y-%m-%d")
    time_str = appt.datetime.strftime("%H:%M")
    slot = Availability.query.filter_by(barber_id=appt.barber_id, date=dt_str, start_time=time_str).first()
    if slot:
        slot.is_booked = False
        
    db.session.commit()
    
    push_notification(appt.barber_id, f"Appointment with {appt.client.name} on {appt.datetime.strftime('%b %d at %H:%M')} was cancelled.")
    return ok(serialise_appointment(appt))


# ══════════════════════════════════════════════════════════════════════
# PAYMENTS
# ══════════════════════════════════════════════════════════════════════

@app.route("/api/payments", methods=["POST"])
def make_payment():
    u, e = require_auth()
    if e: return e
    body = request.get_json() or {}
    if missing := [f for f in ("appointment_id", "amount", "method") if not body.get(f)]:
        return err(f"Missing fields: {', '.join(missing)}")

    appt = Appointment.query.get(body["appointment_id"])
    if not appt: return err("Appointment not found", 404)

    pmt = Payment(
        appointment_id=appt.id,
        amount=body["amount"],
        method=body["method"]
    )
    db.session.add(pmt)
    db.session.commit()
    
    push_notification(appt.barber_id, f"Payment of ${body['amount']:.2f} received for appointment with {u.name}.")
    return ok(serialise_payment(pmt), 201)


@app.route("/api/payments/<int:payment_id>/refund", methods=["PATCH"])
def refund_payment(payment_id):
    u, e = require_auth()
    if e: return e
    pmt = Payment.query.get(payment_id)
    if not pmt: return err("Payment not found", 404)
    
    pmt.status = "Refunded"
    db.session.commit()
    return ok(serialise_payment(pmt))


# ══════════════════════════════════════════════════════════════════════
# REVIEWS
# ══════════════════════════════════════════════════════════════════════

@app.route("/api/reviews", methods=["POST"])
def leave_review():
    u, e = require_auth()
    if e: return e
    if u.role == "barber": return err("Barbers cannot leave reviews", 403)

    body = request.get_json() or {}
    if missing := [f for f in ("barber_id", "rating", "comment") if not body.get(f)]:
        return err(f"Missing fields: {', '.join(missing)}")

    barber = User.query.filter_by(id=body["barber_id"], role="barber").first()
    if not barber: return err("Barber not found", 404)

    rating = int(body["rating"])
    if not 1 <= rating <= 5: return err("Rating must be between 1 and 5")

    rev = Review(
        client_id=u.id,
        barber_id=barber.id,
        rating=rating,
        comment=body["comment"]
    )
    db.session.add(rev)
    
    # Recalculate rating
    all_revs = Review.query.filter_by(barber_id=barber.id).all()
    total_rating = sum(r.rating for r in all_revs) + rating
    barber.rating = total_rating / (len(all_revs) + 1)
    
    db.session.commit()
    
    push_notification(barber.id, f"{u.name} left you a {rating}-star review!")
    return ok(serialise_review(rev), 201)


@app.route("/api/barbers/<int:barber_id>/reviews", methods=["GET"])
def get_reviews(barber_id):
    barber = User.query.filter_by(id=barber_id, role="barber").first()
    if not barber: return err("Barber not found", 404)
    
    reviews = Review.query.filter_by(barber_id=barber_id).order_by(Review.timestamp.desc()).all()
    return ok([serialise_review(r) for r in reviews])


# ══════════════════════════════════════════════════════════════════════
# NOTIFICATIONS
# ══════════════════════════════════════════════════════════════════════

@app.route("/api/notifications", methods=["GET"])
def get_notifications():
    u, e = require_auth()
    if e: return e
    notifs = Notification.query.filter_by(user_id=u.id).order_by(Notification.timestamp.desc()).all()
    return ok([serialise_notification(n) for n in notifs])


@app.route("/api/notifications/<int:notif_id>/read", methods=["PATCH"])
def mark_notification_read(notif_id):
    u, e = require_auth()
    if e: return e
    n = Notification.query.get(notif_id)
    if not n or n.user_id != u.id: return err("Notification not found", 404)
    
    n.is_read = True
    db.session.commit()
    return ok(serialise_notification(n))


@app.route("/api/notifications/read-all", methods=["PATCH"])
def mark_all_read():
    u, e = require_auth()
    if e: return e
    Notification.query.filter_by(user_id=u.id, is_read=False).update({Notification.is_read: True})
    db.session.commit()
    return ok()


# ── NOTIFICATION TRIGGERS (SMS & EMAIL) ──────────────────────────────

def trigger_notifications():
    """
    Checks for appointments that need notification:
    1. Reminders for upcoming appointments within 24 hours.
    2. Review prompts for completed appointments older than 1 hour.
    """
    now = datetime.utcnow()
    
    # 1. Reminders (24 hours before) - For 'Confirmed' appointments
    tomorrow = now + timedelta(hours=24)
    upcoming = Appointment.query.filter(
        Appointment.datetime <= tomorrow,
        Appointment.datetime >= now,
        Appointment.status == 'Confirmed',
        Appointment.reminder_sent == False
    ).all()
    
    for appt in upcoming:
        msg = f"Reminder: Your appointment with {appt.barber.name} is on {appt.datetime.strftime('%b %d at %H:%M')}. Reply CONFIRM or CANCEL."
        send_sms(appt.client_id, appt.client.phone, msg)
        send_email(appt.client_id, appt.client.email, "Appointment Reminder", msg)
        appt.reminder_sent = True
        
    # 2. Review Prompts (1 hour after completion) - For 'Completed' appointments
    past_1h = now - timedelta(hours=1)
    recently_completed = Appointment.query.filter(
        Appointment.datetime <= past_1h,
        Appointment.status == 'Completed',
        Appointment.review_prompt_sent == False
    ).all()
    
    for appt in recently_completed:
        msg = f"Hope you enjoyed your service with {appt.barber.name}! Leave a review here: http://localhost:5173/reviews/{appt.barber_id}"
        send_sms(appt.client_id, appt.client.phone, msg)
        send_email(appt.client_id, appt.client.email, "How was your haircut?", msg)
        appt.review_prompt_sent = True
        
    db.session.commit()
    return len(upcoming) + len(recently_completed)


@app.route("/api/demo/trigger-notifications", methods=["POST"])
def manual_trigger_notifications():
    """Manually trigger the notification logic for demonstration purposes."""
    count = trigger_notifications()
    return ok({"notifications_sent": count})


@scheduler.task('interval', id='do_notifications', minutes=5)
def scheduled_notifications():
    """Automatically run notification check every 5 minutes."""
    with app.app_context():
        trigger_notifications()



# ══════════════════════════════════════════════════════════════════════
# DATABASE SEEDING
# ══════════════════════════════════════════════════════════════════════

def seed_db():
    if User.query.count() > 0:
        return # DB already seeded
        
    print("Database is empty. Seeding demo accounts and data...")
    
    # 1. Services
    services = [
        Service(name="Classic Haircut", duration=30, price=25.00),
        Service(name="Fade & Style", duration=45, price=35.00),
        Service(name="Beard Trim", duration=20, price=15.00),
        Service(name="Hot Towel Shave", duration=30, price=30.00),
        Service(name="Haircut + Beard", duration=60, price=45.00),
        Service(name="Kids Haircut", duration=20, price=18.00)
    ]
    db.session.add_all(services)
    
    # 2. Barbers
    b1 = User(role="barber", name="James Smith", email="james@barbershop.com", password="demo1234", phone="555-0101", rating=5.0, specialties="Classic Cuts,Fades")
    b2 = User(role="barber", name="Marcus Williams", email="marcus@barbershop.com", password="demo1234", phone="555-0202", specialties="Beard Styling,Hot Towel Shave")
    b3 = User(role="barber", name="Diego Ramirez", email="diego@barbershop.com", password="demo1234", phone="555-0303", specialties="Fades,Kids Cuts")
    db.session.add_all([b1, b2, b3])
    db.session.commit() # Commit to get IDs
    
    # 3. Client
    client = User(role="client", name="Alice Johnson", email="alice@email.com", password="demo1234", phone="555-9999")
    db.session.add(client)
    db.session.commit()
    
    # 4. Availabilities
    today = date.today()
    for barber in [b1, b2, b3]:
        for day_offset in range(1, 8):
            day_str = (today + timedelta(days=day_offset)).isoformat()
            for hour in range(9, 17):
                db.session.add(Availability(barber_id=barber.id, date=day_str, start_time=f"{hour:02d}:00", end_time=f"{hour:02d}:30"))
    db.session.commit()
    
    # 5. Dummy Appointment & Review
    appt = Appointment(client_id=client.id, barber_id=b1.id, service_id=services[0].id, datetime=datetime(2026, 3, 28, 10, 0), status="Completed")
    db.session.add(appt)
    rev = Review(client_id=client.id, barber_id=b1.id, rating=5, comment="Excellent cut, very professional!", timestamp=datetime(2026, 3, 28, 11, 0))
    db.session.add(rev)
    db.session.commit()
    print("Seeding complete!")

def create_app():
    with app.app_context():
        db.create_all()
        seed_db()
    
    if not scheduler.running:
        scheduler.init_app(app)
        scheduler.start()
        
    return app

if __name__ == "__main__":
    create_app().run(debug=True, port=5000)
