/** @module dtreemap/GroupLabel */
define(["dcl/dcl", "delite/css!./themes/GroupLabel.css"],
	function (dcl) {

	/**
	 * Mixin that specializes TreeMap to remove leaf labels and display group labels centered on group
	 * content instead of display them in headers.
	 * @mixin module:dtreemap/GroupLabel
	 */
	return dcl(null, /** @lends module:dtreemap/GroupLabel# */ {
		createRenderer: dcl.superCall(function (sup) {
			return function (item, level, kind) {
				var renderer = sup.call(this, item, level, kind);
				if (kind === "content" || kind === "leaf") {
					var p = this.ownerDocument.createElement("div");
					dcl.mix(p.style, {
						"zIndex": 30,
						"position": "relative",
						"height": "100%",
						"textAlign": "center",
						"top": "50%",
						"marginTop": "-.5em"
					});
					renderer.appendChild(p);
				}
				return renderer;
			};
		}),

		styleRenderer: function (renderer, item, level, kind) {
			switch (kind) {
			case "leaf":
				renderer.style.background = this.getColorForItem(item).toHex();
				/* falls through */
			case "content":
				if (level === 0) {
					renderer.firstChild.innerHTML = this.getLabelForItem(item);
				} else {
					renderer.firstChild.innerHTML = null;
				}
				break;
			case "header":
				renderer.style.display = "none";
			}
		}
	});
});