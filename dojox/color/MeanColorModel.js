define(["dojo/_base/array", "dojo/_base/declare", "./_NeutralColorModel"], 
	function(arr, declare, _NeutralColorModel){
	
	return declare("dojox.color.MeanColorModel", _NeutralColorModel, {
	
		constructor: function(startColor, endColor){
		},
			
		computeNeutral: function(min, max, sum, values){
			var median = min;
			if(values.length != 0){
				if(values.length < 3){
					median = sum / values.length;
				}else if((values.length & 1) == 0){
					median = (values[values.length / 2 - 1] + values[values.length / 2]) / 2;
				}else{
					median = values[Math.floor(values.length / 2)];
				}
			}
			return median;
		}
	});
});
