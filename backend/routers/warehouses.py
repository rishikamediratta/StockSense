from fastapi import APIRouter, Depends, HTTPException
import schemas
from auth import get_current_user
from database import get_db, new_id

router=APIRouter(prefix="/api",tags=["warehouses"])
def doc(d):
    if d: d.pop("_id",None)
    return d

@router.get("/warehouses",response_model=list[schemas.WarehouseOut])
def list_warehouses(db=Depends(get_db),user=Depends(get_current_user)):
    return [doc(x) for x in db.warehouses.find().sort("name",1)]

@router.post("/warehouses",response_model=schemas.WarehouseOut)
def create_warehouse(payload:schemas.WarehouseCreate,db=Depends(get_db),user=Depends(get_current_user)):
    data=payload.model_dump()
    if db.warehouses.find_one({"short_code":data["short_code"]}): raise HTTPException(400,"Warehouse short code already exists")
    data.update(id=new_id(db,"warehouses"),receipt_counter=0,delivery_counter=0); db.warehouses.insert_one(data); return data

@router.get("/locations",response_model=list[schemas.LocationOut])
def list_locations(db=Depends(get_db),user=Depends(get_current_user)):
    return [doc(x) for x in db.locations.find().sort("name",1)]

@router.post("/locations",response_model=schemas.LocationOut)
def create_location(payload:schemas.LocationCreate,db=Depends(get_db),user=Depends(get_current_user)):
    data=payload.model_dump()
    if not db.warehouses.find_one({"id":data["warehouse_id"]}): raise HTTPException(400,"Warehouse not found")
    if db.locations.find_one({"warehouse_id":data["warehouse_id"],"short_code":data["short_code"]}): raise HTTPException(400,"Location short code already exists in this warehouse")
    data["id"]=new_id(db,"locations"); db.locations.insert_one(data); return data
