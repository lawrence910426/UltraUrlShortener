var express = require('express');
var router = express.Router();
const crypto = require('crypto')
const moment = require('moment');
const redis = require('redis');
const redisClient = redis.createClient({
  url: process.env.redisConnectionString
});
(async function() { await redisClient.connect(); })()

var mysql = require('mysql');
var connection  = mysql.createConnection({
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
    connection.query(
      'SELECT totalRows FROM sumTable', 
      (error, results, fields) => res([error, results, fields])
    );
  })
}

function updateSum() {
  return new Promise(res => {
    connection.query(
      'UPDATE sumTable SET totalRows = totalRows + 1', 
      (error, results, fields) => res([error, results, fields])
    );
  })
}

function insertUrl(url, expireAt, urlId) {
  return new Promise(res => {
    connection.query(
      'INSERT INTO urls (url, expireAt, urlId) VALUES (?, ?, ?)', 
      [url, expireAt, urlId],
      (error, results, fields) => res([error, results, fields])
    );
  });
}

function convertInt(x) {
  x += 1; // Count from 1.
  var ans = ""
  var mapping = []
  for(var i = 0; i < 10; i++) 
    mapping.push(String.fromCharCode('0'.charCodeAt(0) + i))
  for(var i = 0; i < 26; i++) 
    mapping.push(String.fromCharCode('a'.charCodeAt(0) + i))
  while(x > 0) {
    ans += mapping[x % 36]
    x = Math.floor(x / 36)
  }
  return ans;
}

async function insertTransaction(url, expireAt) {
  return new Promise((res, rej) => {
    connection.beginTransaction(async function(err) {
      if(err) rej(err)
      var [error, results, fields] = await selectSum();
      if(error) rej(error)
      var urlId = convertInt(results[0].totalRows)
      var [error, results, fields] = await updateSum();
      if(error) rej(error)
      var [error, results, fields] = await insertUrl(url, expireAt, urlId);
      if(error) rej(error)
      
      connection.commit((err) => {
        if (err) 
          return connection.rollback(function() { rej(err); });
        res(urlId);
      });
    })
  })
}

/* Upload functions. */
router.post('/urls', async function(req, res) {
  try {
    console.log(req.body)
    var expire = moment(req.body.expireAt).unix();
    const urlId = await insertTransaction(req.body.url, expire);
    res.send({
      id: urlId,
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
