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
};

H.on = H.Event.on;
H.emit = H.Event.emit;

H.bind = function(o1, sProp1) {
	return {
		to: function(o2, sProp2) {
			H.Event.on(H.Events.CHANGE, function(oData) {
				if (oData.sender === o2 && oData.property == sProp2) {
					o1[sProp1] = oData.newValue;
				}
			})
		}
	}
};