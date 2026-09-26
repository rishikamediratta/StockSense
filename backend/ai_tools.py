"""
StockSense AI Tool Functions and Analytics Engine.
Authoritative calculation layer that reads from database models.
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy import desc
from sqlalchemy.orm import Session

import models


def get_products(db: Session) -> List[Dict[str, Any]]:
    products = db.query(models.Product).all()
    return [
        {
            "id": p.id,
            "code": p.code,
            "name": p.name,
            "category": p.category,
            "unit": p.unit,
            "cost_per_unit": p.cost_per_unit,
            "on_hand": p.on_hand,
            "free_to_use": p.free_to_use,
        }
        for p in products
    ]


def get_product_by_identifier(db: Session, identifier: str) -> Optional[models.Product]:
    identifier_clean = identifier.strip().lower()
    product = db.query(models.Product).filter(
        (models.Product.code.ilike(f"%{identifier_clean}%")) |
        (models.Product.name.ilike(f"%{identifier_clean}%"))
    ).first()
    return product


def get_product_stock(db: Session, product_id: int) -> Optional[Dict[str, Any]]:
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        return None
    
    # Calculate movements for this product
    moves = (
        db.query(models.Move)
        .filter(models.Move.product_id == product.id)
        .order_by(desc(models.Move.date))
        .limit(20)
        .all()
    )
    
    # Pending receipts for this product
    pending_receipt_lines = (
        db.query(models.ReceiptLine)
        .join(models.Receipt)
        .filter(
            models.ReceiptLine.product_id == product.id,
            models.Receipt.status.in_([models.ReceiptStatus.Draft, models.ReceiptStatus.Ready]),
        )
        .all()
    )
    pending_receipt_qty = sum(line.qty for line in pending_receipt_lines)

    # Pending deliveries for this product
    pending_delivery_lines = (
        db.query(models.DeliveryLine)
        .join(models.Delivery)
        .filter(
            models.DeliveryLine.product_id == product.id,
            models.Delivery.status.in_([
                models.DeliveryStatus.Draft,
                models.DeliveryStatus.Waiting,
                models.DeliveryStatus.Ready,
            ]),
        )
        .all()
    )
    pending_delivery_qty = sum(line.qty for line in pending_delivery_lines)

    return {
        "id": product.id,
        "code": product.code,
        "name": product.name,
        "category": product.category,
        "unit": product.unit,
        "on_hand": product.on_hand,
        "free_to_use": product.free_to_use,
        "cost_per_unit": product.cost_per_unit,
        "pending_receipt_qty": pending_receipt_qty,
        "pending_delivery_qty": pending_delivery_qty,
        "recent_moves_count": len(moves),
    }


def get_low_stock_products(db: Session, threshold: float = 10.0) -> List[Dict[str, Any]]:
    products = db.query(models.Product).filter(models.Product.on_hand <= threshold).all()
    return [
        {
            "id": p.id,
            "code": p.code,
            "name": p.name,
            "category": p.category,
            "on_hand": p.on_hand,
            "free_to_use": p.free_to_use,
            "unit": p.unit,
        }
        for p in products
    ]


def get_out_of_stock_products(db: Session) -> List[Dict[str, Any]]:
    products = db.query(models.Product).filter(models.Product.on_hand <= 0).all()
    return [
        {
            "id": p.id,
            "code": p.code,
            "name": p.name,
            "category": p.category,
            "on_hand": p.on_hand,
            "unit": p.unit,
        }
        for p in products
    ]


def get_stock_movements(
    db: Session, product_id: Optional[int] = None, limit: int = 15
) -> List[Dict[str, Any]]:
    query = db.query(models.Move)
    if product_id:
        query = query.filter(models.Move.product_id == product_id)
    moves = query.order_by(desc(models.Move.date)).limit(limit).all()
    
    return [
        {
            "id": m.id,
            "product_id": m.product_id,
            "product_name": m.product.name if m.product else "Unknown",
            "product_code": m.product.code if m.product else "",
            "from_location": m.from_location,
            "to_location": m.to_location,
            "qty": m.qty,
            "direction": m.direction,
            "date": m.date.isoformat() if m.date else None,
            "source_ref": m.source_ref,
        }
        for m in moves
    ]


def get_pending_operations(db: Session) -> Dict[str, Any]:
    receipts = (
        db.query(models.Receipt)
        .filter(models.Receipt.status.in_([models.ReceiptStatus.Draft, models.ReceiptStatus.Ready]))
        .all()
    )
    deliveries = (
        db.query(models.Delivery)
        .filter(
            models.Delivery.status.in_([
                models.DeliveryStatus.Draft,
                models.DeliveryStatus.Waiting,
                models.DeliveryStatus.Ready,
            ])
        )
        .all()
    )

    return {
        "pending_receipts": [
            {
                "id": r.id,
                "reference": r.reference,
                "contact": r.contact,
                "schedule_date": r.schedule_date.isoformat() if r.schedule_date else None,
                "status": r.status.value,
                "lines_count": len(r.lines),
            }
            for r in receipts
        ],
        "pending_deliveries": [
            {
                "id": d.id,
                "reference": d.reference,
                "contact": d.delivery_address,
                "schedule_date": d.schedule_date.isoformat() if d.schedule_date else None,
                "status": d.status.value,
                "lines_count": len(d.lines),
            }
            for d in deliveries
        ],
    }


def explain_product_change(db: Session, product: models.Product) -> Dict[str, Any]:
    """
    Analyzes moves, outgoing consumption, incoming replenishment,
    and calculates burn rate / stockout estimate.
    """
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_moves = (
        db.query(models.Move)
        .filter(models.Move.product_id == product.id, models.Move.date >= seven_days_ago)
        .order_by(desc(models.Move.date))
        .all()
    )

    dispatched_qty = sum(m.qty for m in recent_moves if m.direction == "out")
    received_qty = sum(m.qty for m in recent_moves if m.direction == "in")
    net_change = received_qty - dispatched_qty

    # Check pending receipts
    pending_receipt_lines = (
        db.query(models.ReceiptLine)
        .join(models.Receipt)
        .filter(
            models.ReceiptLine.product_id == product.id,
            models.Receipt.status.in_([models.ReceiptStatus.Draft, models.ReceiptStatus.Ready]),
        )
        .all()
    )
    pending_receipt_qty = sum(l.qty for l in pending_receipt_lines)

    # Estimate days until depletion
    daily_burn_rate = dispatched_qty / 7.0 if dispatched_qty > 0 else 0.0
    estimated_depletion_days = None
    if daily_burn_rate > 0:
        estimated_depletion_days = round(product.on_hand / daily_burn_rate, 1)

    reasons = []
    if dispatched_qty > 0:
        reasons.append(f"{dispatched_qty:g} {product.unit} were dispatched through outgoing deliveries over the last 7 days.")
    if received_qty > 0:
        reasons.append(f"{received_qty:g} {product.unit} were received into stock.")
    elif pending_receipt_qty == 0 and product.on_hand < 15:
        reasons.append("No replenishment receipt was recorded or is currently pending during this period.")

    return {
        "product_id": product.id,
        "product_name": product.name,
        "product_code": product.code,
        "current_stock": product.on_hand,
        "free_to_use": product.free_to_use,
        "unit": product.unit,
        "weekly_dispatched": dispatched_qty,
        "weekly_received": received_qty,
        "net_change_7d": net_change,
        "pending_receipts_qty": pending_receipt_qty,
        "daily_burn_rate": round(daily_burn_rate, 2),
        "estimated_depletion_days": estimated_depletion_days,
        "reasons": reasons,
        "recent_moves": [
            {
                "reference": m.source_ref,
                "direction": m.direction,
                "qty": m.qty,
                "from": m.from_location,
                "to": m.to_location,
                "date": m.date.strftime("%Y-%m-%d") if m.date else "",
            }
            for m in recent_moves[:5]
        ],
    }


def generate_inventory_insights(db: Session) -> List[Dict[str, Any]]:
    """
    Generates proactive AI insights for dashboard.
    """
    insights = []
    products = db.query(models.Product).all()

    for p in products:
        # Check stockout or low stock
        if p.on_hand == 0:
            insights.append({
                "id": f"out-{p.id}",
                "type": "out_of_stock",
                "severity": "critical",
                "product_id": str(p.id),
                "product_code": p.code,
                "title": f"{p.name} is completely out of stock",
                "reason": f"Current stock is 0 {p.unit}. Immediate purchase order or receipt needed.",
                "metrics": {
                    "current_stock": p.on_hand,
                    "unit": p.unit,
                },
                "actions": [
                    {"label": "View Product", "path": f"/products?query={p.code}"},
                    {"label": "Create Receipt", "path": "/operations/receipts/new"},
                ],
            })
        elif p.on_hand <= 10:
            analysis = explain_product_change(db, p)
            depletion_text = ""
            if analysis["estimated_depletion_days"] is not None:
                depletion_text = f" (Estimated depletion: ~{analysis['estimated_depletion_days']} days based on recent usage)"
            
            insights.append({
                "id": f"low-{p.id}",
                "type": "low_stock",
                "severity": "high" if p.on_hand <= 5 else "medium",
                "product_id": str(p.id),
                "product_code": p.code,
                "title": f"{p.name} requires replenishment",
                "reason": f"Current stock is {p.on_hand:g} {p.unit}.{depletion_text}",
                "metrics": {
                    "current_stock": p.on_hand,
                    "unit": p.unit,
                    "estimated_depletion_days": analysis["estimated_depletion_days"],
                    "weekly_dispatched": analysis["weekly_dispatched"],
                },
                "actions": [
                    {"label": "Explain Stock Change", "action_key": "explain", "product_code": p.code},
                    {"label": "View Movements", "path": f"/move-history?product={p.code}"},
                ],
            })

    # Check waiting deliveries
    waiting_deliveries = (
        db.query(models.Delivery)
        .filter(models.Delivery.status == models.DeliveryStatus.Waiting)
        .all()
    )
    if waiting_deliveries:
        insights.append({
            "id": "pending-waiting-deliveries",
            "type": "bottleneck",
            "severity": "medium",
            "title": f"{len(waiting_deliveries)} delivery order(s) waiting for stock",
            "reason": "Outgoing orders are blocked due to insufficient free-to-use inventory.",
            "metrics": {"waiting_count": len(waiting_deliveries)},
            "actions": [
                {"label": "View Waiting Deliveries", "path": "/operations/deliveries"},
            ],
        })

    # Check late receipts
    now = datetime.utcnow()
    late_receipts = (
        db.query(models.Receipt)
        .filter(
            models.Receipt.schedule_date < now,
            models.Receipt.status.notin_([models.ReceiptStatus.Done, models.ReceiptStatus.Canceled]),
        )
        .all()
    )
    if late_receipts:
        insights.append({
            "id": "late-receipts",
            "type": "delayed_operation",
            "severity": "medium",
            "title": f"{len(late_receipts)} incoming receipt(s) past schedule date",
            "reason": "Suppliers have not delivered expected stock on time.",
            "metrics": {"late_count": len(late_receipts)},
            "actions": [
                {"label": "View Receipts", "path": "/operations/receipts"},
            ],
        })

    return insights
