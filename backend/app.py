from flask import Flask, jsonify, request, send_from_directory, send_file
from flask_cors import CORS
import json
import os

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend')

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
CORS(app)

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'products.json')


# ─────────────────────────────────────────────
#  SERVE FRONTEND
# ─────────────────────────────────────────────

@app.route('/')
def index():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/products')
def products_page():
    return send_from_directory(FRONTEND_DIR, 'products.html')

@app.route('/cart')
def cart_page():
    return send_from_directory(FRONTEND_DIR, 'cart.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)


def load_data():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)


# ─────────────────────────────────────────────
#  PRODUCTS
# ─────────────────────────────────────────────

@app.route('/api/products', methods=['GET'])
def get_products():
    data = load_data()
    products = data['products']

    # Filtering
    category = request.args.get('category')
    brand = request.args.get('brand')
    search = request.args.get('search', '').lower()
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    featured = request.args.get('featured')
    sort = request.args.get('sort', 'default')

    if category and category != 'All':
        products = [p for p in products if p['category'] == category]

    if brand:
        products = [p for p in products if p['brand'] == brand]

    if search:
        products = [p for p in products if
                    search in p['name'].lower() or
                    search in p['category'].lower() or
                    search in p['brand'].lower() or
                    any(search in t for t in p['tags'])]

    if min_price is not None:
        products = [p for p in products if p['price'] >= min_price]

    if max_price is not None:
        products = [p for p in products if p['price'] <= max_price]

    if featured == 'true':
        products = [p for p in products if p.get('featured')]

    # Sorting
    if sort == 'price_asc':
        products = sorted(products, key=lambda x: x['price'])
    elif sort == 'price_desc':
        products = sorted(products, key=lambda x: x['price'], reverse=True)
    elif sort == 'rating':
        products = sorted(products, key=lambda x: x['rating'], reverse=True)
    elif sort == 'name':
        products = sorted(products, key=lambda x: x['name'])

    return jsonify({
        'success': True,
        'count': len(products),
        'products': products
    })


@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    data = load_data()
    product = next((p for p in data['products'] if p['id'] == product_id), None)
    if not product:
        return jsonify({'success': False, 'message': 'Product not found'}), 404
    return jsonify({'success': True, 'product': product})


@app.route('/api/products', methods=['POST'])
def add_product():
    data = load_data()
    new_product = request.get_json()

    if not new_product:
        return jsonify({'success': False, 'message': 'No data provided'}), 400

    required = ['name', 'category', 'brand', 'price', 'stock']
    for field in required:
        if field not in new_product:
            return jsonify({'success': False, 'message': f'Missing field: {field}'}), 400

    # Assign next id
    max_id = max((p['id'] for p in data['products']), default=0)
    new_product['id'] = max_id + 1
    new_product.setdefault('rating', 0.0)
    new_product.setdefault('reviews', 0)
    new_product.setdefault('discount', 0)
    new_product.setdefault('originalPrice', new_product['price'])
    new_product.setdefault('featured', False)
    new_product.setdefault('tags', [])
    new_product.setdefault('image', '')
    new_product.setdefault('description', '')

    data['products'].append(new_product)
    save_data(data)
    return jsonify({'success': True, 'product': new_product}), 201


@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    data = load_data()
    product = next((p for p in data['products'] if p['id'] == product_id), None)
    if not product:
        return jsonify({'success': False, 'message': 'Product not found'}), 404

    updates = request.get_json()
    if not updates:
        return jsonify({'success': False, 'message': 'No data provided'}), 400

    # Prevent overwriting id
    updates.pop('id', None)
    product.update(updates)
    save_data(data)
    return jsonify({'success': True, 'product': product})


@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    data = load_data()
    original_len = len(data['products'])
    data['products'] = [p for p in data['products'] if p['id'] != product_id]
    if len(data['products']) == original_len:
        return jsonify({'success': False, 'message': 'Product not found'}), 404
    save_data(data)
    return jsonify({'success': True, 'message': 'Product deleted'})


# ─────────────────────────────────────────────
#  CATEGORIES & BRANDS
# ─────────────────────────────────────────────

@app.route('/api/categories', methods=['GET'])
def get_categories():
    data = load_data()
    return jsonify({'success': True, 'categories': data.get('categories', [])})


@app.route('/api/brands', methods=['GET'])
def get_brands():
    data = load_data()
    return jsonify({'success': True, 'brands': data.get('brands', [])})


# ─────────────────────────────────────────────
#  STATS (for dashboard/home)
# ─────────────────────────────────────────────

@app.route('/api/stats', methods=['GET'])
def get_stats():
    data = load_data()
    products = data['products']
    return jsonify({
        'success': True,
        'stats': {
            'total_products': len(products),
            'total_categories': len(data.get('categories', [])) - 1,  # minus "All"
            'total_brands': len(data.get('brands', [])),
            'avg_rating': round(
                sum(p['rating'] for p in products) / len(products), 1
            ) if products else 0
        }
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
