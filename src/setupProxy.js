const express = require('express');
const vernacularRouter = require('../api/routes/vernacular');

module.exports = function setupProxy(app) {
  app.use('/api/translate/vernacular', express.json({ limit: '32kb' }), vernacularRouter);
};
