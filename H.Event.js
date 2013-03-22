H.Event = {
	receive	: function(sEvent) {},
	send	: function(sEvent, oData) {
		var oCaller = arguments.callee.caller,
			oSender;
			
		if (typeof oCaller.contextId != 'undefined') {
			oSender = H.getInstance(oCaller.contextId);
		}
		
		console.log(sEvent, oData.oldValue, oData.newValue, oSender.name, 'Caller:', oCaller.methodName);
	}
}