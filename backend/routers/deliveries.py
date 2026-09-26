from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from auth import get_current_user
from database import get_db
from routers.receipts import next_reference

router = APIRouter(prefix="/api/deliveries", tags=["deliveries"])


@router.get("", response_model=List[schemas.DeliveryOut])
def list_deliveries(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    query = db.query(models.Delivery)
    if status:
        query = query.filter(models.Delivery.status == status)
    return query.all()


@router.post("", response_model=schemas.DeliveryOut)
def create_delivery(
    payload: schemas.DeliveryCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    warehouse = db.query(models.Warehouse).filter(
        models.Warehouse.id == payload.warehouse_id
    ).first()
    if not warehouse:
        raise HTTPException(400, "Warehouse not found")
    if not payload.lines:
        raise HTTPException(400, "Delivery must have at least one product line")

    # If any line lacks free-to-use stock, the delivery starts life as Waiting
    initial_status = models.DeliveryStatus.Draft
    for line in payload.lines:
        product = db.query(models.Product).filter(models.Product.id == line.product_id).first()
        if not product:
            raise HTTPException(400, f"Product {line.product_id} not found")
        if line.qty <= 0:
            raise HTTPException(400, "Quantity must be greater than 0")
        if product.free_to_use < line.qty:
            initial_status = models.DeliveryStatus.Waiting

    reference = next_reference(db, warehouse, "OUT")
    delivery = models.Delivery(
        reference=reference,
        delivery_address=payload.delivery_address,
        schedule_date=payload.schedule_date,
        warehouse_id=payload.warehouse_id,
        responsible_id=user.id,
        status=initial_status,
    )
    delivery.lines = [
        models.DeliveryLine(product_id=line.product_id, qty=line.qty)
        for line in payload.lines
    ]
    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    return delivery


@router.patch("/{delivery_id}/validate", response_model=schemas.DeliveryOut)
def validate_delivery(
    delivery_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    delivery = db.query(models.Delivery).filter(models.Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(404, "Delivery not found")
    if delivery.status == models.DeliveryStatus.Done:
        raise HTTPException(400, "Delivery already completed")
    if delivery.status == models.DeliveryStatus.Canceled:
        raise HTTPException(400, "Delivery is canceled")

    # Re-check stock right before committing the mutation
    for line in delivery.lines:
        product = db.query(models.Product).filter(models.Product.id == line.product_id).first()
        if product.free_to_use < line.qty:
            raise HTTPException(400, f"Insufficient stock for product {product.code}")

    for line in delivery.lines:
        product = db.query(models.Product).filter(models.Product.id == line.product_id).first()
        product.on_hand -= line.qty
        product.free_to_use -= line.qty
        db.add(product)
        db.add(models.Move(
            product_id=product.id,
            from_location=delivery.reference.split("/")[0],
            to_location="Customer",
            qty=line.qty,
            direction="out",
            source_ref=delivery.reference,
        ))

    delivery.status = models.DeliveryStatus.Done
    db.commit()
    db.refresh(delivery)
    return delivery


@router.patch("/{delivery_id}/cancel", response_model=schemas.DeliveryOut)
def cancel_delivery(
    delivery_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    delivery = db.query(models.Delivery).filter(models.Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(404, "Delivery not found")
    if delivery.status == models.DeliveryStatus.Done:
        raise HTTPException(400, "Cannot cancel a completed delivery")
    delivery.status = models.DeliveryStatus.Canceled
    db.commit()
    db.refresh(delivery)
    return delivery
