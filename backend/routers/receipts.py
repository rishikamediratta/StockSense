from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
import models, schemas
from auth import get_current_user
from database import get_db, new_id

router=APIRouter(prefix="/api/receipts",tags=["receipts"])
def ref(db,w,op):
    field="receipt_counter" if op=="IN" else "delivery_counter"
    result=db.warehouses.find_one_and_update({"id":w["id"]},{"$inc":{field:1}},return_document=True)
    return f'{w["short_code"]}/{op}/{result[field]:04d}'
def populated(d):
    if d:
        d.pop("_id",None)
        for x in d.get("lines",[]): x.pop("_id",None)
    return d
@router.get("",response_model=list[schemas.ReceiptOut])
def list_receipts(status:str|None=None,db=Depends(get_db),user=Depends(get_current_user)):
    q={"status":status} if status else {}; return [populated(x) for x in db.receipts.find(q)]
@router.post("",response_model=schemas.ReceiptOut)
def create_receipt(payload:schemas.ReceiptCreate,db=Depends(get_db),user=Depends(get_current_user)):
    w=db.warehouses.find_one({"id":payload.warehouse_id})
    if not w: raise HTTPException(400,"Warehouse not found")
    if not payload.lines: raise HTTPException(400,"Receipt must have at least one product line")
    lines=[x.model_dump() for x in payload.lines]
    for line in lines:
        if not db.products.find_one({"id":line["product_id"]}): raise HTTPException(400,f'Product {line["product_id"]} not found')
        if line["location_id"] is not None and not db.locations.find_one({"id":line["location_id"],"warehouse_id":w["id"]}): raise HTTPException(400,"Receipt location must belong to the selected warehouse")
    d={"id":new_id(db,"receipts"),"reference":ref(db,w,"IN"),"contact":payload.contact,"schedule_date":payload.schedule_date,"status":models.ReceiptStatus.Draft.value,"warehouse_id":w["id"],"responsible_id":user["id"],"created_at":datetime.utcnow(),"lines":lines}
    db.receipts.insert_one(d); return populated(d)
def transition(receipt_id,db,target,allowed):
    d=db.receipts.find_one({"id":receipt_id})
    if not d: raise HTTPException(404,"Receipt not found")
    if d["status"] not in allowed: raise HTTPException(400,f"Cannot change receipt from {d['status']} to {target}")
    if target=="Done":
        for line in d["lines"]:
            product=db.products.find_one({"id":line["product_id"]}); qty=line["qty"]
            db.products.update_one({"id":product["id"]},{"$inc":{"on_hand":qty,"free_to_use":qty}})
            loc=db.locations.find_one({"id":line.get("location_id")}) if line.get("location_id") else None
            wh=db.warehouses.find_one({"id":loc["warehouse_id"]}) if loc else None
            db.moves.insert_one({"id":new_id(db,"moves"),"product_id":product["id"],"from_location":"Supplier","to_location":f'{wh["short_code"]}/{loc["short_code"]}' if loc else d["reference"].split("/")[0],"qty":qty,"direction":"in","source_ref":d["reference"],"date":datetime.utcnow()})
    db.receipts.update_one({"id":receipt_id},{"$set":{"status":target}}); d["status"]=target; return populated(d)
@router.patch("/{receipt_id}/ready",response_model=schemas.ReceiptOut)
def ready_receipt(receipt_id:int,db=Depends(get_db),user=Depends(get_current_user)): return transition(receipt_id,db,"Ready",["Draft"])
@router.patch("/{receipt_id}/validate",response_model=schemas.ReceiptOut)
def validate_receipt(receipt_id:int,db=Depends(get_db),user=Depends(get_current_user)): return transition(receipt_id,db,"Done",["Ready"])
@router.patch("/{receipt_id}/cancel",response_model=schemas.ReceiptOut)
def cancel_receipt(receipt_id:int,db=Depends(get_db),user=Depends(get_current_user)): return transition(receipt_id,db,"Canceled",["Draft","Ready"])
