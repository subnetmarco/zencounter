var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var tcpServer = require('./../lib/tcp-server');
var utils = require('./../lib/utils');
var httpClient = require('./../lib/http-client');
var config = require('./../lib/config');
var cache = require('./../lib/cache');

config.on("completed", function() {
	if (cluster.isMaster) {
		console.info("Counter started on " + config.ip + ":" + config.port);
	
		if (config.workers < 1) {
		  console.info("INFO: There are not enough cores, updating the --mashape-api-proxy:workers property to '1'");
		  config.workers = 1;
		}
	
		// Fork workers.
		for (var i = 0; i < config.workers; i++) {
			startWorker();
		}
		cluster.on('exit', function(worker, code, signal) {
			console.log("Worker died, restarting..");
			startWorker();
		});
	
		console.info("Running " + config.workers + " workers. Ready to process requests...");
	} else {
		tcpServer.startServer();
	}
});

function eachWorker(callback) {
	for (var id in cluster.workers) {
		callback(cluster.workers[id]);
	}
}

var servers = [];

function startWorker() {
	var worker = cluster.fork();
	worker.on('message', function(msg) {
		if (msg.cmd) {
			switch(msg.cmd) {
				case "register-server":
					var ip = utils.trim(msg.ip);
					var port = parseInt(msg.port);
					addServer(ip, port);
					
					// Start Sync
					httpClient.post("http://" + ip + ":" + port + "/servers/sync", {data : JSON.stringify(cache.getData()), ip:config.ip, port:config.port}, false, function() {
						console.info("Sync started on server " + ip + ":" + port);
					});
					break;
				case "sync":
					addServer(msg.ip, msg.port);
					eachWorker(function(worker) {
						worker.send(msg);
					});
					break;
				default:
					//TODO: Support sync of DELETE
					cache.execute(msg.cmd, msg.id, msg.property, msg.amount, msg.expiration);
					eachWorker(function(worker) {
						worker.send(msg);
					});
					
					// And to every remote server in the cluster
					for (var i = 0; i < servers.length; i++) {
						var server = servers[i];
						if (msg.server && msg.server == getServerSignature(server.ip, server.port)) {
							continue;
						}
						if (msg.cmd == "delete") {
							httpClient.delete("http://" + server.ip + ":" + server.port + "/items/" + msg.id + "/" + msg.property, {amount:msg.amount, expiration:msg.expiration, server:getServerSignature(config.ip, config.port)}, false, function(){});						
						} else {
							httpClient.post("http://" + server.ip + ":" + server.port + "/items/" + msg.id + "/" + msg.property, {amount:msg.amount, expiration:msg.expiration, server:getServerSignature(config.ip, config.port)}, false, function(){});
						}					
					}
			}
		}
	});
	console.log("Worker started with PID " + worker.process.pid);
}

function getServerSignature(ip, port) {
	return ip + ":" + port;
}

function addServer(ip, port) {
	ip = utils.trim(ip);
	port = parseInt(port);
	if (!port) port = 8000;
	var server = getServer(ip);
	if (server) {
		server.port = port;
	} else {
		servers.push({ip:ip, port:parseInt(port)});
	}
}

function getServer(ip) {
	for (var i = 0; i < servers.length; i++) {
		var server = servers[i];
		if (server.ip == ip) {
			return server;
		}
	}
	return null;
}