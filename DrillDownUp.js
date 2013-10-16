define(["dojo/_base/lang", "dojo/_base/event", "dcl/dcl", "dojo/on", "dojo/dom-geometry", "dojo/dom-construct",
	"dojo/dom-style", "dojo/_base/fx", "dojo/has!touch?dojox/gesture/tap"],
	function (lang, event, dcl, on, domGeom, domConstruct, domStyle, fx, tap) {

	return dcl(null, {
		// summary:
		//		Specializes TreeMap to support drill down and up operations.

		postCreate: function () {
			this.own(on(this, "dblclick", lang.hitch(this, this._onDoubleClick)));
			if (tap) {
				this.own(on(this, tap.doubletap, lang.hitch(this, this._onDoubleClick)));
			}
		},

		_onDoubleClick: function (e) {
			var renderer = this._getRendererFromTarget(e.target);
			if (renderer.item) {
				var item = renderer.item;
				if (this._isLeaf(item)) {
					// walk up
					item = renderer.parentItem;
					renderer = this.itemToRenderer[this.getIdentity(item)];
					// our leaf parent is the root, we can't do much...
					if (renderer == null) {
						return;
					}
				}
				// Drill up
				if (this.rootItem === item) {
					this.drillUp(renderer);
				} else {
					this.drillDown(renderer);
				}
				event.stop(e);
			}
		},

		drillUp: function (renderer) {
			// summary:
			//		Drill up from the given renderer.
			// renderer: DomNode
			//		The item renderer.
			var item = renderer.item;

			// Remove the current rootItem renderer
			// rebuild the tree map
			// and animate the old renderer before deleting it.

			this.removeChild(renderer);
			var parent = this._getRenderer(item).parentItem;
			this.rootItem = parent;
			this.validate();

			// re-add the old renderer to show the animation
			domConstruct.place(renderer, this);

			domStyle.set(renderer, "zIndex", 40);

			var finalBox = domGeom.position(this._getRenderer(item), true);
			var corner = domGeom.getMarginBox(this);

			fx.animateProperty({
				node: renderer,
				duration: 500,
				properties: {
					left: {
						end: finalBox.x - corner.l
					},
					top: {
						end: finalBox.y - corner.t
					},
					height: {
						end: finalBox.h
					},
					width: {
						end: finalBox.w
					}
				},
				onAnimate: lang.hitch(this, function () {
					var box = domGeom.getContentBox(renderer);
					this._layoutGroupContent(renderer, box.w, box.h, renderer.level + 1, false, true);
				}),
				onEnd: lang.hitch(this, function () {
					this.removeChild(renderer);
				})
			}).play();
		},

		drillDown: function (renderer) {
			// summary:
			//		Drill up from the given renderer.
			// renderer: DomNode
			//		The item renderer.
			var box = domGeom.getMarginBox(this);
			var item = renderer.item;

			// Set the new root item into the rootPanel to make it appear on top
			// of the other nodes, and keep the same global location
			var parentNode = renderer.parentNode;
			var spanInfo = domGeom.position(renderer, true);
			parentNode.removeChild(renderer);
			domConstruct.place(renderer, this);
			domStyle.set(renderer, {
				left: (spanInfo.x - box.l) + "px",
				top: (spanInfo.y - box.t) + "px"
			});
			var zIndex = domStyle.get(renderer, "zIndex");
			domStyle.set(renderer, "zIndex", 40);

			fx.animateProperty({
				node: renderer,
				duration: 500,
				properties: {
					left: {
						end: box.l
					},
					top: {
						end: box.t
					},
					height: {
						end: box.h
					},
					width: {
						end: box.w
					}
				},
				onAnimate: lang.hitch(this, function () {
					var box2 = domGeom.getContentBox(renderer);
					this._layoutGroupContent(renderer, box2.w, box2.h, renderer.level + 1, false);
				}),
				onEnd: lang.hitch(this, function () {
					domStyle.set(renderer, "zIndex", zIndex);
					this.rootItem = item;
				})
			}).play();
		}
	});
});