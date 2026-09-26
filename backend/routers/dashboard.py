from datetime import datetime
from fastapi import APIRouter, Depends
from auth import get_current_user
from database import get_db

router=APIRouter(prefix="/api/dashboard",tags=["dashboard"])
@router.get("/summary")
def dashboard_summary(db=Depends(get_db),user=Depends(get_current_user)):
    now=datetime.utcnow()
    products=list(db.products.find({}, {"_id":0,"on_hand":1,"reorder_point":1}))
    def count(coll, statuses, late=False):
        query={"status":{"$in":statuses}}
        if late: query["schedule_date"]={"$lt":now}
        return db[coll].count_documents(query)
    return {"total_products":len(products),"low_stock_items":sum(p.get("on_hand",0)<=p.get("reorder_point",0) for p in products),"pending_receipts":count("receipts",["Draft","Ready"]),"pending_deliveries":count("deliveries",["Draft","Waiting","Ready"]),"late_receipts":count("receipts",["Draft","Ready"],True),"late_deliveries":count("deliveries",["Draft","Waiting","Ready"],True)}
