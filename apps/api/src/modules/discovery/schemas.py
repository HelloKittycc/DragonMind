from typing import Optional

from pydantic import BaseModel


class DiscoveryFeedItem(BaseModel):
    item_type: str
    node_id: Optional[str]
    task_id: Optional[str]
    relation_id: Optional[str]
    evidence_id: Optional[str]
    title: str
    description: str
    created_at: str
    runtime_importance: int
