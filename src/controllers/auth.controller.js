const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

async function register(req, res) {
  const { username, fullname, password } = req.body;
  if (!username || !fullname || !password) {
    return res.status(400).json({ error: 'username, fullname and password are required' });
  }

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  const normalRole = await prisma.role.findFirst({ where: { rolename: 'normal' } });
  const normalMembership = await prisma.memberShip.findFirst({ where: { mname: 'Normal' } });
  if (!normalRole || !normalMembership) {
    return res.status(500).json({ error: 'Default role or membership is missing. Run: npx prisma db seed' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      fullname,
      password: hashed,
      roleid: normalRole.roleid,
      mid: normalMembership.mid,
    },
  });

  res.status(201).json({
    uid: user.uid,
    username: user.username,
    fullname: user.fullname,
    role: normalRole.rolename,
    score: normalMembership.score,
  });
}

async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign(
    { uid: user.uid, roleid: user.roleid },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  res.json({ token });
}

module.exports = { register, login };