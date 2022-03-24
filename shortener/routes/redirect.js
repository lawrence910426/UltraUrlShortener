var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var pool  = mysql.createPool({
  connectionLimit : 10,
  host            : process.env.dbHost,
  user            : process.env.dbUser,
  password        : process.env.dbPassword,
  database        : process.env.dbName
});

async function queryUrl(urlId) {
  return new Promise(res => {
    var query = pool.query(
      'SELECT url, expireAt FROM urls WHERE urlId = ?', 
      [urlId], res
    );
  });
}

/* Redirect functions. */
router.get('/:urlId', function(req, res, next) {
  const [error, results, fields] = await queryUrl(req.params.urlId);
  if(error) throw error;
  if(results[0].urls.expireAt < moment().unix())
    res.redirect(results[0].urls.url);
});

module.exports = router;
