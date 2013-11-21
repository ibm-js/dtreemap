define(["dojo/_base/lang", "dojo/_base/event", "dcl/dcl", "dojo/on", "dojo/keys", "dojo/dom-attr",
	"./_utils", "dui/_FocusMixin"],
	function (lang, event, dcl, on, keys, domAttr, utils, _FocusMixin) {

	return dcl(_FocusMixin, {
		// summary:
		//		Specializes TreeMap to support keyboard navigation and accessibility.

		// tabIndex: String
		//		Order fields are traversed when user hits the tab key
		tabIndex: "0",
		_setTabIndexAttr: "domNode",

		constructor: function () {
		},

		postCreate: function () {
			this.own(on(this, "keydown", lang.hitch(this, this._onKeyDown)));
			this.own(on(this, "mousedown", lang.hitch(this, this._onMouseDown)));
		},

		createRenderer: dcl.superCall(function (sup) {
			return function (item, level, kind) {
				var renderer = sup.call(this, item, level, kind);
				// on Firefox we need a tabindex on sub divs to let the keyboard event be dispatched
				// put -1 so that it is not tablable
				domAttr.set(renderer, "tabindex", "-1");
				return renderer;
			};
		}),

		_onMouseDown: function () {
			this.focus();
		},

		/* jshint -W074 */
		_onKeyDown: function (e) {
			var selected = this.selectedItem;
			if (!selected) {
				// nothing selected selected we can't navigate
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
					childrenI = utils.initElements(children, lang.hitch(this,
						this._computeAreaForItem)).elements;
					selectedI = childrenI[children.indexOf(selected)];
					childrenI.sort(function (a, b) {
						return b.size - a.size;
					});
				} else {
					return;
				}
			}
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
					event.stop(e);
				}
				break;
				// TODO
				//case "-":
			case keys.NUMPAD_MINUS:
				if (!this._isLeaf(selected) && this.drillUp) {
					this.drillUp(renderer);
					event.stop(e);
				}
				break;
			}
			if (newSelected) {
				if (!this._isRoot(newSelected)) {
					this.selectedItem = newSelected;
					event.stop(e);
				}
			}
		}
	});
});