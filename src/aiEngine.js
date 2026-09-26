/**
 * StockSense Intelligence Engine
 * Authoritative client & API calculation layer for AI insights, explanations, and NL queries.
 */

const today = new Date().toISOString().slice(0, 10);

export function totalStock(product) {
  if (!product || !product.stocks) return 0;
  return Object.values(product.stocks).reduce((a, b) => a + Number(b || 0), 0);
}

export function freeToUseStock(product, state) {
  const onHand = totalStock(product);
  const reservedInDeliveries = (state.deliveries || [])
    .filter((d) => !["Done", "Canceled"].includes(d.status))
    .flatMap((d) => d.lines || [])
    .filter((l) => l.productId === product.id)
    .reduce((sum, l) => sum + Number(l.quantity || 0), 0);
  return Math.max(0, onHand - reservedInDeliveries);
}

/**
 * Calculates authoritative stock metrics, 7-day movement velocity,
 * pending incoming/outgoing operations, and depletion forecasts for a product.
 */
export function calculateProductIntelligence(product, state) {
  if (!product) return null;

  const onHand = totalStock(product);
  const freeToUse = freeToUseStock(product, state);
  const reorderPoint = Number(product.reorder || 0);

  // Filter ledger moves for this product
  const productMoves = (state.ledger || []).filter((m) => m.productId === product.id);

  // 7-day window moves
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const recentMoves = productMoves.filter((m) => m.date >= sevenDaysAgo);

  const dispatched7d = recentMoves
    .filter((m) => m.direction === "out")
    .reduce((sum, m) => sum + Number(m.quantity || 0), 0);

  const received7d = recentMoves
    .filter((m) => m.direction === "in")
    .reduce((sum, m) => sum + Number(m.quantity || 0), 0);

  const netChange7d = received7d - dispatched7d;

  // Pending receipts for this product
  const pendingReceipts = (state.receipts || []).filter(
    (r) => !["Done", "Canceled"].includes(r.status) && (r.lines || []).some((l) => l.productId === product.id)
  );
  const pendingReceiptQty = pendingReceipts.reduce((sum, r) => {
    const lines = (r.lines || []).filter((l) => l.productId === product.id);
    return sum + lines.reduce((s, l) => s + Number(l.quantity || 0), 0);
  }, 0);

  // Pending deliveries for this product
  const pendingDeliveries = (state.deliveries || [])
    .filter((d) => !["Done", "Canceled"].includes(d.status) && (d.lines || []).some((l) => l.productId === product.id));
  const pendingDeliveryQty = pendingDeliveries.reduce((sum, d) => {
    const lines = (d.lines || []).filter((l) => l.productId === product.id);
    return sum + lines.reduce((s, l) => s + Number(l.quantity || 0), 0);
  }, 0);

  // Daily burn rate estimate based on 7-day dispatches
  const dailyBurnRate = dispatched7d > 0 ? dispatched7d / 7 : 0;
  let estimatedDepletionDays = null;
  let depletionConfidence = "low";

  if (dailyBurnRate > 0) {
    estimatedDepletionDays = Math.max(0, Math.round((onHand / dailyBurnRate) * 10) / 10);
    depletionConfidence = recentMoves.length >= 3 ? "medium" : "low";
  }

  // Stock status
  let health = "healthy";
  let healthLabel = "In Stock";
  if (onHand === 0) {
    health = "out";
    healthLabel = "Out of Stock";
  } else if (onHand <= reorderPoint) {
    health = "critical";
    healthLabel = "Below Reorder Level";
  } else if (onHand <= reorderPoint * 1.25) {
    health = "warning";
    healthLabel = "Approaching Reorder";
  }

  // Detect unusual spikes
  const unusualMoves = productMoves.filter((m) => m.quantity >= Math.max(25, onHand * 0.4));

  // Build natural-language explanation drivers
  const drivers = [];
  if (dispatched7d > 0) {
    drivers.push(`${dispatched7d} ${product.uom || "units"} dispatched across outgoing delivery orders this week.`);
  }
  if (received7d > 0) {
    drivers.push(`${received7d} ${product.uom || "units"} received into stock.`);
  } else if (pendingReceiptQty === 0 && onHand <= reorderPoint) {
    drivers.push("No replenishment receipt was recorded or is currently scheduled.");
  } else if (pendingReceiptQty > 0) {
    drivers.push(`${pendingReceiptQty} ${product.uom || "units"} currently scheduled across ${pendingReceipts.length} pending receipt(s).`);
  }

  if (pendingDeliveryQty > freeToUse && freeToUse < onHand) {
    drivers.push(`Reserved stock (${onHand - freeToUse} units) exceeds free availability for pending orders.`);
  }

  return {
    productId: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    uom: product.uom || "Units",
    onHand,
    freeToUse,
    reorderPoint,
    dispatched7d,
    received7d,
    netChange7d,
    pendingReceiptQty,
    pendingDeliveryQty,
    dailyBurnRate: Math.round(dailyBurnRate * 10) / 10,
    estimatedDepletionDays,
    depletionConfidence,
    health,
    healthLabel,
    unusualMoves,
    drivers,
    recentMoves: productMoves.slice(0, 5),
  };
}

/**
 * Generates proactive dashboard insights.
 */
export function generateDashboardInsights(state) {
  const insights = [];
  const products = state.products || [];

  // 1. Critical & Low stock
  products.forEach((p) => {
    const intel = calculateProductIntelligence(p, state);
    if (!intel) return;

    if (intel.onHand === 0) {
      insights.push({
        id: `out-${p.id}`,
        type: "critical",
        severity: "critical",
        productId: p.id,
        sku: p.sku,
        title: `${p.name} is completely out of stock`,
        reason: `Current stock is 0 ${p.uom}. Immediate replenishment required.`,
        details: `Reorder level is configured at ${intel.reorderPoint} ${p.uom}.`,
        metrics: { onHand: 0, reorder: intel.reorderPoint, uom: p.uom },
        actions: [
          { label: "View Product", path: `/products/${p.id}/edit` },
          { label: "New Receipt", path: "/operations/receipts/new" },
        ],
      });
    } else if (intel.onHand <= intel.reorderPoint) {
      const depletionNotice =
        intel.estimatedDepletionDays !== null
          ? `Estimated depletion: ~${intel.estimatedDepletionDays} days based on recent usage.`
          : `Current stock (${intel.onHand} ${p.uom}) is below reorder level (${intel.reorderPoint}).`;

      insights.push({
        id: `low-${p.id}`,
        type: "low_stock",
        severity: intel.onHand <= intel.reorderPoint * 0.6 ? "critical" : "warning",
        productId: p.id,
        sku: p.sku,
        title: `${p.name} requires replenishment`,
        reason: depletionNotice,
        details: `${intel.dispatched7d} ${p.uom} dispatched this week. ${intel.pendingReceiptQty > 0 ? `${intel.pendingReceiptQty} units pending arrival.` : "No replenishment receipt is scheduled."}`,
        metrics: {
          onHand: intel.onHand,
          reorder: intel.reorderPoint,
          dispatched7d: intel.dispatched7d,
          estimatedDays: intel.estimatedDepletionDays,
          uom: p.uom,
        },
        actions: [
          { label: "Explain Stock Change", actionKey: "explain", productId: p.id, sku: p.sku },
          { label: "View Movements", path: `/move-history?query=${encodeURIComponent(p.name)}` },
        ],
      });
    } else if (intel.onHand <= intel.reorderPoint * 1.25) {
      insights.push({
        id: `approach-${p.id}`,
        type: "approaching",
        severity: "info",
        productId: p.id,
        sku: p.sku,
        title: `${p.name} approaching reorder point`,
        reason: `Stock is at ${intel.onHand} ${p.uom} (Buffer: +${intel.onHand - intel.reorderPoint} above threshold).`,
        details: `Configured reorder point: ${intel.reorderPoint} ${p.uom}.`,
        metrics: { onHand: intel.onHand, reorder: intel.reorderPoint, uom: p.uom },
        actions: [{ label: "View Product", path: `/products/${p.id}/edit` }],
      });
    }

    // Unusual movement insights
    if (intel.unusualMoves.length > 0) {
      const lastSpike = intel.unusualMoves[0];
      insights.push({
        id: `spike-${p.id}-${lastSpike.id}`,
        type: "unusual",
        severity: "warning",
        productId: p.id,
        sku: p.sku,
        title: `Unusual stock movement for ${p.name}`,
        reason: `${lastSpike.direction === "out" ? "Decrease" : "Increase"} of ${lastSpike.quantity} ${p.uom} recorded on ${lastSpike.date}.`,
        details: `Ref: ${lastSpike.reference} (${lastSpike.from} → ${lastSpike.to}). Significantly higher than baseline.`,
        metrics: { quantity: lastSpike.quantity, date: lastSpike.date, ref: lastSpike.reference },
        actions: [{ label: "View Move History", path: `/move-history?query=${encodeURIComponent(p.name)}` }],
      });
    }
  });

  // 2. Waiting Deliveries Bottleneck
  const waitingDeliveries = (state.deliveries || []).filter((d) => d.status === "Waiting");
  if (waitingDeliveries.length > 0) {
    insights.push({
      id: "bottleneck-waiting",
      type: "bottleneck",
      severity: "warning",
      title: `${waitingDeliveries.length} delivery order${waitingDeliveries.length > 1 ? "s" : ""} waiting for stock`,
      reason: `Orders are on hold due to insufficient free stock in required warehouse locations.`,
      details: waitingDeliveries.map((d) => d.reference).join(", "),
      metrics: { count: waitingDeliveries.length },
      actions: [{ label: "View Deliveries", path: "/operations/deliveries?status=Waiting" }],
    });
  }

  // 3. Late receipts
  const lateReceipts = (state.receipts || []).filter(
    (r) => r.date < today && !["Done", "Canceled"].includes(r.status)
  );
  if (lateReceipts.length > 0) {
    insights.push({
      id: "late-receipts",
      type: "late",
      severity: "warning",
      title: `${lateReceipts.length} incoming receipt${lateReceipts.length > 1 ? "s" : ""} past schedule date`,
      reason: `Expected shipments have passed their scheduled date without validation.`,
      details: lateReceipts.map((r) => `${r.reference} (${r.contact})`).join(", "),
      metrics: { count: lateReceipts.length },
      actions: [{ label: "View Receipts", path: "/operations/receipts" }],
    });
  }

  return insights;
}

/**
 * Natural language StockSense Query Engine.
 */
export function queryStockSense(queryText, state) {
  const query = (queryText || "").trim().toLowerCase();
  if (!query) {
    return {
      title: "StockSense Intelligence",
      answer: "Please ask a question about your inventory, stock levels, movements, or operations.",
      sources: ["StockSense Knowledge Base"],
      actions: [],
    };
  }

  const products = state.products || [];
  const receipts = state.receipts || [];
  const deliveries = state.deliveries || [];
  const warehouses = state.warehouses || [];
  const locations = state.locations || [];
  const ledger = state.ledger || [];

  // Match specific product
  const matchedProduct = products.find(
    (p) =>
      query.includes(p.name.toLowerCase()) ||
      query.includes(p.sku.toLowerCase()) ||
      p.name.toLowerCase().split(" ").some((w) => w.length > 3 && query.includes(w))
  );

  const isWhyOrMovementQuestion =
    query.includes("why") ||
    query.includes("explain") ||
    query.includes("decrease") ||
    query.includes("change") ||
    query.includes("movement") ||
    query.includes("history") ||
    query.includes("dropped") ||
    query.includes("usage");

  // 1. Explain specific product stock change
  if (matchedProduct && isWhyOrMovementQuestion) {
    const intel = calculateProductIntelligence(matchedProduct, state);
    const depletionText =
      intel.estimatedDepletionDays !== null
        ? `Estimated depletion: ~${intel.estimatedDepletionDays} days (based on recent usage).`
        : "Depletion estimate: Insufficient historical movement data to project run-out time.";

    const driversText = intel.drivers.length
      ? intel.drivers.map((d) => `• ${d}`).join("\n")
      : "• No major movements recorded in the last 7 days.";

    const answer = `### ${matchedProduct.name} (${matchedProduct.sku})

**Inventory Metrics:**
• **Current Stock:** ${intel.onHand} ${matchedProduct.uom}
• **Reorder Level:** ${intel.reorderPoint} ${matchedProduct.uom}
• **Free to Use:** ${intel.freeToUse} ${matchedProduct.uom}
• **Weekly Usage (Dispatched):** ${intel.dispatched7d} ${matchedProduct.uom}
• **Pending Receipts:** ${intel.pendingReceiptQty} ${matchedProduct.uom}
• **Run-out Risk:** ${depletionText}

**Why did stock change?**
${driversText}`;

    return {
      title: `Stock Analysis: ${matchedProduct.name}`,
      answer,
      structuredData: intel,
      sources: ["Live Product Stock", "7-Day Move History", "Receipts Ledger", "Delivery Orders"],
      actions: [
        { label: "View Product", path: `/products/${matchedProduct.id}/edit` },
        { label: "View Related Movements", path: `/move-history?query=${encodeURIComponent(matchedProduct.name)}` },
        { label: "View Deliveries", path: "/operations/deliveries" },
      ],
    };
  }

  // 2. Specific product lookup (general status)
  if (matchedProduct && !isWhyOrMovementQuestion) {
    const intel = calculateProductIntelligence(matchedProduct, state);
    const locBreakdown = Object.entries(matchedProduct.stocks || {})
      .map(([locId, qty]) => {
        const loc = locations.find((l) => l.id === locId);
        return `• ${loc ? loc.name : locId}: **${qty} ${matchedProduct.uom}**`;
      })
      .join("\n");

    const answer = `### ${matchedProduct.name} (${matchedProduct.sku})
Category: **${matchedProduct.category}** · Unit Cost: **₹${matchedProduct.cost?.toLocaleString("en-IN") || 0}**

• **Total Stock:** ${intel.onHand} ${matchedProduct.uom} (Reorder Level: ${intel.reorderPoint})
• **Available (Free to Use):** ${intel.freeToUse} ${matchedProduct.uom}
• **Status:** ${intel.healthLabel}

**Location Distribution:**
${locBreakdown || "• No location stock recorded."}`;

    return {
      title: `${matchedProduct.name} Stock Overview`,
      answer,
      structuredData: intel,
      sources: ["Live Product Catalog", "Location Stock"],
      actions: [
        { label: "Edit Product", path: `/products/${matchedProduct.id}/edit` },
        { label: "View in Stock Table", path: `/stock?query=${encodeURIComponent(matchedProduct.sku)}` },
      ],
    };
  }

  // 3. Products at risk / low stock / running out
  if (
    query.includes("low") ||
    query.includes("risk") ||
    query.includes("running out") ||
    query.includes("deplet") ||
    query.includes("replenish") ||
    query.includes("attention") ||
    query.includes("shortage")
  ) {
    const lowStockItems = products
      .map((p) => calculateProductIntelligence(p, state))
      .filter((intel) => intel.onHand <= intel.reorderPoint);

    if (lowStockItems.length === 0) {
      return {
        title: "Stock Health Check",
        answer: "All catalog products are currently **above their reorder thresholds**. No immediate stockout risk detected.",
        sources: ["Product Reorder Rules", "Current Stock Balances"],
        actions: [{ label: "View Stock", path: "/stock" }],
      };
    }

    const rows = lowStockItems
      .map((item) => {
        const depletion = item.estimatedDepletionDays !== null ? ` (~${item.estimatedDepletionDays}d left)` : "";
        return `• **${item.name}** (\`${item.sku}\`): **${item.onHand}** / ${item.reorderPoint} ${item.uom}${depletion} — *${item.healthLabel}*`;
      })
      .join("\n");

    const answer = `Found **${lowStockItems.length} product(s)** at risk or below reorder level:

${rows}

*Estimates derived from 7-day outgoing velocity compared with current on-hand quantities.*`;

    return {
      title: "Products Requiring Replenishment",
      answer,
      structuredData: { count: lowStockItems.length, items: lowStockItems },
      sources: ["Live Stock Ledger", "Reorder Point Rules", "Usage Run-rate"],
      actions: [
        { label: "View Filtered Products", path: "/products?filter=low" },
        { label: "Open Stock Table", path: "/stock" },
        { label: "Create Receipt", path: "/operations/receipts/new" },
      ],
    };
  }

  // 4. Out of stock / zero stock
  if (query.includes("out of stock") || query.includes("zero stock") || query.includes("empty stock")) {
    const outItems = products
      .map((p) => calculateProductIntelligence(p, state))
      .filter((intel) => intel.onHand === 0);

    if (outItems.length === 0) {
      return {
        title: "Out of Stock Inspection",
        answer: "Great news! Currently **0 products** are completely out of stock in your catalog.",
        sources: ["Current Stock Balances"],
        actions: [{ label: "View Products", path: "/products" }],
      };
    }

    const rows = outItems.map((item) => `• **${item.name}** (\`${item.sku}\`) — Category: ${item.category}`).join("\n");
    return {
      title: "Out of Stock Products",
      answer: `Found **${outItems.length} product(s)** with 0 quantity on hand:\n\n${rows}`,
      structuredData: { count: outItems.length, items: outItems },
      sources: ["Live Stock Balances"],
      actions: [{ label: "View Products", path: "/products?filter=out" }],
    };
  }

  // 5. Pending receipts
  if (query.includes("receipt") || query.includes("incoming") || query.includes("vendor") || query.includes("supplier")) {
    const pending = receipts.filter((r) => !["Done", "Canceled"].includes(r.status));
    if (pending.length === 0) {
      return {
        title: "Pending Receipts",
        answer: "There are currently **no pending receipts** in Draft or Ready status.",
        sources: ["Receipts Ledger"],
        actions: [{ label: "Create Receipt", path: "/operations/receipts/new" }],
      };
    }

    const rows = pending
      .map((r) => `• **${r.reference}** from *${r.contact}* (Date: ${r.date}, Status: **${r.status}**)`)
      .join("\n");

    return {
      title: "Pending Stock Receipts",
      answer: `There are **${pending.length} incoming receipt(s)** currently in progress:\n\n${rows}`,
      structuredData: { count: pending.length, receipts: pending },
      sources: ["Receipts Operations Ledger"],
      actions: [{ label: "View Receipts", path: "/operations/receipts" }],
    };
  }

  // 6. Pending deliveries
  if (query.includes("delivery") || query.includes("deliveries") || query.includes("outgoing") || query.includes("dispatch") || query.includes("shipment")) {
    const pending = deliveries.filter((d) => !["Done", "Canceled"].includes(d.status));
    if (pending.length === 0) {
      return {
        title: "Pending Deliveries",
        answer: "There are currently **no pending delivery orders**.",
        sources: ["Delivery Orders Ledger"],
        actions: [{ label: "Create Delivery", path: "/operations/deliveries/new" }],
      };
    }

    const rows = pending
      .map((d) => `• **${d.reference}** to *${d.contact}* (Status: **${d.status}**, Date: ${d.date})`)
      .join("\n");

    return {
      title: "Pending Delivery Orders",
      answer: `There are **${pending.length} delivery order(s)** pending fulfillment:\n\n${rows}`,
      structuredData: { count: pending.length, deliveries: pending },
      sources: ["Delivery Orders Ledger"],
      actions: [{ label: "View Deliveries", path: "/operations/deliveries" }],
    };
  }

  // 7. Warehouse / Location query
  if (query.includes("warehouse") || query.includes("location") || warehouses.some((w) => query.includes(w.name.toLowerCase()) || query.includes(w.code.toLowerCase()))) {
    const matchedWh = warehouses.find((w) => query.includes(w.name.toLowerCase()) || query.includes(w.code.toLowerCase()));
    if (matchedWh) {
      const whLocations = locations.filter((l) => l.warehouseId === matchedWh.id);
      const locIds = whLocations.map((l) => l.id);

      const itemsInWh = products
        .map((p) => {
          const qty = Object.entries(p.stocks || {})
            .filter(([locId]) => locIds.includes(locId))
            .reduce((s, [, q]) => s + Number(q || 0), 0);
          return { product: p, qty };
        })
        .filter((item) => item.qty > 0);

      const rows = itemsInWh
        .map((item) => `• **${item.product.name}** (\`${item.product.sku}\`): **${item.qty} ${item.product.uom}**`)
        .join("\n");

      return {
        title: `${matchedWh.name} Inventory`,
        answer: `**${matchedWh.name}** (\`${matchedWh.code}\` — ${matchedWh.address}):\n\n${rows || "• No stock currently held in this warehouse."}`,
        sources: ["Warehouse Registry", "Location Stocks"],
        actions: [
          { label: "View Stock by Location", path: "/stock" },
          { label: "View Warehouses", path: "/settings/warehouses" },
        ],
      };
    }

    const whSummary = warehouses.map((w) => {
      const locs = locations.filter((l) => l.warehouseId === w.id);
      return `• **${w.name}** (\`${w.code}\`) — ${locs.length} location(s) (${locs.map((l) => l.name).join(", ")})`;
    }).join("\n");

    return {
      title: "Warehouse Network",
      answer: `Current warehouse facilities:\n\n${whSummary}`,
      sources: ["Warehouse Configuration"],
      actions: [{ label: "View Warehouses", path: "/settings/warehouses" }],
    };
  }

  // 8. Recent movements / ledger
  if (query.includes("movement") || query.includes("move") || query.includes("ledger") || query.includes("audit") || query.includes("recent")) {
    const recent = ledger.slice(0, 6);
    const rows = recent
      .map((m) => {
        const prod = products.find((p) => p.id === m.productId);
        const sign = m.direction === "out" ? "−" : m.direction === "in" ? "+" : "↔";
        return `• **${m.reference}** (${m.date}): ${sign}${m.quantity} of **${prod?.name || "Product"}** (${m.from} → ${m.to})`;
      })
      .join("\n");

    return {
      title: "Recent Stock Ledger Moves",
      answer: `Latest stock movements:\n\n${rows || "• No movements logged yet."}`,
      sources: ["Move History Ledger"],
      actions: [{ label: "View Full Move History", path: "/move-history" }],
    };
  }

  // 9. Biggest stock decrease / usage this week
  if (query.includes("biggest") || query.includes("decrease") || query.includes("unreplenished") || query.includes("replenish")) {
    const list = products.map((p) => calculateProductIntelligence(p, state));
    list.sort((a, b) => b.dispatched7d - a.dispatched7d);

    const rows = list.map((item) => `• **${item.name}**: **${item.dispatched7d} ${item.uom}** dispatched (Current: ${item.onHand})`).join("\n");

    return {
      title: "Weekly Stock Consumption",
      answer: `7-Day outgoing dispatches by product:\n\n${rows}`,
      sources: ["7-Day Move History", "Deliveries Ledger"],
      actions: [{ label: "View Move History", path: "/move-history" }],
    };
  }

  // 10. General / Overview Fallback
  const totalProductsCount = products.length;
  const totalUnits = products.reduce((sum, p) => sum + totalStock(p), 0);
  const lowCount = products.filter((p) => totalStock(p) <= (p.reorder || 0)).length;

  return {
    title: "StockSense Inventory Overview",
    answer: `StockSense is monitoring **${totalProductsCount} catalog items** with **${totalUnits} total units** on hand.

• **${lowCount} product(s)** are currently at or below their reorder threshold.
• **${receipts.filter((r) => !["Done", "Canceled"].includes(r.status)).length} incoming receipt(s)** pending.
• **${deliveries.filter((d) => !["Done", "Canceled"].includes(d.status)).length} delivery order(s)** in queue.

**Try asking:**
• *"Which products are at risk of running out?"*
• *"Why is Steel Rod stock low?"*
• *"What receipts are pending?"*
• *"Show stock in North Warehouse"*
• *"Show recent movements"*`,
    sources: ["Product Catalog", "Live Inventory Balances", "Operations Queue"],
    actions: [
      { label: "View Dashboard", path: "/dashboard" },
      { label: "View Stock", path: "/stock" },
      { label: "View Products", path: "/products" },
    ],
  };
}
