from datetime import datetime, timedelta

from client import Client
from barber import Barber
from service import Service
from availability import Availability
from appointment import Appointment
from payment import Payment
from review import Review
from notification import Notification

def test_barber_shop_flow():
    print("--- Starting Barber Shop Flow Test ---")

    # 1. Create Users
    client = Client(1, "John Doe", "john@example.com", "password123", "555-0101")
    barber = Barber(2, "Sweeny Todd", "sweeny@example.com", "securepass", "555-0102")
    
    print(f"Created Client: {client.name}")
    print(f"Created Barber: {barber.name}")

    # 2. Barber sets availability
    today = datetime.now().date()
    slot_start = datetime.combine(today, datetime.strptime("10:00", "%H:%M").time())
    slot_end = slot_start + timedelta(minutes=30)
    
    availability = Availability(barber.user_id, today, slot_start, slot_end)
    barber.set_availability(availability)
    print(f"Barber set availability for {today} 10:00 - 10:30")

    # 3. Define Service
    haircut = Service(1, "Classic Haircut", 30, 25.00)
    print(f"Service defined: {haircut.name} - ${haircut.price}")

    # 4. Client books appointment
    if availability.check_slot():
        availability.book_slot()
        appointment_time = slot_start
        appointment = Appointment(1, client, barber, haircut, appointment_time)
        client.book_appointment(appointment)
        print("Client booked appointment.")
    else:
        print("Slot not available.")

    # 5. Client makes payment
    payment = client.make_payment(appointment, haircut.price, "Credit Card")
    if payment.status == "Completed":
        print(f"Payment successful: ${payment.amount}")
    
    # 6. Barber gets a review
    client.leave_review(barber, 5, "Great haircut, no nicked ears!")
    print(f"Barber rating: {barber.rating} stars")

    # 7. Notifications
    notif = Notification(1, client.user_id, "Your appointment is confirmed", datetime.now())
    notif.send()

    print("--- Test Completed Successfully ---")

if __name__ == "__main__":
    test_barber_shop_flow()
