define(["dojo/_base/declare", "dojo/_base/lang", "dojo/Stateful"], 
	function(declare, lang, Stateful){
		
	/*=====
	var Stateful = dojo.Stateful;
	=====*/
	
	return declare("dojox.widget._Invalidating", Stateful, {
		watchedProperties: null,
		_invalidRendering: false,
		postscript: function(){
			this.inherited(arguments);		
			if(this.watchedProperties){
				var props = this.watchedProperties;
				for(var i = 0; i < props.length; i++){
					this.watch(props[i], lang.hitch(this, this.invalidateRendering));
				}
			}
		},
		invalidateRendering: function(){
			if(!this._invalidRendering){
				this._invalidRendering = true;
				setTimeout(lang.hitch(this, this.validateRendering), 0);
			}
		},
		validateRendering: function(){
			if(this._invalidRendering){
				this.refreshRendering();
				this._invalidRendering = false;
			}
		},
		refreshRendering: function(){
			// actually do the refresh
		}
	});
});
