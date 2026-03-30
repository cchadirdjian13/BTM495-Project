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
