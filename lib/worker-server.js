var http = require('http');
var querystring = require('querystring');
var utils = require('./utils');
var cache = require('./cache');
var config = require('./../lib/config');

var ITEMS_PATH = "/items"
var SERVERS_PATH = "/servers"

exports.startServer = function() {
	var data = [];
	process.on('message', function(msg) {
		if (msg.cmd && msg.cmd == "sync") {
			cache.populate(msg.data);
		} else {
			cache.execute(msg.cmd, msg.id, msg.property, msg.amount, msg.expiration);
		}
	});
	
	http.createServer(function(req, res) {
		if (utils.startsWith(req.url, ITEMS_PATH)) {
			var item = getItem(req.url);
			if (req.method == 'POST') {
				readBody(req, function(parsedBody) {
					var amount = parsedBody.amount;
					var expiration = parsedBody.expiration;
					var server = parsedBody.server;
					if (!amount || !item.id || utils.trim(item.id) == "") {
						sendResponse(400, res);
					} else {
		            	process.send({ cmd: "update", amount:amount, expiration:expiration, id:item.id, property:item.property, server:server, pid:process.pid });
						sendResponse(200, res);
					}
				});
			} else if (req.method == 'GET') {
				if (item.id == "" || utils.trim(item.id) == "") {
					sendResponse(200, res, JSON.stringify(cache.getData()));
				} else {
					sendResponse(200, res, JSON.stringify({amount:cache.get(item.id, item.property)}));
				}
			} else if (req.method == 'DELETE') {
				process.send({ cmd: "delete", id:item.id, property:item.property, pid:process.pid });
				sendResponse(200, res);
			} else {
				// Wrong HTTP method
				sendResponse(405, res);
			}
		} else if (utils.startsWith(req.url, SERVERS_PATH)) {
			if (req.method == "POST" && req.url == SERVERS_PATH + "/register") {
				readBody(req, function(parsedBody) {
					process.send({cmd:"register-server",ip:parsedBody.ip,port:parsedBody.port});
					sendResponse(200, res);
				});
			} else if (req.method == "POST" && req.url == SERVERS_PATH + "/sync") {
				readBody(req, function(parsedBody) {
					var decodedData = JSON.parse(decodeURIComponent(parsedBody.data));
					var data = decodedData.data;
					process.send({cmd:"sync",data:data,ip:parsedBody.ip,port:parsedBody.port});
					
					console.info("Synchronizing with " + Object.keys(data).length + " items");
					
					sendResponse(200, res);
				});
			} else {
				sendResponse(404, res);
			}
		} else {
			sendResponse(404, res);
		}
	}).listen(config.port);
}

function readBody(req, callback) {
    var body = '';
    req.on('data', function (data) {
        body += data;
    });
    req.on('end', function () {
		callback(querystring.parse(body));
    });
} 

function getItem(requestUrl) {
	var parts = requestUrl.substring(ITEMS_PATH.length + 1).split("/");
	return {id:parts[0],
			property:(parts.length > 1) ? parts[1] : "this"}
}

function sendResponse(statusCode, response, data) {
	data = typeof data !== 'undefined' ? data : "";
	response.writeHead(statusCode);
	response.end(data);
}