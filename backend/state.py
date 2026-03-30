"""
state.py - Central in-memory data store for the Barber Shop API.

Imports the existing class-diagram Python classes and manages
all runtime data (accounts, appointments, availability, payments,
reviews, notifications) in plain Python dicts/lists.
"""

import sys
import os
from datetime import datetime

# ------------------------------------------------------------------
# Make the 'Class Diagram' package importable
# ------------------------------------------------------------------
_CLASS_DIAGRAM_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "Class Diagram"
)
sys.path.insert(0, _CLASS_DIAGRAM_DIR)

from account_manager import AccountManager  # noqa: E402
from service import Service                 # noqa: E402
from availability import Availability       # noqa: E402
from appointment import Appointment         # noqa: E402
from notification import Notification       # noqa: E402

# ------------------------------------------------------------------
# Singleton store
# ------------------------------------------------------------------

manager = AccountManager()

# All appointments keyed by appointment_id
appointments: dict[int, Appointment] = {}
_next_appointment_id = 1

# All notifications keyed by notification_id
notifications: dict[int, Notification] = {}
_next_notification_id = 1

# All availability slots keyed by slot_id
availability_slots: dict[int, Availability] = {}
_next_slot_id = 1


def _next_appt_id() -> int:
    global _next_appointment_id
    val = _next_appointment_id
    _next_appointment_id += 1
    return val


def _next_notif_id() -> int:
    global _next_notification_id
    val = _next_notification_id
    _next_notification_id += 1
    return val


def _next_slot_id_fn() -> int:
    global _next_slot_id
    val = _next_slot_id
    _next_slot_id += 1
    return val


# ------------------------------------------------------------------
# Helpers to serialise domain objects to JSON-safe dicts
# ------------------------------------------------------------------

def serialise_user(user) -> dict:
    d = {
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "role": "barber" if hasattr(user, "schedule") else "client",
    }
    if hasattr(user, "rating"):
        d["rating"] = round(user.rating, 2)
    if hasattr(user, "specialties"):
        d["specialties"] = user.specialties
    return d


def serialise_appointment(appt) -> dict:
    return {
        "appointment_id": appt.appointment_id,
        "client": serialise_user(appt.client),
        "barber": serialise_user(appt.barber),
        "service": {
            "service_id": appt.service.service_id,
            "name": appt.service.name,
            "duration": appt.service.duration,
            "price": appt.service.price,
        },
        "datetime": appt.datetime.isoformat(),
        "status": appt.status,
        "payments": [serialise_payment(p) for p in appt.payments],
    }


def serialise_payment(pmt) -> dict:
    return {
        "payment_id": pmt.payment_id,
        "appointment_id": pmt.appointment_id,
        "amount": pmt.amount,
        "method": pmt.method,
        "status": pmt.status,
        "timestamp": pmt.timestamp.isoformat(),
    }


def serialise_review(rev) -> dict:
    return {
        "review_id": rev.review_id,
        "client_id": rev.client_id,
        "barber_id": rev.barber_id,
        "rating": rev.rating,
        "comment": rev.comment,
        "timestamp": rev.timestamp.isoformat(),
    }


def serialise_slot(slot, slot_id: int) -> dict:
    return {
        "slot_id": slot_id,
        "barber_id": slot.barber_id,
        "date": slot.date,
        "start_time": slot.start_time,
        "end_time": slot.end_time,
        "is_booked": slot.is_booked,
    }


def serialise_notification(n, notif_id: int) -> dict:
    return {
        "notification_id": notif_id,
        "user_id": n.user_id,
        "message": n.message,
        "is_read": n.is_read,
        "timestamp": n.timestamp.isoformat(),
    }


# ------------------------------------------------------------------
# Catalogue of services (shared, not per-barber)
# ------------------------------------------------------------------

SERVICES: list[Service] = [
    Service(1, "Classic Haircut",    30, 25.00),
    Service(2, "Fade & Style",       45, 35.00),
    Service(3, "Beard Trim",         20, 15.00),
    Service(4, "Hot Towel Shave",    30, 30.00),
    Service(5, "Haircut + Beard",    60, 45.00),
    Service(6, "Kids Haircut",       20, 18.00),
]


def get_service(service_id: int) -> Service | None:
    return next((s for s in SERVICES if s.service_id == service_id), None)


# ------------------------------------------------------------------
# Seed demo accounts
# ------------------------------------------------------------------

def seed_demo_data():
    """Create 2 barbers on startup so the UI has content immediately."""
    try:
        b1 = manager.register(
            role="barber",
            name="James Smith",
            email="james@barbershop.com",
            password="demo1234",
            phone="555-0101",
        )
        b1.specialties = ["Classic Cuts", "Fades"]

        b2 = manager.register(
            role="barber",
            name="Marcus Williams",
            email="marcus@barbershop.com",
            password="demo1234",
            phone="555-0202",
        )
        b2.specialties = ["Beard Styling", "Hot Towel Shave"]

        b3 = manager.register(
            role="barber",
            name="Diego Ramirez",
            email="diego@barbershop.com",
            password="demo1234",
            phone="555-0303",
        )
        b3.specialties = ["Fades", "Kids Cuts"]

        # Seed some availability slots
        from datetime import date, timedelta
        today = date.today()
        for barber in [b1, b2, b3]:
            for day_offset in range(1, 8):
                day = today + timedelta(days=day_offset)
                day_str = day.isoformat()
                for hour in range(9, 17):
                    slot = Availability(
                        barber_id=barber.user_id,
                        date=day_str,
                        start_time=f"{hour:02d}:00",
                        end_time=f"{hour:02d}:30",
                    )
                    sid = _next_slot_id_fn()
                    availability_slots[sid] = slot
                    barber.schedule.append(slot)

        # Seed a demo client
        client = manager.register(
            role="client",
            name="Alice Johnson",
            email="alice@email.com",
            password="demo1234",
            phone="555-9999",
        )

        # Seed one completed appointment + review for James
        svc = SERVICES[0]
        appt = Appointment(
            appointment_id=_next_appt_id(),
            client=client,
            barber=b1,
            service=svc,
            datetime_obj=datetime(2026, 3, 28, 10, 0),
        )
        appt.confirm()
        appt.complete()
        appointments[appt.appointment_id] = appt
        client.appointment_history.append(appt)

        from review import Review
        rev = Review(1, client.user_id, b1.user_id, 5,
                     "Excellent cut, very professional!", datetime(2026, 3, 28, 11, 0))
        b1.add_review(rev)

    except ValueError:
        # Already seeded (e.g. hot-reload)
        pass


# ------------------------------------------------------------------
# Convenience lookups
# ------------------------------------------------------------------

def get_all_barbers():
    return [u for u in manager._accounts.values() if hasattr(u, "schedule")]


def get_all_clients():
    return [u for u in manager._accounts.values() if not hasattr(u, "schedule")]


def push_notification(user_id: int, message: str):
    nid = _next_notif_id()
    n = Notification(
        notification_id=nid,
        user_id=user_id,
        message=message,
        timestamp=datetime.now(),
    )
    notifications[nid] = n
    return n
