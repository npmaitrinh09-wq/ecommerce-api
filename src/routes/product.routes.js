const { Router } = require('express');
const { listProducts } = require('../controllers/product.controller');

const router = Router();

router.get('/', listProducts);

module.exports = router;