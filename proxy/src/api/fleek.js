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
  apiKey: process.env.REACT_APP_FLEEK_API_KEY,
  apiSecret: process.env.REACT_APP_FLEEK_API_SECRET,
	key: 'test/0/2.json',
	data: {
		name: 'value',
		age: 4,
		value: false,
	}
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

// Get bids endpoint
router.get('/getBids', limiter, async (req, res, next) => {
  console.log(process.env.RATE_LIMIT);
  if (cacheTime && cacheTime > Date.now() - parseInt(process.env.CACHE_TIME) * 1000) {
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

// Create bid endpoint
router.get('/createBid', async (req, res, next) => {
  try {
		await fleek.upload({
			apiKey: process.env.FLEEK_API_KEY,
			apiSecret: process.env.FLEEK_API_SECRET,
			key: secrets.key,
			data: JSON.stringify(secrets.data)
		}).then((file) => res.json(file));
  } catch (error) {
    next(error);
  }
});

// List bids endpoint
router.get('/listBids', async (req, res, next) => {
  try {
		await fleek.listFiles({
		  apiKey: process.env.FLEEK_API_KEY,
		  apiSecret: process.env.FLEEK_API_SECRET,
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
