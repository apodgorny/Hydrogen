/**
 * Url utility makes easy: 
 *
 * 	1) assembling/disassembling url. 
 * 	2) altering url parameters 
 * 	3) doing ajax requests. 
 * 	4) doing redirects
 * 
 */

H.Url = function(sUrl) {
	return new H.Url.engine(sUrl);
};

H.Url.maxConcurrentRequests = 1;

H.Url.serialize = function(o) {
	var a = [],
		sKey;
		
	for (sKey in o) {
		a.push(sKey + '=' + encodeURIComponent(o[sKey]));
	}
	return a.join('&');
}

H.Url.unserialize = function(s) {
	var aPairs = s.split('&'), 
		n, 
		o = {},
		a = [];
		
	for (n=0; n<aPairs.length; n++) {
		a = aPairs[n].split('=');
		o[a[0]] = a[1];
	}
	return o;
}

/********************************************************************/

H.Url.engine = function(sUrl) {
	var _oThis	 	= this,
		_bRelative	= false,
		_bLSlash	= false,
		_bProtocol	= false,
		_o			= {
			'protocol'	: null,
			'server'	: null,
			'port'		: 80,
			'path'		: [],
			'file'		: null,	
			'params'	: {},
			'hash'		: null
		}
	
	function _init() {
		if (sUrl) {	_fromString(sUrl); }
	}
	
	function _trim(s) {
		return s.replace(/(^[\s\xA0]+|[\s\xA0]+$)/g, '');
	}
	
	function _isDefined(m) {
		return typeof m != 'undefined';
	}
	
	function _fromString(s) {
		var a, a1;
		
		s = _trim(s);
		if (s[0] == '/') {
			_bLSlash = true;
			s = s.substring(1);
		}
		
		// Parse protocol
		a = s.split('://', 2);
		if (a.length > 1) {
			_bProtocol = true;
			_oThis.protocol(a[0]);
			s = a[1];
		}
		
		// Parse hash
		a = s.split('#', 2);
		if (a.length > 1) {
			_oThis.hash(a[1]);
			s = a[0];
		}
		
		// Parse query
		a = s.split('?', 2);
		if (a.length > 1) {
			_o.params = H.Url.unserialize(a[1]);
			s = a[0];
		}
		
		// Parse server
		a = s.split('/');
		if (a.length > 1) { /// TODO: account for case like http://google.com
			if (a[0].indexOf('.') > 0 || a[0] == 'localhost') {
				a1 = a[0].split(':');
				_oThis.server(a1[0]);
				_oThis.port(a1[1]);
				a.splice(0, 1);
			}
		} else {
			if (_bProtocol) {
				_oThis.server(a[0]);
			} else {
				_oThis.file(a[0]);
			}
			a.splice(0, 1);
		}
		s = a.join('/');
		
		if (!_o.server) {
			_bRelative = true;
		}
		
		_oThis.path(s);
	}	
	
	function _toString() {
		var sProtocol	= _o.protocol || 'http',
			sServer		= _o.server ? _o.server : '',
			sPort		= (_o.port == '80' || !_o.port ) ? '' : ':' + _o.port,
			sPath		= _oThis.path(),
			sFile		= _o.file ? '/' + _o.file : '',
			sParams 	= H.Url.serialize(_o.params),
			sHash		= _o.hash ? '#' + _o.hash : '';
			sParams 	= (sParams.length > 0 ? '?' + sParams : '');
		
		if (_bRelative) {
			return (_bLSlash ? '/' : '') +
				sPath +
				sFile +
				sParams +
				sHash;
		}
		return  sProtocol + '://' + 
			sServer + 
			sPort + '/' + 
			sPath +
			sFile +
			sParams +
			sHash;
	}
	
	this.protocol = function(s) {
		if (s) 	{ 
			s = s.toLowerCase();
			_o.protocol = (s == 'https') 
				? 'https' 
				: 'http';
			return this;
		} 
		return _o.protocol || 'http';
	}
	
	this.server = function(s) {
		if (s) {
			s = s.toLowerCase();
			_o.server = s;
			return this;
		}
		return _o.server || '';
	}
	
	this.port = function(n) {
		if (n) { 
			n = parseInt(n, 10);
			_o.port = n;
			return this;
		} 
		return _o.port;
	}
	
	this.path = function(s) {
		if (s) {
			if (typeof s['join'] != 'undefined') {
				_o.path = s;
			} else {
				s = s.toLowerCase().replace(/^[^a-z0-9_]/, '').replace(/[^a-z0-9_]$/, '');
				var a = s.split('/');
				var sLast = a[a.length-1];
				if (sLast.indexOf('.') != -1) {
					_o.file = sLast;
					a.splice(a.length-1, 1);
				}
				_o.path = a;
			}
			return this;
		}
		return _o.path.join('/');
	}
	
	this.file = function(s) {
		if (s) {
			_o.file = s;
			return this;
		}
		return _o.file;
	}
	
	this.query = function(s) {
		if (s) {
			_o.params = H.Url.unserialize(s);
			return this;
		}
		return H.Url.serialize(_o.params);
	}
	
	this.param = function(sKey, sValue) {
		if (!sValue) {
			if (!sKey) {
				return _o.params;
			}
			if (typeof sKey == 'object') {
				for (var s in sKey) {
					this.param(s, sKey[s]);
				}
			} else {
				return _o.params[sKey];
			}
		} else {
			_o.params[sKey] = sValue;
		}
		return this;
	}
	
	this.params = function(oParams) {
		if (!oParams) {
			return _o.params;
		} else {
			var s;
			for (s in oParams) {
				this.param(s, oParams[s]);
			}
		}
		return this;
	}
	
	this.hash = function(s) {
		if (s) {
			_o.hash = s;
			return this;
		}
		return _o.hash || '';
	}
	
	this.url = function(s) {
		if (s) {
			_fromString(s);
			return this;
		}
		return _toString();
	}
	
	this.urlComponents = function(o) {
		if (o) {
			var sKey;
			for (sKey in o) {
				if (typeof _o[sKey] != 'undefined') {
					_o[sKey] = o[sKey];
				}
			}
			return this;
		}
		return _o;
	}
	
	// TODO: post
	this.request = function(oOptions, fSuccess, fError) {
		H.mixin(oOptions, {
			hostname : this.server(),
			port	 : this.port(),
			path	 : '/' + this.path() + '/' + this.file() + '?' + this.query(),
			method	 : 'GET'
		});
		
		return require(this.protocol()).request(oOptions, function(oResponse) {
			var sData = '';
			oResponse.on('data', function(sMoreData) {
				sData += sMoreData;
			});
			oResponse.on('end', function() {
				fSuccess(oResponse, sData)
			});
		}).on('error', function(oError) {
			fError(oError);
		}).end();
	}
	
	_init();
}
	