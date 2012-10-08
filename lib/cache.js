var data = {};

exports.get = function(id, property) {
	property = typeof property !== 'undefined' ? property : "this";
	
	var element = data[id];
	
	if (!element || !element[property]) return 0;

	var timestamp = new Date().getTime();
	if (element[property].expiration == 0 || (element[property].creationDate + element[property].expiration) > timestamp) {
		return element[property].amount
	} else {
		return 0;
	}
}

exports.populate = function(d) {
	data = d;
}

exports.getData = function() {
	return {data:data};
}

exports.execute = function(command, id, property, amount, expiration) {
	//messages.push({command:command, id:id,property:property,amount:amount,expiration:expiration});
	process({command:command, id:id,property:property,amount:amount,expiration:expiration});
}

function process(operation) {
	if (operation) {
		if (operation.command == "update") {
			updateItem(operation);
		} else if (operation.command == "delete") {
			deleteItem(operation);
		}
	}
}

function deleteItem(operation) {
	if (operation.property == "this") {
		delete data[operation.id];
	} else {
		var element = data[operation.id];
		delete element[operation.property];
		var keys = Object.keys(element);
		if (keys.length == 1 && element[keys[0]] == null) {
			// If this was the only key in the item, remove the whole item from memory
			delete data[operation.id];
		}
	}
}

function updateItem(operation) {
	var element = data[operation.id];
	if (element && element[operation.property]) {
		// If is not expired
		var timestamp = new Date().getTime();
		if (element[operation.property].expiration == 0 || (element[operation.property].creationDate + element[operation.property].expiration) > timestamp) {
			element[operation.property].amount = element[operation.property].amount + parseInt(operation.amount);
			return;
		}
	}

	// otherwise is either not existing or expired
	createItem(operation.id, operation.property, {
		amount: operation.amount,
		expiration: (operation.expiration) ? operation.expiration : 0,
		creationDate:new Date().getTime()
	});
}

function createItem(id, property, options) {
	var element = data[id];
	if (!element) element = {};
	element[property] = {
		amount: parseInt(options.amount),
		expiration: (options.expiration) ? parseInt(options.expiration) : 0,
		creationDate:new Date().getTime()
	}
	
	data[id] = element;
}