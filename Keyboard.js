define(["dcl/dcl", "dojo/on", "dojo/keys", "./_utils", "delite/focus", "dpointer/events"],
	function (dcl, on, keys, utils) {

	return dcl(null, {
		// summary:
		//		Specializes TreeMap to support keyboard navigation and accessibility.

		// tabIndex: String
		//		Order fields are traversed when user hits the tab key
		tabIndex: "0",

		constructor: function () {
		},

		postCreate: function () {
			this.own(on(this, "keydown", this._keyDownHandler.bind(this)));
			this.own(on(this, "pointerdown", this._pointerDownHandler.bind(this)));
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
			if (e.keyCode !== keys.UP_ARROW && e.keyCode !== keys.NUMPAD_MINUS &&
				e.keyCode !== keys.NUMPAD_PLUS) {
				children = (e.keyCode === keys.DOWN_ARROW) ? selected.children : parent.children;
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
			switch (e.keyCode) {
			case keys.LEFT_ARROW:
				newSelected = children[childrenI[Math.max(0, childrenI.indexOf(selectedI) - 1)].index];
				break;
			case keys.RIGHT_ARROW:
				newSelected = children[childrenI[Math.min(childrenI.length - 1,
					childrenI.indexOf(selectedI) + 1)].index];
				break;
			case keys.DOWN_ARROW:
				newSelected = children[childrenI[0].index];
				break;
			case keys.UP_ARROW:
				newSelected = parent;
				break;
			// TODO
			//case "+":
			case keys.NUMPAD_PLUS:
				if (!this._isLeaf(selected) && this.drillDown) {
					this.drillDown(renderer);
					e.preventDefault();
					e.stopPropagation();
				}
				break;
			// TODO
			//case "-":
			case keys.NUMPAD_MINUS:
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