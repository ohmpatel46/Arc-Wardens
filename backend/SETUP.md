# Quick Setup Guide

## Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

## Run the Server

```bash
python server.py
```

Or with uvicorn directly:
```bash
uvicorn server:app --reload --port 5000
```

## Verify It's Working

1. Check health endpoint: `http://localhost:5000/health`
2. View API docs: `http://localhost:5000/docs` (Swagger UI)
3. Alternative docs: `http://localhost:5000/redoc` (ReDoc)

## Troubleshooting

### Port Already in Use
If port 5000 is busy, change it in `server.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=5001, reload=True)
```

### Import Errors
Make sure you're in a virtual environment and all dependencies are installed:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Circle API Errors
Ensure your `.env` file in the project root has:
- `CIRCLE_API_KEY`
- `CIRCLE_ENTITY_SECRET_BASE64`
- `CIRCLE_PUBLIC_KEY_PEM`
