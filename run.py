"""run.py - Convenience launcher for the Flask backend."""
import os, sys

# Ensure backend/ is on sys.path so `import state` resolves
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from backend.app import create_app

if __name__ == "__main__":
    print("Starting Barber Shop API backed by SQLite on http://localhost:5000")
    app_instance = create_app()
    app_instance.run(debug=True, port=5000)
