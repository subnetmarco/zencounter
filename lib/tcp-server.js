var utils = require('./utils');
var net = require('net');
var cache = require('./cache');
var config = require('./config');

exports.startServer = function() {
	process.on('message', function(msg) {
		if (msg.cmd && msg.cmd == "sync") {
			cache.populate(msg.data);
		} else {
			cache.execute(msg.cmd, msg.id, msg.property, msg.amount, msg.expiration);
		}
	});
	
	net.createServer(function(c) {
		c.on('data', function(data) {
			if (data.toString('hex') == "fff4fffd06") {
				c.destroy();
			} else {
				handleMessage(data.toString().replace(/(\r\n|\n|\r)/gm,""), c);
			}
		});
		c.write("Welcome to Zencounter\n");
	}).listen(config.port);
	
}

function handleMessage(data, client) {
	data = utils.trim(data.toLowerCase());
	if (utils.startsWith(data, "upd")) {
		var command = data.split(/\s+/);
		if (command.length < 3 || command.length > 5) {
			clientWrite(client, "Invalid command arguments");
		} else {
			var item = getItem(command[1]);
			var expiration = (command.length == 4) ? parseInt(command[3]) : null;
			var amount = parseInt(command[2]);
			var server = (command.length == 5) ? command[5] : null;
			if (isNaN(amount) || isNaN(expiration)) {
				clientWrite(client, "Amount or Expiration values are not numbers");
			} else {
				process.send({ cmd: "update", amount:amount, expiration:expiration, id:item.id, property:item.property, server:server, pid:process.pid });
			}
		}
	} else if (utils.startsWith(data, "get")) {
		var command = data.split(/\s+/);
		if (command.length != 2) {
			clientWrite(client, "Invalid command arguments");
		} else {
			var item = getItem(command[1]);
			clientWrite(client, cache.get(item.id, item.property));
		}
	} else if (utils.startsWith(data, "del")) {
		var command = data.split(/\s+/);
		if (command.length != 2) {
			clientWrite(client, "Invalid command arguments");
		} else {
			var item = getItem(command[1]);
			process.send({ cmd: "delete", id:item.id, property:item.property, pid:process.pid });
		}
	} else if (utils.startsWith(data, "list")) {
		var message = "";
		var data = cache.getData();
		var elements = Object.keys(data);
		for(var i=0;i<elements.length;i++) {
			var id = elements[i];
			message += "|-" + id + "\n";
			var element = data[id];
			var properties = Object.keys(data[id]);
			for (var p=0;p<properties.length;p++) {
				var property = properties[p];
				message	+= "  |- " + property + ": " + element[property].amount + ((element[property].expiration) ? " ~ " + element[property].expiration + "ms)" : "") + "\n";
			}
		}
		clientWrite(client, message);
	} else {
		clientWrite(client, "Unknown command");
	}
}

function clientWrite(client, message) {
	client.write(message + "\n");
}

function getItem(data) {
	var parts = data.split("/");
	return {id:parts[0],
			property:(parts.length > 1) ? parts[1] : "this"}
}