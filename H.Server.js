H.Server = new function() {
	this.host		= '127.0.0.1';
	this.port		= '8000';
	this.server 	= null;
	this.endpoints 	= {};	
	this.isRunning 	= false;
	
	this.start = function(nPort) {
		if (this.isRunning) { return; }
		
		nPort = nPort || this.port;
		
		var oHttp = require('http'),
			oThis = this;

		this.server = oHttp.createServer(function (oRequest, oResponse) {
			var sUrl = 'http://' + oThis.host + ':' + oThis.port + oRequest.url,
				oUrl = new H.Url(sUrl),
				sPath = oUrl.path(),
				oEndpoint = null,
				sResponse = '';
				
			if (H.isDefined(oThis.endpoints[sPath])) {
				oEndpoint = oThis.endpoints[sPath];
				sResponse = oEndpoint.callback.apply(oEndpoint.context, [oUrl]) || '';
			}

			oResponse.writeHead(200, {'Content-Type': 'text/html'});
			oResponse.end(sResponse + '\n');
		});
		
		this.server.listen(nPort);
		this.isRunning = true;
	}
	
	this.stop = function() {
		this.server.close();
		this.isRunning = false;
	}
	
	this.createEndpoint = function(sPath, oContext, fCallback) {
		if (sPath.charAt(0) != '/') {
			sPath = '/' + sPath;
		}
		
		var sUrl = 'http://' + this.host + ':' + this.port + sPath,
			oUrl = new H.Url(sUrl);
			
		console.log('Created endpoint: "' + oUrl.path() + '"');
		this.endpoints[oUrl.path()] = {
			url		 : oUrl,
			callback : fCallback,
			context	 : oContext || null
		};
	}
}