from fastapi import APIRouter, Depends, HTTPException
import schemas
from auth import get_current_user
from database import get_db, new_id

router = APIRouter(prefix="/api/products", tags=["products"])

@router.get("", response_model=list[schemas.ProductOut])
def list_products(db=Depends(get_db), user=Depends(get_current_user)):
    return [{k:v for k,v in d.items() if k != "_id"} for d in db.products.find().sort("name", 1)]

@router.post("", response_model=schemas.ProductOut)
def create_product(payload: schemas.ProductCreate, db=Depends(get_db), user=Depends(get_current_user)):
    data = payload.model_dump()
    if db.products.find_one({"code": data["code"]}):
        raise HTTPException(400, "Product code already exists")
    data.update(id=new_id(db, "products"), on_hand=0.0, free_to_use=0.0)
    db.products.insert_one(data)
    if payload.on_hand:
        db.products.update_one({"id":data["id"]},{"$set":{"on_hand":payload.on_hand,"free_to_use":payload.free_to_use}})
        db.moves.insert_one({"id":new_id(db,"moves"),"product_id":data["id"],"from_location":"External opening balance","to_location":"Unassigned","qty":payload.on_hand,"direction":"adjustment","source_ref":f"OPENING/{payload.code}","date":__import__("datetime").datetime.utcnow()})
    data["on_hand"], data["free_to_use"] = payload.on_hand, payload.free_to_use
    return data

@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db=Depends(get_db), user=Depends(get_current_user)):
    item=db.products.find_one({"id":product_id})
    if not item: raise HTTPException(404,"Product not found")
    item.pop("_id",None); return item

@router.patch("/{product_id}", response_model=schemas.ProductOut)
def update_product(product_id: int, payload: schemas.ProductCreate, db=Depends(get_db), user=Depends(get_current_user)):
    item=db.products.find_one({"id":product_id})
    if not item: raise HTTPException(404,"Product not found")
    data=payload.model_dump(exclude={"on_hand","free_to_use"})
    db.products.update_one({"id":product_id},{"$set":data})
    item.update(data); item.pop("_id",None); return item
