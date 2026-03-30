from datetime import datetime
from user import User
from review import Review
from payment import Payment


class Client(User):
    def __init__(self, user_id, name, email, password, phone):
        super().__init__(user_id, name, email, password, phone)
        self.appointment_history = []
        self.payment_methods = []

    def login(self):
        print(f"Client {self.name} logged in.")

    def logout(self):
        print(f"Client {self.name} logged out.")

    def book_appointment(self, appointment):
        self.appointment_history.append(appointment)
        print(f"Appointment booked for {self.name}")

    def cancel_appointment(self, appointment):
        if appointment in self.appointment_history:
            self.appointment_history.remove(appointment)
            print(f"Appointment cancelled for {self.name}")

    def leave_review(self, barber, rating, comment):
        review = Review(len(barber.reviews) + 1, self.user_id, barber.user_id, rating, comment, datetime.now())
        barber.add_review(review)

    def make_payment(self, appointment, amount, method):
        payment = Payment(
            len(appointment.payments) + 1,
            appointment.appointment_id,
            amount,
            method,
            "Completed",
            datetime.now()
        )
        appointment.add_payment(payment)
        return payment
