define(["dcl/dcl", "dojo/dom-construct", "delite/css!./themes/GroupLabel.css"],
	function (dcl, domConstruct) {

	return dcl(null, {
		// summary:
		//		Specializes TreeMap to remove leaf labels and display group labels centered on group
		//		content instead of display them in headers.

		createRenderer: dcl.superCall(function (sup) {
			return function (item, level, kind) {
				var renderer = sup.call(this, item, level, kind);
				if (kind === "content" || kind === "leaf") {
					var p = domConstruct.create("div");
					dcl.mix(p.style, {
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