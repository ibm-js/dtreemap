/** @module dtreemap/ScaledLabel */
define(["dcl/dcl", "dojo/dom-geometry"], function (dcl, domGeom) {

	var treemapRendererUpdatedHandler = function (evt) {
		if (evt.kind === "leaf") {
			var renderer = evt.renderer;
			// start back with default size
			var oldSize = renderer.ownerDocument.defaultView.getComputedStyle(renderer, null).fontSize;
			renderer.firstChild.style.fontSize = oldSize;
			oldSize = parseInt(oldSize, 10);
			var hRatio = 0.75 * domGeom.getContentBox(renderer).w / domGeom.getMarginBox(renderer.firstChild).w;
			var vRatio = domGeom.getContentBox(renderer).h / domGeom.getMarginBox(renderer.firstChild).h;
			var hDiff = domGeom.getContentBox(renderer).w - domGeom.getMarginBox(renderer.firstChild).w;
			var vDiff = domGeom.getContentBox(renderer).h - domGeom.getMarginBox(renderer.firstChild).h;
			var newSize = Math.floor(oldSize * Math.min(hRatio, vRatio));
			while (vDiff > 0 && hDiff > 0) {
				renderer.firstChild.style.fontSize = newSize + "px";
				hDiff = domGeom.getContentBox(renderer).w - domGeom.getMarginBox(renderer.firstChild).w;
				vDiff = domGeom.getContentBox(renderer).h - domGeom.getMarginBox(renderer.firstChild).h;
				oldSize = newSize;
				newSize += 1;
			}
			if (vDiff < 0 || hDiff < 0) {
				// back track
				renderer.firstChild.style.fontSize = oldSize + "px";
			}
		}
	};

	/**
	 * Mixin that specializes TreeMap to display scaled leaf labels instead of constant size labels.
	 * @mixin module:dtreemap/Keyboard
	 */
	return dcl(null, /** @lends module:dtreemap/ScaledLabel# */ {
		preCreate: function () {
			this.on("treemap-renderer-updated", treemapRendererUpdatedHandler);
		},

		createRenderer: dcl.superCall(function (sup) {
			return function (item, level, kind) {
				var renderer = sup.call(this, item, level, kind);
				if (kind === "leaf") {
					var p = this.ownerDocument.createElement("div");
					dcl.mix(p.style, {
						"position": "absolute",
						"width": "auto"
					});
					renderer.appendChild(p);
				}
				return renderer;
			};
		}),

		styleRenderer: dcl.superCall(function (sup) {
			return function (renderer, item, level, kind) {
				if (kind !== "leaf") {
					sup.call(this, renderer, item, level, kind);
				} else {
					renderer.style.background = this.getColorForItem(item).toHex();
					renderer.firstChild.innerHTML = this.getLabelForItem(item);
				}
			};
		})
	});
});