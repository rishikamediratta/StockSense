from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
import models, schemas
from auth import get_current_user
from database import get_db,new_id
from routers.receipts import ref,populated

router=APIRouter(prefix="/api/deliveries",tags=["deliveries"])
@router.get("",response_model=list[schemas.DeliveryOut])
def list_deliveries(status:str|None=None,db=Depends(get_db),user=Depends(get_current_user)):
    return [populated(x) for x in db.deliveries.find({"status":status} if status else {})]
@router.post("",response_model=schemas.DeliveryOut)
def create_delivery(payload:schemas.DeliveryCreate,db=Depends(get_db),user=Depends(get_current_user)):
    w=db.warehouses.find_one({"id":payload.warehouse_id})
    if not w: raise HTTPException(400,"Warehouse not found")
    if not payload.lines: raise HTTPException(400,"Delivery must have at least one product line")
    lines=[x.model_dump() for x in payload.lines]; status="Draft"
    for line in lines:
        p=db.products.find_one({"id":line["product_id"]})
        if not p: raise HTTPException(400,f'Product {line["product_id"]} not found')
        if line["qty"]<=0: raise HTTPException(400,"Quantity must be greater than 0")
        if line["location_id"] is not None and not db.locations.find_one({"id":line["location_id"],"warehouse_id":w["id"]}): raise HTTPException(400,"Delivery location must belong to the selected warehouse")
        if p.get("free_to_use",0)<line["qty"]: status="Waiting"
    d={"id":new_id(db,"deliveries"),"reference":ref(db,w,"OUT"),"contact":payload.contact or payload.delivery_address,"delivery_address":payload.delivery_address,"schedule_date":payload.schedule_date,"status":status,"warehouse_id":w["id"],"responsible_id":user["id"],"created_at":datetime.utcnow(),"lines":lines}
    db.deliveries.insert_one(d); return populated(d)
def transition(delivery_id,db,target,allowed):
    d=db.deliveries.find_one({"id":delivery_id})
    if not d: raise HTTPException(404,"Delivery not found")
    if d["status"] not in allowed: raise HTTPException(400,f"Cannot change delivery from {d['status']} to {target}")
    if target=="Ready":
        for line in d["lines"]:
            p=db.products.find_one({"id":line["product_id"]})
            if not p or p.get("free_to_use",0)<line["qty"]: target="Waiting"; break
    if target=="Done":
        for line in d["lines"]:
            p=db.products.find_one({"id":line["product_id"]})
            if not p or p.get("free_to_use",0)<line["qty"]: raise HTTPException(400,f'Insufficient stock for product {p["code"] if p else line["product_id"]}')
        for line in d["lines"]:
            p=db.products.find_one({"id":line["product_id"]}); qty=line["qty"]
            db.products.update_one({"id":p["id"]},{"$inc":{"on_hand":-qty,"free_to_use":-qty}})
            loc=db.locations.find_one({"id":line.get("location_id")}) if line.get("location_id") else None
            wh=db.warehouses.find_one({"id":loc["warehouse_id"]}) if loc else None
            db.moves.insert_one({"id":new_id(db,"moves"),"product_id":p["id"],"from_location":f'{wh["short_code"]}/{loc["short_code"]}' if loc else d["reference"].split("/")[0],"to_location":"Customer","qty":qty,"direction":"out","source_ref":d["reference"],"date":datetime.utcnow()})
    db.deliveries.update_one({"id":delivery_id},{"$set":{"status":target}}); d["status"]=target; return populated(d)
@router.patch("/{delivery_id}/ready",response_model=schemas.DeliveryOut)
def ready_delivery(delivery_id:int,db=Depends(get_db),user=Depends(get_current_user)): return transition(delivery_id,db,"Ready",["Draft","Waiting"])
@router.patch("/{delivery_id}/validate",response_model=schemas.DeliveryOut)
def validate_delivery(delivery_id:int,db=Depends(get_db),user=Depends(get_current_user)): return transition(delivery_id,db,"Done",["Ready"])
@router.patch("/{delivery_id}/cancel",response_model=schemas.DeliveryOut)
def cancel_delivery(delivery_id:int,db=Depends(get_db),user=Depends(get_current_user)): return transition(delivery_id,db,"Canceled",["Draft","Waiting","Ready"])
