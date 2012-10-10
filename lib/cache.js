var data = {};

exports.get = function(id, property) {
	property = typeof property !== 'undefined' ? property : "this";
	
	var element = data[id];
	
	if (!element || !element[property]) return 0;


	var newReferenceDate = getNewReferenceDate(element[property].referenceDate, element[property].expiration);
	if (element[property].referenceDate != newReferenceDate) {
		return 0; // Expired
	} else {
		return element[property].amount
	}
}

exports.populate = function(d) {
	data = d;
}

exports.getData = function() {
	return data;
}

exports.execute = function(command, id, property, amount, expiration) {
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

function getNewReferenceDate(oldReferenceDate, expiration) {
	var now = new Date().getTime();
	
	// NEW_REF_DATE = OLD_REF_DATE + (FLOOR((NOW - OLD_REF_DATE) / EXP) * EXP)
	// If new reference date != referenceDate, is expired.
	
	// Reference date is the date taken as reference when calculating the expiration of an item.

	var newReferenceDate = oldReferenceDate + (Math.floor((now - oldReferenceDate) / expiration) * expiration);
	return newReferenceDate;
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
		if (operation.expiration) {
			// update expiration date if set
			if (operation.expiration < 0) operation.expiration = 0;
			element[operation.property].expiration = operation.expiration;
		}
		
		// Item exists
		if (element[operation.property].expiration > 0) {
			var newReferenceDate = getNewReferenceDate(element[operation.property].referenceDate, element[operation.property].expiration);
			if (element[operation.property].referenceDate != newReferenceDate) {
				// Expired
				element[operation.property].amount = parseInt(operation.amount);
				element[operation.property].referenceDate = newReferenceDate;
				return;
			}
		}
		
		// Not expired
		element[operation.property].amount = element[operation.property].amount + parseInt(operation.amount);

	} else {		
		createItem(operation.id, operation.property, {
			amount: operation.amount,
			expiration: (operation.expiration) ? ((operation.expiration < 0) ? 0 : operation.expiration) : 0, // Do not allow negative expiration dates
			referenceDate:new Date().getTime()
		});
	}
}

function createItem(id, property, options) {
	var element = data[id];
	if (!element) element = {};
	element[property] = {
		amount: parseInt(options.amount),
		expiration: (options.expiration) ? parseInt(options.expiration) : 0,
		referenceDate:new Date().getTime()
	}
	
	data[id] = element;
}