/** @module dtreemap/DrillDownUp */
define(["dcl/dcl", "dojo/dom-geometry", "dojo/_base/fx", "delite/css!./themes/DrillDownUp.css", "dpointer/events"],
	function (dcl, domGeom, fx) {
		
	/**
	 * Mixin that specializes TreeMap to support drill down and up operations.
	 * @mixin module:dtreemap/DrillDownUp
	 */
	return dcl(null, /** @lends module:dtreemap/DrillDownUp# */ {

		postCreate: function () {
			this.on("dblclick", this._dblClickHandler.bind(this));
		},

		_dblClickHandler: function (e) {
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
				e.preventDefault();
				e.stopPropagation();
			}
		},

		/**
		 * Drill up from the given item renderer.
		 * @param {Element} renderer The item renderer.
		 */
		drillUp: function (renderer) {
			var item = renderer.item;
			var self = this;

			// Remove the current rootItem renderer
			// rebuild the tree map
			// and animate the old renderer before deleting it.

			var parentNode = renderer.parentNode;
			parentNode.removeChild(renderer);
			this.rootItem = this._getRenderer(item).parentItem;
			this.deliver();

			// re-add the old renderer to show the animation
			this.containerNode.appendChild(renderer);

			renderer.style.zIndex = 40;

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
				onAnimate: function () {
					var box = domGeom.getContentBox(renderer);
					self._layoutGroupContent(renderer, box.w, box.h, renderer.level + 1, false, true);
				},
				onEnd: function () {
					parentNode.removeChild(renderer);
				}
			}).play();
		},

		/**
		 * Drill down on the given item renderer.
		 * @param {Element} renderer The item renderer.
		 */
		drillDown: function (renderer) {
			var box = domGeom.getMarginBox(this);
			var item = renderer.item;
			var self = this;

			// Set the new root item into the rootPanel to make it appear on top
			// of the other nodes, and keep the same global location
			var parentNode = renderer.parentNode;
			parentNode.removeChild(renderer);
			this.containerNode.appendChild(renderer);
			var zIndex = renderer.style.zIndex;
			renderer.style.zIndex = 40;

			fx.animateProperty({
				node: renderer,
				duration: 500,
				properties: {
					left: {
						end: 0
					},
					top: {
						end: 0
					},
					height: {
						end: box.h
					},
					width: {
						end: box.w
					}
				},
				onAnimate: function () {
					var box2 = domGeom.getContentBox(renderer);
					self._layoutGroupContent(renderer, box2.w, box2.h, renderer.level + 1, false);
				},
				onEnd: function () {
					renderer.style.zIndex = zIndex;
					self.rootItem = item;
				}
			}).play();
		}
	});
});