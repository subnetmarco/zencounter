exports.trim = function(myString) {
	return myString.replace(/^s+/g,'').replace(/s+$/g,'');
}

exports.contains = function(a, obj) {
    var i = a.length;
    while (i--) {
       if (a[i] === obj) {
           return true;
       }
    }
    return false;
}

exports.startsWith = function(data, value) {
	return data.substring(0, value.length) === value
}