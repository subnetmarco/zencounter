var rest = require('restler');

exports.get = function(url, retry, callback) {
	var request = rest.get(url);
	request.on('complete', function(result, response) {
	  if (result instanceof Error) {
		if (retry) {
			console.log("Retrying GET " + url);
	    	this.retry(3000); // try again after 3 sec
		} else {
			if (callback) callback(null, response);
		}
	  } else {
		if (callback) callback(result, response);
	  }
	});	
};

exports.post = function(url, data, retry, callback) {
	var request = rest.post(url, {data:data});
	request.on('complete', function(result, response) {
	  if (result instanceof Error) {
		if (retry) {
			console.log("Retrying GET " + url);
	    	this.retry(3000); // try again after 3 sec
		} else {
			if (callback) callback(null, response);
		}
	  } else {
		if (callback) callback(result, response);
	  }
	});	
};

exports.delete = function(url, data, retry, callback) {
	var request = rest.del(url, {data:data});
	request.on('complete', function(result, response) {
	  if (result instanceof Error) {
		if (retry) {
			console.log("Retrying GET " + url);
	    	this.retry(3000); // try again after 3 sec
		} else {
			if (callback) callback(null, response);
		}
	  } else {
		if (callback) callback(result, response);
	  }
	});	
};
