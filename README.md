# Task Flow — FastAPI Task Management App

A lightweight, modern Task Management application with an in-memory CRUD backend powered by FastAPI and a dark-mode frontend interface.

---

## 📁 Project Structure

```text
task-api/
├── static/
│   ├── index.html         # Frontend HTML dashboard & stats
│   ├── style.css          # Modern dark theme styles
│   ├── app.js             # Client-side API interactions
│   └── favicon.svg        # Custom tab icon
├── main.py                # FastAPI REST API endpoints & static file serving
└── requirements.txt       # Project Python dependencies
```

---

## ⚡ How to Run

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run Server**:
   ```bash
   uvicorn main:app --reload
   ```

3. **Open in Browser**:
   - Web App: [http://127.0.0.1:8000](http://127.0.0.1:8000)
   - Swagger Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
