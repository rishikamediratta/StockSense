import sys
from pathlib import Path
import mongomock

BACKEND = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND))
test_db = mongomock.MongoClient().stocksense
