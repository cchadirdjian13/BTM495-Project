# Premium Barber Shop Appointment System ✂️

A full-stack web application designed to handle the end-to-end booking flow for a high-end barber shop. It provides dedicated dashboards for both Clients and Barbers, allowing for seamless appointment scheduling, real-time status updates, payments, and reviews. 

The application is built combining a sleek, glassmorphic React frontend with a lightweight Flask REST backend, which wraps pure Python business logic objects.

---

## 🏗️ Architecture

The project is split into three main layers:

1. **`Class Diagram/` (Core Business Logic)**
   This directory houses the foundational domain-driven Python classes (`Client`, `Barber`, `Appointment`, `Payment`, `Service`, `Availability`, `Notification`, etc.). All core logic for managing the shop is strictly maintained here. 

2. **`backend/` (Flask REST API)**
   A lightweight Flask API (`app.py`) serves as the bridge between the frontend web client and the backend Python classes. It uses an in-memory datastore (`state.py`) to hold all class instances. It features clean HTTP endpoints for authentication, fetching data, and mutating system state.

3. **`frontend/` (React + Vite SPA)**
   The user interface is built as a Single Page Application using React and Vite. It is purely driven by vanilla CSS (`index.css`), showcasing a custom dark luxury theme with gold accents, tailored for the premium aesthetic of a classic barber shop.

---

## ✨ Key Features

### For Clients 👤
- **Discover Services & Barbers**: Browse the available haircut services and view the barber directory.
- **Smart Booking**: A multi-step wizard to pick a specific barber, a desired service, and an available date/time slot.
- **Manage Appointments**: Keep track of scheduled haircuts, confirm past ones, and securely handle payments.
- **Leave Reviews**: Share feedback and provide a 1-to-5 star rating on completed appointments.
- **Live Notifications**: Get instant alerts via the navigation bell when a barber confirms an appointment.

### For Barbers ✂️
- **Set Availability**: Define working hours by generating specific time blocks within a given date.
- **Action Dashboard**: Manage upcoming bookings and manually mark services as `Confirmed` or `Completed`.
- **Client Management**: Track performance ratings and read feedback submitted by direct clients.
- **Live Notifications**: Get notified instantly when a new client secures a time slot.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have both **Python (3.8+)** and **Node.js (LTS)** installed on your machine.
- Flask, flask-cors
- npm

### 1. Start the Backend API

From the root directory of the project, run:

```bash
# Install the required Python packages (only once)
pip install flask flask-cors

# Start the Flask API
python run.py
```
*The backend server will run natively at `http://localhost:5000` and automatically populate with demo accounts.*

### 2. Start the Frontend React App

Open a new terminal window / tab. From the root directory, navigate into the frontend and start up Vite:

```bash
cd frontend

# Install the required NPM packages (only once)
npm install

# Start the React development server
npm run dev
```
*The frontend will run at `http://localhost:5173`. Any API calls to `/api` are automatically proxied to the Flask server.*

---

## 🧪 Demo Credentials

The backend automatically pre-seeds the in-memory state with existing users and appointments so you can test the system immediately.

**Client Account:**
- **Email:** `alice@email.com`
- **Password:** `demo1234`

**Barber Account:**
- **Email:** `marcus@barbershop.com`
- **Password:** `demo1234`

*(Additional barber accounts generated: `james@barbershop.com` & `diego@barbershop.com` - all use the same password).*

---

## 🔮 Future Enhancements (Roadmap)
- **Database Persistence**: Currently, the application uses an in-memory dictionary. A natural next step is converting `state.py` to use SQLAlchemy/SQLite.
- **Payment Gateway**: The current payment system acts as an integration stub. Hooking into Stripe or Square APIs would enable real transactions.
- **Role-based Authentication**: Expanding the API with secure JWTs to fully lock down Barber boundaries.