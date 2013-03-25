var H = new function() {
	
	var _oFs 	= require('fs'),
		_oPath 	= require('path');
	
	var _nInstanceCount 	= 0,
		_oInstances			= {},
		_oKinds				= {};
	
	function _makeConstructor(sKind) {
		return function(oParams) { return _construct(sKind, oParams); };
	}
	
	function _makeDestructor(oInst) {
		return function() { return _destruct(oInst); };
	}

	function _require(sName, sPath) {
		sPath = sPath || '';
		var sPackage = '';
		
		if (sName.match(/\.js$/)) {
			sName = sPath + sName;
			// console.log('Loading: ', sName);
			eval(_oFs.readFileSync(sName, 'utf8'));
		} else {
			sPath = sPath + sName + '/';
			sName = sPath + 'package';
			// console.log('Loading: ', sName);
			var aPackage = _oFs.readFileSync(sName, 'utf8').split('\n');
			for (var n in aPackage) {
				var sFileName = aPackage[n].trim();
				if (sFileName.length > 0) {
					_require(sFileName, sPath);
				}
			}
		}
	}
	
	function _updateMethod(sName, oInst, fMethod) {
		fMethod = fMethod || oInst[sName];
		fMethod.contextId 	= oInst.id;
		fMethod.methodName	= sName;
	}
	
	function _createGetter(oInst, sProp) {
		var fGetter = function() { return oInst._(sProp); }
		_updateMethod('get ' + sProp, oInst, fGetter);
		oInst.__defineGetter__(sProp, fGetter);
	}
	
	function _createSetter(oInst, sProp) {
		var fSetter = function(m) {
			if (m == oInst._(sProp)) { return; }
			
			var oEvent = {
				property: sProp,
				oldValue: oInst._(sProp),
				newValue: m
			};
			
			H.Event.emit(H.Events.CHANGE, oEvent);
			
			if (H.isFunction(oInst['onChange'])) {
				oInst.onChange(oInst, oEvent);
			}
			
			oInst._(sProp, m);
		}
		_updateMethod('set ' + sProp, oInst, fSetter);
		oInst.__defineSetter__(sProp, fSetter);
	}
	
	function _normalizeKindName(sName) {
		return 'H.' + sName.replace(/^H\./, '');
	}
	
	function _saveKind(oKind) {
		var aName 		= oKind.name.split('.'),
			oNamespace 	= H,
			sName 		= 'H',
			sLastName	= aName[aName.length - 1],
			sNormalName	= _normalizeKindName(oKind.name);
			
		if (aName[0] == 'H') { aName.splice(0, 1); }

		if (aName.length > 1) {
			for (var n=0; n<aName.length-1; n++) {
				sName += '.' + aName[n];
				if (H.isDefined(oNamespace[aName[n]])) {
					oNamespace = oNamespace[aName[n]];
				} else {
					throw 'Kind ' + sName + ' is not defined';
				}
			}
		}
		oNamespace.__defineGetter__(sLastName, function() { return _oKinds[sNormalName]; });
		_oKinds[sNormalName] = oKind;
	}
	
	function _construct(sKindName, oParams) {
		oParams = oParams || {};
		var sProp,										// Property name
			oKind = _oKinds[sKindName],					// Kind definition
			oInst = new function() {					// New instance
				var _ = {};								// Private members repository
				this._ = function(s, m) { 				// Setter/Getter for private members
					if (!H.isDefined(m)) { return _[s]; }
					_[s] = m;
				}
			};
			
		H.mixin(oKind, oParams);
		H.addProperty(oInst, 'id', _nInstanceCount, false);	// Setting id before anything else
			
		for (sProp in oKind) {
			if (sProp.charAt(0) == '_') {													// Private
				oInst[sProp] = oKind[sProp];
			} else {																		// Public
				switch (typeof oKind[sProp]) {
				
					/*********************/
					case 'string':
					case 'number':
						switch (sProp) {
							case 'id':
								break;
							case 'name':
								H.addProperty(oInst, sProp, oKind[sProp], false);
								break;
							case 'kind':
								H.addProperty(oInst, sProp, _oKinds[oKind[sProp]], false);
								break;
							default:
								H.addProperty(oInst, sProp, oKind[sProp], true);
						}
						break;
					
					/*********************/
					case 'function':
						H.addMethod(oInst, sProp, oKind[sProp], true);
						break;
					
					/*********************/
					case 'undefined':
						break;
				}
			}
		}
		
		if (H.isFunction(oInst['onConstruct'])) {
			oInst.onConstruct(oInst, {});
			delete oInst.construct;
		}
		
		oInst.destruct = _makeDestructor(oInst);
		
		_oInstances[oInst.id] = oInst;
		_nInstanceCount ++;
		
		H.Event.emit(H.Events.CONSTRUCT, {
			instance: oInst
		});
		
		return oInst;
	}
	
	function _destruct(oInst) {
		if (H.isFunction(oInst['onDestruct'])) {
			oInst.onDestruct(oInst, {});
		}
		H.Event.emit(H.Events.DESTRUCT, {
			instance: oInst
		});
		delete oInst;
	}
	
	/************************* PUBLIC *************************/
	
	this.initialize = function() {
		H.Event.initialize();
		
		_saveKind({
			name : 'H.Object',
			inherited : function() {
				var oCaller = arguments.callee.caller;
				this.kind[oCaller.methodName].apply(this, oCaller.arguments);
			},
			construct : _makeConstructor('H.Object')
		})
		
		process.on('uncaughtException', function (oError) {
		    H.error(oError.stack ? oError.stack : (oError.message ? oError.message : oError));
		});
	}
	
	this.error	= function(s) { console.log('Error', s); process.exit(1); }
	this.warn	= function(s) {	console.log('Warning: ', s); }
	
	this.addMethod = function(oInst, sProp, mValue, bWritable) {
		this.addProperty(oInst, sProp, mValue, bWritable);
		_updateMethod(sProp, oInst);
	}
	
	this.addProperty = function(oInst, sProp, mValue, bWritable) {
		_createGetter(oInst, sProp);
		if (bWritable) { 
			_createSetter(oInst, sProp); 
		}
		oInst._(sProp, mValue); 
	}
	
	this.construct = function(sKindName, oParams) {
		return _construct(sKindName, oParams);
	}
	
	this.kind = function(oKind) {
		if (!H.isDefined(oKind.name)) 	{ throw 'Kind name is not defined'; }
		if (!H.isDefined(oKind.kind)) 	{ oKind.kind = 'Object'; }
		if (H.isObject(oKind.kind))		{ oKind.kind = oKind.kind.name; }
		
		oKind.kind = _normalizeKindName(oKind.kind)
		
		if (!H.isDefined(_oKinds[oKind.kind])) 	{ throw 'Kind "' + oKind.kind + '" is not defined'; }
	
		oKind.name 		= _normalizeKindName(oKind.name);
		oKind.__proto__ = _oKinds[oKind.kind];
		oKind.construct = _makeConstructor(oKind.name);
		
		_saveKind(oKind);
	}
	
	this.require = function() {
		for (var n=0; n<arguments.length; n++) {
			_require(arguments[n]);
		}
	}
	
	this.getInstance = function(nId) {
		return _oInstances[nId];
	}
	
	this.toString = function() {
		return 'Hydrogen';
	}
}

H.isDefined 	= function(m) {	return typeof m != 'undefined'; }
H.isFunction 	= function(m) {	return typeof m == 'function'; 	}
H.isObject 		= function(m) {	return typeof m == 'object'; 	}
H.isString 		= function(m) {	return typeof m == 'string'; 	}

H.mixin	= function(o1, o2) {
	var s;
	for (s in o2) {
		o1[s] = o2[s];
	}
}

H.clone = function(o) {
	var o1 = {};
	this.mixin(o1, o);
	return o1;
}

H.require(
	'H/H.Event.js'
);

H.Events = {
	CONSTRUCT	: 'CONSTRUCT',
	DESTRUCT		: 'DESTRUCT',
	CHANGE		: 'CHANGE'
}
H.initialize();
module.exports = H;