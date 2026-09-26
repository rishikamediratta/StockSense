from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/api/receipts", tags=["receipts"])


def next_reference(db: Session, warehouse: models.Warehouse, op: str) -> str:
    """Shared by receipts (IN) and deliveries (OUT). Increments the
    per-warehouse counter and returns e.g. WH/IN/0001."""
    if op == "IN":
        warehouse.receipt_counter += 1
        num = warehouse.receipt_counter
    else:
        warehouse.delivery_counter += 1
        num = warehouse.delivery_counter
    db.add(warehouse)
    return f"{warehouse.short_code}/{op}/{num:04d}"


@router.get("", response_model=List[schemas.ReceiptOut])
def list_receipts(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    query = db.query(models.Receipt)
    if status:
        query = query.filter(models.Receipt.status == status)
    return query.all()


@router.post("", response_model=schemas.ReceiptOut)
def create_receipt(
    payload: schemas.ReceiptCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    warehouse = db.query(models.Warehouse).filter(
        models.Warehouse.id == payload.warehouse_id
    ).first()
    if not warehouse:
        raise HTTPException(400, "Warehouse not found")
    if not payload.lines:
        raise HTTPException(400, "Receipt must have at least one product line")

    for line in payload.lines:
        if not db.query(models.Product).filter(models.Product.id == line.product_id).first():
            raise HTTPException(400, f"Product {line.product_id} not found")
        if line.qty <= 0:
            raise HTTPException(400, "Quantity must be greater than 0")

    reference = next_reference(db, warehouse, "IN")
    receipt = models.Receipt(
        reference=reference,
        contact=payload.contact,
        schedule_date=payload.schedule_date,
        warehouse_id=payload.warehouse_id,
        responsible_id=user.id,
        status=models.ReceiptStatus.Draft,
    )
    receipt.lines = [
        models.ReceiptLine(product_id=line.product_id, qty=line.qty)
        for line in payload.lines
    ]
    db.add(receipt)
    db.commit()
    db.refresh(receipt)
    return receipt


@router.patch("/{receipt_id}/validate", response_model=schemas.ReceiptOut)
def validate_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    receipt = db.query(models.Receipt).filter(models.Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(404, "Receipt not found")
    if receipt.status == models.ReceiptStatus.Done:
        raise HTTPException(400, "Receipt already completed")
    if receipt.status == models.ReceiptStatus.Canceled:
        raise HTTPException(400, "Receipt is canceled")

    # Apply stock changes + ledger entries atomically
    for line in receipt.lines:
        product = db.query(models.Product).filter(models.Product.id == line.product_id).first()
        product.on_hand += line.qty
        product.free_to_use += line.qty
        db.add(product)
        db.add(models.Move(
            product_id=product.id,
            from_location="Supplier",
            to_location=receipt.reference.split("/")[0],
            qty=line.qty,
            direction="in",
            source_ref=receipt.reference,
        ))

    receipt.status = models.ReceiptStatus.Done
    db.commit()
    db.refresh(receipt)
    return receipt


@router.patch("/{receipt_id}/cancel", response_model=schemas.ReceiptOut)
def cancel_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    receipt = db.query(models.Receipt).filter(models.Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(404, "Receipt not found")
    if receipt.status == models.ReceiptStatus.Done:
        raise HTTPException(400, "Cannot cancel a completed receipt")
    receipt.status = models.ReceiptStatus.Canceled
    db.commit()
    db.refresh(receipt)
    return receipt
