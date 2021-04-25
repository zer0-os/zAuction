const express = require('express');
const fleek = require('@fleekhq/fleek-storage-js');
const rateLimit = require('express-rate-limit');

// User receives a 429 error for being rate limited
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100 // limit each IP to 50 requests per windowMs
});

const router = express.Router();

const secrets = {
  apiKey: "",
  apiSecret: "",
  cashew: "50",
  key: 'test/0/2.json',
  data: {
    name: 'value',
    age: 4,
    value: false,
  }
}

function checkNullCreateFields (...args) {
  let createFields = [];
  for(let i = 0;i < args.length; i++){
    if (args[i] == null || (!/\S/.test(args[i]))) {
      return {data: createFields[i], value:false};
    }
  }
  return{data:null, value:true};
}
async function fleekGetFile(hash) {
	return myFile = await fleek.getFileFromHash({
		hash: hash,
	})
}
async function fleekListFiles(apiKey, apiSecret) {
  return files = await fleekStorage.listFiles({
    apiKey: apiKey,
    apiSecret: apiSecret,
    getOptions: [
      'bucket',
      'key',
      'hash',
      'publicUrl'
    ],
  })
}
async function fleekDeleteFile(apiKey, apiSecret, key, bucket) {
  const input = {
    apiKey: apiKey,
    apiSecret: apiSecret,
    key: key,
    bucket: bucket
  };
  return result = await fleek.deleteFile(input);
}
async function fleekWriteFile(apiKey, apiSecret, key, data) {
  const input = {
    apiKey: apiKey,
    apiSecret: apiSecret,
    key: key,
    data: JSON.stringify(data)
  };
  return result = await fleek.upload(input);
}
async function fleekGetBuckets(apiKey, apiSecret) {
  const buckets = await fleek.listBuckets({
    apiKey: apiKey,
    apiSecret: apiSecret,
  })
}

let cachedData;
let cacheTime;

// Get auction endpoint
router.get('/getAuction', limiter, async (req, res, next) => {
  if (cacheTime && cacheTime > Date.now() - parseInt(secrets.cashew) * 1000) {
    return res.json(cachedData);
  }
  try {
    await fleek.getFileFromHash({
      hash: 'bafybeibtedlr5m36oxnzh5ylyauy6vpmchx4fbmdlbkoda3ztptkwbydty',
    }).then((file) => {
      // Careful, this cache is stored in memory
      cachedData = file;
      cacheTime = Date.now();
      res.json(file)
    }
    );
  } catch (error) {
    next(error);
  }
});

// Create auction endpoint
router.get('/createAuction', async (req, res, next) => {
  try {
    var result = checkNullCreateFields();
    if (result['value'] == false) {
        return res.send({"status": "false", "message": result['data'] + " not found"});
    }
    await fleek.upload({
      apiKey: secrets.apiKey,
      apiSecret: secrets.apiSecret,
      key: secrets.key,
      data: JSON.stringify(secrets.data)
    }).then((file) => res.json(file));
  } catch (error) {
    next(error);
  }
});

// List auctions endpoint
router.get('/listAuctions', async (req, res, next) => {
  var t = Math.floor(new Date().getTime() / 1000);
  console.log(t);
  try {
    await fleek.listFiles({
      apiKey: secrets.apiKey,
      apiSecret: secrets.apiSecret,
      getOptions: [
        'bucket',
        'key',
        'publicUrl'
      ],
    }).then((file) => res.json(file));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
