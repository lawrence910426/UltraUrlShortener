var express = require('express');
var router = express.Router();
const { createHash } = await import('crypto');
const hash = createHash('sha512');

var mysql = require('mysql');
var pool  = mysql.createPool({
  connectionLimit : 10,
  host            : process.env.dbHost,
  user            : process.env.dbUser,
  password        : process.env.dbPassword,
  database        : process.env.dbName
});

async function insertUrl(url, expireAt, hashed) {
  return new Promise(res => {
    var query = pool.query(
      'INSERT INTO urls SET ?', 
      { url: url, expireAt, expireAt, urlId: hashed }, 
      res
    );
  });
}


/* Upload functions. */
router.post('/urls', function(req, res) {
  // Assume CPU is not the bottleneck
  var hashed = hash.update(req.body.url + req.body.expireAt).digest('hex');
  await insertUrl(req.body.url, req.body.expireAt, hashed);
});

module.exports = router;
