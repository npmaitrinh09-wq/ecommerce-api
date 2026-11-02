const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth.middleware');
const { createOrder, listMyOrders, getMyOrder } = require('../controllers/order.controller');

const router = Router();

router.use(requireAuth);

router.post('/', createOrder);
router.get('/', listMyOrders);
router.get('/:oid', getMyOrder);

module.exports = router;