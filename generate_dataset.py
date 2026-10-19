"""
generate_dataset.py
Generates a realistic, structured sales dataset containing 450+ rows spanning 2023 to 2024.
Exact required columns:
- Order ID
- Product Name
- Category
- Sales Amount
- Profit
- Quantity Sold
- Order Date
- Customer Location
"""

import csv
import random
from datetime import datetime, timedelta

# Categories and their catalog of products with base price and profit margin range
CATALOG = {
    "Electronics": [
        ("Wireless Mouse", 25, 0.25, 0.45),
        ("Mechanical Keyboard", 85, 0.28, 0.40),
        ("Noise-Cancelling Headphones", 199, 0.30, 0.48),
        ("Smart Watch Series 5", 249, 0.22, 0.38),
        ("4K Ultra HD Monitor 27-inch", 320, 0.18, 0.32),
        ("USB-C Hub Multiport Adapter", 45, 0.35, 0.55),
        ("Bluetooth Portable Speaker", 60, 0.25, 0.42),
        ("External SSD 1TB", 110, 0.20, 0.35),
        ("Webcam 1080p Pro", 70, 0.30, 0.50),
        ("Gaming Mousepad XL", 20, 0.40, 0.60)
    ],
    "Furniture": [
        ("Office Chair Ergonomic", 180, 0.20, 0.35),
        ("Standing Desk Dual Motor", 420, 0.18, 0.30),
        ("Bookshelf 5-Tier Wood", 130, 0.22, 0.36),
        ("Modern Coffee Table", 150, 0.25, 0.40),
        ("Leather Recliner Armchair", 380, 0.15, 0.28),
        ("Filing Cabinet 3-Drawer", 95, 0.24, 0.38),
        ("Minimalist Bedside Table", 75, 0.28, 0.42),
        ("Monitor Riser Bamboo", 35, 0.35, 0.50)
    ],
    "Appliances": [
        ("Coffee Maker Programmable", 75, 0.25, 0.40),
        ("Air Fryer Digital 6-Quart", 110, 0.22, 0.35),
        ("Robotic Vacuum Cleaner", 260, 0.18, 0.30),
        ("Stainless Steel Microwave", 140, 0.20, 0.32),
        ("Electric Kettle Fast-Boil", 40, 0.30, 0.45),
        ("Blender Pro High-Speed", 90, 0.25, 0.38),
        ("Toaster 4-Slice Stainless", 50, 0.28, 0.42)
    ],
    "Clothing": [
        ("Classic Oxford Cotton Shirt", 55, 0.35, 0.55),
        ("Denim Slim Jeans", 65, 0.30, 0.50),
        ("Hooded Fleece Sweatshirt", 45, 0.35, 0.52),
        ("Waterproof Winter Jacket", 160, 0.25, 0.40),
        ("Athletic Running Shoes", 95, 0.28, 0.45),
        ("Casual Canvas Sneakers", 60, 0.32, 0.48),
        ("Wool Blend Overcoat", 190, 0.22, 0.38)
    ],
    "Beauty": [
        ("Hydrating Face Serum", 38, 0.45, 0.65),
        ("Vitamin C Day Cream", 32, 0.40, 0.60),
        ("Organic Herbal Shampoo", 22, 0.42, 0.58),
        ("Matte Long-Wear Lipstick", 24, 0.50, 0.70),
        ("Mineral Sunscreen SPF 50", 28, 0.40, 0.62),
        ("Exfoliating Body Scrub", 26, 0.45, 0.65),
        ("Ionic Hair Dryer Salon Pro", 120, 0.25, 0.40)
    ]
}

# Real US customer locations across multiple regions (City, State, Region, Lat, Lon)
LOCATIONS = [
    ("Chicago", "IL", "Midwest", 41.8781, -87.6298),
    ("Austin", "TX", "South", 30.2672, -97.7431),
    ("Seattle", "WA", "West", 47.6062, -122.3321),
    ("New York", "NY", "Northeast", 40.7128, -74.0060),
    ("Los Angeles", "CA", "West", 34.0522, -118.2437),
    ("San Francisco", "CA", "West", 37.7749, -122.4194),
    ("Dallas", "TX", "South", 32.7767, -96.7970),
    ("Atlanta", "GA", "South", 33.7490, -84.3880),
    ("Denver", "CO", "West", 39.7392, -104.9903),
    ("Boston", "MA", "Northeast", 42.3601, -71.0589),
    ("Miami", "FL", "South", 25.7617, -80.1918),
    ("Phoenix", "AZ", "West", 33.4484, -112.0740),
    ("Philadelphia", "PA", "Northeast", 39.9526, -75.1652),
    ("San Diego", "CA", "West", 32.7157, -117.1611),
    ("Minneapolis", "MN", "Midwest", 44.9778, -93.2650),
    ("Portland", "OR", "West", 45.5152, -122.6784),
    ("Nashville", "TN", "South", 36.1627, -86.7816),
    ("Detroit", "MI", "Midwest", 42.3314, -83.0458),
    ("Charlotte", "NC", "South", 35.2271, -80.8431),
    ("Salt Lake City", "UT", "West", 40.7608, -111.8910)
]

def generate_sales_data(num_records=480, output_path="sample_sales_data.csv"):
    random.seed(42)  # Reproducible seed
    start_date = datetime(2023, 1, 1)
    end_date = datetime(2024, 6, 30)
    delta_days = (end_date - start_date).days

    records = []
    
    # Pre-add the exact example records from the prompt:
    # 1001, Wireless Mouse, Electronics, 25, 7, 2, 2024-03-12, Chicago
    # 1002, Office Chair, Furniture, 180, 45, 1, 2024-03-13, Austin
    # 1003, Coffee Maker, Appliances, 75, 20, 1, 2024-03-14, Seattle
    records.append({
        "Order ID": 1001,
        "Product Name": "Wireless Mouse",
        "Category": "Electronics",
        "Sales Amount": 25.0,
        "Profit": 7.0,
        "Quantity Sold": 2,
        "Order Date": "2024-03-12",
        "Customer Location": "Chicago"
    })
    records.append({
        "Order ID": 1002,
        "Product Name": "Office Chair",
        "Category": "Furniture",
        "Sales Amount": 180.0,
        "Profit": 45.0,
        "Quantity Sold": 1,
        "Order Date": "2024-03-13",
        "Customer Location": "Austin"
    })
    records.append({
        "Order ID": 1003,
        "Product Name": "Coffee Maker",
        "Category": "Appliances",
        "Sales Amount": 75.0,
        "Profit": 20.0,
        "Quantity Sold": 1,
        "Order Date": "2024-03-14",
        "Customer Location": "Seattle"
    })

    current_order_id = 1004

    # Weights for seasonality and categories
    category_weights = {
        "Electronics": 0.32,
        "Furniture": 0.22,
        "Appliances": 0.18,
        "Clothing": 0.16,
        "Beauty": 0.12
    }
    categories = list(category_weights.keys())
    cat_probs = [category_weights[c] for c in categories]

    while len(records) < num_records:
        chosen_cat = random.choices(categories, weights=cat_probs, k=1)[0]
        prod_tuple = random.choice(CATALOG[chosen_cat])
        prod_name, unit_price, min_m, max_m = prod_tuple

        # Quantity sold usually 1 to 5, occasionally bulk
        qty = random.choices([1, 2, 3, 4, 5, 8], weights=[0.45, 0.28, 0.14, 0.08, 0.03, 0.02], k=1)[0]

        # Generate realistic order date with holiday/Q4 surge
        day_offset = random.randint(0, delta_days)
        order_dt = start_date + timedelta(days=day_offset)
        
        # Holiday / Black Friday bump
        if order_dt.month in [11, 12]:
            if random.random() < 0.25:
                # Add extra bump
                qty = min(qty + random.randint(1, 2), 10)

        # Sales amount
        sales_amount = round(unit_price * qty, 2)
        
        # Profit margin with realistic variance (e.g. occasional discount or promo)
        margin = random.uniform(min_m, max_m)
        if random.random() < 0.06:  # 6% of orders had heavy promotion/discount -> lower or slight negative margin
            margin = random.uniform(-0.08, 0.05)
        
        profit = round(sales_amount * margin, 2)

        # Customer Location
        loc_choice = random.choice(LOCATIONS)
        city = loc_choice[0]

        records.append({
            "Order ID": current_order_id,
            "Product Name": prod_name,
            "Category": chosen_cat,
            "Sales Amount": sales_amount,
            "Profit": profit,
            "Quantity Sold": qty,
            "Order Date": order_dt.strftime("%Y-%m-%d"),
            "Customer Location": city
        })
        current_order_id += 1

    # Write to CSV
    fieldnames = [
        "Order ID",
        "Product Name",
        "Category",
        "Sales Amount",
        "Profit",
        "Quantity Sold",
        "Order Date",
        "Customer Location"
    ]

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    print(f"Generated {len(records)} records in {output_path}")

if __name__ == "__main__":
    import os
    os.makedirs("data", exist_ok=True)
    generate_sales_data(500, "data/sample_sales_data.csv")
