const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const searchRouter = require('./routes/search');
const dataLoader = require('./data-loader');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Load data into memory (sync at startup)
const data = dataLoader.loadData();
app.locals.data = data;

app.use('/api/search', (req, res, next) => {
  // attach data to request for routes
  req.appData = app.locals.data;
  next();
}, searchRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Poetry helper API listening on port ${PORT}`);
});
