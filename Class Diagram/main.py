"""
main.py - Entry point for the Salon Dimension Appointment System.

Demonstrates a full end-to-end flow:
  1. Register a barber and a client.
  2. Barber sets availability.
  3. Client books an appointment.
  4. Payment is made.
  5. Appointment is completed.
  6. Client leaves a review.
  7. A notification is sent.
"""

from datetime import datetime

from account_manager import AccountManager
from service import Service
from availability import Availability
from appointment import Appointment
from notification import Notification


def main():
    print("=" * 55)
    print("   Salon Dimension Appointment System - Demo")
    print("=" * 55)

    # ------------------------------------------------------------------
    # 1. Account registration
    # ------------------------------------------------------------------
    manager = AccountManager()

    barber = manager.register(
        role="barber",
        name="James Smith",
        email="james@salondimension.com",
        password="securepass123",
        phone="555-0101",
    )

    client = manager.register(
        role="client",
        name="Alice Johnson",
        email="alice@email.com",
        password="mypassword",
        phone="555-0202",
    )

    # ------------------------------------------------------------------
    # 2. Login
    # ------------------------------------------------------------------
    print()
    barber.login()
    client.login()

    # ------------------------------------------------------------------
    # 3. Barber sets availability
    # ------------------------------------------------------------------
    print()
    slot = Availability(
        barber_id=barber.user_id,
        date="2026-04-10",
        start_time="10:00",
        end_time="10:30",
    )
    barber.set_availability(slot)
    print(f"Slot available: {slot.check_slot()}")

    # ------------------------------------------------------------------
    # 4. Define a service & book an appointment
    # ------------------------------------------------------------------
    print()
    haircut = Service(service_id=1, name="Classic Haircut", duration=30, price=25.00)

    appt_datetime = datetime(2026, 4, 10, 10, 0)
    appointment = Appointment(
        appointment_id=1001,
        client=client,
        barber=barber,
        service=haircut,
        datetime_obj=appt_datetime,
    )

    # Mark the slot as booked
    slot.book_slot()
    client.book_appointment(appointment)
    appointment.confirm()
    print(f"Appointment status: {appointment.status}")

    # ------------------------------------------------------------------
    # 5. Payment
    # ------------------------------------------------------------------
    print()
    payment = client.make_payment(appointment, amount=25.00, method="Credit Card")
    payment.process_payment()
    print(f"Payment status: {payment.status}")

    # ------------------------------------------------------------------
    # 6. Complete the appointment
    # ------------------------------------------------------------------
    print()
    appointment.complete()
    print(f"Appointment status after completion: {appointment.status}")

    # ------------------------------------------------------------------
    # 7. Client leaves a review
    # ------------------------------------------------------------------
    print()
    client.leave_review(barber, rating=5, comment="Great haircut, very professional!")
    print(f"Barber '{barber.name}' average rating: {barber.rating:.1f} / 5.0")

    # ------------------------------------------------------------------
    # 8. Send a notification
    # ------------------------------------------------------------------
    print()
    notif = Notification(
        notification_id=1,
        user_id=client.user_id,
        message="Your appointment on Apr 10 has been completed. Thank you!",
        timestamp=datetime.now(),
    )
    notif.send()
    notif.mark_read()
    print(f"Notification read: {notif.is_read}")

    # ------------------------------------------------------------------
    # 9. Logout
    # ------------------------------------------------------------------
    print()
    client.logout()
    barber.logout()

    print()
    print("=" * 55)
    print("   Demo completed successfully.")
    print("=" * 55)


if __name__ == "__main__":
    main()
