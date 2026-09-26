# Run StockSense locally

The React UI calls the FastAPI auth endpoints through Vite's `/api` proxy. Start each process in its own terminal.

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env
set -a; source ../.env; set +a
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Set `MONGODB_URI` and `MONGODB_DB_NAME` in the root `.env`. The default URI
uses a local MongoDB server at `127.0.0.1:27017`; for Atlas, use your Atlas
connection string. A local standalone server is suitable for development; use
a replica set when transaction support is needed.

FastAPI docs are available at `http://127.0.0.1:8000/docs`.

To run the backend checks, install `requirements-dev.txt` in the same virtual environment and run `python -m pytest -q` from the project root.

## Frontend

```bash
npm ci
npm run dev
```

Open `http://localhost:5000`. Sign up first; demo accounts are not created automatically. FastAPI persists data in MongoDB. Keep the Atlas URI in the local `.env` file and do not commit it.
