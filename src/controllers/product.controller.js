const prisma = require('../lib/prisma');

async function listProducts(req, res) {
  const products = await prisma.product.findMany({ orderBy: { pid: 'asc' } });
  res.json(products);
}

module.exports = { listProducts };