"""
StockSense AI Router
Handles natural language inventory intelligence queries and dashboard insights.
"""
import re
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
from database import get_db
import ai_tools

router = APIRouter(prefix="/api/ai", tags=["ai"])


class AIQueryRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None


class AIAction(BaseModel):
    label: str
    path: Optional[str] = None
    action_key: Optional[str] = None
    product_code: Optional[str] = None


class AIQueryResponse(BaseModel):
    title: str
    answer: str
    query: str
    structured_data: Optional[Dict[str, Any]] = None
    sources: List[str]
    actions: List[AIAction] = []


@router.get("/insights")
def get_insights(db: Session = Depends(get_db)):
    """
    Returns proactive inventory insights for dashboard and monitoring.
    """
    return {
        "insights": ai_tools.generate_inventory_insights(db),
    }


@router.get("/explain/{identifier}")
def explain_product(identifier: str, db: Session = Depends(get_db)):
    """
    Explain stock change and movement drivers for a specific product.
    """
    product = ai_tools.get_product_by_identifier(db, identifier)
    if not product:
        raise HTTPException(status_code=404, detail=f"Product '{identifier}' not found")
    
    explanation = ai_tools.explain_product_change(db, product)
    return explanation


@router.post("/query", response_model=AIQueryResponse)
def query_ai(payload: AIQueryRequest, db: Session = Depends(get_db)):
    """
    Natural-language inventory query engine.
    Uses authoritative database records to answer questions without hallucination.
    """
    query_text = payload.query.strip().lower()
    
    # 1. Check for product-specific change explanation: "why is [product] low", "why did [product] decrease", etc.
    products = db.query(models.Product).all()
    matched_product = None
    for p in products:
        if p.name.lower() in query_text or p.code.lower() in query_text:
            matched_product = p
            break
            
    is_why_question = any(w in query_text for w in ["why", "explain", "decrease", "dropped", "change", "movement", "usage"])
    
    if matched_product and is_why_question:
        analysis = ai_tools.explain_product_change(db, matched_product)
        depletion_str = f"Estimated depletion: ~{analysis['estimated_depletion_days']} days (based on recent usage)" if analysis['estimated_depletion_days'] is not None else "Depletion velocity: Insufficient historical movement data to estimate."
        
        reasons_md = "\n".join([f"• {r}" for r in analysis["reasons"]]) if analysis["reasons"] else "• No significant movement recorded in the last 7 days."
        
        answer = (
            f"**{matched_product.name}** (`{matched_product.code}`)\n\n"
            f"• **Current Stock**: {analysis['current_stock']:g} {matched_product.unit}\n"
            f"• **Net 7-Day Change**: {analysis['net_change_7d']:+g} {matched_product.unit}\n"
            f"• **Dispatched (7d)**: {analysis['weekly_dispatched']:g} {matched_product.unit}\n"
            f"• **Pending Receipts**: {analysis['pending_receipts_qty']:g} {matched_product.unit}\n"
            f"• **Stockout Forecast**: {depletion_str}\n\n"
            f"**Key Drivers:**\n{reasons_md}"
        )
        
        return AIQueryResponse(
            title=f"Stock Analysis: {matched_product.name}",
            answer=answer,
            query=payload.query,
            structured_data=analysis,
            sources=["Live Inventory", "7-Day Move History", "Receipts Ledger", "Delivery Orders"],
            actions=[
                AIAction(label="View Product", path=f"/products?query={matched_product.code}"),
                AIAction(label="View Related Movements", path=f"/move-history?product={matched_product.code}"),
                AIAction(label="Create Receipt", path="/operations/receipts/new"),
            ]
        )

    # 2. Out of stock / zero stock query
    if "out of stock" in query_text or "zero stock" in query_text or "empty" in query_text:
        out_items = ai_tools.get_out_of_stock_products(db)
        if not out_items:
            answer = "Great news! Currently there are **0 products completely out of stock** across all warehouses."
        else:
            lines = [f"• **{item['name']}** (`{item['code']}`) — Category: {item['category'] or 'General'}" for item in out_items]
            answer = f"Found **{len(out_items)} product(s)** completely out of stock:\n\n" + "\n".join(lines)
            
        return AIQueryResponse(
            title="Out of Stock Items",
            answer=answer,
            query=payload.query,
            structured_data={"out_of_stock_count": len(out_items), "items": out_items},
            sources=["Authoritative Stock Records", "Warehouse Inventory"],
            actions=[AIAction(label="View Products Catalog", path="/products?filter=out")]
        )

    # 3. Low stock / risk of running out
    if any(k in query_text for k in ["low stock", "risk", "running out", "depletion", "replenish", "attention"]):
        low_items = ai_tools.get_low_stock_products(db, threshold=10.0)
        if not low_items:
            answer = "All inventory items are currently above critical replenishment thresholds."
        else:
            lines = [f"• **{item['name']}** (`{item['code']}`): **{item['on_hand']:g} {item['unit']}** on hand ({item['free_to_use']:g} free to use)" for item in low_items]
            answer = f"Found **{len(low_items)} product(s)** at risk or below safe thresholds:\n\n" + "\n".join(lines) + "\n\n*Estimates based on current on-hand quantities vs replenishment buffers.*"
            
        return AIQueryResponse(
            title="Low Stock & Replenishment Risk",
            answer=answer,
            query=payload.query,
            structured_data={"low_stock_count": len(low_items), "items": low_items},
            sources=["Authoritative Stock Balance", "Safety Stock Levels"],
            actions=[
                AIAction(label="View Filtered Products", path="/products?filter=low"),
                AIAction(label="View Stock Table", path="/stock"),
            ]
        )

    # 4. Pending receipts / incoming goods
    if any(k in query_text for k in ["receipt", "incoming", "supplier", "vendor", "purchase"]):
        pending = ai_tools.get_pending_operations(db)["pending_receipts"]
        if not pending:
            answer = "There are currently **no pending receipts** awaiting processing."
        else:
            lines = [f"• **{r['reference']}** from *{r['contact']}* — Status: **{r['status']}** ({r['lines_count']} lines)" for r in pending]
            answer = f"There are **{len(pending)} incoming receipt(s)** pending:\n\n" + "\n".join(lines)
            
        return AIQueryResponse(
            title="Pending Stock Receipts",
            answer=answer,
            query=payload.query,
            structured_data={"pending_receipts": pending},
            sources=["Receipts Operations Ledger"],
            actions=[AIAction(label="Open Receipts", path="/operations/receipts")]
        )

    # 5. Pending deliveries / outgoing orders
    if any(k in query_text for k in ["delivery", "outgoing", "dispatch", "customer", "deliveries", "shipment"]):
        pending = ai_tools.get_pending_operations(db)["pending_deliveries"]
        if not pending:
            answer = "There are currently **no pending delivery orders**."
        else:
            lines = [f"• **{d['reference']}** to *{d['contact']}* — Status: **{d['status']}** ({d['lines_count']} lines)" for d in pending]
            answer = f"There are **{len(pending)} outgoing delivery order(s)** in queue:\n\n" + "\n".join(lines)
            
        return AIQueryResponse(
            title="Pending Delivery Orders",
            answer=answer,
            query=payload.query,
            structured_data={"pending_deliveries": pending},
            sources=["Delivery Operations Ledger"],
            actions=[AIAction(label="Open Deliveries", path="/operations/deliveries")]
        )

    # 6. Recent stock movements / ledger
    if any(k in query_text for k in ["movement", "history", "ledger", "recent", "transferred", "dispatched"]):
        moves = ai_tools.get_stock_movements(db, limit=8)
        if not moves:
            answer = "No stock movements recorded yet in the ledger."
        else:
            lines = [f"• **{m['source_ref']}** ({m['date'][:10]}): {m['direction'].upper()} {m['qty']:g} of **{m['product_name']}** ({m['from_location']} → {m['to_location']})" for m in moves]
            answer = f"Most recent stock movements:\n\n" + "\n".join(lines)
            
        return AIQueryResponse(
            title="Recent Stock Movements",
            answer=answer,
            query=payload.query,
            structured_data={"movements": moves},
            sources=["Stock Ledger Move History"],
            actions=[AIAction(label="Open Move History", path="/move-history")]
        )

    # 7. Warehouses / Locations
    if "warehouse" in query_text or "location" in query_text:
        warehouses = db.query(models.Warehouse).all()
        wh_summary = [f"• **{w.name}** (`{w.short_code}`) — {len(w.locations)} location(s) configured" for w in warehouses]
        answer = f"Current Warehouse Network ({len(warehouses)} facilities):\n\n" + "\n".join(wh_summary)
        
        return AIQueryResponse(
            title="Warehouse Facilities",
            answer=answer,
            query=payload.query,
            sources=["Warehouse & Location Registry"],
            actions=[
                AIAction(label="View Warehouses", path="/settings/warehouses"),
                AIAction(label="View Stock by Location", path="/stock"),
            ]
        )

    # 8. Fallback / General Catalog Overview
    all_products = ai_tools.get_products(db)
    total_items = len(all_products)
    total_qty = sum(p["on_hand"] for p in all_products)
    
    answer = (
        f"StockSense is managing **{total_items} catalog products** with a total of **{total_qty:g} units** on hand.\n\n"
        "You can ask me specific questions like:\n"
        "• *Which products are at risk of running out?*\n"
        "• *Why is Steel Rods stock low?*\n"
        "• *What receipts are pending?*\n"
        "• *Show recent stock movements*\n"
        "• *Which products are out of stock?*"
    )
    
    return AIQueryResponse(
        title="StockSense Inventory Overview",
        answer=answer,
        query=payload.query,
        structured_data={"total_products": total_items, "total_units": total_qty},
        sources=["Authoritative Stock Database", "Product Catalog"],
        actions=[
            AIAction(label="View Dashboard", path="/dashboard"),
            AIAction(label="View Products", path="/products"),
            AIAction(label="Check Move History", path="/move-history"),
        ]
    )
