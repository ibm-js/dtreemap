define(["dcl/dcl", "dojo/dom-construct", "dojo/dom-style"], function (dcl, domConstruct, domStyle) {

	return dcl(null, {
		// summary:
		//		Specializes TreeMap to remove leaf labels and display group labels centered on group
		//		content instead of display them in headers.

		createRenderer: dcl.superCall(function (sup) {
			return function (item, level, kind) {
				var renderer = sup.call(this, item, level, kind);
				if (kind === "content" || kind === "leaf") {
					var p = domConstruct.create("div");
					domStyle.set(p, {
						"zIndex": 30,
						"position": "relative",
						"height": "100%",
						"textAlign": "center",
						"top": "50%",
						"marginTop": "-.5em"
					});
					domConstruct.place(p, renderer);
				}
				return renderer;
			};
		}),

		styleRenderer: function (renderer, item, level, kind) {
			switch (kind) {
			case "leaf":
				/* jshint -W086 */
				domStyle.set(renderer, "background", this.getColorForItem(item).toHex());
			case "content":
				/* jshint +W086 */
				if (level === 0) {
					renderer.firstChild.innerHTML = this.getLabelForItem(item);
				} else {
					renderer.firstChild.innerHTML = null;
				}
				break;
			case "header":
				domStyle.set(renderer, "display", "none");
			}
		}
	});
});