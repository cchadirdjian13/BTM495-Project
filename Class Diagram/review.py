class Review:
    def __init__(self, review_id, client_id, barber_id, rating, comment, timestamp):
        self.review_id = review_id
        self.client_id = client_id
        self.barber_id = barber_id
        self.rating = rating
        self.comment = comment
        self.timestamp = timestamp
