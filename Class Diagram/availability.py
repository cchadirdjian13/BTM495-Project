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
