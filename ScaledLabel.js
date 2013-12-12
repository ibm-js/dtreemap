define(["dcl/dcl", "dojo/dom-geometry", "dojo/dom-construct", "dojo/dom-style"],
	function (dcl, domGeom, domConstruct, domStyle) {

	var treemapRendererUpdatedHandler = function (evt) {
		if (evt.kind === "leaf") {
			var renderer = evt.renderer;
			// start back with default size
			var oldSize = domStyle.get(renderer, "fontSize");
			domStyle.set(renderer.firstChild, "fontSize", oldSize);
			oldSize = parseInt(oldSize, 10);
			var hRatio = 0.75 * domGeom.getContentBox(renderer).w / domGeom.getMarginBox(renderer.firstChild).w;
			var vRatio = domGeom.getContentBox(renderer).h / domGeom.getMarginBox(renderer.firstChild).h;
			var hDiff = domGeom.getContentBox(renderer).w - domGeom.getMarginBox(renderer.firstChild).w;
			var vDiff = domGeom.getContentBox(renderer).h - domGeom.getMarginBox(renderer.firstChild).h;
			var newSize = Math.floor(oldSize * Math.min(hRatio, vRatio));
			while (vDiff > 0 && hDiff > 0) {
				domStyle.set(renderer.firstChild, "fontSize", newSize + "px");
				hDiff = domGeom.getContentBox(renderer).w - domGeom.getMarginBox(renderer.firstChild).w;
				vDiff = domGeom.getContentBox(renderer).h - domGeom.getMarginBox(renderer.firstChild).h;
				oldSize = newSize;
				newSize += 1;
			}
			if (vDiff < 0 || hDiff < 0) {
				// back track
				domStyle.set(renderer.firstChild, "fontSize", oldSize + "px");
			}
		}
	};

	return dcl(null, {
		// summary:
		//		Specializes TreeMap to display scaled leaf labels instead of constant size labels.

		preCreate: function () {
			this.on("treemap-renderer-updated", treemapRendererUpdatedHandler);
		},

		createRenderer: dcl.superCall(function (sup) {
			return function (item, level, kind) {
				var renderer = sup.call(this, item, level, kind);
				if (kind === "leaf") {
					var p = domConstruct.create("div");
					domStyle.set(p, {
						"position": "absolute",
						"width": "auto"
					});
					domConstruct.place(p, renderer);
				}
				return renderer;
			};
		}),

		styleRenderer: dcl.superCall(function (sup) {
			return function (renderer, item, level, kind) {
				if (kind !== "leaf") {
					sup.call(this, renderer, item, level, kind);
				} else {
					domStyle.set(renderer, "background", this.getColorForItem(item).toHex());
					renderer.firstChild.innerHTML = this.getLabelForItem(item);
				}
			};
		})
	});
});