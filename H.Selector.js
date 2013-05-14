H.select = function(sSelector, oOwner) {
	var sProperty	= sSelector,
		sObjectName	= null,
		o			= null;

	if (sSelector.indexOf('.') > -1) {
		var a = sSelector.split('.');
		sObjectName	= a[0];
		sProperty 	= a[1];
	}

	if (sObjectName) {
		o = oOwner.$[sObjectName];
	} else {
		if (oOwner.owner) {
			o = oOwner.owner;
		} else {
			o = oOwner;
		}
	}
	
	return {
		object	 : o,
		property : sProperty
	}
};

H.bindTo = function(s) {
	return new H.Selector(s, true);
},

H.setTo = function(s) {
	return new H.Selector(s);
}

H.Selector = function(m, bBind) {
	this.attach = function(oDst, sDstProp) {
		if (bBind) {
			return this.bind(oDst, sDstProp);
		} else {
			return this.set(oDst, sDstProp);
		}
	}

	this.bind = function(oDst, sDstProp) {
		// console.log('bind', m);
		if (H.isString(m)) { m = [m]; }
		
		var n 	 = 0,
			oSrc = null;
			
		for (; n<m.length; n++) {
			oSrc = H.select(m[n], oDst);
			H.bind(oDst, sDstProp).to(oSrc.object, oSrc.property);
		}
	}
	
	this.set = function(oDst, sDstProp) {
		var oSrc = H.select(m, oDst);
		if (H.isFunction(oSrc.object[oSrc.property])) {
			if (H.isFunction(oDst[sDstProp])) {
				// console.log('was function');
			} else {
				// console.log(oDst.kindName + '.' + sDstProp + ' is not a function', typeof oDst[sDstProp]);
			}
			oDst[sDstProp] = oSrc.object[oSrc.property].bind(oSrc.object);
		} else {
			oDst[sDstProp] = oSrc.object[oSrc.property];
		}
	}
	
	this.toString = function() {
		return 'H.Selector';
	}
}