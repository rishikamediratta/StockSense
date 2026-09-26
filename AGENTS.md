# AGENTS.md — StockSense

## 1. Project Context

StockSense is a modular Inventory Management System (IMS) intended to replace manual registers, Excel sheets, and scattered stock tracking with a centralized, real-time, easy-to-use application.

The primary users are:
- Inventory Managers — manage incoming and outgoing stock.
- Warehouse Staff — perform transfers, picking, shelving, and counting.

The source requirements define authentication, a dashboard, product management, receipts, delivery orders, internal transfers, stock adjustments, stock/move history, warehouses, locations, and inventory alerts.

**Source of truth:** `StockSense.pdf` and the supplied Excalidraw mockup. Do not invent business rules when the sources already define them.

---

## 2. Agent Operating Rules

When modifying or extending this project:

1. **Read the existing implementation first.**
   - Inspect the current file structure, routes, components, models, APIs, and database schema before making changes.
   - Reuse existing patterns instead of introducing parallel implementations.

2. **Treat the requirements and mockup as the product contract.**
   - Preserve terminology such as Receipt, Delivery, Move History, Stock, Warehouse, Location, Draft, Waiting, Ready, Done, and Canceled.
   - Do not silently change business semantics.

3. **Do not overbuild.**
   - Implement the requested workflow before adding abstractions, integrations, AI, analytics, billing, or unrelated features.
   - If a feature is not specified, prefer the smallest reasonable implementation or leave it explicitly marked as a future decision.

4. **Do not fake inventory state.**
   - Stock quantities must have a clear source of truth.
   - Stock-changing operations must be traceable.
   - Inventory changes should be represented in the stock/move ledger.

5. **Keep UI and business logic consistent.**
   - A status displayed in the UI must correspond to the actual backend/domain state.
   - Actions such as Validate, Cancel, and stock updates must enforce the same rules server-side.

6. **Validate edge cases.**
   - Missing products.
   - Invalid quantities.
   - Insufficient stock.
   - Duplicate SKUs.
   - Duplicate login IDs.
   - Invalid status transitions.
   - Missing warehouse/location.
   - Transfers where source and destination are invalid.
   - Operations with multiple product lines.

7. **Preserve data integrity.**
   - Inventory-changing operations should be atomic.
   - Avoid partially applying a receipt, delivery, transfer, or adjustment.
   - Do not allow negative stock unless an explicitly documented rule is introduced later.

8. **Do not expose secrets.**
   - Never hard-code credentials, API keys, passwords, OTP secrets, or database credentials.
   - Use environment variables/configuration for secrets.

9. **Keep changes reviewable.**
   - Prefer small, focused changes.
   - Avoid unrelated refactors while implementing a feature.
   - Explain important business-logic changes in code comments only where the reason is not obvious.

---

## 3. Functional Scope

### 3.1 Authentication

Required flows:
- Sign up.
- Login.
- OTP-based password reset.
- Redirect authenticated users to the Inventory Dashboard.
- Logout.
- My Profile.

The mockup specifies:
- Login ID must be unique.
- Login ID is intended to be 6–12 characters.
- Login should reject invalid credentials with an error equivalent to:
  `Invalid Login Id or Password`.

Do not weaken authentication validation merely to make a UI demo work.

---

## 4. Dashboard

The dashboard is the landing page after authentication.

It should provide a current snapshot of inventory operations.

### Required KPIs

- Total Products in Stock.
- Low Stock / Out of Stock Items.
- Pending Receipts.
- Pending Deliveries.
- Internal Transfers Scheduled.

### Required filtering concepts

Support filtering by:
- Document type:
  - Receipts
  - Delivery
  - Internal
  - Adjustments
- Status:
  - Draft
  - Waiting
  - Ready
  - Done
  - Canceled
- Warehouse/location.
- Product category.

The mockup also shows receipt and delivery summary cards, including counts such as items to receive/deliver and late/waiting operations.

---

## 5. Products

Products must support:

- Name.
- SKU / Code.
- Category.
- Unit of Measure.
- Optional initial stock.
- Stock availability per location.
- Reordering rules.

The system must support:
- Creating products.
- Updating products.
- Searching by SKU.
- Smart filtering.

SKU/code uniqueness should be enforced.

---

## 6. Warehouses and Locations

### Warehouse

A warehouse contains:
- Name.
- Short Code.
- Address.

The system must support multiple warehouses.

### Location

A location represents a stock-holding location inside a warehouse, such as:
- Warehouse stock.
- Rack.
- Room.
- Production area.

A location contains:
- Name.
- Short Code.
- Warehouse.

Inventory quantities must be location-aware.

---

## 7. Receipts — Incoming Stock

Receipts represent goods arriving from a vendor.

### Receipt workflow

1. Create a receipt.
2. Add supplier/vendor.
3. Add product lines.
4. Enter quantities received.
5. Move through the appropriate status.
6. Validate the receipt.
7. On completion, increase stock automatically.
8. Record the movement in the stock ledger.

Example:
- Receive 50 Steel Rods → stock increases by 50.

### Receipt fields shown by the mockup

- Reference.
- Receive From.
- Schedule Date.
- Responsible.
- Products.
- Quantity.
- Status.

### Receipt statuses

The source material specifies:

`Draft → Ready → Done`

The mockup describes:
- Draft = initial state.
- Ready = ready to receive.
- Done = received.

Buttons/actions shown:
- New.
- Validate.
- Print.
- Cancel.

The responsible user should be auto-filled from the currently logged-in user.

### Reference format

Receipt references should follow the pattern:

`<Warehouse>/<Operation>/<ID>`

Example:

`WH/IN/0001`

Where:
- `WH` = warehouse short code.
- `IN` = incoming operation.
- `0001` = auto-incrementing identifier.

---

## 8. Delivery Orders — Outgoing Stock

Delivery orders represent stock leaving a warehouse for customer shipment.

### Delivery workflow

1. Create delivery order.
2. Add delivery address/contact.
3. Add product lines.
4. Pick/prepare items.
5. Pack/prepare items.
6. Validate.
7. On completion, decrease stock automatically.
8. Record the movement in the stock ledger.

Example:
- Deliver 10 chairs → available chair stock decreases by 10.

### Delivery fields shown by the mockup

- Reference.
- Delivery Address.
- Schedule Date.
- Operation Type.
- Responsible.
- Products.
- Quantity.
- Status.

### Delivery statuses

The mockup specifies:

`Draft → Waiting → Ready → Done`

Meaning:
- Draft = initial stage.
- Waiting = waiting for required stock.
- Ready = ready to deliver.
- Done = delivered.

If a product is not available:
- The relevant line should be marked red.
- A notification/alert should be shown.
- The operation may enter the Waiting state until stock is available.

### Delivery reference format

Use:

`<Warehouse>/<Operation>/<ID>`

Example:

`WH/OUT/0001`

Where:
- `WH` = warehouse short code.
- `OUT` = outgoing operation.
- `0001` = auto-incrementing identifier.

---

## 9. Internal Transfers

Internal transfers move stock between locations within the company.

Examples:
- Main Warehouse → Production Floor.
- Rack A → Rack B.
- Warehouse 1 → Warehouse 2.

### Rules

- Total company stock does not change during a transfer.
- Source-location stock decreases.
- Destination-location stock increases.
- Every movement must be logged.
- Source and destination locations must be valid.

The transfer must not silently create or destroy inventory.

---

## 10. Stock Adjustments

Adjustments reconcile recorded stock with physical counts.

### Workflow

1. Select product.
2. Select location.
3. Enter counted quantity.
4. Calculate the adjustment from recorded quantity.
5. Update inventory.
6. Log the adjustment.

Example:
- Recorded stock = 50.
- Physical count = 47.
- Adjustment = -3.

The adjustment must be traceable in the stock ledger.

---

## 11. Stock View

The Stock page contains warehouse/location inventory information.

The mockup shows columns/concepts including:

- Product.
- Per-unit cost.
- On hand.
- Free to Use.

Example values in the mockup are illustrative and must not be treated as seeded business data unless the implementation explicitly chooses to seed demo data.

Users must be able to update stock through the appropriate inventory operation rather than bypassing ledger/history rules.

---

## 12. Move History / Stock Ledger

Move History records inventory movements.

It should capture movements between source and destination locations and operational changes caused by:
- Receipts.
- Deliveries.
- Internal transfers.
- Adjustments.

The requirements explicitly state that inventory movements are logged in the ledger.

### List behavior

The mockup specifies:
- Default view is List View.
- Columns include Reference, Contact, Status, and date-related information.
- If a single reference contains multiple products, display the products as multiple rows where appropriate.
- Search should be supported using reference/contact concepts.
- A Kanban view based on status should be available.

Do not treat Move History as a second independent inventory source. It is an audit/history representation of inventory movements.

---

## 13. Status Semantics

Use these meanings consistently:

| Status | Meaning |
|---|---|
| Draft | Initial/unconfirmed operation |
| Waiting | Operation cannot proceed yet, commonly because required stock is unavailable |
| Ready | Operation is prepared and ready to be completed |
| Done | Operation has been completed |
| Canceled | Operation has been canceled |

Do not allow arbitrary status jumps unless the product requirements are expanded.

For the flows explicitly shown:
- Receipt: Draft → Ready → Done.
- Delivery: Draft → Waiting → Ready → Done.

The mockup also describes:
- A "To Do" action from Draft moves an operation to Ready where applicable.
- Validate from Ready moves the operation to Done.
- A receipt can be printed once it is Done.

---

## 14. Date and Scheduling Rules

The mockup defines:
- **Late:** schedule date is earlier than today's date.
- **Operations:** schedule date is later than today's date.
- **Waiting:** waiting for required stock.

Implement these as derived UI/business states where appropriate rather than storing contradictory duplicate values.

Use the application's date/time strategy consistently. Avoid client-only date calculations when the backend is responsible for business-state decisions.

---

## 15. Navigation

The primary application navigation shown in the sources includes:

- Dashboard.
- Operations.
  - Receipts.
  - Delivery.
  - Inventory Adjustment.
- Products.
- Stock.
- Move History.
- Settings.
  - Warehouse.
  - Locations.
- Profile menu.
  - My Profile.
  - Logout.

Keep navigation labels aligned with the product terminology.

---

## 16. Inventory Invariants

These are critical domain rules.

### Receipt

For a validated/completed receipt:

`destination stock += received quantity`

### Delivery

For a completed delivery:

`source stock -= delivered quantity`

A delivery must not complete when required stock is unavailable unless a future product decision explicitly permits negative stock.

### Internal Transfer

For quantity `Q`:

`source stock -= Q`
`destination stock += Q`

Net total stock remains unchanged.

### Adjustment

For recorded quantity `R` and counted quantity `C`:

`adjustment = C - R`

Then:

`stock = C`

The adjustment must create an audit/ledger record.

---

## 17. Data Integrity

Any operation that changes inventory should:

1. Validate the request.
2. Validate the operation's current status.
3. Validate product/location relationships.
4. Validate quantities.
5. Apply the inventory mutation.
6. Create the corresponding ledger/history record.
7. Commit the whole operation atomically.

If any step fails, the inventory mutation must not be partially persisted.

---

## 18. UI Expectations From the Mockup

The mockup consistently uses:
- List views for Receipts, Delivery, and Move History.
- Kanban/status views as an alternate view for operational lists.
- Sidebar navigation.
- Detail pages for individual receipt/delivery records.
- Action buttons such as New, Validate, Print, and Cancel.
- Tables for product/quantity and stock information.
- Search/filter controls.

The implementation does not need to reproduce the mockup pixel-for-pixel unless explicitly requested. It should preserve the information architecture and workflow.

---

## 19. Demo / Seed Data

If demo data is required:
- Keep it clearly separated from production/business logic.
- Do not confuse mockup example values with real records.
- Use realistic but clearly synthetic data.
- Seed data should exercise:
  - At least one warehouse.
  - Multiple locations.
  - Multiple products.
  - A receipt.
  - A delivery.
  - An internal transfer.
  - An adjustment.
  - Different operation statuses.

---

## 20. Testing Expectations

When implementing domain logic, test at minimum:

### Authentication
- Valid login.
- Invalid login.
- Duplicate login ID.
- Password confirmation mismatch.
- Password reset flow validation.

### Products
- Create product.
- Update product.
- Duplicate SKU.
- Invalid quantity/initial stock.

### Receipts
- Draft receipt.
- Validate receipt.
- Stock increases exactly once.
- Cannot validate an already completed/canceled receipt.
- Multiple product lines.
- Correct ledger entries.

### Deliveries
- Sufficient stock.
- Insufficient stock → Waiting/blocked behavior.
- Stock decreases exactly once.
- Cannot complete twice.
- Multiple product lines.
- Correct ledger entries.

### Transfers
- Valid source/destination.
- Insufficient source stock.
- Same source and destination.
- Correct quantity movement.
- Correct ledger entries.

### Adjustments
- Increase stock.
- Decrease stock.
- Zero adjustment.
- Correct final stock.
- Correct ledger entry.

### Filtering
- Document type.
- Status.
- Warehouse/location.
- Product category.
- Search by reference/contact where applicable.

---

## 21. Implementation Discipline

Before writing code:
1. Inspect the repository.
2. Identify the existing stack.
3. Identify the current data model.
4. Identify implemented vs missing requirements.
5. Make the smallest coherent change.

Before considering a feature complete:
1. Verify the UI flow.
2. Verify the backend/domain rule.
3. Verify persistence.
4. Verify stock quantities.
5. Verify ledger/history.
6. Verify invalid/edge cases.
7. Run available tests/lint/build checks.

When requirements conflict or are ambiguous:
- Prefer the explicit workflow in the supplied mockup for UI behavior.
- Prefer the explicit requirements PDF for product scope.
- Do not silently invent a resolution.
- Document the ambiguity and choose the smallest reversible implementation.

---

## 22. Techstack

Layer	Technology	Purpose
Frontend	React + Vite	SPA and UI
Styling	Tailwind CSS	Odoo-inspired ERP UI
UI Components	shadcn/ui	Tables, dialogs, dropdowns, forms, badges, etc.
Icons	Lucide React	Consistent interface icons
Routing	React Router	Page/navigation routing
Forms	React Hook Form	Form state + validation
Validation	Zod	Frontend schema validation
Data fetching	TanStack Query	API calls, caching, loading/error states
HTTP	Axios	Frontend → FastAPI communication
Backend	Python + FastAPI	REST API + business logic
ORM	SQLAlchemy	Database models/queries
Database migrations	Alembic	Schema migrations
Database	PostgreSQL	Persistent application data
Authentication	JWT	Login/session authentication
Password hashing	Argon2/bcrypt	Secure password storage
OTP	Backend OTP service	Password reset flow
API documentation	FastAPI OpenAPI/Swagger	API testing/documentation
Testing — Frontend	Vitest + React Testing Library	UI/component tests
Testing — Backend	Pytest	API/business-logic tests
Version control	Git + GitHub	Source control
---

## 23. Definition of Done

A StockSense feature is considered done only when:

- It matches the supplied product requirements.
- Its UI state matches its domain state.
- Inventory changes are correct.
- The corresponding stock movement is traceable.
- Invalid operations are rejected safely.
- Existing workflows are not broken.
- The implementation follows the existing repository architecture.
- Relevant tests/build checks pass.
- No secrets or credentials are committed.

---

## 24. Source References

Primary product requirements:
- `StockSense.pdf`

Primary UI/workflow reference:
- Supplied Excalidraw mockup: StockSense - 8 hours

The PDF explicitly describes the IMS goal, target users, authentication, dashboard KPIs/filters, product management, receipts, delivery orders, internal transfers, adjustments, alerts, multi-warehouse support, SKU search, and the stock-ledger inventory flow.
