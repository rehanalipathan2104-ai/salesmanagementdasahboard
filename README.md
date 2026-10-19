# Sales Dashboard Using Data Visualization

> **An Executive-Ready, Interactive Sales Analytics & Decision Intelligence Platform**  
> Built with Python (Pandas, NumPy, SQLite, Flask) and Modern Frontend Data Visualizations (Plotly.js, Leaflet.js, Glassmorphism CSS).

---

## 🌟 Project Overview

**Sales Dashboard Using Data Visualization** is a comprehensive, production-grade web application designed for business executives and data science teams to monitor performance, analyze monthly trends, detect anomalies, compare product and regional metrics, and make data-driven operational decisions.

The application follows an end-to-end data science lifecycle:
1. **Data Ingestion**: Standardized CSV/Excel import and SQLite database persistence.
2. **Data Cleaning & Preprocessing**: Automated handling of missing values, invalid dates, duplicate order IDs, negative profit anomalies, and location standardization.
3. **Exploratory Data Analysis & Analytics Aggregation**: Real-time KPI calculations with period-over-period growth comparisons.
4. **Interactive Visualization**: Plotly charts, Leaflet geographic maps with drill-down, and a paginated data table.
5. **AI Sales Analyst**: Context-aware natural language assistant answering complex business questions with metric highlights and strategic recommendations.
6. **Collaboration & Sharing**: Snapshot permalink generator, filtered CSV export, and file sharing.

---

## 🚀 Key Features

### 1. KPI Executive Cards
- **Total Sales**: Real-time gross revenue calculation with period-over-period growth %.
- **Total Profit**: Cumulative net profit with growth comparison.
- **Total Orders**: Count of transactions in the active filter slice.
- **Active Customers**: Reach across 20 metro markets and 4 geographic regions.
- **Total Quantity Sold**: Total units fulfilled with growth indicator.
- **Average Profit Margin**: Calculated as `(Total Profit / Total Sales) × 100`, with health badges (`Healthy >25%`, `Moderate 15-25%`, `Low Margin <15%`).

### 2. Multi-Dimensional Interactive Filters
- **Date Presets**: One-click filters for **All Time**, **2024**, **2023**, **Q1 2024**, **Q2 2024**, and **Last 90 Days**.
- **Date Range Picker**: Custom Start Date and End Date calendar selectors.
- **Category Filter**: Multi-category selector (Electronics, Furniture, Appliances, Clothing, Beauty).
- **Product Selector**: Filter by specific product in catalog.
- **Customer Location & Region**: Filter by metropolitan city or macro-region (Midwest, West, South, Northeast).
- **Min Sales Amount Slider**: Real-time slider filtering transactions by order value.
- **Min Profit Margin % Slider**: Slider filtering transactions by minimum profit margin percentage.
- **Live Search**: Instant multi-field search across Order ID, Product Name, and Customer Location.
- **Active Chips Ribbon & Reset**: Visual pills showing active filters with single-click removal and a global "Reset Filters" action.

### 3. Rich Visualizations
- **Monthly Sales & Profit Trend (Combo / Line Chart)**:
  - Interactive Plotly chart with smooth splines and markers.
  - Metric switcher: **Sales & Profit**, **Sales Only**, **Profit Only**, **Orders**.
  - Currency formatting and hover tooltips.
- **Category Share (Donut Chart)**:
  - Percentage contribution of each product category to total sales.
- **Sales & Profit by Category (Grouped Bar Chart)**:
  - Side-by-side comparison of revenue and net profit per category.
- **Geographic Sales & Drill-Down (Leaflet Map)**:
  - Interactive map with CartoDB dark/light tile layers.
  - City bubble markers dynamically sized by Sales and colored by Profit Margin.
  - Click on any city bubble or region pill to drill down and filter the entire dashboard.
- **Top Products Leaderboard**:
  - Horizontal bar chart ranked by **Revenue**, **Profit**, **Quantity Sold**, or **Profit Margin**.
  - Toggle between **Top 5**, **Top 10**, **Top 20**, and **All**.

### 4. Automated Business Insights & Anomaly Detection
Dynamic data science heuristic engine detecting:
- **Best-Selling Product**: Highest revenue generator.
- **Most Profitable Product**: Highest net profit contributor.
- **Category Dominance**: Market share percentage leader.
- **Margin Alert**: Identifies categories with lowest profit margins for pricing optimization.
- **Top Geographic Market**: Peak regional revenue hub.
- **Peak Sales Period**: Highest historical sales month.
- **Anomalous Loss Detected**: Flags orders with negative profit margins.

### 5. AI Sales Analyst Assistant
- Accessible via the **AI Analyst** button in the navigation bar.
- Pre-built suggested prompts:
  - *"Give me an executive summary"*
  - *"What is our best product?"*
  - *"Which category has highest margin?"*
  - *"Show me anomalies or negative profit items"*
  - *"Forecast sales trend for next month"*
  - *"How are sales in the West region?"*
- Answers custom free-form queries, breaking down data into key metric boxes and providing strategic business recommendations.

### 6. Interactive Data Table
- Displays all required columns: `Order ID`, `Product Name`, `Category`, `Sales Amount`, `Profit`, `Profit Margin`, `Quantity Sold`, `Order Date`, `Customer Location`.
- Multi-column sortable headers (ascending / descending).
- Server-side pagination (10, 25, 50 rows per page).
- Color-coded badges for categories and green/red indicators for profit.
- **Export Filtered CSV**: Download currently active filtered records with a single click.

### 7. File Upload & Snapshot Sharing
- **Upload CSV / Excel**: Drag-and-drop file uploader that validates required schema columns, runs the cleaning pipeline, and updates the SQLite database.
- **Share Snapshot**: Generates a shareable permalink (`/?share=<id>`) encoding active filters and notes so colleagues can view the exact same data slice.
- **Print / PDF**: Clean executive print layout support.
- **Add Order**: Modal form to record new transactions directly into SQLite with instant dashboard recalculation.

---

## 📁 Dataset Schema

The application includes a realistic sample dataset of 500 records in `data/sample_sales_data.csv` spanning 2023 to 2024 with the exact required schema:

| Column Name | Type | Description |
|---|---|---|
| `Order ID` | Integer | Unique identifier for each transaction |
| `Product Name` | String | Name of product (e.g. Wireless Mouse, Office Chair) |
| `Category` | String | Electronics, Furniture, Appliances, Clothing, Beauty |
| `Sales Amount` | Float | Gross order amount in USD |
| `Profit` | Float | Net profit in USD |
| `Quantity Sold` | Integer | Number of units purchased |
| `Order Date` | String (YYYY-MM-DD) | Date transaction took place |
| `Customer Location` | String | City name (e.g. Chicago, Austin, Seattle, New York) |

---

## 🛠️ Data Cleaning & Preprocessing Pipeline

The pipeline in [data_pipeline.py](file:///d:/Projects/Kunal/data_pipeline.py) enforces data integrity:
1. **Column Normalization**: Case-insensitive and synonym mapping for flexible column naming.
2. **Deduplication**: Drops duplicate `Order ID` records.
3. **Data Type Coercion**: Converts numeric columns (`Sales Amount`, `Profit`, `Quantity Sold`) with fallback defaults.
4. **Anomalies Handling**: Handles zero or negative sales values.
5. **Date Validation**: Standardizes dates to `YYYY-MM-DD`, fixing corrupt date entries.
6. **Location Standardization**: Maps abbreviations (`nyc`, `la`, `chi`, `sf`) to canonical city names.
7. **Geographic Enrichment**: Automatically enriches records with Region (Midwest, West, South, Northeast), State, Latitude, and Longitude for map coordinates.

---

## 💻 Tech Stack

- **Backend**: Python 3, Flask, SQLite3, Pandas, NumPy
- **Frontend**: HTML5, Vanilla CSS (Custom Design System with Dark/Light Mode), JavaScript (ES6 Modules)
- **Visualizations**: Plotly.js (Charts), Leaflet.js (Interactive Geographic Maps)
- **Icons**: Lucide Icons
- **Typography**: Google Fonts (Plus Jakarta Sans, JetBrains Mono)

---

## 📦 Project Structure

```
d:\Projects\Kunal\
├── app.py                     # Flask REST API server & web application entry point
├── data_pipeline.py           # Data science cleaning, SQLite DB, KPIs, AI assistant logic
├── generate_dataset.py        # Reproducible 500-record dataset generator script
├── requirements.txt           # Python dependency specifications
├── README.md                  # Complete project documentation
├── data/
│   ├── sample_sales_data.csv  # 500 rows sample sales dataset
│   └── sales.db               # SQLite database with indexed tables
├── templates/
│   └── index.html             # Single-page executive dashboard HTML template
└── static/
    ├── css/
    │   └── dashboard.css      # Design system, glassmorphism, responsive styles
    └── js/
        ├── api.js             # Async REST API client wrapper
        ├── charts.js          # Plotly & Leaflet visualization rendering engine
        ├── table.js           # Interactive data table (sorting, pagination)
        └── app.js             # Main orchestrator (filters, state, modals, AI)
```

---

## ⚡ Installation & How to Run

### Step 1: Install Dependencies
Ensure Python 3.9+ is installed, then run:
```bash
pip install -r requirements.txt
```

### Step 2: (Optional) Re-generate Sample Data
```bash
python generate_dataset.py
```

### Step 3: Start the Application Server
```bash
python app.py
```

### Step 4: Access the Dashboard
Open your web browser and navigate to:
```
http://127.0.0.1:5000/
```

---

## 📡 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `GET /api/health` | GET | System health & total record count |
| `GET /api/filter-options` | GET | Available categories, products, locations, regions, and date boundaries |
| `POST /api/analytics` | POST | Primary analytics engine (KPIs, trends, category share, top products, map data, insights) |
| `POST /api/table` | POST | Paginated, sorted transaction records |
| `GET /api/export-csv` | GET | Stream and download filtered records as CSV |
| `POST /api/upload` | POST | Upload and ingest custom CSV or Excel dataset |
| `POST /api/reset-data` | POST | Restore database to default 500 sample records |
| `POST /api/orders/add` | POST | Record a new order directly into SQLite |
| `POST /api/ai/ask` | POST | Natural language query endpoint for AI Sales Analyst |
| `POST /api/share/save` | POST | Save filter snapshot and generate permalink |
| `GET /api/share/<share_id>` | GET | Retrieve saved snapshot configuration |

---

## 🏆 Data Science Mini-Project Evaluation Highlights

- **Clean UI & Responsive Aesthetics**: Curated color palette, dark/light theme switcher, fluid mobile/desktop layouts.
- **Reproducible Logic**: Seeded dataset generator with clean formulas and modular separation of concerns.
- **Mathematical Integrity**: 
  - $\text{Profit Margin} = \left(\frac{\text{Total Profit}}{\text{Total Sales}}\right) \times 100$
  - Period-over-period growth comparisons calculated against preceding equivalent time windows.
- **Extensible AI Capabilities**: Heuristic NLP engine providing instant answers to executive questions.
