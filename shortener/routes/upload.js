var express = require('express');
var router = express.Router();
const crypto = require('crypto')
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

redisClient.on("error", error => {
  if(error) {
      console.error("ERROR***",error);
  } else {
      console.log("Redis connect.");
  }
});

function selectSum() {
  return new Promise((res) => {
    pool.query(
      'SELECT totalRows FROM sumTable', 
      (error, results, fields) => res([error, results, fields])
    );
  })
}

function updateSum() {
  return new Promise(res => {
    pool.query(
      'UPDATE sumTable SET totalRows = totalRows + 1', 
      (error, results, fields) => res([error, results, fields])
    );
  })
}

function insertUrl(url, expireAt, urlId) {
  return new Promise(res => {
    pool.query(
      'INSERT INTO urls (url, expireAt, urlId) VALUES (?, ?, ?)', 
      [url, , hashed],
      (error, results, fields) => res([error, results, fields])
    );
  });
}

function convertInt(x) {
  var ans = ""
  var mapping = []
  for(var i = 0; i < 10; i++) 
    mapping.append(String.fromCharCode('0'.charCodeAt(0) + i))
  for(var i = 0; i < 26; i++) 
    mapping.append(String.fromCharCode('a'.charCodeAt(0) + i))
  for(var i = 0; i < 26; i++) 
    mapping.append(String.fromCharCode('A'.charCodeAt(0) + i))
  while(x > 0) {
    ans += (x % 62)
    x = floor(x / 62)
  }
  return ans;
}

async function insertTransaction(url, expireAt, urlId) {
  return new Promise((res, rej) => {
    pool.beginTransaction(async function(err) {
      if(err) rej(err)
      var [error, results, fields] = await selectSum();
      if(error) rej(error)
      var latest = results[0].totalRows
      var [error, results, fields] = await updateSum();
      if(error) rej(error)
      var [error, results, fields] = await insertUrl(url, expireAt, urlId);
      if(error) rej(error)
      
      pool.commit((err) => {
        if (err) 
          return pool.rollback(function() { rej(err); });
        res(convertInt(latest));
      });
    })
  })
}

/* Upload functions. */
router.post('/urls', async function(req, res) {
  try {
    const urlId = await insertTransaction(req.body.url, expire, hashed);
    var expire = moment(req.body.expireAt).unix();
    res.send({
      id: hashed,
      shortUrl: "http://localhost/" + urlId
    })
    redisClient.hSet(urlId, 'url', req.body.url);
    redisClient.hSet(urlId, 'expireAt', expire);
    console.log(urlId, req.body.url, expire)
  } catch (e) {
    console.log(e)
  }
});

module.exports = router;
