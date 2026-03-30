from user import User


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
