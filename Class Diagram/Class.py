from datetime import datetime
from abc import ABC, abstractmethod

class User(ABC):
    def __init__(self, user_id, name, email, password, phone):
        self.user_id = user_id
        self.name = name
        self.email = email
        self.password = password
        self.phone = phone

    @abstractmethod
    def login(self):
        pass

    @abstractmethod
    def logout(self):
        pass
    
    def update_profile(self, **kwargs):
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)

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
        payment = Payment(len(appointment.payments) + 1, appointment.appointment_id, amount, method, "Completed", datetime.now())
        appointment.add_payment(payment)
        return payment

class Barber(User):
    def __init__(self, user_id, name, email, password, phone):
        super().__init__(user_id, name, email, password, phone)
        self.specialties = []
        self.schedule = []
        self.reviews = []
        self.rating = 0.0

    def login(self):
        print(f"Barber {self.name} logged in.")

    def logout(self):
        print(f"Barber {self.name} logged out.")

    def set_availability(self, availability):
        self.schedule.append(availability)

    def view_appointments(self):
        # In a real app, this would query a database
        print(f"Viewing appointments for {self.name}")

    def add_review(self, review):
        self.reviews.append(review)
        self.calculate_rating()

    def calculate_rating(self):
        if not self.reviews:
            self.rating = 0.0
        else:
            total = sum(r.rating for r in self.reviews)
            self.rating = total / len(self.reviews)

class Service:
    def __init__(self, service_id, name, duration, price):
        self.service_id = service_id
        self.name = name
        self.duration = duration
        self.price = price

class Availability:
    def __init__(self, barber_id, date, start_time, end_time):
        self.barber_id = barber_id
        self.date = date
        self.start_time = start_time
        self.end_time = end_time
        self.is_booked = False

    def check_slot(self):
        return not self.is_booked

    def book_slot(self):
        if not self.is_booked:
            self.is_booked = True
            return True
        return False

class Appointment:
    def __init__(self, appointment_id, client, barber, service, datetime_obj):
        self.appointment_id = appointment_id
        self.client = client
        self.barber = barber
        self.service = service
        self.datetime = datetime_obj
        self.status = "Scheduled"
        self.payments = []

    def confirm(self):
        self.status = "Confirmed"

    def cancel(self):
        self.status = "Cancelled"

    def complete(self):
        self.status = "Completed"

    def add_payment(self, payment):
        self.payments.append(payment)

class Payment:
    def __init__(self, payment_id, appointment_id, amount, method, status, timestamp):
        self.payment_id = payment_id
        self.appointment_id = appointment_id
        self.amount = amount
        self.method = method
        self.status = status
        self.timestamp = timestamp

    def process_payment(self):
        print(f"Processing payment {self.payment_id} of ${self.amount}")
        self.status = "Processed"

    def refund(self):
        print(f"Refunding payment {self.payment_id}")
        self.status = "Refunded"

class Review:
    def __init__(self, review_id, client_id, barber_id, rating, comment, timestamp):
        self.review_id = review_id
        self.client_id = client_id
        self.barber_id = barber_id
        self.rating = rating
        self.comment = comment
        self.timestamp = timestamp

class Notification:
    def __init__(self, notification_id, user_id, message, timestamp):
        self.notification_id = notification_id
        self.user_id = user_id
        self.message = message
        self.is_read = False
        self.timestamp = timestamp

    def send(self):
        print(f"Sending notification to User {self.user_id}: {self.message}")

    def mark_read(self):
        self.is_read = True


class AccountManager:
    """Handles registration and lookup of Client and Barber accounts."""

    def __init__(self):
        # Registry maps email -> User instance
        self._accounts: dict[str, "User"] = {}
        self._next_id: int = 1

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def register(self, role: str, name: str, email: str, password: str, phone: str) -> "User":
        """Create a new account for the given role ('client' or 'barber').

        Args:
            role:     'client' or 'barber' (case-insensitive).
            name:     Full name of the user.
            email:    Unique email address used as the account identifier.
            password: Plain-text password (hash in production).
            phone:    Contact phone number.

        Returns:
            The newly created Client or Barber instance.

        Raises:
            ValueError: If an account with that email already exists or the
                        role is unrecognised.
        """
        self._validate_no_duplicate(email)

        user_id = self._next_id
        self._next_id += 1

        role_lower = role.strip().lower()
        if role_lower == "client":
            account = Client(user_id, name, email, password, phone)
        elif role_lower == "barber":
            account = Barber(user_id, name, email, password, phone)
        else:
            raise ValueError(f"Unknown role '{role}'. Expected 'client' or 'barber'.")

        self._accounts[email.lower()] = account
        print(f"{role.capitalize()} account created for '{name}' (ID: {user_id}).")
        return account

    def get_account(self, email: str) -> "User":
        """Retrieve an existing account by email.

        Raises:
            KeyError: If no account exists for that email.
        """
        key = email.strip().lower()
        if key not in self._accounts:
            raise KeyError(f"No account found for email '{email}'.")
        return self._accounts[key]

    def account_exists(self, email: str) -> bool:
        """Return True if an account is already registered for *email*."""
        return email.strip().lower() in self._accounts

    def delete_account(self, email: str) -> None:
        """Remove an account from the registry.

        Raises:
            KeyError: If no account exists for that email.
        """
        key = email.strip().lower()
        if key not in self._accounts:
            raise KeyError(f"No account found for email '{email}'.")
        removed = self._accounts.pop(key)
        print(f"Account for '{removed.name}' (ID: {removed.user_id}) has been deleted.")

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _validate_no_duplicate(self, email: str) -> None:
        if self.account_exists(email):
            raise ValueError(f"An account with email '{email}' already exists.")
