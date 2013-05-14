H.kind(
	'H.Object', {
		$: {},
		
		events: {
			CONSTRUCT : function() { return {}; },
			DESTRUCT  : function() { return {}; },
			CHANGE	  : function(sProperty, mOldValue, mNewValue) {
				return {
					property : sProperty,
					oldValue : mOldValue,
					newValue : mNewValue
				}
			}
		},
		
		handlers: {
		},
		
		statics: {
			construct: function(oParams, oOwner) { return H.construct(this.kindName, oParams, oOwner); }
		},
		
		log: function() {
			console.log(''.pad('<', 60));
			console.log(this.kindName + '[id:' + this.id + '].' + arguments.callee.caller.methodName + '():');
			for (var n=0; n<arguments.length; n++) {
				//console.log(''.pad('-', 60));
				switch (typeof arguments[n]) {
					case 'object':
						console.log('{');
						for (var sProp in arguments[n]) {
							console.log('\t' + sProp + ': ' + arguments[n][sProp]);
						}
						console.log('}');
						break;
					case 'string':
						console.log('"' + arguments[n] + '"');
						break;
					default:
						console.log(arguments[n]);
						break;
				}
			}
			console.log(''.pad('>', 60));
		},
		
		error: function() {
			var sError = 'Error in ' + this.kindName + '[id:' + this.id + '].' + arguments.callee.caller.methodName + '(): \n\t',
				aError = [];
				
			for (var n=0; n<arguments.length; n++) {
				aError.push(arguments[n]);
			}
			sError += '"' + aError.join(' ') + '"';
			H.error(sError);
		},
		
		addComponent: function(o) {
			this.$[o.name] = H.construct(o.kind, o, this);
		},
		
		removeComponent: function(sName) {
			if (H.isDefined(this.$[sName])) {
				if (H.isDefined(this.$[sName].destruct)) {
					this.$[sName].destruct();
				}
				delete this.$[sName];
			}
		},
		
		addComponents: function(a) {
			var n = 0;
			for (;n<a.length; n++) {
				this.addComponent(a[n]);
			}
		},
		
		onConstruct: function() {
			this.inherited();
			// Process components
			if (H.isArray(this.components)) {
				this.addComponents(this.components);
			}			
		},
		
		onDestruct: function() {},
		
		onChange: function(oEvent) {
			var sOnPropChange = 'on' + (oEvent.property).capitalize() + 'Change';
			if (H.isFunction(this[sOnPropChange])) {
				this[sOnPropChange].apply(this, [oEvent]);
			}
		},
		
		toString: function() {
			return 'H.Object';
		}
	}
);