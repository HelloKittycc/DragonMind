import os
import sqlite3
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from src.config import settings  # noqa: E402
from src.db import database  # noqa: E402


def test_day1_migrations_create_expected_tables() -> None:
    with tempfile.TemporaryDirectory() as tmpdir:
        original_db_path = settings.DB_PATH
        original_database_db_path = database.DB_PATH
        test_db_path = Path(tmpdir) / "dragonmind.sqlite3"
        settings.DB_PATH = test_db_path
        database.DB_PATH = test_db_path
        try:
            database.run_migrations()
            conn = sqlite3.connect(test_db_path)
            tables = {
                row[0]
                for row in conn.execute(
                    "SELECT name FROM sqlite_master WHERE type='table'"
                ).fetchall()
            }
            assert "node" in tables
            assert "node_message" in tables
            assert "node_interpretation" in tables
            assert "relation" in tables
            assert "evidence" in tables
            assert "task" in tables
            assert "decision" not in tables
        finally:
            settings.DB_PATH = original_db_path
            database.DB_PATH = original_database_db_path
