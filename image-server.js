const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3002;

app.use(cors());

// Serve static files from the 'uploads' directory
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date(), service: 'Image Server' });
});

app.listen(PORT, () => {
  console.log(`🖼️  Image Server running on port ${PORT}`);
  console.log(`📁 Serving images from: ${uploadsPath}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});