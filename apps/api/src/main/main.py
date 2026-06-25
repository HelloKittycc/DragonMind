from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.modules.nodes.router import router as nodes_router
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
