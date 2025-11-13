var express = require('express');
var router = express.Router();
const pool = require('../db'); // import db-pool

/* GET home page – DB-test */
router.get('/', async function(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.send('DB virker! 1 + 1 = ' + rows[0].result);
  } catch (err) {
    console.error('Fejl ved DB-forbindelse:', err);
    res.status(500).send('Fejl ved forbindelse til databasen');
  }
});

module.exports = router;
