/**
 * SKU Routes
 * 
 * These routes handle all SKU-related operations.
 */

const express = require('express');
const router = express.Router();
const skuController = require('../controllers/sku.controller');

/**
 * @route   GET /api/skus
 * @desc    Get all SKUs with optional filtering
 * @access  Public
 */
router.get('/', skuController.getAllSkus);

/**
 * @route   GET /api/skus/:skuId
 * @desc    Get a single SKU by ID
 * @access  Public
 */
router.get('/:skuId', skuController.getSkuById);

/**
 * @route   GET /api/skus/barcode/:code
 * @desc    Get a SKU by barcode or UPC
 * @access  Public
 */
router.get('/barcode/:code', skuController.getSkuByBarcode);

/**
 * @route   GET /api/skus/product/:productId
 * @desc    Get all SKUs for a specific product
 * @access  Public
 */
router.get('/product/:productId', skuController.getSkusByProduct);

/**
 * @route   POST /api/skus
 * @desc    Create a new SKU
 * @access  Private
 */
router.post('/', skuController.createSku);

/**
 * @route   PUT /api/skus/:skuId
 * @desc    Update an existing SKU
 * @access  Private
 */
router.put('/:skuId', skuController.updateSku);

/**
 * @route   DELETE /api/skus/:skuId
 * @desc    Delete a SKU
 * @access  Private
 */
router.delete('/:skuId', skuController.deleteSku);

module.exports = router;