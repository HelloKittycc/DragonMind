from src.shared.constants import MESSAGE_ROLES, MESSAGE_TYPES


def non_empty_text(value: str, field_name: str) -> str:
    stripped = value.strip()
    if not stripped:
        raise ValueError(f"{field_name} cannot be empty")
    return stripped


def validate_message_role(value: str) -> str:
    if value not in MESSAGE_ROLES:
        raise ValueError("invalid message role")
    return value


def validate_message_type(value: str) -> str:
    if value not in MESSAGE_TYPES:
        raise ValueError("invalid message type")
    return value
