# Premium Salon Dimension Appointment System ✂️

A full-stack web application designed to handle the end-to-end booking flow for a high-end salon. It provides dedicated dashboards for both Clients and Stylists, allowing for seamless appointment scheduling, real-time status updates, payments, integrated notifications, and full bilingual support (English/French).

The application is built combining a sleek, glassmorphic React frontend with a robust Flask REST backend, powered by a persistent SQLite database.

---

## 🏗️ Architecture

The project is split into three main layers:

1. **`Class Diagram/` (Core Business Logic)**
   This directory houses the foundational domain-driven Python classes. It has been completely modularized so that each class (`client.py`, `barber.py`, `appointment.py`, etc.) lives in its own dedicated file.

2. **`backend/` (Flask REST API & SQLAlchemy)**
   A Flask API (`app.py`) serves as the bridge between the frontend web client and the backend.
   - **Database Persistence**: The system has been fully migrated from an ephemeral in-memory dictionary to a persistent **SQLite** datastore managed by **Flask-SQLAlchemy** (`database.py` & `models.py`).
   - **Notification Service**: Includes a localized prototype Notification service (`notifications.py`) that simulates the immediate dispatch of SMS and Email alerts when bookings are confirmed or cancelled.

3. **`frontend/` (React + Vite SPA)**
   The user interface is built as a Single Page Application using React and Vite.
   - **Modern Aesthetics**: Driven by vanilla CSS showcasing a custom dark luxury theme with dynamically animated elements (such as the interactive circular "scissors cutting" sequence upon booking confirmation).
   - **Localization (i18n)**: Fully synced bilingual support (EN/FR) via a custom `LanguageContext`. The frontend preference binds directly to the backend database, ensuring user notifications are delivered in their preferred language.

---

## ✨ Key Features

### For Clients 👤

- **Discover Services & Barbers**: Browse the available haircut services and view the barber directory.
- **Smart Booking**: A multi-step wizard to pick a specific barber, a desired service, and an available date/time slot. Success is capped off with a rewarding, smooth SVG/CSS animated scissor cutting sequence.
- **Bilingual Interface**: Toggle seamlessly between French and English inside the dashboard.
- **Manage Appointments**: Keep track of scheduled haircuts, confirm past ones, and securely handle payments.
- **Leave Reviews**: Share feedback and provide a 1-to-5 star rating on completed appointments.
- **Live Notifications**: Get instant in-app alerts and simulated localized SMS/Email notifications securely processed over the backend.

### For Barbers ✂️

- **Set Availability**: Define working hours by generating specific time blocks within a given date.
- **Action Dashboard**: Manage upcoming bookings and manually mark services as `Confirmed` or `Completed`.
- **Client Management**: Track performance ratings and read feedback submitted by direct clients.
- **Live Notifications**: Get notified instantly when a new client secures a time slot.

---

## 🚀 Getting Started

### Prerequisites

Make sure you have both **Python (3.8+)** and **Node.js (LTS)** installed on your machine.

### 1. Start the Backend API

From the root directory of the project, run:

```bash
# Install the required Python packages (only once)
pip install flask flask-cors flask-sqlalchemy

# Start the Flask API (auto-seeds the SQLite DB on first run)
python run.py

*(Note: If you get an error saying 'python' is not recognized, try using 'py' instead)*
```

_The backend server will natively run at `http://localhost:5000`._
_(You can optionally execute `python check_db.py` to view the seeded database configurations)_

### 2. Start the Frontend React App

Open a new terminal window / tab. From the root directory, navigate into the frontend and start up Vite:

```bash
cd frontend

# Install the required NPM packages (only once)
npm install

# Start the React development server
npm run dev
```

_(Note for Windows users: If you get a PowerShell script execution error, try running `cmd /c npm run dev` instead)._

_The frontend will run at `http://localhost:5173`. Any API calls to `/api` are automatically proxied to the Flask server._

---

## 🧪 Demo Credentials

The backend automatically pre-seeds the SQLite database with user accounts, appointments, and services so you can test the system immediately on a fresh boot.

**Client Account:**

- **Email:** `alice@email.com`
- **Password:** `demo1234`

**Barber Account:**

- **Email:** `marcus@salondimension.com`
- **Password:** `demo1234`

---

## 🔮 Future Enhancements (Roadmap)

- **Payment Gateway**: The current payment system acts as an integration stub. Hooking into Stripe or Square APIs would enable real transactions.
- **Role-based Authentication**: Expanding the API with secure JWTs to fully lock down Barber boundaries.
- **Production Email Sending**: Linking `notifications.py` to an active SMTP server or an API string like SendGrid to blast real emails instead of console logging prototypes.
