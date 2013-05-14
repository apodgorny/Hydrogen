String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g, '');
};

String.prototype.ltrim = function() {
	return this.replace(/^\s+/,'');
};

String.prototype.rtrim = function() {
	return this.replace(/\s+$/,'');
};

String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.substr(1);
} 

String.prototype.toCamelCase = function() {
	return this.replace(/([\-_][a-z]+)/gi, function($1) {return $1.substr(1).toLowerCase().capitalize();});
};

String.prototype.toDashCase = function() {
	return this.replace(/([A-Z])/g, function($1) {return '-'+$1.toLowerCase();});
};

String.prototype.toUnderscoreCase = function() {
	return this.replace(/([A-Z])/g, function($1) {return '_'+$1.toLowerCase();});
};

String.prototype.pad = function(sInput, nLength, bRight) {
	var s = '';
	while (s.length <= nLength) {
		s += sInput;
	}
	if (bRight) {
		return this + s.slice(-nLength + this.length);
	}
	return s.slice(-nLength + this.length) + this;
};