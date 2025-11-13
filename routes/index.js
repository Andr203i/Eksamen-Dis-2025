var express = require('express');
var router = express.Router();
const pool = require('../Db'); // Importér database-poolen

/**
 * GET /
 * Forside route – tester databaseforbindelsen
 */
router.get('/', async function(req, res, next) {
  try {
    // Simpel DB-testquery
    const [rows] = await pool.query('SELECT 1 + 1 AS result');

    // Send svar til browseren
    res.send('DB virker! 1 + 1 = ' + rows[0].result);

  } catch (err) {
    console.error('Fejl ved DB-forbindelse:', err);
    res.status(500).send('Fejl ved forbindelse til databasen');
  }
});

/**
 * Eksempel på en ekstra route hvis du får brug for det senere:
 * router.get('/status', (req, res) => {
 *   res.json({ message: 'Serveren kører!', time: new Date() });
 * });
 */

module.exports = router;
