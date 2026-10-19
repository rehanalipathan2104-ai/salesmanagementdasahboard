"""
app.py
Flask Application & RESTful API for "Sales Dashboard Using Data Visualization"
Integrates Python Data Science Pipeline, SQLite Database, AI Assistant,
CSV Export, File Upload/Share, and Interactive Web Dashboard.
"""

import os
import io
import json
import uuid
import pandas as pd
from flask import Flask, request, jsonify, render_template, send_file, make_response
from flask_cors import CORS

import data_pipeline

app = Flask(__name__)
CORS(app)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB max upload

# Ensure database is initialized and seeded on boot
data_pipeline.init_database()
conn = data_pipeline.get_db_connection()
cursor = conn.cursor()
cursor.execute("SELECT COUNT(*) as cnt FROM sales_orders")
count = cursor.fetchone()["cnt"]
conn.close()

if count == 0:
    print("Database empty. Seeding with sample sales data...")
    data_pipeline.seed_database_from_csv()
    print("Seeding complete.")

@app.route("/")
def index():
    """Renders the single-page dashboard."""
    return render_template("index.html")

@app.route("/api/health", methods=["GET"])
def health_check():
    """Returns system status and database records count."""
    conn = data_pipeline.get_db_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as total FROM sales_orders")
    total = c.fetchone()["total"]
    conn.close()
    return jsonify({
        "status": "healthy",
        "database": "sqlite",
        "total_records": total
    })

@app.route("/api/filter-options", methods=["GET"])
def get_filter_options():
    """Returns available categories, locations, regions, and date boundaries."""
    conn = data_pipeline.get_db_connection()
    categories = [r[0] for r in conn.execute("SELECT DISTINCT category FROM sales_orders ORDER BY category").fetchall()]
    locations = [r[0] for r in conn.execute("SELECT DISTINCT customer_location FROM sales_orders ORDER BY customer_location").fetchall()]
    regions = [r[0] for r in conn.execute("SELECT DISTINCT region FROM sales_orders WHERE region IS NOT NULL ORDER BY region").fetchall()]
    products = [r[0] for r in conn.execute("SELECT DISTINCT product_name FROM sales_orders ORDER BY product_name").fetchall()]
    dates = conn.execute("SELECT MIN(order_date) as min_date, MAX(order_date) as max_date, MIN(sales_amount) as min_sales, MAX(sales_amount) as max_sales FROM sales_orders").fetchone()
    conn.close()

    return jsonify({
        "categories": ["All"] + categories,
        "locations": ["All"] + locations,
        "regions": ["All"] + regions,
        "products": ["All"] + products,
        "min_date": dates["min_date"] or "2023-01-01",
        "max_date": dates["max_date"] or "2024-12-31",
        "min_sales": float(dates["min_sales"] or 0),
        "max_sales": float(dates["max_sales"] or 2000)
    })

@app.route("/api/analytics", methods=["POST"])
def get_analytics():
    """
    Main analytics endpoint. Receives filter criteria and computes:
    - Overall KPIs & growth comparison
    - Monthly sales & profit trends
    - Category distribution & margins
    - Top products ranking
    - Region & geographic city coordinates
    - Dynamic automated insights & anomaly detection
    """
    payload = request.get_json(silent=True) or {}
    filters = payload.get("filters", {})
    top_limit = int(payload.get("top_limit", 10))
    sort_products_by = payload.get("sort_products_by", "sales")

    df = data_pipeline.fetch_filtered_data(filters)

    # Calculate previous period data for comparison if start_date & end_date are set
    prev_df = None
    if filters.get("start_date") and filters.get("end_date"):
        try:
            cur_start = pd.to_datetime(filters["start_date"])
            cur_end = pd.to_datetime(filters["end_date"])
            duration_days = (cur_end - cur_start).days
            prev_start = (cur_start - pd.Timedelta(days=duration_days + 1)).strftime("%Y-%m-%d")
            prev_end = (cur_start - pd.Timedelta(days=1)).strftime("%Y-%m-%d")

            prev_filters = dict(filters)
            prev_filters["start_date"] = prev_start
            prev_filters["end_date"] = prev_end
            prev_df = data_pipeline.fetch_filtered_data(prev_filters)
        except Exception:
            prev_df = None

    kpis = data_pipeline.calculate_kpis(df, prev_df)
    monthly_trend = data_pipeline.get_monthly_trend(df)
    category_analysis = data_pipeline.get_category_analysis(df)
    top_products = data_pipeline.get_top_products(df, limit=top_limit, sort_by=sort_products_by)
    region_analysis = data_pipeline.get_region_analysis(df)
    insights = data_pipeline.generate_automated_insights(df)

    return jsonify({
        "total_records": len(df),
        "kpis": kpis,
        "monthly_trend": monthly_trend,
        "category_analysis": category_analysis,
        "top_products": top_products,
        "region_analysis": region_analysis,
        "insights": insights
    })

@app.route("/api/table", methods=["POST"])
def get_table_data():
    """
    Returns paginated, sorted records for the interactive data table.
    """
    payload = request.get_json(silent=True) or {}
    filters = payload.get("filters", {})
    page = max(1, int(payload.get("page", 1)))
    page_size = max(5, min(100, int(payload.get("page_size", 10))))
    sort_col = payload.get("sort_col", "Order ID")
    sort_dir = payload.get("sort_dir", "desc")

    df = data_pipeline.fetch_filtered_data(filters)
    total_records = len(df)

    if total_records == 0:
        return jsonify({
            "records": [],
            "total_records": 0,
            "page": page,
            "page_size": page_size,
            "total_pages": 0
        })

    # Sort DataFrame
    col_mapping = {
        "Order ID": "Order ID",
        "Product Name": "Product Name",
        "Category": "Category",
        "Sales Amount": "Sales Amount",
        "Profit": "Profit",
        "Quantity Sold": "Quantity Sold",
        "Order Date": "Order Date",
        "Customer Location": "Customer Location"
    }
    actual_col = col_mapping.get(sort_col, "Order ID")
    ascending = (sort_dir.lower() == "asc")
    df = df.sort_values(by=actual_col, ascending=ascending)

    # Slice for pagination
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paged_df = df.iloc[start_idx:end_idx]

    records = []
    for _, r in paged_df.iterrows():
        sales = float(r["Sales Amount"])
        profit = float(r["Profit"])
        margin = round((profit / sales * 100) if sales > 0 else 0.0, 1)
        records.append({
            "order_id": int(r["Order ID"]),
            "product_name": str(r["Product Name"]),
            "category": str(r["Category"]),
            "sales_amount": round(sales, 2),
            "profit": round(profit, 2),
            "profit_margin": margin,
            "quantity_sold": int(r["Quantity Sold"]),
            "order_date": str(r["Order Date"]),
            "customer_location": str(r["Customer Location"]),
            "region": str(r.get("region", "US"))
        })

    total_pages = (total_records + page_size - 1) // page_size

    return jsonify({
        "records": records,
        "total_records": total_records,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    })

@app.route("/api/export-csv", methods=["GET", "POST"])
def export_csv():
    """Generates and streams a CSV of currently filtered dataset."""
    if request.method == "POST":
        payload = request.get_json(silent=True) or {}
        filters = payload.get("filters", {})
    else:
        filters = {}
        for key in ["start_date", "end_date", "category", "product", "location", "region", "min_sales", "min_profit_margin", "search"]:
            if request.args.get(key):
                filters[key] = request.args.get(key)

    df = data_pipeline.fetch_filtered_data(filters)
    
    # Select and rename to standard columns
    export_df = df[[
        "Order ID", "Product Name", "Category",
        "Sales Amount", "Profit", "Quantity Sold",
        "Order Date", "Customer Location"
    ]].copy()

    csv_buffer = io.StringIO()
    export_df.to_csv(csv_buffer, index=False)
    csv_output = csv_buffer.getvalue()

    response = make_response(csv_output)
    response.headers["Content-Disposition"] = "attachment; filename=filtered_sales_data.csv"
    response.headers["Content-type"] = "text/csv"
    return response

@app.route("/api/upload", methods=["POST"])
def upload_file():
    """
    Accepts CSV or Excel file upload, executes cleaning/preprocessing,
    and updates SQLite database.
    """
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"success": False, "error": "Empty filename"}), 400

    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(file)
        elif file.filename.endswith((".xls", ".xlsx")):
            df = pd.read_excel(file)
        else:
            return jsonify({"success": False, "error": "Unsupported file format. Please upload CSV or Excel."}), 400

        # Run pipeline cleaning
        clean_df = data_pipeline.clean_and_preprocess(df)

        # Ingest into SQLite
        conn = data_pipeline.get_db_connection()
        cursor = conn.cursor()
        
        # Save old count
        cursor.execute("SELECT COUNT(*) as cnt FROM sales_orders")
        old_count = cursor.fetchone()["cnt"]

        # Option: replace or append (default: replace with new dataset)
        replace = request.form.get("mode", "replace") == "replace"
        if replace:
            cursor.execute("DELETE FROM sales_orders")

        insert_sql = """
            INSERT INTO sales_orders (
                order_id, product_name, category, sales_amount, profit,
                quantity_sold, order_date, customer_location, region, state, lat, lon
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        rows = []
        for _, row in clean_df.iterrows():
            rows.append((
                int(row["Order ID"]),
                str(row["Product Name"]),
                str(row["Category"]),
                float(row["Sales Amount"]),
                float(row["Profit"]),
                int(row["Quantity Sold"]),
                str(row["Order Date"]),
                str(row["Customer Location"]),
                str(row["region"]),
                str(row["state"]),
                float(row["lat"]),
                float(row["lon"])
            ))

        cursor.executemany(insert_sql, rows)
        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": f"Successfully ingested {len(rows)} records from '{file.filename}'.",
            "records_count": len(rows),
            "filename": file.filename
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route("/api/reset-data", methods=["POST"])
def reset_default_data():
    """Resets database back to default sample sales records."""
    try:
        count = data_pipeline.seed_database_from_csv()
        return jsonify({
            "success": True,
            "message": f"Database restored to {count} sample sales records.",
            "total_records": count
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/orders/add", methods=["POST"])
def add_order():
    """Allows creating a new transaction record manually."""
    payload = request.get_json(silent=True) or {}
    try:
        conn = data_pipeline.get_db_connection()
        cursor = conn.cursor()

        # Generate unique order ID if not provided
        cursor.execute("SELECT MAX(order_id) as max_id FROM sales_orders")
        max_id = cursor.fetchone()["max_id"] or 1000
        new_order_id = int(payload.get("order_id", max_id + 1))

        product_name = str(payload.get("product_name", "Wireless Mouse"))
        category = str(payload.get("category", "Electronics"))
        sales_amount = float(payload.get("sales_amount", 50.0))
        profit = float(payload.get("profit", 15.0))
        quantity_sold = int(payload.get("quantity_sold", 1))
        order_date = str(payload.get("order_date", "2024-05-01"))
        customer_location = str(payload.get("customer_location", "Chicago"))

        geo = data_pipeline.CITY_GEO.get(customer_location, {"region": "Midwest", "state": "IL", "lat": 41.8781, "lon": -87.6298})

        cursor.execute("""
            INSERT INTO sales_orders (
                order_id, product_name, category, sales_amount, profit,
                quantity_sold, order_date, customer_location, region, state, lat, lon
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            new_order_id, product_name, category, sales_amount, profit,
            quantity_sold, order_date, customer_location,
            geo["region"], geo["state"], geo["lat"], geo["lon"]
        ))
        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": f"Order #{new_order_id} recorded successfully.",
            "order_id": new_order_id
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route("/api/ai/ask", methods=["POST"])
def ai_ask():
    """AI natural language query endpoint."""
    payload = request.get_json(silent=True) or {}
    query = payload.get("query", "").strip()
    filters = payload.get("filters", {})

    if not query:
        return jsonify({"answer": "Please ask a question about sales, categories, profit, or forecasts."})

    df = data_pipeline.fetch_filtered_data(filters)
    result = data_pipeline.answer_ai_query(query, df)
    return jsonify(result)

@app.route("/api/share/save", methods=["POST"])
def save_share_snapshot():
    """Saves active filter state and creates a shareable token."""
    payload = request.get_json(silent=True) or {}
    filters = payload.get("filters", {})
    title = payload.get("title", "Custom Sales View")
    notes = payload.get("notes", "")

    share_id = uuid.uuid4().hex[:10]
    conn = data_pipeline.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO shared_snapshots (share_id, title, created_at, filter_payload, notes)
        VALUES (?, ?, ?, ?, ?)
    """, (
        share_id,
        title,
        pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S"),
        json.dumps(filters),
        notes
    ))
    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "share_id": share_id,
        "share_url": f"/?share={share_id}",
        "title": title
    })

@app.route("/api/share/<share_id>", methods=["GET"])
def get_share_snapshot(share_id):
    """Retrieves a previously saved snapshot by share_id."""
    conn = data_pipeline.get_db_connection()
    row = conn.execute("SELECT * FROM shared_snapshots WHERE share_id = ?", (share_id,)).fetchone()
    conn.close()

    if not row:
        return jsonify({"success": False, "error": "Shared dashboard snapshot not found"}), 404

    return jsonify({
        "success": True,
        "share_id": row["share_id"],
        "title": row["title"],
        "created_at": row["created_at"],
        "filters": json.loads(row["filter_payload"]),
        "notes": row["notes"]
    })

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
