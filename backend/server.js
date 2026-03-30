require('dotenv').config({ path: './config.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const authMiddleware = require('./middleware/auth');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/faturalar', authMiddleware, require('./routes/faturalar'));
app.use('/api/raporlar', authMiddleware, require('./routes/raporlar'));
app.use('/api/ekspertiz', authMiddleware, require('./routes/ekspertiz'));

const distPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(distPath));
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  const interfaces = os.networkInterfaces();
  let localIP = 'localhost';
  Object.values(interfaces).forEach(list => {
    (list || []).forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) localIP = iface.address;
    });
  });
  console.log('');
  console.log('  Fatura Takip calisiyor');
  console.log('  Bu bilgisayar : http://localhost:' + PORT);
  console.log('  Yerel ag      : http://' + localIP + ':' + PORT);
  console.log('');
});
