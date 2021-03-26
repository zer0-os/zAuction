const fs = require("fs");
const fleek = require('@fleekhq/fleek-storage-js');

async function fleekGetFile(hash) {
	return myFile = await fleek.getFileFromHash({
		hash: hash,
	})
}
async function fleekListFiles(apiKey, apiSecret) {
// NEEDS TESTED
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
// NEEDS TESTED
	const input = {
		apiKey: apiKey,
		apiSecret: apiSecret,
		key: key,
		bucket: bucket
	};
	return result = await fleek.deleteFile(input);
}
async function fleekWriteFile(apiKey, apiSecret, key, data) {
  // data gets json.stringified
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
