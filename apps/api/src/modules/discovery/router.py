from fastapi import APIRouter

from src.db.database import connection_scope
from src.modules.discovery.schemas import DiscoveryFeedItem
from src.modules.discovery.service import get_discovery_feed


router = APIRouter(prefix="/discovery-feed", tags=["discovery-feed"])


@router.get("", response_model=list[DiscoveryFeedItem])
def get_feed() -> list[dict]:
    with connection_scope() as conn:
        return get_discovery_feed(conn)
