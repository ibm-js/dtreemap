define(["dojo/_base/declare", "dojo/dom-geometry", "dojo/dom-construct", "dojo/dom-style"],
	function(declare, domGeom, domConstruct, domStyle) {

	return declare("dojox.treemap.ScaledLabel", null, {
		//	summary:
		//		Specialize TreeMap to display scaled leaf label instead of constant size labels.

		onRendererUpdated: function(evt) {
			var renderer = evt.renderer;
			var hRatio = domGeom.getMarginBox(renderer).w / domGeom.getMarginBox(renderer.firstChild).w;
			var hDiff = domGeom.getContentBox(renderer).w - domGeom.getMarginBox(renderer.firstChild).w;
			var vDiff = domGeom.getContentBox(renderer).h - domGeom.getMarginBox(renderer.firstChild).h;
			var oldSize = parseInt(domStyle.get(renderer.firstChild, "fontSize"));
			var newSize = oldSize * hRatio;
			while (true) {
				domStyle.set(renderer.firstChild, "fontSize", newSize + "px");
				hDiff = domGeom.getContentBox(renderer).w - domGeom.getMarginBox(renderer.firstChild).w;
				vDiff = domGeom.getContentBox(renderer).h - domGeom.getMarginBox(renderer.firstChild).h;
				if (vDiff < 0 || hDiff < 0) {
					// back track
					domStyle.set(renderer.firstChild, "fontSize", oldSize + "px");
					break;
				}
				oldSize = newSize;
				newSize += 0.5;
			}
		},

		createRenderer: function(item, level, kind) {
			var renderer = this.inherited(arguments);
			if (kind == "leaf") {
				var p = domConstruct.create("div");
				domStyle.set(p, {
					"position": "absolute",
					"width": "auto"
				});
				renderer.appendChild(p);
			}
			return renderer;
		},
		
		styleRenderer: function(renderer, item, level, kind) {
			if (kind != "leaf") {
				this.inherited(arguments);
			} else {
				domStyle.set(renderer, "background", this.getColorForItem(item).toHex());
				renderer.firstChild.innerHTML = this.getLabelForItem(item);
			}
		}
	});
});