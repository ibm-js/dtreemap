/** @module dtreemap/Keyboard */
define(["dcl/dcl", "./_utils", "dpointer/events"],
	function (dcl, utils) {

	/**
	 * Mixin that specializes TreeMap to support keyboard navigation and accessibility.
	 * @mixin module:dtreemap/Keyboard
	 */
	return dcl(null, /** @lends module:dtreemap/Keyboard# */ {
		constructor: function () {
		},

		postRender: function () {
			this.on("keydown", this._keyDownHandler.bind(this));
			this.on("pointerdown", this._pointerDownHandler.bind(this));
			if (!this.hasAttribute("tabindex")) {
				this.tabIndex = "0";
			}
			this.on("focusin", this._focusInHandler.bind(this));
		},

		createRenderer: dcl.superCall(function (sup) {
			return function (item, level, kind) {
				var renderer = sup.call(this, item, level, kind);
				// on Firefox we need a tabindex on sub divs to let the keyboard event be dispatched
				// put -1 so that it is not tablable
				renderer.setAttribute("tabindex", "-1");
				return renderer;
			};
		}),

		_focusInHandler: function () {
			// if no selection, select first item
			if (!this.selectedItem) {
				this.selectedItem = this.firstChild.firstChild.item;
			}
		},
		
		_pointerDownHandler: function () {
			this.focus();
		},

		_keyDownHandler: function (e) {
			var selected = this.selectedItem;
			if (!selected) {
				return;
			}
			var renderer = this.itemToRenderer[this.getIdentity(selected)];
			var parent = renderer.parentItem;
			var children, childrenI, selectedI;
			// we also need items to be sorted out
			if (e.key !== "Up" && e.key !== "Subtract" &&
				e.key !== "Add") {
				children = (e.key === "Down") ? selected.children : parent.children;
				if (children) {
					childrenI = utils.initElements(children, this._computeAreaForItem.bind(this)).elements;
					selectedI = childrenI[children.indexOf(selected)];
					childrenI.sort(function (a, b) {
						return b.size - a.size;
					});
				} else {
					return;
				}
			}
			this._navigate(e, renderer, selected, parent, children, childrenI, selectedI);

		},

		_navigate: function (e, renderer, selected, parent, children, childrenI, selectedI) {
			var newSelected;
			switch (e.key) {
			case "Left":
				newSelected = children[childrenI[Math.max(0, childrenI.indexOf(selectedI) - 1)].index];
				break;
			case "Right":
				newSelected = children[childrenI[Math.min(childrenI.length - 1,
					childrenI.indexOf(selectedI) + 1)].index];
				break;
			case "Down":
				newSelected = children[childrenI[0].index];
				break;
			case "Up":
				newSelected = parent;
				break;
			// TODO
			//case "+":
			case "Add":
				if (!this._isLeaf(selected) && this.drillDown) {
					this.drillDown(renderer);
					e.preventDefault();
					e.stopPropagation();
				}
				break;
			// TODO
			//case "-":
			case "Subtract":
				if (!this._isLeaf(selected) && this.drillUp) {
					this.drillUp(renderer);
					e.preventDefault();
					e.stopPropagation();
				}
				break;
			}
			if (newSelected) {
				this._selectItem(e, newSelected);
			}
		},

		_selectItem: function (e, selected) {
			if (!this._isRoot(selected)) {
				this.selectedItem = selected;
				e.preventDefault();
				e.stopPropagation();
			}
		}
	});
});