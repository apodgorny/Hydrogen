var HydrogenError = function(sMessage, sFileName, sLineNumber, sColumn, sCode) {
	
	this.name		= 'HydrogenError';
	this.message 	= sMessage;
	this.fileName 	= sFileName;
	this.lineNumber = sLineNumber;
	this.column 	= sColumn;
	
	this.toString = function() {
		return (
			this.name + ': "' + this.message + '" in ' + this.fileName
			 // + ':' +
			 // 			this.lineNumber + ':' + 
			 // 			this.column
		);
	}
}

HydrogenError.createFromError = function(oError, sFile, sCode) {
	if (oError.name == HydrogenError.name) { return oError; }
	
	var sFileName = sFile,
		sLineNumber,
		sColumn;
		
	if (oError.stack) {
		var aLines = oError.stack.split('\n'),
			oRegEx = /at ([^ ]*) \(([^:]*):([0-9]*):([0-9]*)\)/,
			aMatches,
			n = 0;
		
		
		while(!(aMatches = aLines[n].match(oRegEx))) {
			n ++;
		}
		
		if (aMatches) {
			sFileName	= sFile || oError.fileName || aMatches[2];
			sLineNumber	= aMatches[3];
			sColumn		= aMatches[4];
		}
	}
	
	return new HydrogenError(oError.message, sFileName, sLineNumber, sColumn, sCode);
}

module.exports.HydrogenError = HydrogenError;