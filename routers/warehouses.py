from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/api", tags=["warehouses"])


@router.get("/warehouses", response_model=List[schemas.WarehouseOut])
def list_warehouses(
    db: Session = Depends(get_db), user: models.User = Depends(get_current_user)
):
    return db.query(models.Warehouse).all()


@router.post("/warehouses", response_model=schemas.WarehouseOut)
def create_warehouse(
    payload: schemas.WarehouseCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    if db.query(models.Warehouse).filter(
        models.Warehouse.short_code == payload.short_code
    ).first():
        raise HTTPException(400, "Warehouse short code already exists")
    warehouse = models.Warehouse(**payload.dict())
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    return warehouse


@router.get("/locations", response_model=List[schemas.LocationOut])
def list_locations(
    db: Session = Depends(get_db), user: models.User = Depends(get_current_user)
):
    return db.query(models.Location).all()


@router.post("/locations", response_model=schemas.LocationOut)
def create_location(
    payload: schemas.LocationCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    if not db.query(models.Warehouse).filter(
        models.Warehouse.id == payload.warehouse_id
    ).first():
        raise HTTPException(400, "Warehouse not found")
    location = models.Location(**payload.dict())
    db.add(location)
    db.commit()
    db.refresh(location)
    return location
