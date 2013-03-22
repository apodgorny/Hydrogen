var H = new function() {
	
	var _nInstanceCount 	= 0,
		_sLastPackagePath 	= '';	// Holds package path when requiring package files
		_oInstances			= {};
		_oKinds				= {
			'Object' : {
				name 	  : 'Object',
				id	 	  : 0,
				inherited : function() {
					var oCaller = arguments.callee.caller;
					this.kind[oCaller.methodName].apply(this, oCaller.arguments);
				},
				construct : function(oParams) { _construct('Object', oParams); },
			}
		};
		
	function _makeConstructor(sKind) {
		return function(oParams) { return _construct(sKind, oParams); };
	}
	
	function _makeDestructor(oInst) {
		return function() { return _destruct(oInst); };
	}
	
	function _require(sName) {
		if (sName.match(/\.js$/)) {
			sName = _sLastPackagePath
			 	? _sLastPackagePath + '/' + sName
				: 'H/' + sName;						// FIXME
		} else {
			_sLastPackagePath = sName;
			sName = sName + '/package.js';
		}
		
		// Read and eval library
		var sCode = H.FS.readFileSync(sName, 'utf8');
		eval(sCode);
	}
	
	function _updateMethod(sName, oInst, fMethod) {
		fMethod = fMethod || oInst[sName];
		fMethod.contextId 	= oInst.id;
		fMethod.methodName	= sName;
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
				if (typeof oNamespace[aName[n]] != 'undefined') {
					oNamespace = oNamespace[aName[n]];
				} else {
					H.error('Kind ' + sName + ' is not defined');
				}
			}
		}
		oNamespace.__defineGetter__(sLastName, function() { return _oKinds[sNormalName]; });
		_oKinds[sNormalName] = oKind;
	}
	
	function _construct(sKindName, oParams) {
		var sProp,										// Property name
			oKind = _oKinds[sKindName],				// Kind definition
			oInst = new function() {					// New instance
				var _ = {};								// Private members repository
				this._ = function(s, m) { 				// Setter/Getter for private members
					if (typeof m == 'undefined') { return _[s]; }
					_[s] = m;
				}
			};
		
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
		
		_oInstances[oInst.id] = oInst;
		_nInstanceCount ++;
		
		if (typeof oInst['onConstruct'] == 'function') {
			oInst.onConstruct();
			delete oInst.construct;
		}
		
		oInst.destruct = _makeDestructor(oInst);
		
		return oInst;
	}
	
	function _destruct(oInst) {
		if (typeof oInst['onDestruct'] == 'function') {
			oInst.onDestruct();
		}
		delete oInst;
	}
	
	/************************* PUBLIC *************************/
	
	this.FS	= require('fs');

	this.error	= function(s) { console.log('Error', s); process.exit(1); }
	this.warn	= function(s) {	console.log('Warning: ', s); }
	
	this.addMethod = function(oInst, sProp, mValue, bWritable) {
		this.addProperty(oInst, sProp, mValue, bWritable);
		_updateMethod(sProp, oInst);
	}
	
	this.addProperty = function(oInst, sProp, mValue, bWritable) {
		var fGetter,
			fSetter;
			
		fGetter = function() { return oInst._(sProp); }
		_updateMethod('get ' + sProp, oInst, fGetter);
		
		oInst.__defineGetter__(sProp, fGetter);
		
		if (bWritable) {
			fSetter = function(m) { 
				H.Event.send(H.Events.CHANGE, {
					oldValue	: oInst._(sProp),
					newValue	: m
				});
				oInst._(sProp, m); 
			}
			_updateMethod('set ' + sProp, oInst, fSetter);
			oInst.__defineSetter__(sProp, fSetter);
		}
		
		oInst._(sProp, mValue); 
	}
	
	this.construct = function(sKindName, oParams) {
		return _construct(sKindName, oParams);
	}
	
	this.kind = function(oKind) {
		if (typeof oKind.name == 'undefined') 			{ H.error('Kind name is not defined'); }
		if (typeof oKind.kind == 'undefined') 			{ oKind.kind = 'Object'; }
		if (typeof oKind.kind == 'object')				{ oKind.kind = oKind.kind.name; }
		if (typeof _oKinds[oKind.kind] == 'undefined') 	{ H.error('Kind "' + oKind.kind + '" is not defined'); }
	
		oKind.name = _normalizeKindName(oKind.name);
		oKind.__proto__ = _oKinds[oKind.kind];
		oKind.construct = _makeConstructor(oKind.name);
		_saveKind(oKind);
	}
	
	this.require = function() {
		var n = 0;
		for (;n<arguments.length; n++) {
			_require(arguments[n]);
		}
	}
	
	this.getInstance = function(nId) {
		return _oInstances[nId];
	}
}

H.require(
	'H.Utils.js',
	'H.Event.js'
);


H.Events = {
	CHANGE: 'CHANGE'
}

module.exports = H;