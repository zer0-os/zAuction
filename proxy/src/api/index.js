const express = require('express');

// routes
const fleek = require('./fleek');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'ok'
  });
});

router.use('/fleek', fleek);

module.exports = router;
