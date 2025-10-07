# Brand-SKU Master Data Management System

A centralized master data management system for brands, products, and SKUs, designed to support the Brand-SKU detection pipeline in the InsightPulseAI system.

## Overview

This system provides a robust API for managing and querying product catalog data, including brands, categories, products, and SKUs. It's designed to be the "golden source" for product data used by various applications, especially for the Brand-SKU detection system.

## Features

- **Comprehensive Data Model**: Well-structured schema for brands, categories, products, and SKUs
- **Flexible API**: RESTful endpoints for CRUD operations and advanced queries
- **Search Capabilities**: Full-text search across all entities
- **SKU Lookup**: Fast barcode/UPC lookups for retail applications
- **Data Validation**: Schema validation for data integrity
- **Sample Data**: Pre-loaded with common Filipino sari-sari store products

## Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the directory
cd brand-sku-masterdata

# Install dependencies
npm install

# Import sample data
npm run import-data

# Start the server
npm start
```

## API Endpoints

The API provides the following endpoints:

### Health Check
- `GET /health` - Basic health check
- `GET /health/db` - Database health check

### Brand Endpoints
- `GET /api/brands` - Get all brands
- `GET /api/brands/:brandId` - Get a specific brand by ID

### Category Endpoints
- `GET /api/categories` - Get all categories
- `GET /api/categories/:categoryId` - Get a specific category by ID

### Product Endpoints
- `GET /api/products` - Get all products
- `GET /api/products/:productId` - Get a specific product by ID

### SKU Endpoints
- `GET /api/skus` - Get all SKUs (with optional filtering)
- `GET /api/skus/:skuId` - Get a specific SKU by ID
- `GET /api/skus/barcode/:code` - Get a SKU by barcode or UPC
- `GET /api/skus/product/:productId` - Get all SKUs for a specific product
- `POST /api/skus` - Create a new SKU
- `PUT /api/skus/:skuId` - Update an existing SKU
- `DELETE /api/skus/:skuId` - Delete a SKU

### Search Endpoints
- `GET /api/search?q=<query>` - Search across all collections
- `GET /api/search/advanced` - Advanced search with multiple filters

## Query Parameters

### For SKU Endpoints:
- `product_id` - Filter by product ID
- `brand_id` - Filter by brand ID
- `category_id` - Filter by category ID
- `status` - Filter by status (active, discontinued, pending)
- `variant` - Filter by variant name
- `price_min` - Filter by minimum price
- `price_max` - Filter by maximum price
- `search` - Text search across multiple fields
- `include` - Include related entities (e.g., `include=all` to include product and brand details)

### For Search Endpoints:
- `q` - Search query
- `collection` - Limit search to a specific collection
- `limit` - Maximum number of results to return

### For Advanced Search:
- `brand` - Search by brand name or ID
- `product` - Search by product name or ID
- `category` - Filter by category ID
- `sku` - Search by SKU name, ID, or variant
- `barcode` - Search by exact barcode or UPC
- `price_min` - Filter by minimum price
- `price_max` - Filter by maximum price
- `status` - Filter by SKU status
- `sort` - Sort results (e.g., `sort=price.base:desc`)
- `limit` - Maximum number of results per page
- `offset` - Pagination offset

## Examples

### Search for a SKU by name
```
GET /api/skus?search=Nescafé
```

### Get a SKU by barcode
```
GET /api/skus/barcode/4800361354136
```

### Advanced search for active SKUs from a specific brand with price range
```
GET /api/search/advanced?brand=Nestlé&status=active&price_min=5&price_max=20&sort=price.base:asc
```

## Data Model

### Brand
```json
{
  "brand_id": "NESTLE",
  "name": "Nestlé",
  "description": "Global food and drink processing conglomerate",
  "logo_url": "https://example.com/nestle_logo.png",
  "website_url": "https://www.nestle.com.ph",
  "country_of_origin": "Switzerland",
  "founded_year": 1866,
  "meta": {
    "created_at": "2025-05-10T00:00:00Z",
    "updated_at": "2025-05-10T00:00:00Z",
    "source_system": "PIM_EXPORT"
  }
}
```

### Category
```json
{
  "category_id": "BEVERAGES",
  "name": "Beverages",
  "description": "Drinks and liquid refreshments",
  "parent_category_id": null,
  "level": 0,
  "path": [],
  "meta": {
    "created_at": "2025-05-10T00:00:00Z",
    "updated_at": "2025-05-10T00:00:00Z"
  }
}
```

### Product
```json
{
  "product_id": "NES-3IN1-CLASSIC",
  "name": "Nescafé Classic 3-in-1",
  "description": "Instant coffee mix with creamer and sugar",
  "brand_id": "NESTLE",
  "category_id": "BEVERAGES",
  "subcategory_id": "COFFEE",
  "images": [
    {
      "url": "https://example.com/nescafe_3in1_classic.png",
      "alt_text": "Nescafé Classic 3-in-1 Coffee Mix",
      "is_primary": true
    }
  ],
  "meta": {
    "created_at": "2025-05-10T00:00:00Z",
    "updated_at": "2025-05-10T00:00:00Z",
    "status": "active",
    "source_system": "PIM_EXPORT"
  }
}
```

### SKU
```json
{
  "sku_id": "NES3IN1-001",
  "product_id": "NES-3IN1-CLASSIC",
  "barcode": "4800361354136",
  "upc": "4800361354136",
  "name": "Nescafé Classic 3-in-1 Original",
  "variant": "Sachet",
  "size": "20g",
  "weight": {
    "value": 20,
    "unit": "g"
  },
  "price": {
    "base": 8.00,
    "currency": "PHP"
  },
  "inventory": {
    "stock_level": "High",
    "quantity": 500,
    "reorder_point": 100
  },
  "images": [
    {
      "url": "https://example.com/nescafe_3in1_sachet.png",
      "alt_text": "Nescafé Classic 3-in-1 Sachet",
      "is_primary": true
    }
  ],
  "meta": {
    "created_at": "2025-05-10T00:00:00Z",
    "updated_at": "2025-05-10T00:00:00Z",
    "status": "active",
    "source_system": "PIM_EXPORT",
    "last_sync_date": "2025-05-19T00:00:00Z"
  }
}
```

## Future Enhancements

- MongoDB integration for production deployment
- User authentication and access control
- Advanced cache layer for high-performance lookups
- Batch import/export functionality
- Webhook notifications for data changes
- Integration with image recognition services
- Comprehensive audit logging
- Versioning for SKU changes