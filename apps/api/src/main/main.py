from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.modules.nodes.router import router as nodes_router
from src.modules.discovery.router import router as discovery_router
from src.modules.evidence.router import router as evidence_router
from src.modules.knowledge.router import router as knowledge_router
from src.modules.relations.router import router as relations_router
from src.modules.review_context.router import router as review_context_router
from src.modules.tasks.router import router as tasks_router
from src.db.database import run_migrations


app = FastAPI(title="DragonMind API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    run_migrations()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(nodes_router)
app.include_router(discovery_router)
app.include_router(evidence_router)
app.include_router(knowledge_router)
app.include_router(relations_router)
app.include_router(review_context_router)
app.include_router(tasks_router)
