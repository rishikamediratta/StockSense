from datetime import datetime
from fastapi import APIRouter,Depends,HTTPException
import schemas
from auth import get_current_user
from database import get_db,new_id

router=APIRouter(prefix="/api",tags=["inventory operations"])
def clean(d):
    if d:d.pop("_id",None)
    return d
def label(db,loc):
    w=db.warehouses.find_one({"id":loc["warehouse_id"]})
    return f'{w["short_code"]}/{loc["short_code"]}'
def stock(db,pid,loc):
    qty=0
    for m in db.moves.find({"product_id":pid}):
        if m["to_location"]==loc and m["direction"] in ("in","internal","adjustment"):qty+=m["qty"]
        if m["from_location"]==loc and m["direction"] in ("out","internal","adjustment"):qty-=m["qty"]
    return qty
@router.get("/transfers",response_model=list[schemas.TransferOut])
def list_transfers(db=Depends(get_db),user=Depends(get_current_user)):return [clean(x) for x in db.transfers.find().sort("created_at",-1)]
@router.post("/transfers",response_model=schemas.TransferOut)
def create_transfer(payload:schemas.TransferCreate,db=Depends(get_db),user=Depends(get_current_user)):
    if payload.source_location_id==payload.destination_location_id:raise HTTPException(400,"Source and destination locations must differ")
    p=db.products.find_one({"id":payload.product_id}); src=db.locations.find_one({"id":payload.source_location_id}); dst=db.locations.find_one({"id":payload.destination_location_id})
    if not p:raise HTTPException(400,"Product not found")
    if not src or not dst:raise HTTPException(400,"Source and destination locations must exist")
    sl,dl=label(db,src),label(db,dst)
    if stock(db,p["id"],sl)<payload.qty:raise HTTPException(400,"Insufficient stock at the source location")
    i=new_id(db,"transfers"); reference=f'{sl.split("/")[0]}/INT/{i:04d}'; d={"id":i,"reference":reference,"product_id":p["id"],"source_location_id":src["id"],"destination_location_id":dst["id"],"qty":payload.qty,"responsible_id":user["id"],"status":"Done","created_at":datetime.utcnow()}
    db.transfers.insert_one(d);db.moves.insert_one({"id":new_id(db,"moves"),"product_id":p["id"],"from_location":sl,"to_location":dl,"qty":payload.qty,"direction":"internal","source_ref":reference,"date":datetime.utcnow()});return d
@router.get("/adjustments",response_model=list[schemas.AdjustmentOut])
def list_adjustments(db=Depends(get_db),user=Depends(get_current_user)):return [clean(x) for x in db.adjustments.find().sort("created_at",-1)]
@router.post("/adjustments",response_model=schemas.AdjustmentOut)
def create_adjustment(payload:schemas.AdjustmentCreate,db=Depends(get_db),user=Depends(get_current_user)):
    p=db.products.find_one({"id":payload.product_id});loc=db.locations.find_one({"id":payload.location_id})
    if not p:raise HTTPException(400,"Product not found")
    if not loc:raise HTTPException(400,"Location not found")
    tag=label(db,loc);recorded=stock(db,p["id"],tag);delta=payload.counted_quantity-recorded
    if p.get("on_hand",0)+delta<0 or p.get("free_to_use",0)+delta<0:raise HTTPException(400,"Adjustment would create negative available stock")
    i=new_id(db,"adjustments");reference=f'{tag.split("/")[0]}/ADJ/{i:04d}';d={"id":i,"reference":reference,"product_id":p["id"],"location_id":loc["id"],"recorded_quantity":recorded,"counted_quantity":payload.counted_quantity,"delta":delta,"responsible_id":user["id"],"status":"Done","created_at":datetime.utcnow()}
    db.adjustments.insert_one(d);db.products.update_one({"id":p["id"]},{"$inc":{"on_hand":delta,"free_to_use":delta}});db.moves.insert_one({"id":new_id(db,"moves"),"product_id":p["id"],"from_location":tag if delta<=0 else "Adjustment","to_location":tag if delta>=0 else "Adjustment","qty":abs(delta),"direction":"adjustment","source_ref":reference,"date":datetime.utcnow()});return d
