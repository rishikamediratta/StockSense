# StockSense Frontend Specification

## Purpose

This document is the frontend implementation specification for StockSense.

It is based on:

1. `StockSense.pdf` — product requirements.
2. `StockSense - 8 hours.excalidraw` — supplied UI/workflow mockup.
3. The StockSense Odoo-inspired UI instructions supplied for this project.

**Important implementation rule:** Do not invent product requirements, workflows, fields, screens, or UI components that are not supported by the sources. When the sources do not specify an exact UI detail, keep the implementation minimal rather than filling the gap with an unnecessary feature.

---

# 1. Frontend Page Count

The frontend consists of **17 pages/routes**:

| # | Page | Route | Source basis |
|---|---|---|---|
| 1 | Login | `/login` | PDF + Excalidraw |
| 2 | Sign Up | `/signup` | PDF + Excalidraw |
| 3 | Forgot Password / OTP | `/forgot-password` | PDF + Excalidraw flow |
| 4 | Dashboard | `/dashboard` | PDF + Excalidraw |
| 5 | Products | `/products` | PDF |
| 6 | New/Edit Product | `/products/new`, `/products/:id/edit` | PDF |
| 7 | Stock | `/stock` | Excalidraw + PDF |
| 8 | Receipts | `/operations/receipts` | PDF + Excalidraw |
| 9 | Receipt Detail | `/operations/receipts/:id` | Excalidraw |
| 10 | Delivery Orders | `/operations/deliveries` | PDF + Excalidraw |
| 11 | Delivery Detail | `/operations/deliveries/:id` | Excalidraw |
| 12 | Internal Transfers | `/operations/transfers` | PDF |
| 13 | Inventory Adjustments | `/operations/adjustments` | PDF |
| 14 | Move History | `/move-history` | PDF + Excalidraw |
| 15 | Warehouses | `/settings/warehouses` | PDF + Excalidraw |
| 16 | Locations | `/settings/locations` | Excalidraw |
| 17 | My Profile | `/profile` | PDF |

The authenticated pages use the application's persistent left-side navigation shown in the mockup. Login, Sign Up, and Forgot Password are authentication screens.

---

# 2. Page Specifications

## 2.1 Login

### Route

`/login`

### Purpose

Allow an existing user to log in to StockSense.

### Components / UI elements

Only the elements shown or explicitly described by the sources:

- App Logo
- Login Id input
- Password input
- `SIGN IN` button
- `Forget Password ?` link
- `Sign Up` link

### Behavior

- Check the supplied login credentials.
- If credentials match, allow login and redirect to Dashboard.
- If credentials do not match, display:

`Invalid Login Id or Password`

- Clicking Sign Up opens the Sign Up page.
- Clicking Forget Password opens the Forgot Password page.

### Do not add

- Social login.
- Remember-me functionality.
- Unspecified authentication methods.

---

# 2.2 Sign Up

### Route

`/signup`

### Purpose

Create a user account.

### Components / UI elements

- Login Id input
- Password input
- Re-Enter Password input
- Email Id input
- Sign Up / Login navigation

### Validation specified by the mockup

#### Login ID

- Must be unique.
- Must contain between 6 and 12 characters.

#### Email

- Must not be a duplicate in the database.

#### Password

- Must be more than 8 characters.
- Must contain lowercase.
- Must contain uppercase.
- Must contain a special character.
- Password confirmation must match.

### Behavior

On successful signup, create the user in the system.

### Do not add

- Profile picture.
- Phone number.
- Social accounts.
- Additional account fields not specified by the sources.

---

# 2.3 Forgot Password / OTP

### Route

`/forgot-password`

### Purpose

Password reset using OTP.

The PDF explicitly requires an OTP-based password reset.

### Components / states

The exact complete OTP UI is not specified in the mockup. Therefore keep this page limited to the required flow:

1. Request password reset.
2. Enter/verify OTP.
3. Set the new password.

### Do not invent

The sources do not specify:

- OTP provider.
- OTP length.
- OTP expiry duration.
- Number of resend attempts.
- Specific email/SMS delivery mechanism.

These should not be represented as product requirements in the frontend specification.

---

# 2.4 Dashboard

### Route

`/dashboard`

### Purpose

The Dashboard is the landing page after login and displays current inventory statistics and operational information.

### Components / UI elements

The Excalidraw shows:

- Dashboard navigation item.
- Receipt summary.
- Delivery summary.
- Operations.
- Stock.
- Move History.
- Settings.

The PDF defines these dashboard KPIs:

- Total Products in Stock
- Low Stock / Out of Stock Items
- Pending Receipts
- Pending Deliveries
- Internal Transfers Scheduled

### Receipt summary

The mockup shows information such as:

- `4 to receive`
- `1 Late`
- `6 operations`

### Delivery summary

The mockup shows:

- `4 to Deliver`
- `1 Late`
- `2 waiting`
- `6 operations`

These are example mockup values, not mandatory seeded values.

### Dynamic filters

The PDF specifies filtering by:

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
- Warehouse/location
- Product category

### Behavior

Dashboard statistics should represent current inventory/operation state.

### Do not add

- Charts not specified by the sources.
- Revenue metrics.
- Sales analytics.
- Profit/loss.
- Unrelated ERP modules.

---

# 2.5 Products

### Route

`/products`

### Purpose

Manage products and view product/stock information.

### Required functionality

The PDF requires:

- Create products.
- Update products.
- Stock availability per location.
- Product categories.
- Reordering rules.
- SKU search.
- Smart filters.

### Components / UI elements

- Products navigation item.
- Product list.
- Search.
- Filters.
- Product information.
- New Product action.

### Product information

A product contains:

- Name
- SKU / Code
- Category
- Unit of Measure
- Initial Stock (optional)

### Do not add

Do not introduce product fields that are not specified by the sources.

---

# 2.6 New / Edit Product

### Routes

`/products/new`

`/products/:id/edit`

### Purpose

Create or update a product.

### Components / UI elements

Use the product fields specified by the PDF:

- Name
- SKU / Code
- Category
- Unit of Measure
- Initial Stock (optional)

The page may be used for both create and update rather than creating separate unrelated pages.

### Behavior

- Create a new product.
- Update an existing product.
- Enforce SKU/code uniqueness where applicable.
- Support the product/category/unit/initial-stock information defined by the requirements.

### Do not add

No product metadata beyond the specified fields unless it is later added to the requirements.

---

# 2.7 Stock

### Route

`/stock`

### Purpose

Display available stock and warehouse/location information.

### Components / UI elements

The Excalidraw explicitly shows:

- Stock page.
- Product.
- Per Unit Cost.
- On Hand.
- Free to Use.
- Warehouse/location information.
- Ability for the user to update stock from this area.

Example mockup data:

| Product | Per Unit Cost | On Hand | Free to Use |
|---|---:|---:|---:|
| Desk | 3000 Rs | 50 | 45 |
| Table | 3000 Rs | 50 | 50 |

These are mockup examples only.

### Behavior

Stock must be location-aware because the requirements specify stock availability per location.

When stock is changed, the change must follow the inventory-operation/ledger rules rather than silently bypassing inventory history.

### Do not add

- Sales forecasting.
- Profit calculations.
- Unspecified analytics.

---

# 2.8 Receipts

### Route

`/operations/receipts`

### Purpose

Display incoming stock receipts.

Receipts are used when goods arrive from vendors.

### Default view

**List View**

The Excalidraw explicitly states that the page should land on List View by default.

### Components / UI elements

- Operations navigation.
- Receipts page.
- List View.
- Kanban View.
- Search.
- Reference.
- Contact.
- Schedule Date.
- Status.
- New action.

### Search

Users can search receipts by:

- Reference
- Contact

### View switching

Allow switching between:

- List View
- Kanban View based on status

### Receipt reference

References follow:

`<Warehouse>/<Operation>/<ID>`

Example:

`WH/IN/0001`

Where:

- Warehouse = warehouse ID/short code used by the system.
- Operation = `IN`.
- ID = auto-incrementing unique ID.

### Receipt process

The PDF specifies:

1. Create a new receipt.
2. Add supplier/products.
3. Input quantities received.
4. Validate.
5. Stock increases automatically.

### Do not add

No supplier-specific fields beyond the source's `Receive From` / supplier concept.

---

# 2.9 Receipt Detail

### Route

`/operations/receipts/:id`

### Purpose

View and perform actions on an individual receipt.

### Components / UI elements from the mockup

- Receipt title.
- Receipt reference.
- Receive From.
- Schedule Date.
- Status progression.
- Responsible.
- Products.
- Quantity.
- New.
- Validate.
- Print.
- Cancel.

### Status progression

Receipt:

`Draft → Ready → Done`

### Status meanings

- Draft = Initial state.
- Ready = Ready to receive.
- Done = Received.

### Actions

#### New / To Do

When the receipt is in Draft, the To Do action moves it to Ready.

#### Validate

When the receipt is Ready, Validate moves it to Done.

#### Print

The mockup specifies printing the receipt once it is Done.

#### Cancel

Cancel is available as an operation action.

### Responsible

The responsible user is auto-filled with the currently logged-in user.

### Products

Display:

- Product
- Quantity

Example:

`[DESK001] Desk — 6`

### Inventory behavior

When the receipt is validated/completed:

`stock increases`

The movement must be logged in the stock ledger.

---

# 2.10 Delivery Orders

### Route

`/operations/deliveries`

### Purpose

Display outgoing stock delivery orders.

### Default view

**List View**

### Components / UI elements

- Delivery page.
- List View.
- Kanban View.
- Search.
- Reference.
- Contact.
- Schedule Date.
- Status.
- New action.

### Search

Users can search by:

- Reference
- Contact

### View switching

Allow switching between:

- List View
- Kanban View based on status

### Delivery reference

References follow:

`<Warehouse>/<Operation>/<ID>`

Example:

`WH/OUT/0001`

Where:

- Warehouse = warehouse ID/short code used by the system.
- Operation = `OUT`.
- ID = auto-incrementing unique ID.

### Delivery process

The PDF specifies:

1. Pick items.
2. Pack items.
3. Validate.
4. Stock decreases automatically.

### Do not add

Do not introduce sales-order screens or customer modules. The requirement only defines the Delivery Order operation.

---

# 2.11 Delivery Detail

### Route

`/operations/deliveries/:id`

### Purpose

View and perform actions on an individual delivery.

### Components / UI elements from the mockup

- Delivery title.
- Delivery reference.
- Delivery Address.
- Schedule Date.
- Operation Type.
- Status progression.
- Responsible.
- Products.
- Quantity.
- New.
- Validate.
- Print.
- Cancel.

### Status progression

Delivery:

`Draft → Waiting → Ready → Done`

### Status meanings

- Draft = Initial stage.
- Waiting = Waiting for stock.
- Ready = Ready to deliver.
- Done = Delivered.

### Stock availability behavior

If the product is not in stock:

- Show an alert/notification.
- Mark the affected product line red.
- The operation can be in Waiting while stock is unavailable.

### Actions

#### New / To Do

When the operation is in Draft, To Do moves it to the next applicable operational state.

#### Validate

When the operation is Ready, Validate moves it to Done.

#### Print

Print is available as an operation action.

#### Cancel

Cancel is available as an operation action.

### Responsible

Auto-fill using the current logged-in user.

### Inventory behavior

When the delivery is completed:

`stock decreases`

The movement is recorded in the stock ledger.

---

# 2.12 Internal Transfers

### Route

`/operations/transfers`

### Purpose

Move stock internally between company locations.

The PDF explicitly defines internal transfers, including:

- Main Warehouse → Production Floor
- Rack A → Rack B
- Warehouse 1 → Warehouse 2

Every movement is logged in the ledger.

### Components / UI elements supported by the source

The source establishes:

- Internal Transfer operation.
- From location.
- To location.
- Quantity/product movement.
- Movement history/ledger.

### Inventory behavior

For an internal transfer:

- Source location stock decreases.
- Destination location stock increases.
- Total stock does not change.
- The movement is logged.

### Important limitation

The supplied sources do **not** specify a complete dedicated Internal Transfer screen design, exact fields, or exact status workflow.

Therefore, do not invent additional transfer-specific fields or workflow states.

Use only the information required to perform:

`Product + Quantity + From + To`

and record the movement.

---

# 2.13 Inventory Adjustments

### Route

`/operations/adjustments`

### Purpose

Correct mismatches between recorded stock and physical count.

The PDF explicitly defines Inventory Adjustment as an operation.

### Required flow

1. Select product/location.
2. Enter counted quantity.
3. System updates stock.
4. System logs the adjustment.

### Components / UI elements supported by the source

- Inventory Adjustment operation.
- Product selection.
- Location selection.
- Recorded quantity.
- Counted quantity.
- Updated stock.
- Adjustment history/ledger.

### Inventory behavior

If:

`Recorded = 50`

and:

`Physical Count = 47`

then the stock becomes:

`47`

and the adjustment is logged.

### Important limitation

The supplied sources do not specify a detailed Adjustment page layout or exact status controls.

Do not invent additional fields or workflows.

---

# 2.14 Move History

### Route

`/move-history`

### Purpose

Display the history of stock movements.

The PDF calls this Move History and states that every internal movement is logged in the ledger.

### Default view

**List View**

### Components / UI elements

The Excalidraw specifies:

- Move History.
- List View.
- Kanban View based on status.
- Reference.
- Contact.
- Status.
- Date.
- From.
- To.
- Quantity.
- Search.
- Multiple rows when one reference contains multiple products.

### Movement display

Incoming moves:

- Green visual indication.

Outgoing moves:

- Red visual indication.

The color should not be the only indicator of direction.

### Multiple products

If one reference contains multiple products, display the products as multiple rows.

### Search

The mockup specifies searching using:

- Reference
- Contact

### Inventory movement meaning

The history represents movements between From and To locations.

Examples:

`vendor → WH/Stock1`

`WH/Stock1 → vendor`

`WH/Stock1 → WH/Stock2`

---

# 2.15 Warehouses

### Route

`/settings/warehouses`

### Purpose

Manage warehouse information.

### Components / UI elements

The Excalidraw explicitly shows:

- Warehouse
- Name
- Short Code
- Address

### Fields

#### Name

Warehouse name.

#### Short Code

Short code used by warehouse operations/reference numbering.

#### Address

Warehouse address.

### Multi-warehouse

The PDF requires multi-warehouse support.

### Reference relationship

Warehouse information participates in operation references such as:

`WH/IN/0001`

`WH/OUT/0001`

---

# 2.16 Locations

### Route

`/settings/locations`

### Purpose

Manage locations belonging to warehouses.

The Excalidraw describes this page as holding multiple locations of warehouses, rooms, etc.

### Components / UI elements

- Location
- Name
- Short Code
- Warehouse

### Fields

#### Name

Location name.

#### Short Code

Location short code.

#### Warehouse

The warehouse to which the location belongs.

### Inventory relationship

Locations are important because:

- Stock availability is location-aware.
- Internal transfers move stock between locations.
- Move History records From and To locations.
- Stock adjustments select a product/location.

---

# 2.17 My Profile

### Route

`/profile`

### Purpose

Provide the user's profile area.

The PDF explicitly lists:

- My Profile
- Logout

under the profile menu.

### Components / UI elements

Only the profile area required by the source should be implemented.

The exact editable profile fields are not specified in the supplied requirements/mockup.

### Do not invent

Do not add:

- Phone number.
- Avatar upload.
- Preferences.
- Notification settings.
- Unspecified profile fields.

Logout should remain available through the profile menu.

---

# 3. Shared Navigation

The Excalidraw repeatedly shows the application's navigation:

- Dashboard
- Operations
- Products
- Move History
- Settings

The PDF expands the navigation to include:

### Products

- Products

### Operations

- Receipts
- Delivery Orders
- Inventory Adjustment
- Move History

### Dashboard

- Dashboard

### Settings

- Warehouse
- Locations

### Profile menu

- My Profile
- Logout

### Stock

The Excalidraw also explicitly contains the Stock page.

The navigation should therefore provide direct access to the required operational pages without creating additional navigation levels.

---

# 4. Shared Operational UI Patterns

These are not additional pages. They are patterns already specified by the sources.

## List View

Used by:

- Receipts
- Delivery
- Move History

The Excalidraw specifies List View as the default for these pages.

## Kanban View

The Excalidraw specifies switching to a Kanban view based on status for:

- Receipts
- Delivery
- Move History

Do not create additional Kanban-only pages.

## Search

Search is explicitly required for:

- Receipts by reference/contact.
- Delivery by reference/contact.
- Move History by reference/contact.
- SKU/product search.

## Status

The PDF specifies these statuses:

- Draft
- Waiting
- Ready
- Done
- Canceled

The mockup gives specific workflows:

### Receipt

`Draft → Ready → Done`

### Delivery

`Draft → Waiting → Ready → Done`

Do not introduce additional status values unless the requirements are changed.

## Schedule date

The mockup defines:

- Late = schedule date < today's date.
- Operations = schedule date > today's date.
- Waiting = waiting for stock.

## Current user

The responsible field in Receipt and Delivery is automatically filled with the current logged-in user.

---

# 5. Inventory Rules That the Frontend Must Respect

## Receipt

Validated receipt:

`Stock + received quantity`

## Delivery

Completed delivery:

`Stock - delivered quantity`

## Internal Transfer

`Source stock - quantity`

`Destination stock + quantity`

Total stock remains unchanged.

## Adjustment

The physical counted quantity becomes the resulting stock quantity.

Example:

`Recorded = 50`

`Counted = 47`

`Result = 47`

Adjustment:

`-3`

Every inventory movement must be represented in the Stock Ledger / Move History.

---

# 6. UI Inspiration — Odoo-Inspired Design Rules

The following section is the supplied StockSense UI direction and should be treated as the visual design contract.

## Overall Direction

Build StockSense as a **professional ERP/inventory management application inspired by Odoo's UX patterns**, NOT as a pixel-perfect Odoo clone.

The UI should feel like:

- Professional
- Operational
- Dense but not cluttered
- Efficient for warehouse/inventory users
- Easy to scan
- Consistent
- Desktop-first
- Modern but restrained

Think **"Odoo-like business software, but with a distinct StockSense identity."**

---

# DOs

## 1. Use an ERP-style layout

Use a persistent left sidebar for primary navigation.

Recommended structure:

- Dashboard
- Products
- Operations
  - Receipts
  - Delivery Orders
  - Internal Transfers
  - Inventory Adjustments
  - Move History
- Reporting
- Settings

Profile/logout can live at the bottom of the sidebar.

Keep the main content area spacious and structured.

---

## 2. Prioritize information density

This is an inventory application, not a marketing website.

Users should be able to see lots of useful information without excessive scrolling.

Prefer:

- Tables
- Lists
- Compact cards
- Status badges
- Filters
- Search
- Tabs
- Detail panels
- Timelines

Avoid turning every piece of information into a giant card.

---

## 3. Make tables a major UI pattern

Products and operations should primarily use professional data tables.

Example:

Reference | Product | Location | Quantity | Status | Date | Actions

Tables should support:

- Search
- Filtering
- Sorting
- Status indicators
- Row actions
- Pagination where appropriate
- Clickable rows for detail views

Keep table rows compact and readable.

---

## 4. Use Odoo-like operational workflows

Operations should feel like business documents.

For example:

Receipt:

Draft → Waiting → Ready → Done

Delivery:

Draft → Waiting → Ready → Done

Adjustment:

Draft → Confirmed → Done

Use clear status indicators.

Do not invent complicated workflow states unless required.

---

## 5. Use search + filters heavily

Inventory users need to find information quickly.

Provide a prominent search field on list pages.

Support filters such as:

- Status
- Warehouse
- Location
- Product category
- Document type
- Date
- Low stock

Use filter chips/dropdowns rather than creating separate pages for every possible filter.

---

## 6. Make dashboard KPIs actionable

Dashboard cards should not just display numbers.

Include:

- Total Products
- Low Stock
- Out of Stock
- Pending Receipts
- Pending Deliveries
- Internal Transfers

Whenever possible, clicking a KPI should take the user to the relevant filtered list.

Example:

"12 Low Stock"

→ click

→ Products page filtered to low-stock products.

---

## 7. Use clear status colors

Status should be immediately recognizable.

Use restrained semantic colors:

- Green → completed / healthy
- Yellow/amber → waiting / attention
- Red → critical / low stock / error
- Blue → informational / active
- Gray → draft / inactive

Do NOT make the entire interface colorful.

Use color primarily for status and important actions.

---

## 8. Use a restrained visual hierarchy

Prioritize:

1. Page title
2. Primary action
3. Important KPIs
4. Filters/search
5. Main data
6. Secondary information

Example:

Products

[ + New Product ]

[ Search... ] [ Filters ]

---

Product table

Do not have ten competing buttons at the top of every page.

---

## 9. Use clear primary actions

Every important page should have one obvious primary action.

Examples:

Products:
`+ New Product`

Receipts:
`+ New Receipt`

Delivery Orders:
`+ New Delivery`

Transfers:
`+ New Transfer`

Adjustments:
`+ New Adjustment`

Primary actions should visually stand out without being oversized.

---

## 10. Make forms feel like business forms

Forms should be structured into logical sections.

Example:

### Product Information

Name
SKU / Code
Category
Unit of Measure

### Inventory

Initial Stock
Warehouse
Location

Use labels above inputs.

Group related fields together.

Avoid unnecessarily long single-column forms when a two-column layout improves readability.

---

## 11. Use detail pages with strong hierarchy

When opening a product or operation, show:

- Title
- Status
- Important metadata
- Primary actions
- Main information
- Related records/history

For stock movements, include a clear movement history/timeline where appropriate.

---

## 12. Use confirmations for destructive actions

Actions such as:

- Delete
- Cancel
- Remove stock
- Reset

should require confirmation when there is a meaningful risk of accidental data loss.

Avoid confirmation dialogs for harmless actions.

---

## 13. Keep navigation predictable

The user should always know:

- Where they are
- What section they're in
- How to return
- What action they're performing

Use breadcrumbs where useful.

Example:

`Operations / Receipts / WH-IN-0042`

---

## 14. Give StockSense its own identity

Take inspiration from Odoo's UX patterns, but do NOT copy Odoo's branding.

Use:

- StockSense name/logo
- StockSense-specific accent color
- Distinct typography
- Your own icons
- Your own dashboard composition

The result should look like a product that could integrate with or complement an ERP system, not an Odoo clone.

---

# DON'Ts

## 1. DON'T make it a pixel-perfect Odoo clone

Do not reproduce:

- Odoo logo
- Exact Odoo branding
- Exact Odoo screens
- Exact Odoo layouts
- Exact Odoo icons
- Exact Odoo colors
- Exact screenshots

We are taking UX inspiration, not copying the product.

---

## 2. DON'T build a generic SaaS dashboard

Avoid:

- Huge gradient cards
- Excessive rounded rectangles
- Giant numbers everywhere
- Glassmorphism
- Excessive shadows
- Neon colors
- Decorative gradients
- Floating blobs
- Marketing-style hero sections

StockSense is an operational business application.

---

## 3. DON'T overuse cards

Not everything needs to be:

`[ BIG CARD ]`

Use cards primarily for:

- KPIs
- Important summaries
- Grouped information

Use tables/lists for operational data.

---

## 4. DON'T make everything huge

Avoid:

- Huge headings
- Oversized buttons
- Excessive whitespace
- Giant dashboard cards
- Large table rows

Users need to process lots of inventory information quickly.

---

## 5. DON'T use excessive animations

Avoid:

- Page transition animations
- Floating animations
- Bouncing elements
- Excessive hover effects
- Animated backgrounds

Use subtle transitions only where they improve usability.

---

## 6. DON'T hide important information behind unnecessary clicks

For example, don't force the user to open a product just to see:

- SKU
- Stock quantity
- Location
- Status

Show important information directly in tables.

---

## 7. DON'T use icons without meaning

Icons should support comprehension.

Do not add icons simply because the interface "looks empty."

Every icon should have a clear purpose.

Use tooltips for unfamiliar icon-only actions.

---

## 8. DON'T rely only on color

Do not communicate status solely through color.

Bad:

🔴 = Low Stock

Better:

`LOW STOCK` + red semantic styling

This improves accessibility and clarity.

---

## 9. DON'T create unnecessary navigation levels

Avoid things like:

Dashboard → Inventory → Products → Stock → Current Stock → Products

Keep navigation shallow and predictable.

---

## 10. DON'T introduce features outside the scope unnecessarily

The core StockSense experience should focus on:

- Products
- Receipts
- Delivery Orders
- Internal Transfers
- Inventory Adjustments
- Move History
- Dashboard
- Warehouse/settings
- Stock visibility
- Low-stock alerts
- Search/filtering

Do not clutter the UI with unrelated ERP modules.

---

# VISUAL STYLE

Use:

- Clean sans-serif typography
- Neutral backgrounds
- Clear borders
- Subtle shadows
- Moderate border radius
- Compact controls
- Strong alignment
- Consistent spacing
- Professional tables

Avoid:

- Excessive gradients
- Excessive rounded corners
- Excessive shadows
- Cartoonish illustrations
- Decorative UI elements
- Overly futuristic styling

The interface should look like **serious business software**.

---

# RESPONSIVENESS

Desktop is the primary target because this is an inventory/warehouse management application.

Still ensure reasonable tablet/mobile behavior.

On smaller screens:

- Collapse sidebar
- Allow horizontal scrolling for complex tables
- Stack form fields
- Preserve important actions
- Do not simply shrink everything

---

# UX PRINCIPLE

The interface should optimize for:

**Find → Understand → Act**

A user should be able to:

1. Find the relevant product/order/operation.
2. Understand its current state immediately.
3. Perform the required action with minimal friction.

Every UI decision should support this principle.

---

# FINAL DESIGN TEST

Before considering a page complete, ask:

- Does this look like professional inventory software?
- Can a warehouse employee understand it quickly?
- Can the user find information without unnecessary clicks?
- Are tables and filters easy to use?
- Are statuses obvious?
- Is the primary action obvious?
- Is the UI information-dense without feeling cluttered?
- Does it feel inspired by Odoo without looking copied?
- Does StockSense still have its own visual identity?

If the answer to these is yes, keep the design.
