H.Utils = {
	
	mixin: function(o1, o2) {
		var s;
		for (s in o2) {
			o1[s] = o2[s];
		}
	},
	
	clone: function(o) {
		var o1 = {};
		this.mixin(o1, o);
		return o1;
	},
	
	isUndefined: function(m) {
		return typeof m == 'undefined';
	}
}