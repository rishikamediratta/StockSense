"""MongoDB connection and small document helpers for Atlas/local MongoDB."""
import os
from datetime import datetime

from dotenv import load_dotenv
from pymongo import MongoClient, ReturnDocument

load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/?directConnection=true")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "stocksense")
_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000, tz_aware=False)
_db = _client[MONGODB_DB_NAME]


def get_db():
    """FastAPI dependency yielding the configured MongoDB database."""
    yield _db


def init_db():
    _db.users.create_index("login_id", unique=True)
    _db.users.create_index("email", unique=True)
    _db.products.create_index("code", unique=True)
    _db.warehouses.create_index("short_code", unique=True)
    _db.locations.create_index([("warehouse_id", 1), ("short_code", 1)], unique=True)
    for collection in ("receipts", "deliveries", "transfers", "adjustments"):
        _db[collection].create_index("reference", unique=True)


def new_id(db, collection: str) -> int:
    """Monotonic numeric IDs keep the existing frontend/API contract stable."""
    value = db.counters.find_one_and_update(
        {"_id": collection}, {"$inc": {"value": 1}}, upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return value["value"]


def clean(document):
    if document is None:
        return None
    result = dict(document)
    result.pop("_id", None)
    return result


def now():
    return datetime.utcnow()
