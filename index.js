// Initialize dotenv only if not in production
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// Import core modules
const express = require('express');
const cors = require('cors');

// Import routes
const sendMap = require('./routes/sendmap');
const receiveOrders = require('./routes/receiveorders');
const resetMap = require('./routes/resetmap.js');
const advanceTurn = require('./routes/advanceturn.js');
const authRoutes = require('./routes/authRoutes.js');
const userRoutes = require('./routes/userRoutes.js');

// Set up express environment
const app = express();

app.use(express.json());
app.use(cors());

// Set up routes
app.use('/api/map', sendMap);
app.use('/api/orders', receiveOrders);
app.use('/api/reset', resetMap);
app.use('/api/turn', advanceTurn);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen( PORT, console.log(`Running express server on Port ${PORT}`));