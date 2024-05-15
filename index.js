const express = require('express');
const cors = require('cors');

const sendMap = require('./routes/sendmap');
const receiveOrders = require('./routes/receiveorders');
const resetMap = require('./routes/resetmap.js');
const advanceTurn = require('./routes/advanceturn.js');

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api/map', sendMap);
app.use('/api/orders', receiveOrders);
app.use('/api/reset', resetMap);
app.use('/api/turn', advanceTurn);

const PORT = process.env.PORT || 3000;
app.listen( PORT, console.log(`Running express server on Port ${PORT}`));