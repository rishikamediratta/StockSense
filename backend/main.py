from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import auth, products, warehouses, receipts, deliveries, moves, dashboard, ai

Base.metadata.create_all(bind=engine)

app = FastAPI(title="StockSense API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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
app.include_router(ai.router)


@app.get("/")
def root():
    return {"status": "StockSense API running"}
