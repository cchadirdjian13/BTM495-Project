from .database import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(50), nullable=False) # 'client' or 'barber'
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    phone = db.Column(db.String(20))
    rating = db.Column(db.Float, default=0.0) # For barbers
    specialties = db.Column(db.String(255))   # Comma separated, for barbers
    
    # Relationships
    notifications = db.relationship('Notification', backref='user', lazy=True)
    availabilities = db.relationship('Availability', backref='barber', lazy=True)
    
    # We will use explicit queries for appointments instead of backrefs for simplicity,
    # or define multiple relationships specifying foreign keys.
    appointments_as_client = db.relationship('Appointment', foreign_keys='Appointment.client_id', backref='client', lazy=True)
    appointments_as_barber = db.relationship('Appointment', foreign_keys='Appointment.barber_id', backref='barber', lazy=True)
    
    reviews_received = db.relationship('Review', foreign_keys='Review.barber_id', backref='barber', lazy=True)
    reviews_given = db.relationship('Review', foreign_keys='Review.client_id', backref='client', lazy=True)


class Service(db.Model):
    __tablename__ = 'services'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    duration = db.Column(db.Integer, nullable=False) # minutes
    price = db.Column(db.Float, nullable=False)


class Availability(db.Model):
    __tablename__ = 'availabilities'
    id = db.Column(db.Integer, primary_key=True)
    barber_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.String(20), nullable=False) # YYYY-MM-DD
    start_time = db.Column(db.String(10), nullable=False) # HH:MM
    end_time = db.Column(db.String(10), nullable=False) # HH:MM
    is_booked = db.Column(db.Boolean, default=False)


class Appointment(db.Model):
    __tablename__ = 'appointments'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    barber_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False)
    datetime = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(50), default='Scheduled') # Scheduled, Confirmed, Completed, Cancelled
    reminder_sent = db.Column(db.Boolean, default=False)
    review_prompt_sent = db.Column(db.Boolean, default=False)
    
    service = db.relationship('Service')
    payments = db.relationship('Payment', backref='appointment', lazy=True)


class Payment(db.Model):
    __tablename__ = 'payments'
    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    method = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50), default='Paid') # Pending, Paid, Refunded
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


class Review(db.Model):
    __tablename__ = 'reviews'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    barber_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    channel = db.Column(db.String(20), default='IN_APP') # IN_APP, SMS, EMAIL
    is_read = db.Column(db.Boolean, default=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
