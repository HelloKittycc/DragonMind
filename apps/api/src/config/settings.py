from pathlib import Path


API_ROOT = Path(__file__).resolve().parents[2]
DB_PATH = API_ROOT / "dragonmind.sqlite3"
MIGRATIONS_DIR = API_ROOT / "src" / "db" / "migrations"
REMINDER_TIMEZONE = "Asia/Shanghai"
