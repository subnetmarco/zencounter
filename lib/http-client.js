var rest = require('restler');

exports.get = function(url, retry, callback) {
	var request = rest.get(url);
	handleRequest(request, retry, callback);
};

exports.post = function(url, data, retry, callback) {
	var request = rest.post(url, {data:data});
	handleRequest(request, retry, callback);
};

exports.delete = function(url, data, retry, callback) {
	var request = rest.del(url, {data:data});
	handleRequest(request, retry, callback);
};

function handleRequest(request, retry, callback) {
	request.on('complete', function(result, response) {
		if (result instanceof Error) {
			if (retry) {
				console.log("Retrying " + url);
				this.retry(3000); // try again after 3 sec
			} else {
				if (callback) callback(null, response);
			}
		} else {
			if (callback) callback(result, response);
		}
	});
}
