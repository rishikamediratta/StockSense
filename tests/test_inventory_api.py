import pytest
from fastapi.testclient import TestClient

from database import get_db
from main import app
from conftest import test_db

app.dependency_overrides[get_db] = lambda: test_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_database():
    for name in test_db.list_collection_names():
        test_db.drop_collection(name)


def test_inventory_receipt_delivery_transfer_and_adjustment_flow():
    client.post("/api/auth/signup", json={"login_id":"warehouse1", "email":"warehouse@example.com", "password":"SecurePass@123"})
    token = client.post("/api/auth/login", json={"login_id":"warehouse1", "password":"SecurePass@123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    product = client.post("/api/products", headers=headers, json={"code":"P-1","name":"Widget","category":"","unit":"pcs","cost_per_unit":2,"on_hand":0,"free_to_use":0,"reorder_point":1}).json()
    warehouse = client.post("/api/warehouses", headers=headers, json={"name":"Main","short_code":"MAIN","address":""}).json()
    source = client.post("/api/locations", headers=headers, json={"name":"Shelf A","short_code":"A","warehouse_id":warehouse["id"]}).json()
    destination = client.post("/api/locations", headers=headers, json={"name":"Shelf B","short_code":"B","warehouse_id":warehouse["id"]}).json()

    receipt = client.post("/api/receipts", headers=headers, json={"contact":"Supplier","schedule_date":"2026-09-26T10:00:00","warehouse_id":warehouse["id"],"lines":[{"product_id":product["id"],"location_id":source["id"],"qty":8}]}).json()
    assert client.patch(f"/api/receipts/{receipt['id']}/ready", headers=headers).status_code == 200
    assert client.patch(f"/api/receipts/{receipt['id']}/validate", headers=headers).json()["status"] == "Done"

    transfer = client.post("/api/transfers", headers=headers, json={"product_id":product["id"],"source_location_id":source["id"],"destination_location_id":destination["id"],"qty":2})
    assert transfer.status_code == 200, transfer.text
    adjustment = client.post("/api/adjustments", headers=headers, json={"product_id":product["id"],"location_id":destination["id"],"counted_quantity":3})
    assert adjustment.status_code == 200, adjustment.text

    delivery = client.post("/api/deliveries", headers=headers, json={"contact":"Customer","delivery_address":"Dock","schedule_date":"2026-09-26T10:00:00","warehouse_id":warehouse["id"],"lines":[{"product_id":product["id"],"location_id":destination["id"],"qty":1}]})
    assert delivery.status_code == 200, delivery.text
    assert client.patch(f"/api/deliveries/{delivery.json()['id']}/ready", headers=headers).json()["status"] == "Ready"
    assert client.patch(f"/api/deliveries/{delivery.json()['id']}/validate", headers=headers).json()["status"] == "Done"

    assert client.get("/api/products", headers=headers).json()[0]["on_hand"] == 8
    assert len(client.get("/api/moves", headers=headers).json()) == 4


def test_ai_query_and_insights_read_current_mongo_inventory():
    client.post("/api/auth/signup", json={"login_id":"aiuser01", "email":"ai@example.com", "password":"SecurePass@123"})
    token = client.post("/api/auth/login", json={"login_id":"aiuser01", "password":"SecurePass@123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    created = client.post("/api/products", headers=headers, json={"code":"AI-LOW","name":"Low Widget","category":"Parts","unit":"pcs","cost_per_unit":1,"on_hand":0,"free_to_use":0,"reorder_point":3})
    assert created.status_code == 200
    result = client.post("/api/ai/query", headers=headers, json={"query":"Which products are out of stock?"})
    assert result.status_code == 200
    assert result.json()["structured_data"]["items"][0]["code"] == "AI-LOW"
    insights = client.get("/api/ai/insights", headers=headers)
    assert insights.status_code == 200
    assert insights.json()["insights"][0]["product_code"] == "AI-LOW"
