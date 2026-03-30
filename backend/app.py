"""
app.py - Flask REST API for the Barber Shop Appointment System.

All business logic reuses the existing class-diagram Python classes
via the state.py in-memory store. No database required.
"""

from flask import Flask, request, jsonify, session
from flask_cors import CORS
from datetime import datetime

import state as st
from state import (
    manager, appointments, notifications, availability_slots,
    SERVICES, get_service, get_all_barbers, get_all_clients,
    push_notification, serialise_user, serialise_appointment,
    serialise_payment, serialise_review, serialise_slot,
    serialise_notification, _next_appt_id, _next_slot_id_fn,
)

# ---- Import domain classes for isinstance checks etc ----
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), "Class Diagram"))
from appointment import Appointment  # noqa
from availability import Availability  # noqa
from payment import Payment  # noqa
from review import Review  # noqa

app = Flask(__name__)
app.secret_key = "barber-shop-secret-2026"
CORS(app, supports_credentials=True)

# Seed demo data once at startup
st.seed_demo_data()


# ── helpers ──────────────────────────────────────────────────────────

def ok(data=None, status=200):
    return jsonify({"ok": True, "data": data}), status


def err(msg, status=400):
    return jsonify({"ok": False, "error": msg}), status


def current_user():
    uid = session.get("user_id")
    if uid is None:
        return None
    return manager._accounts.get(session.get("user_email", ""))


def require_auth():
    u = current_user()
    if u is None:
        return None, err("Not authenticated", 401)
    return u, None


# ══════════════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════════════

@app.route("/api/auth/register", methods=["POST"])
def register():
    body = request.get_json() or {}
    required = ("name", "email", "password", "phone", "role")
    if missing := [f for f in required if not body.get(f)]:
        return err(f"Missing fields: {', '.join(missing)}")
    try:
        user = manager.register(
            role=body["role"],
            name=body["name"],
            email=body["email"],
            password=body["password"],
            phone=body["phone"],
        )
        session["user_id"] = user.user_id
        session["user_email"] = user.email.lower()
        return ok(serialise_user(user), 201)
    except ValueError as e:
        return err(str(e))


@app.route("/api/auth/login", methods=["POST"])
def login():
    body = request.get_json() or {}
    email = (body.get("email") or "").strip().lower()
    password = body.get("password", "")

    if not email or not password:
        return err("Email and password required")

    try:
        user = manager.get_account(email)
    except KeyError:
        return err("Invalid email or password", 401)

    if user.password != password:
        return err("Invalid email or password", 401)

    session["user_id"] = user.user_id
    session["user_email"] = user.email.lower()
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
# SERVICES
# ══════════════════════════════════════════════════════════════════════

@app.route("/api/services", methods=["GET"])
def list_services():
    return ok([{
        "service_id": s.service_id,
        "name": s.name,
        "duration": s.duration,
        "price": s.price,
    } for s in SERVICES])


# ══════════════════════════════════════════════════════════════════════
# BARBERS
# ══════════════════════════════════════════════════════════════════════

@app.route("/api/barbers", methods=["GET"])
def list_barbers():
    return ok([serialise_user(b) for b in get_all_barbers()])


@app.route("/api/barbers/<int:barber_id>", methods=["GET"])
def get_barber(barber_id):
    barber = next((b for b in get_all_barbers() if b.user_id == barber_id), None)
    if not barber:
        return err("Barber not found", 404)
    return ok(serialise_user(barber))


# ══════════════════════════════════════════════════════════════════════
# AVAILABILITY
# ══════════════════════════════════════════════════════════════════════

@app.route("/api/barbers/<int:barber_id>/availability", methods=["GET"])
def get_availability(barber_id):
    date_filter = request.args.get("date")
    slots = [
        serialise_slot(slot, sid)
        for sid, slot in availability_slots.items()
        if slot.barber_id == barber_id
        and (not date_filter or slot.date == date_filter)
    ]
    return ok(sorted(slots, key=lambda s: (s["date"], s["start_time"])))


@app.route("/api/availability", methods=["POST"])
def add_availability():
    u, e = require_auth()
    if e:
        return e
    if not hasattr(u, "schedule"):
        return err("Only barbers can set availability", 403)

    body = request.get_json() or {}
    required = ("date", "start_time", "end_time")
    if missing := [f for f in required if not body.get(f)]:
        return err(f"Missing fields: {', '.join(missing)}")

    slot = Availability(
        barber_id=u.user_id,
        date=body["date"],
        start_time=body["start_time"],
        end_time=body["end_time"],
    )
    sid = _next_slot_id_fn()
    availability_slots[sid] = slot
    u.schedule.append(slot)
    return ok(serialise_slot(slot, sid), 201)


# ══════════════════════════════════════════════════════════════════════
# APPOINTMENTS
# ══════════════════════════════════════════════════════════════════════

@app.route("/api/appointments", methods=["GET"])
def list_appointments():
    u, e = require_auth()
    if e:
        return e

    is_barber = hasattr(u, "schedule")
    appts = [
        serialise_appointment(a)
        for a in appointments.values()
        if (is_barber and a.barber.user_id == u.user_id)
        or (not is_barber and a.client.user_id == u.user_id)
    ]
    appts.sort(key=lambda a: a["datetime"], reverse=True)
    return ok(appts)


@app.route("/api/appointments", methods=["POST"])
def book_appointment():
    u, e = require_auth()
    if e:
        return e
    if hasattr(u, "schedule"):
        return err("Barbers cannot book appointments", 403)

    body = request.get_json() or {}
    required = ("barber_id", "service_id", "slot_id", "datetime")
    if missing := [f for f in required if not body.get(f)]:
        return err(f"Missing fields: {', '.join(missing)}")

    barber = next((b for b in get_all_barbers() if b.user_id == body["barber_id"]), None)
    if not barber:
        return err("Barber not found", 404)

    svc = get_service(body["service_id"])
    if not svc:
        return err("Service not found", 404)

    slot_id = body["slot_id"]
    slot = availability_slots.get(slot_id)
    if not slot:
        return err("Slot not found", 404)
    if slot.is_booked:
        return err("Slot already booked", 409)

    try:
        dt = datetime.fromisoformat(body["datetime"])
    except ValueError:
        return err("Invalid datetime format")

    appt = Appointment(
        appointment_id=_next_appt_id(),
        client=u,
        barber=barber,
        service=svc,
        datetime_obj=dt,
    )
    slot.book_slot()
    u.book_appointment(appt)
    appt.confirm()
    appointments[appt.appointment_id] = appt

    # Notify the barber
    push_notification(barber.user_id,
        f"New appointment booked by {u.name} on {dt.strftime('%b %d at %H:%M')}.")

    return ok(serialise_appointment(appt), 201)


@app.route("/api/appointments/<int:appt_id>/confirm", methods=["PATCH"])
def confirm_appointment(appt_id):
    u, e = require_auth()
    if e:
        return e
    appt = appointments.get(appt_id)
    if not appt:
        return err("Appointment not found", 404)
    appt.confirm()
    push_notification(appt.client.user_id,
        f"Your appointment on {appt.datetime.strftime('%b %d at %H:%M')} has been confirmed!")
    return ok(serialise_appointment(appt))


@app.route("/api/appointments/<int:appt_id>/complete", methods=["PATCH"])
def complete_appointment(appt_id):
    u, e = require_auth()
    if e:
        return e
    appt = appointments.get(appt_id)
    if not appt:
        return err("Appointment not found", 404)
    appt.complete()
    push_notification(appt.client.user_id,
        f"Your appointment on {appt.datetime.strftime('%b %d at %H:%M')} is complete. Thank you!")
    return ok(serialise_appointment(appt))


@app.route("/api/appointments/<int:appt_id>/cancel", methods=["PATCH"])
def cancel_appointment(appt_id):
    u, e = require_auth()
    if e:
        return e
    appt = appointments.get(appt_id)
    if not appt:
        return err("Appointment not found", 404)
    appt.cancel()
    # Free the slot
    for slot in availability_slots.values():
        if (slot.barber_id == appt.barber.user_id
                and slot.date == appt.datetime.strftime("%Y-%m-%d")
                and slot.start_time == appt.datetime.strftime("%H:%M")):
            slot.is_booked = False
            break
    push_notification(appt.barber.user_id,
        f"Appointment with {appt.client.name} on {appt.datetime.strftime('%b %d at %H:%M')} was cancelled.")
    return ok(serialise_appointment(appt))


# ══════════════════════════════════════════════════════════════════════
# PAYMENTS
# ══════════════════════════════════════════════════════════════════════

@app.route("/api/payments", methods=["POST"])
def make_payment():
    u, e = require_auth()
    if e:
        return e
    body = request.get_json() or {}
    if missing := [f for f in ("appointment_id", "amount", "method") if not body.get(f)]:
        return err(f"Missing fields: {', '.join(missing)}")

    appt = appointments.get(body["appointment_id"])
    if not appt:
        return err("Appointment not found", 404)

    pmt = u.make_payment(appt, body["amount"], body["method"])
    pmt.process_payment()
    push_notification(appt.barber.user_id,
        f"Payment of ${body['amount']:.2f} received for appointment with {u.name}.")
    return ok(serialise_payment(pmt), 201)


@app.route("/api/payments/<int:payment_id>/refund", methods=["PATCH"])
def refund_payment(payment_id):
    u, e = require_auth()
    if e:
        return e
    for appt in appointments.values():
        for pmt in appt.payments:
            if pmt.payment_id == payment_id:
                pmt.refund()
                return ok(serialise_payment(pmt))
    return err("Payment not found", 404)


# ══════════════════════════════════════════════════════════════════════
# REVIEWS
# ══════════════════════════════════════════════════════════════════════

@app.route("/api/reviews", methods=["POST"])
def leave_review():
    u, e = require_auth()
    if e:
        return e
    if hasattr(u, "schedule"):
        return err("Barbers cannot leave reviews", 403)

    body = request.get_json() or {}
    if missing := [f for f in ("barber_id", "rating", "comment") if not body.get(f)]:
        return err(f"Missing fields: {', '.join(missing)}")

    barber = next((b for b in get_all_barbers() if b.user_id == body["barber_id"]), None)
    if not barber:
        return err("Barber not found", 404)

    rating = int(body["rating"])
    if not 1 <= rating <= 5:
        return err("Rating must be between 1 and 5")

    u.leave_review(barber, rating=rating, comment=body["comment"])
    rev = barber.reviews[-1]
    push_notification(barber.user_id,
        f"{u.name} left you a {rating}-star review!")
    return ok(serialise_review(rev), 201)


@app.route("/api/barbers/<int:barber_id>/reviews", methods=["GET"])
def get_reviews(barber_id):
    barber = next((b for b in get_all_barbers() if b.user_id == barber_id), None)
    if not barber:
        return err("Barber not found", 404)
    return ok([serialise_review(r) for r in barber.reviews])


# ══════════════════════════════════════════════════════════════════════
# NOTIFICATIONS
# ══════════════════════════════════════════════════════════════════════

@app.route("/api/notifications", methods=["GET"])
def get_notifications():
    u, e = require_auth()
    if e:
        return e
    notifs = [
        serialise_notification(n, nid)
        for nid, n in notifications.items()
        if n.user_id == u.user_id
    ]
    notifs.sort(key=lambda x: x["timestamp"], reverse=True)
    return ok(notifs)


@app.route("/api/notifications/<int:notif_id>/read", methods=["PATCH"])
def mark_notification_read(notif_id):
    u, e = require_auth()
    if e:
        return e
    n = notifications.get(notif_id)
    if not n or n.user_id != u.user_id:
        return err("Notification not found", 404)
    n.mark_read()
    return ok(serialise_notification(n, notif_id))


@app.route("/api/notifications/read-all", methods=["PATCH"])
def mark_all_read():
    u, e = require_auth()
    if e:
        return e
    for n in notifications.values():
        if n.user_id == u.user_id:
            n.mark_read()
    return ok()


# ══════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    app.run(debug=True, port=5000)
