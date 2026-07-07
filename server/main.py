"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, seed_db
from routers import annual_evals, eval_rules, organizations, quarterly_evals


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and seed data on startup."""
    await init_db()
    await seed_db()
    yield


app = FastAPI(
    title="基层党组织创先争优评价管理系统",
    description="基于模板的季度/年度创先争优评价管理系统",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(organizations.router)
app.include_router(quarterly_evals.router)
app.include_router(annual_evals.router)
app.include_router(eval_rules.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


def main() -> None:
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8765, reload=True)


if __name__ == "__main__":
    main()
