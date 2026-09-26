"""Rule based inventory intelligence over authoritative MongoDB records."""
from datetime import datetime, timedelta


def products(db):
    return list(db.products.find({}, {"_id": 0}))


def product_by_identifier(db, identifier):
    key = identifier.strip().lower()
    return next((p for p in products(db) if key in p.get("code", "").lower() or key in p.get("name", "").lower()), None)


def product_explanation(db, product):
    cutoff = datetime.utcnow() - timedelta(days=7)
    moves = list(db.moves.find({"product_id": product["id"], "date": {"$gte": cutoff}}, {"_id": 0}))
    sent = sum(m["qty"] for m in moves if m["direction"] == "out")
    received = sum(m["qty"] for m in moves if m["direction"] == "in")
    incoming = sum(line["qty"] for op in db.receipts.find({"status": {"$in": ["Draft", "Ready"]}}) for line in op.get("lines", []) if line["product_id"] == product["id"])
    rate = sent / 7
    reasons = []
    if sent: reasons.append(f"{sent:g} {product.get('unit','units')} dispatched in the last 7 days.")
    if received: reasons.append(f"{received:g} {product.get('unit','units')} received in the last 7 days.")
    if not incoming and product.get("on_hand", 0) < product.get("reorder_point", 0): reasons.append("No replenishment receipt is currently pending.")
    return {"product_id": product["id"], "name": product["name"], "code": product["code"], "current_stock": product.get("on_hand", 0), "free_to_use": product.get("free_to_use", 0), "weekly_dispatched": sent, "weekly_received": received, "net_change_7d": received-sent, "pending_receipts_qty": incoming, "estimated_depletion_days": round(product.get("on_hand", 0)/rate, 1) if rate else None, "reasons": reasons}


def insights(db):
    result=[]
    for p in products(db):
        qty=p.get("on_hand",0); threshold=p.get("reorder_point",0)
        if qty <= 0: result.append({"type":"out_of_stock","severity":"critical","title":f'{p["name"]} is out of stock',"product_id":p["id"],"product_code":p["code"],"detail":"No units are currently on hand."})
        elif qty <= threshold: result.append({"type":"low_stock","severity":"warning","title":f'{p["name"]} is below its reorder point',"product_id":p["id"],"product_code":p["code"],"detail":f"{qty:g} on hand against a reorder point of {threshold:g}."})
    for op in db.deliveries.find({"status":"Waiting"}, {"_id":0,"id":1,"reference":1,"contact":1}):
        result.append({"type":"waiting_delivery","severity":"warning","title":f'Delivery {op["reference"]} is waiting',"detail":op.get("contact","")})
    return result
