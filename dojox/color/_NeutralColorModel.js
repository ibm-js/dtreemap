define(["dojo/_base/array", "dojo/_base/declare", "dojox/color", "./_ColorModelBase"], 
	function(arr, declare, Color, _ColorModelBase){
	
	return declare("dojox.color._NeutralColorModel", _ColorModelBase, {
	
		_min: 0, 
		_max: 0, 
		_e: 0,
	
		constructor: function(startColor, endColor){
		},
	
		initialize: function(items, colorFunc){
			var values = [];
			var sum = 0;
			var min = 100000000; 
			var max = -min; 
			arr.forEach(items, function(item){
				var value = colorFunc(item);
				min = Math.min(min, value);
				max = Math.max(max, value);
				sum += value;
				values.push(value);
			});
			values.sort();
			var neutral = this.computeNeutral(min, max, sum, values);
			this._min = min;
			this._max = max;
			if(this._min == this._max || neutral == this._min){
				this._e = -1;
			}else{
				this._e = Math.log(.5) / Math.log((neutral - this._min) / (this._max - this._min));
			}
		},
		
		getNormalizedValue: function(value){
			if(this._e < 0){
				return 0;
			}
			value = (value - this._min) / (this._max - this._min);
			return Math.pow(value, this._e);
		}
	});

});
