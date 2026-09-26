from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from database import init_db
from routers import auth, products, warehouses, receipts, deliveries, moves, dashboard, inventory

try:
    init_db()
except Exception as exc:
    # Keep module import useful for docs/tests when Atlas is not reachable;
    # requests will still fail clearly until MongoDB becomes available.
    print(f"MongoDB index initialization deferred: {exc}")

app = FastAPI(title="StockSense API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "CORS_ORIGINS", "http://localhost:5000,http://127.0.0.1:5000"
    ).split(","),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(warehouses.router)
app.include_router(receipts.router)
app.include_router(deliveries.router)
app.include_router(moves.router)
app.include_router(dashboard.router)
app.include_router(inventory.router)


@app.get("/")
def root():
    return {"status": "StockSense API running"}
