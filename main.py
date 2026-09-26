from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models
from database import Base, engine
from routers import auth, products, warehouses, receipts, deliveries, moves, dashboard

Base.metadata.create_all(bind=engine)


def seed_demo_user():
    from auth import hash_password
    from database import SessionLocal
    db = SessionLocal()
    try:
        if not db.query(models.User).filter(models.User.login_id == "manager01").first():
            user = models.User(
                login_id="manager01",
                email="manager@stocksense.local",
                password_hash=hash_password("Stocksense@2026"),
            )
            db.add(user)
            db.commit()
    finally:
        db.close()


seed_demo_user()

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


@app.get("/")
def root():
    return {"status": "StockSense API running"}
