var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send(`
    <h1>🏗️ Svar fra Eksamen-Dis-2025</h1>
    <p>Dette er Node/Express-serveren i <b>Frankfurt</b> (port 3000)</p>
    <p>Klientens IP: ${req.ip}</p>
  `);
});

module.exports = router;
