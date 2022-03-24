var express = require('express');
var router = express.Router();
const moment = require('moment');
const redis = require('redis');
const redisClient = redis.createClient();
(async function() { await redisClient.connect(); })()

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
      [urlId], (error, results, fields) => res([error, results, fields])
    );
  });
}

/* Redirect functions. */
router.get('/:urlId', async function(req, res, next) {
  try {
    var url, expireAt;

    const value = await redisClient.hGetAll(req.params.urlId)
    console.log(value)
    if(value == undefined) {
      const [ error, results, fields ] = await queryUrl(req.params.urlId);
      console.log(error, results, fields)
      if(error) throw error;
      if(results.length == 0) throw "Link not found";
      url = results[0].url;
      expireAt = results[0].expireAt;
    } else {
      url = value.url;
      expireAt = value.expireAt;
    }

    if(moment().unix() < expireAt)
      res.writeHead(301, { Location: url }).end();
    else
      res.send("Link outdated.")
  } catch (e) {
    console.log(e)
  }
});

module.exports = router;
