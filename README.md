# SportZone – Full-Stack Sports Store

A complete sports store web application with a **Python (Flask) backend** and **HTML/CSS/JS frontend**.

## Project Structure

```
CLASS-DEMO-WEBSITE/
├── backend/
│   ├── app.py              # Flask REST API
│   ├── requirements.txt    # Python dependencies
│   └── data/
│       └── products.json   # Local product database
└── frontend/
    ├── index.html          # Home page
    ├── products.html       # Products listing + filters
    ├── cart.html           # Shopping cart & checkout
    ├── css/
    │   └── style.css       # All styles (responsive)
    └── js/
        ├── cart.js         # Shared cart logic
        ├── main.js         # Home page JS
        ├── products.js     # Products page JS
        └── cartpage.js     # Cart page JS
```

## Quick Start

### 1. Install Python dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the Flask server

```bash
python app.py
# Server runs at http://localhost:5000
```

### 3. Open the frontend

Open `frontend/index.html` in your browser (or use Live Server in VS Code).

## API Endpoints

| Method | Endpoint                  | Description                          |
|--------|---------------------------|--------------------------------------|
| GET    | `/api/products`           | List all products (supports filters) |
| GET    | `/api/products/<id>`      | Get single product                   |
| POST   | `/api/products`           | Add new product                      |
| PUT    | `/api/products/<id>`      | Update product                       |
| DELETE | `/api/products/<id>`      | Delete product                       |
| GET    | `/api/categories`         | List all categories                  |
| GET    | `/api/brands`             | List all brands                      |
| GET    | `/api/stats`              | Store statistics                     |

### Query Parameters for GET /api/products

- `search` – text search (name, category, brand, tags)
- `category` – filter by category
- `brand` – filter by brand
- `min_price` / `max_price` – price range
- `featured=true` – only featured products
- `sort` – `price_asc`, `price_desc`, `rating`, `name`

## Features

- **Home** – Hero banner, live stats, category grid, featured products
- **Products** – Sidebar filters (category, brand, price, rating), sort, quick-view modal
- **Cart** – Add/remove items, quantity control, coupon codes (`SPORT10`, `SAVE20`, `ZONE5`), order summary, checkout flow
- Fully **responsive** design (mobile-first)
- **Local JSON** data store – no database needed
- **REST API** with full CRUD operations

## Coupon Codes

| Code     | Discount |
|----------|----------|
| SPORT10  | 10% off  |
| SAVE20   | 20% off  |
| ZONE5    | 5% off   |
