"""Inventory insights and natural language query endpoints."""
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
import ai_tools
from auth import get_current_user
from database import get_db

router=APIRouter(prefix="/api/ai",tags=["ai"])

class AIQueryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)

@router.get("/insights")
def get_insights(db=Depends(get_db), user=Depends(get_current_user)):
    return {"insights": ai_tools.insights(db)}

@router.get("/explain/{identifier}")
def explain_product(identifier:str,db=Depends(get_db),user=Depends(get_current_user)):
    product=ai_tools.product_by_identifier(db,identifier)
    if not product: raise HTTPException(404,detail=f"Product '{identifier}' not found")
    return ai_tools.product_explanation(db,product)

@router.post("/query")
def query_ai(payload:AIQueryRequest,db=Depends(get_db),user=Depends(get_current_user)):
    query=payload.query.strip()
    if not query: raise HTTPException(422,"Query cannot be empty")
    lowered=query.lower(); all_products=ai_tools.products(db)
    matched=next((p for p in all_products if p["name"].lower() in lowered or p["code"].lower() in lowered),None)
    if matched and any(word in lowered for word in ("why","explain","change","movement","decrease","low")):
        data=ai_tools.product_explanation(db,matched)
        answer=(f'{matched["name"]} ({matched["code"]}) has {data["current_stock"]:g} {matched.get("unit","units")} on hand. '
                f'Net 7-day movement is {data["net_change_7d"]:+g}; {data["weekly_dispatched"]:g} dispatched and {data["weekly_received"]:g} received. '
                + (f'Estimated depletion: {data["estimated_depletion_days"]} days.' if data["estimated_depletion_days"] is not None else "There is not enough recent dispatch history to estimate depletion."))
        title=f'Stock analysis: {matched["name"]}'; structured=data
    elif any(word in lowered for word in ("out of stock","zero stock","empty")):
        items=[p for p in all_products if p.get("on_hand",0)<=0]
        answer=f'{len(items)} product(s) are out of stock.'; title="Out of stock items"; structured={"items":items}
    elif any(word in lowered for word in ("low stock","risk","running out","replenish","attention")):
        items=[p for p in all_products if p.get("on_hand",0)<=p.get("reorder_point",0)]
        answer=f'{len(items)} product(s) are at or below their reorder point.'; title="Low stock and replenishment risk"; structured={"items":items}
    elif any(word in lowered for word in ("receipt","incoming","supplier","vendor","purchase")):
        items=list(db.receipts.find({"status":{"$in":["Draft","Ready"]}},{"_id":0,"id":1,"reference":1,"contact":1,"status":1}))
        answer=f'{len(items)} pending receipt(s).'; title="Pending receipts"; structured={"pending_receipts":items}
    elif any(word in lowered for word in ("delivery","outgoing","dispatch","customer","shipment")):
        items=list(db.deliveries.find({"status":{"$in":["Draft","Waiting","Ready"]}},{"_id":0,"id":1,"reference":1,"contact":1,"status":1}))
        answer=f'{len(items)} pending delivery order(s).'; title="Pending deliveries"; structured={"pending_deliveries":items}
    else:
        answer=f'StockSense is tracking {len(all_products)} products with {sum(p.get("on_hand",0) for p in all_products):g} units on hand. Ask about low stock, a product, pending receipts, or deliveries.'
        title="Inventory overview"; structured={"total_products":len(all_products),"total_units":sum(p.get("on_hand",0) for p in all_products)}
    return {"title":title,"answer":answer,"query":query,"structured_data":structured,"sources":["Live inventory records","Stock movement ledger"],"actions":[]}
