const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const dogruKullanici = process.env.LOGIN_USER || 'ODAK PAZARLAMA';
  const dogruSifre = process.env.LOGIN_PASSWORD || 'odak2024';

  if (username === dogruKullanici && password === dogruSifre) {
    const token = jwt.sign(
      { username },
      process.env.JWT_SECRET || 'gizli-anahtar',
      { expiresIn: '12h' }
    );
    res.json({ token, username });
  } else {
    res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
  }
});

module.exports = router;
