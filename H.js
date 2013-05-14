var H = new function() {
	
	this.Error	= require('./H.Error.js').HydrogenError;

	var _oFs 	= require('fs'),
		_oPath 	= require('path');
		
	var _nInstanceCount 	= 0,
		_oInstances			= {},
		_oKinds				= {};

	function _require(sName, sPath) {
		sPath = sPath || __dirname.replace(/H$/, '');
		
		var sPackage = '',
			sCode;
	
		if (sName.match(/\.js$/)) {
			sName = sPath + sName;
			sCode = _oFs.readFileSync(sName, 'utf8');
			try {
				eval(sCode);
			} catch (oError) {
				var oHError = H.Error.createFromError(
					oError,
					sName,
					sCode
				);
				throw oHError;
			}
		} else {
			sPath = sPath + sName + '/';
			sName = sPath + 'package';
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
	
	function _addInheritedMethod(oInst) {
		H.addMethod(oInst, 'inherited', function() {
			var fCaller 	= arguments.callee.caller,
				sMethod 	= fCaller.methodName,
				oBase		= oInst,
				bFound		= false;
				
			while (true) {
				if (!bFound) {
					if (oBase[sMethod] === fCaller) {
						bFound = true;
					}
				} else {
					if (oBase[sMethod] !== fCaller) {
						_updateMethod(sMethod, oInst, oBase[sMethod]);
						oBase[sMethod].apply(oInst, fCaller.arguments);
						break;
					}
				}
				if (!H.isDefined(oBase.base)) { 
					break; 
				}
				oBase = oBase.base;
			}
		}, false);
	}

	function _createGetter(oInst, sProp) {
		var fGetter = function() { return oInst._(sProp); }
		_updateMethod('get ' + sProp, oInst, fGetter);
		oInst.__defineGetter__(sProp, fGetter);
	}

	function _createSetter(oInst, sProp) {
		var fSetter = function(mNewValue) {
			if (mNewValue == oInst._(sProp)) { return; }
			var mOldValue = oInst._(sProp);
			oInst._(sProp, mNewValue);
			oInst.emitChange(sProp, mOldValue, mNewValue);
		}
		_updateMethod('set ' + sProp, oInst, fSetter);
		oInst.__defineSetter__(sProp, fSetter);
	}

	function _normalizeKindName(sKindName) {
		if (!sKindName) { return null; }
		return 'H.' + sKindName.replace(/^H\./, '');
	}

	function _createStaticProperty(oKind, sStatic) {
		oKind.__defineGetter__(sStatic, function()  { return oKind.statics[sStatic]; });
		oKind.__defineSetter__(sStatic, function(m) { oKind.statics[sStatic] = m;    });
	}

	function _createStaticMethod(oKind, sStatic) {
		oKind.statics[sStatic].bind(oKind);
		_createStaticProperty(oKind, sStatic);
	}

	function _extendStatics(oKind) {
		if (!H.isDefined(oKind['statics'])) {
			oKind.statics = {};
		}
		if (oKind.base) {
			H.mixin(oKind.statics, oKind.base.statics);
		}
		for (var sStatic in oKind.statics) {
			switch (typeof oKind.statics[sStatic]) {
				case 'function':
					_createStaticMethod(oKind, sStatic);
					break;
				default:
					_createStaticProperty(oKind, sStatic);
			}
		}
	}

	function _extendEvents(oKind) {
		if (!H.isDefined(oKind['events'])) {
			oKind.events = {};
		}
		if (oKind.base) {
			H.mixin(oKind.events, oKind.base.events);
		}
	}
	
	function _extendHandlers(oKind) {
		if (!H.isDefined(oKind['handlers'])) {
			oKind.events = {};
		}
		if (oKind.base) {
			H.mixin(oKind.handlers, oKind.base.handlers);
		}
	}

	function _registerEvents(oInst, oKind) {
		for (var sEvent in oKind.events) {
			H.addEvent(oInst, sEvent, oKind.events[sEvent]);
		}
	}
	
	function _registerHandlers(oInst, oKind) {
		var sEvent;
		for (sEvent in oKind.handlers) {
			H.addHandler(oInst, sEvent, oKind.handlers[sEvent]);
		}
	}

	function _saveKind(oKind) {
		var aName 		= oKind.kindName.split('.'),
			oNamespace 	= H,
			sName 		= 'H',
			sLastName	= aName[aName.length - 1];
		
		if (aName[0] == 'H') { aName.splice(0, 1); }

		if (aName.length > 1) {
			for (var n=0; n<aName.length-1; n++) {
				sName += '.' + aName[n];
				if (!H.isDefined(oNamespace[aName[n]])) {
					oNamespace[aName[n]] = {
						kindName: sName
					};
				}
				oNamespace = oNamespace[aName[n]];
			}
		}
		oNamespace.__defineGetter__(sLastName, function() { return _oKinds[oKind.kindName]; });
		_oKinds[oKind.kindName] = oKind;
	}
	
	function _extractSelectors(oParams) {
		var s,
			oSelectors = {};

		// Move selectors into a separate object
		for (s in oParams) {
			if (oParams[s] instanceof H.Selector) {
				oSelectors[s] = oParams[s];
				// delete oParams[s];
			}
		}
		
		return oSelectors;
	}
	
	function _addSelectors(oInst, oSelectors) {
		for (var s in oSelectors) {
			oSelectors[s].attach(oInst, s);
		}
	}

	function _construct(sKindName, oParams, oOwner) {
		oParams = oParams || {};
		oOwner  = H.isObject(oOwner) ? oOwner : null;
		
		if (oParams && H.isDefined(oParams['components'])) {
			H.warn('Nested components are not allowed');
			delete oParams['components'];
		}

		// Allow for things like H.Construct(H.MyKind, ...
		if (H.isObject(sKindName)) { sKindName = sKindName.kindName; }
		
		// console.log('CONSTRUCT:', sKindName, 'with owner', oOwner ? oOwner.kindName : 'null', _nInstanceCount);
		
		var sProp,										// Property name
			sStatic,									// Static property name
			sEvent,										// Event name
			oKind = H.getKind(sKindName),				// Get kind definition
			oSelectors = {},							// Selectors in definition
			oInst = new function() {					// Create new instance
				var _ = {};									// Private members repository
				this._ = function(s, m) { 					// Setter/Getter for private members
					if (!H.isDefined(m)) { return _[s]; }
					_[s] = m;
				}
			};
		
		H.mixin(oKind, oParams, true);
		
		oSelectors = _extractSelectors(oKind);
		
		H.addProperty(oInst, 'id', 		 _nInstanceCount, 	false);		// Setting id before anything else
		H.addProperty(oInst, 'kindName', oKind.kindName, 	false);
		H.addProperty(oInst, 'base', 	 oKind.base, 		true);
		H.addProperty(oInst, 'owner',	 oOwner,			false);
		
		_registerEvents(oInst, oKind);						// Setting up events before other properties
		_addInheritedMethod(oInst);
		
		for (sProp in oKind) {
			if (sProp.charAt(0) == '_') {													// Private
				oInst[sProp] = oKind[sProp];
			} else {																		// Public
				switch (typeof oKind[sProp]) {

					/*********************/
					case 'object':
						switch (sProp) {
							case 'statics':		break;
							case 'events':		break;
							case 'base':		break;
							case 'owner': 		break;
							default:
								if (!H.isDefined(oKind.statics[sProp])) {
									H.addProperty(oInst, sProp, oKind[sProp], true);
								}
						}
						break;
					case 'string':
					case 'number':
					case 'boolean':
						switch (sProp) {
							case 'kindName': 	break;
							case 'id':			break;
							case 'base': 		break;
							case 'owner': 		break;
							default:
								if (!H.isDefined(oKind.statics[sProp])) {
									H.addProperty(oInst, sProp, oKind[sProp], true);
								}
						}
						break;
				
					/*********************/
					case 'function':
						if (!H.isDefined(oKind.statics[sProp])) {
							H.addMethod(oInst, sProp, oKind[sProp], true);
						}
						break;
				
					/*********************/
					case 'undefined':
						break;
				}
			}
		}
	
		_oInstances[oInst.id] = oInst;
		_nInstanceCount ++;
		_registerHandlers(oInst, oKind);
	
		if (H.isFunction(oInst.emitConstruct)) {
			oInst.emitConstruct(oInst);
		}
		
		_addSelectors(oInst, oSelectors);

		return oInst;
	}

	/************************* PUBLIC *************************/

	this.initialize = function() {
		process.on('uncaughtException', function (oError) {
			if (oError.name == 'HydrogenError') {
				H.error(oError.toString());
			} else {
				H.error(oError.stack);
			}
		});
	}

	this.error	= function(s) { console.error('\n' + s + '\n'); process.exit(1); }
	this.warn	= function(s) {	console.log('Warning: ', s); }

	this.addMethod = function(oInst, sName, fValue, bWritable) {
		this.addProperty(oInst, sName, fValue, bWritable);
		_updateMethod(sName, oInst);
	}

	this.addProperty = function(oInst, sName, mValue, bWritable) {
		_createGetter(oInst, sName);
		if (bWritable) {
			_createSetter(oInst, sName); 
		}
		oInst._(sName, mValue); 
	}
	
	this.addEvent = function(oInst, sEventName, fEvent) {				// TODO: check if fEvent is function and act accordingly
		var sEventName		= sEventName.toUpperCase(),
			sEventMethod 	= ('emit_' + sEventName).toCamelCase();
			
		H.addMethod(oInst, sEventMethod, function() {
			var oData = (H.isFunction(fEvent) 
					? fEvent.apply(oInst, arguments)        // Call event definition function
					: { data: H.cloneArray(arguments) }     // If event definition function is not a function
				),
				sHandlerMethod	= ('on_' + sEventName).toCamelCase();

			oData.sender = oInst;
			oData.event  = sEventName;
			
			if (H.isFunction(oInst[sHandlerMethod])) {
				oInst[sHandlerMethod].apply(oInst, [oData]);
			}
			
			H.Event.emit(sEventName, oData);
		});
	}
	
	this.addHandler = function(oInst, sEventName, mHandler) {
		sEventName 	 = sEventName.toUpperCase();
		
		if (H.isString(mHandler)) {
			mHandler = oInst[mHandler];
		}
		H.Event.on(sEventName, mHandler);
	}

	this.construct = function(sKindName, oParams, oOwner) {
		return _construct(sKindName, oParams, oOwner);
	}

	this.kind = function(sKind, sBase, oKind) {
		if (!sBase && !oKind) {
			oKind = sKind;
			sKind = oKind.name;
			sBase = oKind.kind;
			delete oKind.name;
			delete oKind.kind;
		} else if (!oKind) {
			oKind = sBase;
			sBase = null;
		}
	
		// Allow for things like H.kind('mykind', H.BaseKind, ...
		if (H.isObject(sBase)) {
			sBase = sBase.kindName;
		}
	
		if (sKind != 'H.Object') {
			if (!sKind) { throw 'Kind name is not supplied'; }
			if (!sBase) { sBase = 'H.Object'; }
	
			sKind = _normalizeKindName(sKind);
			sBase = _normalizeKindName(sBase);
		
			var oBaseKind = H.getKind(sBase);
			if (oBaseKind) {
				oKind.__proto__ = oKind.base = oBaseKind;
			} else {
				throw 'Kind "' + sBase + '" could not be found';
			}
		}
	
		oKind.kindName	= sKind;
	
		_extendStatics(oKind);
		_extendEvents(oKind);
		_extendHandlers(oKind);
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

	this.getKind = function(sKindName) {
		sKindName = _normalizeKindName(sKindName);
		if (sKindName && H.isDefined(_oKinds[sKindName])) {
			return _oKinds[sKindName];
		}
		return null;
	}
	
	this.getKinds = function() {
		return _oKinds;
	}

	this.toString = function() {
		return 'Hydrogen';
	}
}

/************************************************************/

H.isDefined 	= function(m) {	return typeof m != 'undefined'; 	}
H.isFunction 	= function(m) {	return typeof m == 'function'; 		}
H.isObject 		= function(m) {	return m && typeof m == 'object'; 	}
H.isString 		= function(m) {	return typeof m == 'string'; 		}
H.isBoolean		= function(m) { return typeof m == 'boolean';		}
H.isNumber		= function(m) { return typeof m == 'number';		}
H.isArray		= function(m) {	return H.isObject(m) && Object.getPrototypeOf(m) == Array.prototype }

H.mixin = function(oDst, oSrc, bOverride) {
	var s;
	for (s in oSrc) {
		if (H.isDefined(oDst[s]) && !bOverride) { continue;	}
		oDst[s] = oSrc[s];
	}
}

H.clone = function(o) {
	var o1 = {};
	this.mixin(o1, o);
	return o1;
}

H.cloneArray = function(a) {
	var a1 = [],
		n  = 0;
		
	for (;n<a.length; n++) {
		a1.push(a[n]);
	}
	
	return a1;
}

H.assert = function(bCondition, sAction) {
	if (bCondition) {
		console.log('- Assert ' + sAction + ' ' + ' SUCCESS'.pad('.', 70 - sAction.length));
	} else {
		console.log('- Assert ' + sAction + ' ' + ' FAILURE'.pad('.', 70 - sAction.length));
		throw new Error('Failed to assert ' + sAction);
	}
}

H.initialize();

H.require(
	'H/H.String.js',
	'H/H.Event.js',
	'H/H.Selector.js',
	'H/H.Url.js',
	'H/H.Server.js',
	'H/kind.Object.js'
);

module.exports = H;