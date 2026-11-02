const prisma = require('../lib/prisma');

const include = { details: { include: { product: true } }, shipments: true };

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function createOrder(req, res) {
  const { items } = req.body; // dạng [{ pid, qty }]
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items must be a non-empty array' });
  }
  for (const item of items) {
    if (!Number.isInteger(item.pid) || !Number.isInteger(item.qty) || item.qty <= 0) {
      return res.status(400).json({ error: 'Each item needs integer pid and qty greater than 0' });
    }
  }
  const pids = items.map((item) => item.pid);
  if (new Set(pids).size !== pids.length) {
    return res.status(400).json({ error: 'Duplicate pid in items' });
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({ data: { uid: req.user.uid } });

      for (const item of items) {
        const product = await tx.product.findUnique({ where: { pid: item.pid } });
        if (!product) throw httpError(404, `Product ${item.pid} not found`);
        if (product.quantity < item.qty) {
          throw httpError(409, `Not enough stock for product ${item.pid}`);
        }

        await tx.product.update({
          where: { pid: item.pid },
          data: { quantity: { decrement: item.qty } },
        });

        await tx.orderDetail.create({
          data: { oid: created.oid, pid: item.pid, qty: item.qty, unit_price: product.price },
        });
      }

      await tx.shipment.create({ data: { oid: created.oid, status: 'PENDING' } });

      return tx.order.findUnique({ where: { oid: created.oid }, include });
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function listMyOrders(req, res) {
  const orders = await prisma.order.findMany({
    where: { uid: req.user.uid },
    orderBy: { oid: 'desc' },
    include,
  });
  res.json(orders);
}

async function getMyOrder(req, res) {
  const order = await prisma.order.findFirst({
    where: { oid: Number(req.params.oid), uid: req.user.uid },
    include,
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
}

module.exports = { createOrder, listMyOrders, getMyOrder };