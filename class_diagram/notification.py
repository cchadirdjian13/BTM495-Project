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
