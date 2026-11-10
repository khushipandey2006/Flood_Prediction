import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")

_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
CORS_ORIGINS = [o.strip() for o in _origins.split(",") if o.strip()]

_db = Path(os.getenv("DATABASE_PATH", "clariflood.db"))
DATABASE_PATH = _db if _db.is_absolute() else BACKEND_DIR / _db