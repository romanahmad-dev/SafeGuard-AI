import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Default to SQLite for local development; can be overridden via environment variables for production PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./safeguard_factory.db")

# If using SQLite, we need to disable the same-thread check for multi-threaded FastAPI execution
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True  # Detect and recover from stale connections automatically
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    Dependency helper to provide thread-safe request-scoped database sessions.
    Automatically releases database connections back to the pool upon request termination.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
