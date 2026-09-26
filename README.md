# StockSense 📦

> **AI-powered Inventory Management System for smarter, faster stock operations.**

StockSense is a modular Inventory Management System built to digitize and streamline stock-related operations within a business.

It provides a centralized platform for managing **products, warehouses, receipts, deliveries, internal transfers, inventory adjustments, and stock movements**, while adding an intelligent analytics layer for **stockout forecasting, anomaly detection, natural-language inventory queries, and operational insights**.

Built for the **Odoo Hiring Hackathon**.

---

## 🚀 Overview

Traditional inventory management often relies on manual registers, spreadsheets, and disconnected tracking systems.

StockSense brings these workflows into one centralized system:

```text
Receive → Store → Transfer → Deliver → Adjust → Analyze
```

Every inventory movement is recorded in the stock ledger, while **StockSense Intelligence** analyzes operational data to identify risks and provide actionable insights.

---

## ✨ Key Features

### 📊 Inventory Dashboard

A centralized overview of inventory operations.

**Dashboard KPIs include:**

* Total Products in Stock
* Low Stock Items
* Out of Stock Items
* Pending Receipts
* Pending Deliveries
* Scheduled Internal Transfers

Dynamic filtering by:

* Document type
* Status
* Warehouse / location
* Product category

---

### 📦 Product Management

Create and manage products with:

* Product Name
* SKU / Product Code
* Category
* Unit of Measure
* Initial Stock
* Stock availability by location
* Reordering rules

---

### 📥 Receipts

Manage incoming goods from suppliers.

**Workflow:**

```text
Create Receipt
      ↓
Add Supplier & Products
      ↓
Enter Received Quantity
      ↓
Validate
      ↓
Stock Increases
      ↓
Movement Logged
```

---

### 📤 Delivery Orders

Manage outgoing stock and customer shipments.

**Workflow:**

```text
Create Delivery
      ↓
Pick Items
      ↓
Pack
      ↓
Validate
      ↓
Stock Decreases
      ↓
Movement Logged
```

---

### 🔄 Internal Transfers

Move stock between warehouses, locations, or storage areas.

Examples:

```text
Main Warehouse → Production Floor

Rack A → Rack B

Warehouse 1 → Warehouse 2
```

Internal transfers change the stock location while preserving the overall inventory quantity.

Every movement is recorded in the ledger.

---

### 🧮 Inventory Adjustments

Reconcile recorded inventory with physical stock counts.

**Workflow:**

```text
Select Product / Location
          ↓
Enter Physical Count
          ↓
Calculate Difference
          ↓
Update Stock
          ↓
Record Adjustment
```

---

### 📜 Stock Movement History

Maintain a traceable history of inventory operations, including:

* Receipts
* Deliveries
* Internal transfers
* Inventory adjustments

This provides visibility into how and why stock levels change.

---

### 🚨 Low Stock Monitoring

Identify products that fall below configured reorder levels and surface them directly through the dashboard and intelligence layer.

---

### 🏢 Multi-Warehouse Support

Track inventory across multiple:

* Warehouses
* Locations
* Storage areas

---

### 🔎 Search & Smart Filtering

Quickly find inventory records using:

* SKU
* Product name
* Category
* Warehouse
* Location
* Document type
* Status

---

# 🧠 StockSense Intelligence

StockSense goes beyond traditional inventory tracking with a dedicated **AI & analytics layer** designed specifically around inventory operations.

Instead of adding a generic chatbot, StockSense Intelligence analyzes actual inventory data to help users understand **what is happening, what is unusual, and what may require attention.**

---

## 💬 Natural-Language Inventory Queries

Users can query inventory using natural language.

Examples:

> "Which products are at risk of running out?"

> "Why is Steel Rods stock low?"

> "Which products had the biggest stock decrease this week?"

> "What receipts are still pending?"

> "Show me recent movements for Steel Rods."

The system extracts the user's intent and retrieves relevant inventory information.

---

## 📉 Stockout & Depletion Forecasting

StockSense analyzes recent inventory movement to estimate potential stock depletion.

The intelligence layer uses a **7-day moving window** to calculate run-rate and burn-rate patterns.

Example:

```text
Steel Rods

Current Stock:       18 units
Reorder Level:       25 units
Recent Usage:        32 units / week

⚠ Potential Stockout Risk

Estimated depletion:
~4 days based on recent usage
```

Forecasts are presented as estimates based on observed inventory behavior.

---

## 🚨 Anomaly & Spike Detection

StockSense identifies unusual changes in stock movement.

Example:

```text
⚠ Unusual Stock Movement

Steel Rods decreased by 42 units
on September 25.

This movement is significantly
higher than recent transaction activity.
```

This helps inventory managers investigate unexpected stock changes.

---

## 📦 Bottleneck Identification

The intelligence layer analyzes pending operational activity to identify potential bottlenecks.

Examples include:

* Large numbers of pending receipts
* Pending deliveries
* Delayed internal transfers
* Products waiting for replenishment

This allows users to focus attention on operations that may require action.

---

## 🧠 AI Dashboard Insights

StockSense Intelligence is integrated directly into the existing dashboard.

Example:

```text
┌─────────────────────────────────────────────────────────┐
│ 🧠 StockSense Intelligence                              │
│                                                         │
│ Here's what needs your attention                       │
│                                                         │
│ 🔴 3 products at critical stock levels                 │
│ 🟡 7 products approaching reorder level                 │
│ ⚠️ 2 unusual stock movements                           │
│ 📦 12 pending operations                                │
│                                                         │
│ Ask StockSense...                              [ Ask ]  │
└─────────────────────────────────────────────────────────┘
```

AI insights are designed to complement the existing inventory workflows rather than replace them.

---

# 🏗️ Technology Stack

## Frontend

| Technology          | Purpose                                       |
| ------------------- | --------------------------------------------- |
| **React 18**        | Single Page Application                       |
| **Vite 6**          | Build tool and development server             |
| **React Router v6** | Client-side routing and URL state             |
| **Lucide React**    | SVG icon system                               |
| **Vanilla CSS**     | Styling, design tokens and responsive layouts |
| **Space Grotesk**   | Display typography                            |
| **DM Sans**         | Interface typography                          |

The frontend uses a custom CSS design system with responsive grid layouts and reusable UI patterns.

---

## Backend

| Technology         | Purpose                                     |
| ------------------ | ------------------------------------------- |
| **FastAPI**        | Python REST API framework                   |
| **Uvicorn**        | ASGI server                                 |
| **Pydantic v2**    | Data validation and schemas                 |
| **CORSMiddleware** | Frontend/backend cross-origin communication |

---

## Database

| Technology         | Purpose                        |
| ------------------ | ------------------------------ |
| **SQLite**         | Serverless relational database |
| **SQLAlchemy 2.0** | ORM and database abstraction   |

The database stores core inventory entities such as:

* Users
* Products
* Warehouses
* Locations
* Receipts
* Deliveries
* Moves

Database file:

```text
stocksense.db
```

---

# 🤖 StockSense Intelligence Architecture

The intelligence layer combines deterministic inventory analytics with natural-language reasoning.

```text
┌──────────────────────────────────────────────────────────┐
│                    React 18 + Vite                       │
│                                                          │
│ Dashboard │ Products │ Stock │ Operations │ AI UI       │
└─────────────────────────┬────────────────────────────────┘
                          │
                    REST API / State
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│                     FastAPI                              │
│                                                          │
│  ┌─────────────────────┐   ┌──────────────────────────┐ │
│  │   Core REST APIs    │   │ StockSense Intelligence  │ │
│  │                     │   │                          │ │
│  │ Products            │   │ Query & Intent           │ │
│  │ Receipts            │   │ Run-rate Analysis        │ │
│  │ Deliveries          │   │ Burn-rate Analysis       │ │
│  │ Transfers           │   │ Stockout Forecasting     │ │
│  │ Adjustments         │   │ Anomaly Detection        │ │
│  │ Stock Movements     │   │ Bottleneck Detection     │ │
│  └──────────┬──────────┘   └────────────┬─────────────┘ │
│             │                           │               │
│             └─────────────┬─────────────┘               │
│                           ▼                             │
│                 SQLAlchemy 2.0 ORM                      │
└───────────────────────────┬──────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ SQLite        │
                    │ stocksense.db │
                    └───────────────┘
```

---

# 🧠 Intelligence Engine

The core intelligence functionality is implemented through:

```text
backend/ai_tools.py
src/aiEngine.js
```

The intelligence layer handles:

### Natural Language

* Query parsing
* Intent extraction

### Inventory Analytics

* 7-day moving-window analysis
* Run-rate calculations
* Burn-rate calculations
* Stockout/depletion forecasting

### Operational Intelligence

* Transaction anomaly detection
* Spike detection
* Pending-operation bottleneck identification

---

# 🔐 Authentication & Security

StockSense uses:

### JWT Authentication

JSON Web Tokens are used for authenticated API access.

### Password Security

Passwords are protected using:

**bcrypt**

with salted password hashing.

### Token Scheme

Authenticated requests use:

```text
Authorization: Bearer <token>
```

### CORS

FastAPI's `CORSMiddleware` enables secure communication between the decoupled frontend and backend.

---

# 🔄 Inventory Lifecycle

StockSense models the complete inventory lifecycle:

```text
                         ┌──────────────┐
                         │    Vendor    │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │   Receipt    │
                         └──────┬───────┘
                                │
                             Stock +
                                │
                                ▼
                    ┌──────────────────────┐
                    │      Warehouse       │
                    └──────────┬───────────┘
                               │
                       Internal Transfer
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Storage / Location  │
                    └──────────┬───────────┘
                               │
                            Delivery
                               │
                               ▼
                         ┌──────────────┐
                         │   Customer   │
                         └──────────────┘

          Physical Count
                │
                ▼
      Inventory Adjustment
                │
                ▼
          Stock Ledger
                │
                ▼
      StockSense Intelligence
```

---

# 🧭 Application Structure

```text
StockSense
│
├── Dashboard
│   └── StockSense Intelligence
│
├── Products
│   ├── Product Management
│   ├── Categories
│   └── Reordering Rules
│
├── Operations
│   ├── Receipts
│   ├── Delivery Orders
│   ├── Internal Transfers
│   ├── Inventory Adjustments
│   └── Move History
│
├── Settings
│   └── Warehouse
│
└── Profile
    ├── My Profile# StockSense 📦

> **AI-powered Inventory Management System for smarter, faster stock operations.**

StockSense is a modular Inventory Management System built to digitize and streamline stock-related operations within a business.

It provides a centralized platform for managing **products, warehouses, receipts, deliveries, internal transfers, inventory adjustments, and stock movements**, while adding an intelligent analytics layer for **stockout forecasting, anomaly detection, natural-language inventory queries, and operational insights**.

Built for the **Odoo Hiring Hackathon**.

---

## 🚀 Overview

Traditional inventory management often relies on manual registers, spreadsheets, and disconnected tracking systems.

StockSense brings these workflows into one centralized system:

```text
Receive → Store → Transfer → Deliver → Adjust → Analyze
```

Every inventory movement is recorded in the stock ledger, while **StockSense Intelligence** analyzes operational data to identify risks and provide actionable insights.

---

## ✨ Key Features

### 📊 Inventory Dashboard

A centralized overview of inventory operations.

**Dashboard KPIs include:**

* Total Products in Stock
* Low Stock Items
* Out of Stock Items
* Pending Receipts
* Pending Deliveries
* Scheduled Internal Transfers

Dynamic filtering by:

* Document type
* Status
* Warehouse / location
* Product category

---

### 📦 Product Management

Create and manage products with:

* Product Name
* SKU / Product Code
* Category
* Unit of Measure
* Initial Stock
* Stock availability by location
* Reordering rules

---

### 📥 Receipts

Manage incoming goods from suppliers.

**Workflow:**

```text
Create Receipt
      ↓
Add Supplier & Products
      ↓
Enter Received Quantity
      ↓
Validate
      ↓
Stock Increases
      ↓
Movement Logged
```

---

### 📤 Delivery Orders

Manage outgoing stock and customer shipments.

**Workflow:**

```text
Create Delivery
      ↓
Pick Items
      ↓
Pack
      ↓
Validate
      ↓
Stock Decreases
      ↓
Movement Logged
```

---

### 🔄 Internal Transfers

Move stock between warehouses, locations, or storage areas.

Examples:

```text
Main Warehouse → Production Floor

Rack A → Rack B

Warehouse 1 → Warehouse 2
```

Internal transfers change the stock location while preserving the overall inventory quantity.

Every movement is recorded in the ledger.

---

### 🧮 Inventory Adjustments

Reconcile recorded inventory with physical stock counts.

**Workflow:**

```text
Select Product / Location
          ↓
Enter Physical Count
          ↓
Calculate Difference
          ↓
Update Stock
          ↓
Record Adjustment
```

---

### 📜 Stock Movement History

Maintain a traceable history of inventory operations, including:

* Receipts
* Deliveries
* Internal transfers
* Inventory adjustments

This provides visibility into how and why stock levels change.

---

### 🚨 Low Stock Monitoring

Identify products that fall below configured reorder levels and surface them directly through the dashboard and intelligence layer.

---

### 🏢 Multi-Warehouse Support

Track inventory across multiple:

* Warehouses
* Locations
* Storage areas

---

### 🔎 Search & Smart Filtering

Quickly find inventory records using:

* SKU
* Product name
* Category
* Warehouse
* Location
* Document type
* Status

---

# 🧠 StockSense Intelligence

StockSense goes beyond traditional inventory tracking with a dedicated **AI & analytics layer** designed specifically around inventory operations.

Instead of adding a generic chatbot, StockSense Intelligence analyzes actual inventory data to help users understand **what is happening, what is unusual, and what may require attention.**

---

## 💬 Natural-Language Inventory Queries

Users can query inventory using natural language.

Examples:

> "Which products are at risk of running out?"

> "Why is Steel Rods stock low?"

> "Which products had the biggest stock decrease this week?"

> "What receipts are still pending?"

> "Show me recent movements for Steel Rods."

The system extracts the user's intent and retrieves relevant inventory information.

---

## 📉 Stockout & Depletion Forecasting

StockSense analyzes recent inventory movement to estimate potential stock depletion.

The intelligence layer uses a **7-day moving window** to calculate run-rate and burn-rate patterns.

Example:

```text
Steel Rods

Current Stock:       18 units
Reorder Level:       25 units
Recent Usage:        32 units / week

⚠ Potential Stockout Risk

Estimated depletion:
~4 days based on recent usage
```

Forecasts are presented as estimates based on observed inventory behavior.

---

## 🚨 Anomaly & Spike Detection

StockSense identifies unusual changes in stock movement.

Example:

```text
⚠ Unusual Stock Movement

Steel Rods decreased by 42 units
on September 25.

This movement is significantly
higher than recent transaction activity.
```

This helps inventory managers investigate unexpected stock changes.

---

## 📦 Bottleneck Identification

The intelligence layer analyzes pending operational activity to identify potential bottlenecks.

Examples include:

* Large numbers of pending receipts
* Pending deliveries
* Delayed internal transfers
* Products waiting for replenishment

This allows users to focus attention on operations that may require action.

---

## 🧠 AI Dashboard Insights

StockSense Intelligence is integrated directly into the existing dashboard.

Example:

```text
┌─────────────────────────────────────────────────────────┐
│ 🧠 StockSense Intelligence                              │
│                                                         │
│ Here's what needs your attention                       │
│                                                         │
│ 🔴 3 products at critical stock levels                 │
│ 🟡 7 products approaching reorder level                 │
│ ⚠️ 2 unusual stock movements                           │
│ 📦 12 pending operations                                │
│                                                         │
│ Ask StockSense...                              [ Ask ]  │
└─────────────────────────────────────────────────────────┘
```

AI insights are designed to complement the existing inventory workflows rather than replace them.

---

# 🏗️ Technology Stack

## Frontend

| Technology          | Purpose                                       |
| ------------------- | --------------------------------------------- |
| **React 18**        | Single Page Application                       |
| **Vite 6**          | Build tool and development server             |
| **React Router v6** | Client-side routing and URL state             |
| **Lucide React**    | SVG icon system                               |
| **Vanilla CSS**     | Styling, design tokens and responsive layouts |
| **Space Grotesk**   | Display typography                            |
| **DM Sans**         | Interface typography                          |

The frontend uses a custom CSS design system with responsive grid layouts and reusable UI patterns.

---

## Backend

| Technology         | Purpose                                     |
| ------------------ | ------------------------------------------- |
| **FastAPI**        | Python REST API framework                   |
| **Uvicorn**        | ASGI server                                 |
| **Pydantic v2**    | Data validation and schemas                 |
| **CORSMiddleware** | Frontend/backend cross-origin communication |

---

## Database

| Technology         | Purpose                        |
| ------------------ | ------------------------------ |
| **SQLite**         | Serverless relational database |
| **SQLAlchemy 2.0** | ORM and database abstraction   |

The database stores core inventory entities such as:

* Users
* Products
* Warehouses
* Locations
* Receipts
* Deliveries
* Moves

Database file:

```text
stocksense.db
```

---

# 🤖 StockSense Intelligence Architecture

The intelligence layer combines deterministic inventory analytics with natural-language reasoning.

```text
┌──────────────────────────────────────────────────────────┐
│                    React 18 + Vite                       │
│                                                          │
│ Dashboard │ Products │ Stock │ Operations │ AI UI       │
└─────────────────────────┬────────────────────────────────┘
                          │
                    REST API / State
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│                     FastAPI                              │
│                                                          │
│  ┌─────────────────────┐   ┌──────────────────────────┐ │
│  │   Core REST APIs    │   │ StockSense Intelligence  │ │
│  │                     │   │                          │ │
│  │ Products            │   │ Query & Intent           │ │
│  │ Receipts            │   │ Run-rate Analysis        │ │
│  │ Deliveries          │   │ Burn-rate Analysis       │ │
│  │ Transfers           │   │ Stockout Forecasting     │ │
│  │ Adjustments         │   │ Anomaly Detection        │ │
│  │ Stock Movements     │   │ Bottleneck Detection     │ │
│  └──────────┬──────────┘   └────────────┬─────────────┘ │
│             │                           │               │
│             └─────────────┬─────────────┘               │
│                           ▼                             │
│                 SQLAlchemy 2.0 ORM                      │
└───────────────────────────┬──────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ SQLite        │
                    │ stocksense.db │
                    └───────────────┘
```

---

# 🧠 Intelligence Engine

The core intelligence functionality is implemented through:

```text
backend/ai_tools.py
src/aiEngine.js
```

The intelligence layer handles:

### Natural Language

* Query parsing
* Intent extraction

### Inventory Analytics

* 7-day moving-window analysis
* Run-rate calculations
* Burn-rate calculations
* Stockout/depletion forecasting

### Operational Intelligence

* Transaction anomaly detection
* Spike detection
* Pending-operation bottleneck identification

---

# 🔐 Authentication & Security

StockSense uses:

### JWT Authentication

JSON Web Tokens are used for authenticated API access.

### Password Security

Passwords are protected using:

**bcrypt**

with salted password hashing.

### Token Scheme

Authenticated requests use:

```text
Authorization: Bearer <token>
```

### CORS

FastAPI's `CORSMiddleware` enables secure communication between the decoupled frontend and backend.

---

# 🔄 Inventory Lifecycle

StockSense models the complete inventory lifecycle:

```text
                         ┌──────────────┐
                         │    Vendor    │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │   Receipt    │
                         └──────┬───────┘
                                │
                             Stock +
                                │
                                ▼
                    ┌──────────────────────┐
                    │      Warehouse       │
                    └──────────┬───────────┘
                               │
                       Internal Transfer
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Storage / Location  │
                    └──────────┬───────────┘
                               │
                            Delivery
                               │
                               ▼
                         ┌──────────────┐
                         │   Customer   │
                         └──────────────┘

          Physical Count
                │
                ▼
      Inventory Adjustment
                │
                ▼
          Stock Ledger
                │
                ▼
      StockSense Intelligence
```

---

# 🧭 Application Structure

```text
StockSense
│
├── Dashboard
│   └── StockSense Intelligence
│
├── Products
│   ├── Product Management
│   ├── Categories
│   └── Reordering Rules
│
├── Operations
│   ├── Receipts
│   ├── Delivery Orders
│   ├── Internal Transfers
│   ├── Inventory Adjustments
│   └── Move History
│
├── Settings
│   └── Warehouse
│
└── Profile
    ├── My Profile
    └── Logout
```

---

# 🔑 Authentication Flow

```text
User
 │
 ├── Sign Up
 │
 └── Login
       │
       ▼
   JWT Token
       │
       ▼
Inventory Dashboard
```

Password recovery uses an OTP-based reset flow.

---

# 🎨 Design Philosophy

StockSense uses an **Odoo-inspired ERP interface** while maintaining its own visual identity.

The design prioritizes:

* Information density
* Operational efficiency
* Clear data hierarchy
* Search and filtering
* Professional tables
* Action-oriented dashboards
* Clear status indicators
* Minimal unnecessary decoration
* Responsive layouts

The objective is to make inventory operations easy to **find, understand, and act on**.

---

# 🧪 Example Inventory Scenario

Consider a warehouse receiving 100 kg of steel.

### 1. Receive Goods

```text
Receipt:
Steel = +100 kg
```

### 2. Transfer Stock

```text
Main Store → Production Rack

Total Stock = unchanged
Location = updated
```

### 3. Deliver Goods

```text
Delivery:
Steel = -20 kg
```

### 4. Adjust Damaged Stock

```text
Damaged:
Steel = -3 kg
```

### 5. Intelligence Layer

StockSense analyzes the resulting ledger and can identify:

```text
Current inventory
Usage velocity
Potential depletion
Unusual movements
Replenishment requirements
```

---

# 📈 Future Improvements

Potential extensions include:

* Advanced demand forecasting
* Automated reorder recommendations
* Barcode / QR scanning
* Supplier management
* Purchase order integration
* Sales order integration
* Role-based permissions
* Advanced inventory analytics
* Automated notifications
* More sophisticated forecasting models
* Expanded AI-powered natural-language filtering

---

# 🛠️ Running the Project

## Prerequisites

Make sure you have installed:

* Node.js
* Python 3.x
* npm

---

## Frontend

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

---

## Backend

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a Python virtual environment:

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### macOS / Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

The API will be available through the configured local backend port.

---

# 📁 High-Level Project Structure

```text
StockSense/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── aiEngine.js
│   │   └── ...
│   └── ...
│
├── backend/
│   ├── ai_tools.py
│   ├── ...
│   └── stocksense.db
│
├── README.md
└── ...
```

> The exact directory structure may vary depending on the current implementation.

---

# 📊 Project Status

**Status: Hackathon Project 🚀**

StockSense is being developed for the **Odoo Hiring Hackathon**, with a focus on building a practical inventory-management platform enhanced by domain-specific intelligence.

---

# 👥 Team

Built for the **Odoo Hiring Hackathon**.

---

# 📄 License

This project was developed as a hackathon project.

Add an appropriate open-source license if the project is released publicly.

---# StockSense 📦

> **AI-powered Inventory Management System for smarter, faster stock operations.**

StockSense is a modular Inventory Management System built to digitize and streamline stock-related operations within a business.

It provides a centralized platform for managing **products, warehouses, receipts, deliveries, internal transfers, inventory adjustments, and stock movements**, while adding an intelligent analytics layer for **stockout forecasting, anomaly detection, natural-language inventory queries, and operational insights**.

Built for the **Odoo Hiring Hackathon**.

---

## 🚀 Overview

Traditional inventory management often relies on manual registers, spreadsheets, and disconnected tracking systems.

StockSense brings these workflows into one centralized system:

```text
Receive → Store → Transfer → Deliver → Adjust → Analyze
```

Every inventory movement is recorded in the stock ledger, while **StockSense Intelligence** analyzes operational data to identify risks and provide actionable insights.

---

## ✨ Key Features

### 📊 Inventory Dashboard

A centralized overview of inventory operations.

**Dashboard KPIs include:**

* Total Products in Stock
* Low Stock Items
* Out of Stock Items
* Pending Receipts
* Pending Deliveries
* Scheduled Internal Transfers

Dynamic filtering by:

* Document type
* Status
* Warehouse / location
* Product category

---

### 📦 Product Management

Create and manage products with:

* Product Name
* SKU / Product Code
* Category
* Unit of Measure
* Initial Stock
* Stock availability by location
* Reordering rules

---

### 📥 Receipts

Manage incoming goods from suppliers.

**Workflow:**

```text
Create Receipt
      ↓
Add Supplier & Products
      ↓
Enter Received Quantity
      ↓
Validate
      ↓
Stock Increases
      ↓
Movement Logged
```

---

### 📤 Delivery Orders

Manage outgoing stock and customer shipments.

**Workflow:**

```text
Create Delivery
      ↓
Pick Items
      ↓
Pack
      ↓
Validate
      ↓
Stock Decreases
      ↓
Movement Logged
```

---

### 🔄 Internal Transfers

Move stock between warehouses, locations, or storage areas.

Examples:

```text
Main Warehouse → Production Floor

Rack A → Rack B

Warehouse 1 → Warehouse 2
```

Internal transfers change the stock location while preserving the overall inventory quantity.

Every movement is recorded in the ledger.

---

### 🧮 Inventory Adjustments

Reconcile recorded inventory with physical stock counts.

**Workflow:**

```text
Select Product / Location
          ↓
Enter Physical Count
          ↓
Calculate Difference
          ↓
Update Stock
          ↓
Record Adjustment
```

---

### 📜 Stock Movement History

Maintain a traceable history of inventory operations, including:

* Receipts
* Deliveries
* Internal transfers
* Inventory adjustments

This provides visibility into how and why stock levels change.

---

### 🚨 Low Stock Monitoring

Identify products that fall below configured reorder levels and surface them directly through the dashboard and intelligence layer.

---

### 🏢 Multi-Warehouse Support

Track inventory across multiple:

* Warehouses
* Locations
* Storage areas

---

### 🔎 Search & Smart Filtering

Quickly find inventory records using:

* SKU
* Product name
* Category
* Warehouse
* Location
* Document type
* Status

---

# 🧠 StockSense Intelligence

StockSense goes beyond traditional inventory tracking with a dedicated **AI & analytics layer** designed specifically around inventory operations.

Instead of adding a generic chatbot, StockSense Intelligence analyzes actual inventory data to help users understand **what is happening, what is unusual, and what may require attention.**

---

## 💬 Natural-Language Inventory Queries

Users can query inventory using natural language.

Examples:

> "Which products are at risk of running out?"

> "Why is Steel Rods stock low?"

> "Which products had the biggest stock decrease this week?"

> "What receipts are still pending?"

> "Show me recent movements for Steel Rods."

The system extracts the user's intent and retrieves relevant inventory information.

---

## 📉 Stockout & Depletion Forecasting

StockSense analyzes recent inventory movement to estimate potential stock depletion.

The intelligence layer uses a **7-day moving window** to calculate run-rate and burn-rate patterns.

Example:

```text
Steel Rods

Current Stock:       18 units
Reorder Level:       25 units
Recent Usage:        32 units / week

⚠ Potential Stockout Risk

Estimated depletion:
~4 days based on recent usage
```

Forecasts are presented as estimates based on observed inventory behavior.

---

## 🚨 Anomaly & Spike Detection

StockSense identifies unusual changes in stock movement.

Example:

```text
⚠ Unusual Stock Movement

Steel Rods decreased by 42 units
on September 25.

This movement is significantly
higher than recent transaction activity.
```

This helps inventory managers investigate unexpected stock changes.

---

## 📦 Bottleneck Identification

The intelligence layer analyzes pending operational activity to identify potential bottlenecks.

Examples include:

* Large numbers of pending receipts
* Pending deliveries
* Delayed internal transfers
* Products waiting for replenishment

This allows users to focus attention on operations that may require action.

---

## 🧠 AI Dashboard Insights

StockSense Intelligence is integrated directly into the existing dashboard.

Example:

```text
┌─────────────────────────────────────────────────────────┐
│ 🧠 StockSense Intelligence                              │
│                                                         │
│ Here's what needs your attention                       │
│                                                         │
│ 🔴 3 products at critical stock levels                 │
│ 🟡 7 products approaching reorder level                 │
│ ⚠️ 2 unusual stock movements                           │
│ 📦 12 pending operations                                │
│                                                         │
│ Ask StockSense...                              [ Ask ]  │
└─────────────────────────────────────────────────────────┘
```

AI insights are designed to complement the existing inventory workflows rather than replace them.

---

# 🏗️ Technology Stack

## Frontend

| Technology          | Purpose                                       |
| ------------------- | --------------------------------------------- |
| **React 18**        | Single Page Application                       |
| **Vite 6**          | Build tool and development server             |
| **React Router v6** | Client-side routing and URL state             |
| **Lucide React**    | SVG icon system                               |
| **Vanilla CSS**     | Styling, design tokens and responsive layouts |
| **Space Grotesk**   | Display typography                            |
| **DM Sans**         | Interface typography                          |

The frontend uses a custom CSS design system with responsive grid layouts and reusable UI patterns.

---

## Backend

| Technology         | Purpose                                     |
| ------------------ | ------------------------------------------- |
| **FastAPI**        | Python REST API framework                   |
| **Uvicorn**        | ASGI server                                 |
| **Pydantic v2**    | Data validation and schemas                 |
| **CORSMiddleware** | Frontend/backend cross-origin communication |

---

## Database

| Technology         | Purpose                        |
| ------------------ | ------------------------------ |
| **SQLite**         | Serverless relational database |
| **SQLAlchemy 2.0** | ORM and database abstraction   |

The database stores core inventory entities such as:

* Users
* Products
* Warehouses
* Locations
* Receipts
* Deliveries
* Moves

Database file:

```text
stocksense.db
```

---

# 🤖 StockSense Intelligence Architecture

The intelligence layer combines deterministic inventory analytics with natural-language reasoning.

```text
┌──────────────────────────────────────────────────────────┐
│                    React 18 + Vite                       │
│                                                          │
│ Dashboard │ Products │ Stock │ Operations │ AI UI       │
└─────────────────────────┬────────────────────────────────┘
                          │
                    REST API / State
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│                     FastAPI                              │
│                                                          │
│  ┌─────────────────────┐   ┌──────────────────────────┐ │
│  │   Core REST APIs    │   │ StockSense Intelligence  │ │
│  │                     │   │                          │ │
│  │ Products            │   │ Query & Intent           │ │
│  │ Receipts            │   │ Run-rate Analysis        │ │
│  │ Deliveries          │   │ Burn-rate Analysis       │ │
│  │ Transfers           │   │ Stockout Forecasting     │ │
│  │ Adjustments         │   │ Anomaly Detection        │ │
│  │ Stock Movements     │   │ Bottleneck Detection     │ │
│  └──────────┬──────────┘   └────────────┬─────────────┘ │
│             │                           │               │
│             └─────────────┬─────────────┘               │
│                           ▼                             │
│                 SQLAlchemy 2.0 ORM                      │
└───────────────────────────┬──────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ SQLite        │
                    │ stocksense.db │
                    └───────────────┘
```

---

# 🧠 Intelligence Engine

The core intelligence functionality is implemented through:

```text
backend/ai_tools.py
src/aiEngine.js
```

The intelligence layer handles:

### Natural Language

* Query parsing
* Intent extraction

### Inventory Analytics

* 7-day moving-window analysis
* Run-rate calculations
* Burn-rate calculations
* Stockout/depletion forecasting

### Operational Intelligence

* Transaction anomaly detection
* Spike detection
* Pending-operation bottleneck identification

---

# 🔐 Authentication & Security

StockSense uses:

### JWT Authentication

JSON Web Tokens are used for authenticated API access.

### Password Security

Passwords are protected using:

**bcrypt**

with salted password hashing.

### Token Scheme

Authenticated requests use:

```text
Authorization: Bearer <token>
```

### CORS

FastAPI's `CORSMiddleware` enables secure communication between the decoupled frontend and backend.

---

# 🔄 Inventory Lifecycle

StockSense models the complete inventory lifecycle:

```text
                         ┌──────────────┐
                         │    Vendor    │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │   Receipt    │
                         └──────┬───────┘
                                │
                             Stock +
                                │
                                ▼
                    ┌──────────────────────┐
                    │      Warehouse       │
                    └──────────┬───────────┘
                               │
                       Internal Transfer
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Storage / Location  │
                    └──────────┬───────────┘
                               │
                            Delivery
                               │
                               ▼
                         ┌──────────────┐
                         │   Customer   │
                         └──────────────┘

          Physical Count
                │
                ▼
      Inventory Adjustment
                │
                ▼
          Stock Ledger
                │
                ▼
      StockSense Intelligence
```

---

# 🧭 Application Structure

```text
StockSense
│
├── Dashboard
│   └── StockSense Intelligence
│
├── Products
│   ├── Product Management
│   ├── Categories
│   └── Reordering Rules
│
├── Operations
│   ├── Receipts
│   ├── Delivery Orders
│   ├── Internal Transfers
│   ├── Inventory Adjustments
│   └── Move History
│
├── Settings
│   └── Warehouse
│
└── Profile
    ├── My Profile
    └── Logout
```

---

# 🔑 Authentication Flow

```text
User
 │
 ├── Sign Up
 │
 └── Login
       │
       ▼
   JWT Token
       │
       ▼
Inventory Dashboard
```

Password recovery uses an OTP-based reset flow.

---

# 🎨 Design Philosophy

StockSense uses an **Odoo-inspired ERP interface** while maintaining its own visual identity.

The design prioritizes:

* Information density
* Operational efficiency
* Clear data hierarchy
* Search and filtering
* Professional tables
* Action-oriented dashboards
* Clear status indicators
* Minimal unnecessary decoration
* Responsive layouts

The objective is to make inventory operations easy to **find, understand, and act on**.

---

# 🧪 Example Inventory Scenario

Consider a warehouse receiving 100 kg of steel.

### 1. Receive Goods

```text
Receipt:
Steel = +100 kg
```

### 2. Transfer Stock

```text
Main Store → Production Rack

Total Stock = unchanged
Location = updated
```

### 3. Deliver Goods

```text
Delivery:
Steel = -20 kg
```

### 4. Adjust Damaged Stock

```text
Damaged:
Steel = -3 kg
```

### 5. Intelligence Layer

StockSense analyzes the resulting ledger and can identify:

```text
Current inventory
Usage velocity
Potential depletion
Unusual movements
Replenishment requirements
```

---

# 📈 Future Improvements

Potential extensions include:

* Advanced demand forecasting
* Automated reorder recommendations
* Barcode / QR scanning
* Supplier management
* Purchase order integration
* Sales order integration
* Role-based permissions
* Advanced inventory analytics
* Automated notifications
* More sophisticated forecasting models
* Expanded AI-powered natural-language filtering

---

# 🛠️ Running the Project

## Prerequisites

Make sure you have installed:

* Node.js
* Python 3.x
* npm

---

## Frontend

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

---

## Backend

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a Python virtual environment:

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### macOS / Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

The API will be available through the configured local backend port.

---

# 📁 High-Level Project Structure

```text
StockSense/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── aiEngine.js
│   │   └── ...
│   └── ...
│
├── backend/
│   ├── ai_tools.py
│   ├── ...
│   └── stocksense.db
│
├── README.md
└── ...
```

> The exact directory structure may vary depending on the current implementation.

---

# 📊 Project Status

**Status: Hackathon Project 🚀**

StockSense is being developed for the **Odoo Hiring Hackathon**, with a focus on building a practical inventory-management platform enhanced by domain-specific intelligence.

---

# 👥 Team

Built for the **Odoo Hiring Hackathon**.

---

# 📄 License

This project was developed as a hackathon project.

Add an appropriate open-source license if the project is released publicly.

---

## StockSense

**Centralized inventory. Intelligent insights. Smarter stock operations.**


## StockSense

**Centralized inventory. Intelligent insights. Smarter stock operations.**

    └── Logout
```

---

# 🔑 Authentication Flow

```text
User
 │
 ├── Sign Up
 │
 └── Login
       │
       ▼
   JWT Token
       │
       ▼
Inventory Dashboard
```

Password recovery uses an OTP-based reset flow.

---

# 🎨 Design Philosophy

StockSense uses an **Odoo-inspired ERP interface** while maintaining its own visual identity.

The design prioritizes:

* Information density
* Operational efficiency
* Clear data hierarchy
* Search and filtering
* Professional tables
* Action-oriented dashboards
* Clear status indicators
* Minimal unnecessary decoration
* Responsive layouts

The objective is to make inventory operations easy to **find, understand, and act on**.

---

# 🧪 Example Inventory Scenario

Consider a warehouse receiving 100 kg of steel.

### 1. Receive Goods

```text
Receipt:
Steel = +100 kg
```

### 2. Transfer Stock

```text
Main Store → Production Rack

Total Stock = unchanged
Location = updated
```

### 3. Deliver Goods

```text
Delivery:
Steel = -20 kg
```

### 4. Adjust Damaged Stock

```text
Damaged:
Steel = -3 kg
```

### 5. Intelligence Layer

StockSense analyzes the resulting ledger and can identify:

```text
Current inventory
Usage velocity
Potential depletion
Unusual movements
Replenishment requirements
```

---

# 📈 Future Improvements

Potential extensions include:

* Advanced demand forecasting
* Automated reorder recommendations
* Barcode / QR scanning
* Supplier management
* Purchase order integration
* Sales order integration
* Role-based permissions
* Advanced inventory analytics
* Automated notifications
* More sophisticated forecasting models
* Expanded AI-powered natural-language filtering

---

# 🛠️ Running the Project

## Prerequisites

Make sure you have installed:

* Node.js
* Python 3.x
* npm

---

## Frontend

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

---

## Backend

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a Python virtual environment:

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### macOS / Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

The API will be available through the configured local backend port.

---

# 📁 High-Level Project Structure

```text
StockSense/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── aiEngine.js
│   │   └── ...
│   └── ...
│
├── backend/
│   ├── ai_tools.py
│   ├── ...
│   └── stocksense.db
│
├── README.md
└── ...
```

> The exact directory structure may vary depending on the current implementation.

---

# 📊 Project Status

**Status: Hackathon Project 🚀**

StockSense is being developed for the **Odoo Hiring Hackathon**, with a focus on building a practical inventory-management platform enhanced by domain-specific intelligence.

---

# 👥 Team

Built for the **Odoo x LPU Jalandhar Hackathon**

---



## StockSense

**Centralized inventory. Intelligent insights. Smarter stock operations.**
