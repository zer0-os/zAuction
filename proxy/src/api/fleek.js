const express = require('express');
const fleek = require('@fleekhq/fleek-storage-js');
const rateLimit = require('express-rate-limit');
const { json } = require('express');

// User receives a 429 error for being rate limited
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100 // limit each IP to 50 requests per windowMs
});

const router = express.Router();

const secrets = {
  apiKey: "+cuSvgFnS2MkpuLxQjp8Kg==",
  apiSecret: "Q4jc2NCcIM7N56947davlJBEQ6BFBjLBHwMcK1IwKq0=",
  cashew: "50",
  key: 'test/0/2.json',
  data: {
    name: 'value',
    age: 4,
    value: false,
  }
}

function checkNullCreateFields (...args) {
  let createFields = ["account","tokenId","contractAddress","startTime","endTime","minBid","auctionType"];
  for(let i = 0;i < args.length; i++){
    if (args[i] == null || (!/\S/.test(args[i]))) {
      return {data: createFields[i], value:false};
    }
  }
  return{data:null, value:true};
}

let cachedData;
let cacheTime;

// Get auction endpoint
router.get('/getAuction', limiter, async (req, res, next) => {
  try {
    if (req.body.key == null || (!/\S/.test(req.body.key))) {
      return res.send({"status":"false","message":"please provide a valid key"});
    }
	  await fleek.get({
      apiKey: secrets.apiKey,
      apiSecret: secrets.apiSecret,
      key: req.body.key
    }).then((file) => {
      res.send(file.data);
    });
  } catch (error) {
    next(error);
  }
});

// Create auction endpoint
router.post('/createAuction', async (req, res, next) => {
  var t = Math.floor(new Date().getTime() / 1000);
  //console.log(t,req.body);
  try {
    var result = checkNullCreateFields(
      req.body.account,
      req.body.tokenId,
      req.body.contractAddress,
      req.body.startTime,
      req.body.endTime,
      req.body.minBid,
      req.body.auctionType
    );
    if (result['value'] == false) {
        return res.send({"status": "false", "message": result['data'] + " not found"});
    }
    const data = {
      account: req.body.account,
      tokenId: req.body.tokenId,
      contractAddress: req.body.contractAddress,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      minBid: req.body.minBid,
      auctionType: req.body.auctionType
    };
    await fleek.upload({
      apiKey: secrets.apiKey,
      apiSecret: secrets.apiSecret,
      key: t + "-" + req.body.account,
      data: JSON.stringify(data)
    }).then((file) => res.json(file));
  } catch (error) {
    next(error);
  }
});

// List auctions endpoint
router.get('/getAuctions', async (req, res, next) => {
  var t = Math.floor(new Date().getTime() / 1000);
  //console.log(t);
  try {
    await fleek.listFiles({
      apiKey: secrets.apiKey,
      apiSecret: secrets.apiSecret,
      getOptions: [
        'key'
      ],
    }).then((file) => res.send(file));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
