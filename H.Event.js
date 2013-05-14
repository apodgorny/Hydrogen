H.Event = {
	emitter: null,
		
	initialize: function() {
		var oEvents = require('events');
		H.Event.emitter = new oEvents.EventEmitter();
		H.Event.emitter.setMaxListeners(100)
	},
	
	on: function(sEvent, fCallback, bSubscribe) {
		if (!H.isDefined(bSubscribe) || bSubscribe) {
			H.Event.emitter.addListener(sEvent, fCallback);
		} else {
			H.Event.emitter.removeListener(sEvent, fCallback);
		}
	},
	
	emit: function(sEvent, oData) {
		// console.log('EMITTING:', sEvent, oData);
		H.Event.emitter.emit(sEvent, oData);
	},

	bind: function(oDst, sDstProp) {
		return {
			to: function(oSrc, sSrcProp) {
				var sDstName = (oDst == 'STDOUT') ? 'STDOUT' : oDst.kindName + '.' + sDstProp,
					sSrcName = (oSrc == 'STDIN' ) ? 'STDIN'  : oSrc.kindName + '.' + sSrcProp;
				
				if (oSrc == 'STDIN') {
					process.stdin.on('data', function(sData) {
						sData = sData.trim();
						var a = sData.split('\n');
						for (var n=0; n<a.length; n++) {
							var s = a[n],
								nInt, 
								nFloat;
								
							//console.log(':::', sDstName, '<=', sSrcName, '(' + s + ')');
						
							if 		(nFloat = parseFloat(s)) { s = nFloat; }
							else if (nInt = parseInt(s, 10)) { s = nInt;   }
						
							if (oDst == 'STDOUT') { process.stdout.write(s + '\n');} 
							else 				  { oDst[sDstProp] = s; }
						}
					});
				} else {																 // console.log('BINDING ADDED:', sDstName, '<=', sSrcName);
					H.Event.on('CHANGE', function(oEvent) {
						if (oEvent.sender === oSrc && oEvent.property == sSrcProp) {
							// console.log('BINDING TRIGGERED:', sDstName, '<=', sSrcName, '(' + oEvent.newValue + ')');
							if (oDst == 'STDOUT') { process.stdout.write(oEvent.newValue + '\n'); } 
							else 				  { oDst[sDstProp] = oEvent.newValue; }
						}
					})
				}
			}
		}
	}
}

H.Event.initialize();

H.on     = H.Event.on;
H.emit   = H.Event.emit;
H.bind   = H.Event.bind;