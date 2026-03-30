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
