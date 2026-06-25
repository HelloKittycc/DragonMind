from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from src.config.settings import REMINDER_TIMEZONE


def now_iso() -> str:
    return datetime.now(ZoneInfo(REMINDER_TIMEZONE)).isoformat()


def today_at_21_iso() -> str:
    now = datetime.now(ZoneInfo(REMINDER_TIMEZONE))
    reminder = datetime.combine(now.date(), time(hour=21), tzinfo=ZoneInfo(REMINDER_TIMEZONE))
    return reminder.isoformat()


def add_days_iso(value: str, days: int) -> str:
    return (datetime.fromisoformat(value) + timedelta(days=days)).isoformat()


def now_datetime() -> datetime:
    return datetime.now(ZoneInfo(REMINDER_TIMEZONE))
