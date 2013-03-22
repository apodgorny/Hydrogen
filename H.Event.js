H.Event = {
	emitter: null,
		
	initialize: function() {
		var oEvents = require('events');
		H.Event.emitter = new oEvents.EventEmitter();
	},
	
	on: function(sEvent, fCallback, bSubscribe) {
		if (!H.isDefined(bSubscribe) || bSubscribe) {
			H.Event.emitter.addListener(sEvent, fCallback);
		} else {
			H.Event.emitter.removeListener(sEvent, fCallback);
		}
	},
	
	emit: function(sEvent, oData) {
		var oCaller = arguments.callee.caller,
			oSender;
			
		if (H.isDefined(oCaller.contextId)) {
			oData.sender = H.getInstance(oCaller.contextId);
		}
		
		oData.event = sEvent;
		
		H.Event.emitter.emit(sEvent, oData);
	}
}