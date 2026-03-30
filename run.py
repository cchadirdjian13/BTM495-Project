"""run.py - Convenience launcher for the Flask backend."""
import os, sys

# Ensure backend/ is on sys.path so `import state` resolves
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from backend.app import app

if __name__ == "__main__":
    print("Starting Barber Shop API on http://localhost:5000")
    app.run(debug=True, port=5000)
