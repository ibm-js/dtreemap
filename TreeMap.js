/** @module dtreemap/TreeMap */
define(["dcl/dcl", "delite/register", "dcolor/Color",
	"dojo/dom-geometry", "dojo/dom-class",
	"./_utils", "dpointer/events", "delite/Widget", "delite/Selection",
	"delite/StoreMap", "requirejs-dplugins/css!./themes/TreeMap.css"],
	function (dcl, register, Color, domGeom, domClass,
			  utils, pointer, Widget, Selection, StoreMap) {

	/**
	 * A treemap widget.
	 * @class module:dtreemap/TreeMap
	 * @augments module:delite/Widget
	 * @augments module:delite/Selection
	 * @augments module:delite/StoreMap
	 */
	return register("d-treemap", [HTMLElement, Widget, Selection, StoreMap], /** @lends module:dtreemap/TreeMap# */ {

		baseClass: "d-treemap",

		/**
		 * The associated array item to renderer list.
		 * @member {Object}
		 * @protected
		 */
		itemToRenderer: null,

		/**
		 * The root item of the treemap, that is the first visible item.
		 * If null the entire treemap hierarchy is shown.
		 * @member {Object}
		 * @default null
		 */
		rootItem: null,

		/**
		 * The attribute of the source item that contains the tooltip text of a treemap cell.
		 * @member {string}
		 * @default ""
		 */
		tooltipAttr: "",

		/**
		 * A function that returns the tooltip text of a treemap cell from a source item. If specified takes
		 * precedence over tooltipAttr.
		 * @member {Function}
		 * @default null
		 */
		tooltipFunc: null,

		/**
		 * The attribute of the source item that contains the data used to compute the area of a treemap cell.
		 * @member {string}
		 * @default ""
		 */
		areaAttr: "",

		/**
		 * A function that returns the value use to compute the area of cell from a source item. If specified
		 * takes precedence over areaAttr.
		 * @member {Function}
		 * @default null
		 */
		areaFunc: null,

		/**
		 * The attribute of the source item that contains the label of a treemap cell.
		 * @member {string}
		 * @default "label"
		 */
		labelAttr: "label",

		/**
		 * A function that returns the label of a treemap cell from a source item. If specified takes
		 * precedence over labelAttr.
		 * @member {Function}
		 * @default null
		 */
		labelFunc: null,

		/**
		 * The starting depth level at which the labels are not displayed anymore on cells.
		 * If NaN no threshold is applied. The depth is the visual depth of the items on the screen not
		 * in the data (i.e. after drill down the depth of an item might change).
		 * @member {number}
		 * @default NaN
		 */
		labelThreshold: NaN,

		/**
		 * The attribute of the source item that contains the data used to compute the color of a treemap cell.
		 * @member {string}
		 * @default ""
		 */
		colorAttr: "",

		/**
		 * A function that returns from a source item the data used to compute the color of a treemap cell.
		 * If specified takes precedence over colorAttr.
		 * @member {Function}
		 * @default null
		 */
		colorFunc: null,

		/**
		 * The optional color model that converts data to color.
		 * @member {dcolor/api/ColorModel}
		 * @default null
		 */
		colorModel: null,

		/**
		 * An array of data attributes used to group data in the treemap.
		 * @member {string[]}
		 * @default []
		 */
		groupAttrs: [],

		/**
		 * An array of grouping functions used to group data in the treemap.
		 * When null, groupAttrs is used to compute grouping functions.
		 * @member {Function[]}
		 * @default null
		 */
		groupFuncs: null,

		_groupFuncs: null,

		mapAtInit: false,

		copyAllItemProps: true,

		preRender: function () {
			this.allowRemap = true;
			this.itemToRenderer = {};
		},

		getIdentity: function (item) {
			return item.__treeID ? item.__treeID : this.source.getIdentity(item);
		},


		/**
		 * To be called when the TreeMap should relayout itself following a change in CSS layout. The application
		 * typically calls this method when a `resize` event occurs. 
		 */
		update: function () {
			this.notifyCurrentValue("areaAttr");
		},

		postRender: function () {
			this.on("pointerover", this._pointerOverHandler.bind(this));
			this.on("pointerout", this._pointerOutHandler.bind(this));
			this.on("pointerup", this._pointerUpHandler.bind(this));
			this.setAttribute("role", "presentation");
			this.setAttribute("aria-label", "treemap");
		},

		// we need to call Store.computeProperties
		computeProperties: function (props) {
			if (this.renderItems && this._mappedKeys.some(function (item) {
				return props.hasOwnProperty(item + "Attr") || props.hasOwnProperty(item + "Func");
			})) {
				this.remap();
			}
			if ("renderItems" in props || "groupAttrs" in props || "groupFuncs" in props) {
				this._set("rootItem", null);
				this.notifyCurrentValue("rootItem");
			}
			if ("renderItems" in props) {
				this.notifyCurrentValue("groupAttrs");
				this.notifyCurrentValue("colorAttr");
			}
		},

		/* jshint maxcomplexity: 13 */
		refreshRendering: function (props) {
			var refresh = false;
			
			if ("groupAttrs" in props || "groupFuncs" in props) {
				this._updateTreeMapHierarchy();
				refresh = true;
			}

			if ("colorAttr" in props || "colorFunc" in props || "colorModel" in props) {
				refresh = true;
				if (this.colorModel != null && this.renderItems != null && this.colorModel.initialize) {
					this.colorModel.initialize(this.renderItems, this._colorFunc.bind(this));
				}
			}

			if ("areaAttr" in props || "areaFunc" in props) {
				this._removeAreaForGroup();
				refresh = true;
			}

			if (("rootItem" in props || refresh) && this._groupeditems) {
				if (this.containerNode == null) {
					this.containerNode = this.ownerDocument.createElement("div");
					dcl.mix(this.containerNode.style, {
						"position": "relative",
						"width": "100%",
						"height": "100%"
					});
					this.appendChild(this.containerNode);
				}
				if ("rootItem" in props) {
					this.containerNode.innerHTML = "";
					this._render(true);
				} else {
					this._render(false);
				}
			}
		},
		/* jshint maxcomplexity: 10 */

		_render: function (forceCreate) {
			var rootItem = this.rootItem, rootParentItem;

			if (rootItem != null) {
				var rootItemRenderer = this._getRenderer(rootItem);
				if (rootItemRenderer) {
					if (this._isLeaf(rootItem)) {
						rootItem = rootItemRenderer.parentItem;
					}
					rootParentItem = rootItemRenderer.parentItem;
				}
			}
			var box = domGeom.getMarginBox(this);
			if (rootItem != null && !this._isRoot(rootItem)) {
				this._buildRenderer(this.containerNode, rootParentItem, rootItem, {
					x: 0,
					y: 0,
					w: box.w,
					h: box.h
				}, 0, forceCreate);
			} else {
				this._buildChildrenRenderers(this.containerNode,
					rootItem ? rootItem : { __treeRoot: true, children: this._groupeditems },
					0, forceCreate, null);
			}
		},

		_setGroupAttrsAttr: function (value) {
			if (this.groupFuncs == null) {
				if (value != null) {
					this._groupFuncs = value.map(function (attr) {
						return function (item) {
							return item[attr];
						};
					});
				} else {
					this._groupFuncs = null;
				}
			}
			this._set("groupAttrs", value);
		},

		_setGroupFuncsAttr: function (value) {
			this._set("groupFuncs", this._groupFuncs = value);
			if (value == null && this.groupAttrs != null) {
				this._groupFuncs = this.groupAttrs.map(function (attr) {
					return function (item) {
						return item[attr];
					};
				});
			}
		},

		_colorFunc: function (/*Object*/ item) {
			if (this.colorFunc) {
				return this.colorFunc(item);
			} else {
				var color = item.color;
				if (!color) {
					color = 0;
				}
				return parseFloat(color);
			}
		},

		/**
		 * Creates an item renderer of the specified kind. This is called only when the treemap
		 * is created. Default implementation always create div nodes. It also sets overflow
		 * to hidden and position to absolute on non-header renderers.
		 * @param item The render item.
		 * @param level The item depth level.
		 * @param kind The specified kind. This can either be "leaf", "group", "header" or "content".
		 * @returns {HTMLElement} The renderer use for the specified kind.
		 * @protected
		 */
		createRenderer: function (item, level, kind) {
			var div = this.ownerDocument.createElement("div");
			if (kind !== "header") {
				dcl.mix(div.style, {
					"overflow": "hidden",
					"position": "absolute"
				});
			}
			return div;
		},

		/**
		 * Style the item renderer. This is called each time the treemap is refreshed.
		 * For leaf items it colors them with the color computed from the color model.
		 * For other items it does nothing.
		 * @param renderer The item renderer.
		 * @param item The render item.
		 * @param level The item depth level.
		 * @param kind The specified kind. This can either be "leaf", "group", "header" or "content".
		 * @protected
		 */
		styleRenderer: function (renderer, item, level, kind) {
			switch (kind) {
			case "leaf":
				renderer.style.background = this.getColorForItem(item).toHex();
				/* falls through */
			case "header":
				var label = this.getLabelForItem(item);
				if (label && (isNaN(this.labelThreshold) || level < this.labelThreshold)) {
					renderer.innerHTML = label;
				} else {
					renderer.innerHTML = "";
				}
				break;
			default:

			}
		},

		_updateTreeMapHierarchy: function () {
			var items = this.renderItems;
			if (items == null) {
				return;
			}
			if (this._groupFuncs != null && this._groupFuncs.length > 0) {
				this._groupeditems = utils.group(items, this._groupFuncs,
												this._getAreaForItem.bind(this)).children;
			} else {
				this._groupeditems = items;
			}
		},

		_removeAreaForGroup: function (item) {
			var children;
			if (item != null) {
				if (item.__treeValue) {
					delete item.__treeValue;
					children = item.children;
				} else {
					// not a grouping item
					return;
				}
			} else {
				children = this._groupeditems;
			}
			if (children) {
				for (var i = 0; i < children.length; ++i) {
					this._removeAreaForGroup(children[i]);
				}
			}
		},

		_getAreaForItem: function (item) {
			var area = parseFloat(item.area);
			return isNaN(area) ? 0 : area;
		},

		_computeAreaForItem: function (item) {
			var value;
			if (item.__treeID) { // group
				value = item.__treeValue;
				if (!value) {
					value = 0;
					var children = item.children;
					for (var i = 0; i < children.length; ++i) {
						value += this._computeAreaForItem(children[i]);
					}
					item.__treeValue = value;
				}
			} else {
				value = this._getAreaForItem(item);
			}
			return value;
		},

		/**
		 * Returns the color for a given item. This either use the colorModel if not null
		 * or just the result of the colorFunc.
		 * @param item The render item.
		 * @returns {dcolor/Color} The item color
		 */
		getColorForItem: function (item) {
			var value = this._colorFunc(item);
			if (this.colorModel != null) {
				return this.colorModel.getColor(value);
			} else {
				return new Color(value);
			}
		},

		/**
		 * Returns the label for a given item.
		 * @param item The render item.
		 * @returns {string}
		 */
		getLabelForItem: function (item) {
			return item.__treeName ? item.__treeName : item.label.toString();
		},

		_buildChildrenRenderers: function (domNode, item, level, forceCreate, delta, anim) {
			var children = item.children;
			var box = domGeom.getMarginBox(domNode);

			var solution = utils.solve(children, box.w, box.h, this._computeAreaForItem.bind(this),
				this.effectiveDir === "rtl");

			var rectangles = solution.rectangles;

			if (delta) {
				rectangles = rectangles.map(function (item) {
					item.x += delta.l;
					item.y += delta.t;
					return item;
				});
			}

			var rectangle;
			for (var j = 0; j < children.length; ++j) {
				rectangle = rectangles[j];
				this._buildRenderer(domNode, item, children[j], rectangle, level, forceCreate, anim);
			}
		},

		_isLeaf: function (item) {
			return !item.children;
		},

		_isRoot: function (item) {
			return item.__treeRoot;
		},

		_getRenderer: function (item, anim, parent) {
			if (anim) {
				// while animating we do that on a copy of the subtree
				// so we can use our hash object to get to the renderer
				for (var i = 0; i < parent.children.length; ++i) {
					if (parent.children[i].item === item) {
						return parent.children[i];
					}
				}
			}
			return this.itemToRenderer[this.getIdentity(item)];
		},

		_buildRenderer: function (container, parent, child, rect, level, forceCreate, anim) {
			var isLeaf = this._isLeaf(child);
			var renderer = !forceCreate ? this._getRenderer(child, anim, container) : null;
			renderer = isLeaf ? this._updateLeafRenderer(renderer, child, level) : this._updateGroupRenderer(renderer,
				child, level);
			if (forceCreate) {
				renderer.level = level;
				renderer.item = child;
				renderer.parentItem = parent;
				this.itemToRenderer[this.getIdentity(child)] = renderer;
				// update its selection status
				this.updateRenderers(child);
			}

			// in some cases the computation might be slightly incorrect (0.0000...1)
			// and due to the floor this will cause 1px gaps 

			var x = Math.floor(rect.x);
			var y = Math.floor(rect.y);
			var w = Math.floor(rect.x + rect.w + 0.00000000001) - x;
			var h = Math.floor(rect.y + rect.h + 0.00000000001) - y;

			// before sizing put the item inside its parent so that styling
			// is applied and taken into account
			if (forceCreate) {
				container.appendChild(renderer);
			}

			domGeom.setMarginBox(renderer, { l: x, t: y, w: w, h: h	});

			if (!isLeaf) {
				var box = domGeom.getContentBox(renderer);
				this._layoutGroupContent(renderer, box.w, box.h, level + 1, forceCreate, anim);
			}

			this.emit("treemap-renderer-updated",
				{ renderer: renderer, item: child, kind: isLeaf ? "leaf" : "group", level: level });
		},

		_layoutGroupContent: function (renderer, width, height, level, forceCreate, anim) {
			var header = renderer.querySelector(".d-treemap-header");
			var content = renderer.querySelector(".d-treemap-groupcontent");
			if (header == null || content == null) {
				return;
			}

			var box = domGeom.getMarginBox(header);

			// If the header is too high, reduce its area
			// and don't show the children..
			if (box.h > height) {
				// TODO: this might cause pb when coming back to visibility later
				// as the getMarginBox of the header will keep that value?
				box.h = height;
				content.style.display = "none";
			} else {
				content.style.dispaly = "block";
				domGeom.setMarginBox(content, {	l: 0, t: box.h, w: width, h: (height - box.h) });
				this._buildChildrenRenderers(content, renderer.item, level, forceCreate, null, anim);
			}

			domGeom.setMarginBox(header, { l: 0, t: 0, w: width, h: box.h });
		},

		/**
		 * Update a group renderer. This creates the renderer if not already created,
		 * call styleRender for it and recurse into children.
		 * @param renderer The item renderer.
		 * @param item The render item.
		 * @param level The item depth level.
		 * @returns {HTMLElement}
		 * @private
		 */
		_updateGroupRenderer: function (renderer, item, level) {
			var forceCreate = renderer == null;
			if (renderer == null) {
				renderer = this.createRenderer("div", level, "group");
				domClass.add(renderer, "d-treemap-group");
			}
			this.styleRenderer(renderer, item, level, "group");
			var header = renderer.querySelector(".d-treemap-header");
			header = this._updateHeaderRenderer(header, item, level);
			if (forceCreate) {
				renderer.appendChild(header);
			}
			var content = renderer.querySelector(".d-treemap-groupcontent");
			content = this._updateGroupContentRenderer(content, item, level);
			if (forceCreate) {
				renderer.appendChild(content);
			}
			return renderer;
		},

		/**
		 * Update a leaf renderer. This creates the renderer if not already created,
		 * call styleRender for it and set the label as its innerHTML.
		 * @param renderer The item renderer.
		 * @param item The render item.
		 * @param level The item depth level.
		 * @returns {HTMLElement}
		 * @private
		 */
		_updateHeaderRenderer: function (renderer, item, level) {
			if (renderer == null) {
				renderer = this.createRenderer(item, level, "header");
				domClass.add(renderer, "d-treemap-header");
				domClass.add(renderer, "d-treemap-header_" + level);
			}
			this.styleRenderer(renderer, item, level, "header");
			return renderer;
		},

		/**
		 * Update a leaf renderer. This creates the renderer if not already created,
		 * call styleRender for it and set the label as its innerHTML.
		 * @param renderer The item renderer.
		 * @param item The render item.
		 * @param level The item depth level.
		 * @returns {HTMLElement}
		 * @private
		 */
		_updateLeafRenderer: function (renderer, item, level) {
			if (renderer == null) {
				renderer = this.createRenderer(item, level, "leaf");
				domClass.add(renderer, "d-treemap-leaf");
				domClass.add(renderer, "d-treemap-leaf_" + level);
			}
			this.styleRenderer(renderer, item, level, "leaf");
			if (item.tooltip) {
				renderer.title = item.tooltip;
			}
			return renderer;
		},

		/**
		 * Update a group content renderer. This creates the renderer if not already created,
		 * and call styleRender for it.
		 * @param renderer The item renderer.
		 * @param item The render item.
		 * @param level The item depth level
		 * @returns {HTMLElement}
		 * @private
		 */
		_updateGroupContentRenderer: function (renderer, item, level) {
			if (renderer == null) {
				renderer = this.createRenderer(item, level, "content");
				domClass.add(renderer, "d-treemap-groupcontent");
				domClass.add(renderer, "d-treemap-groupcontent_" + level);
			}
			this.styleRenderer(renderer, item, level, "content");
			return renderer;
		},

		_getRendererFromTarget: function (target) {
			var renderer = target;
			while (renderer !== this && !renderer.item) {
				renderer = renderer.parentNode;
			}
			return renderer;
		},

		_pointerOverHandler: function (e) {
			var renderer = this._getRendererFromTarget(e.target);
			if (renderer.item) {
				var item = renderer.item;
				this.updateRenderers(item);
				this.emit("treemap-item-over", {renderer: renderer, item: item, triggerEvent: e});
			}
		},

		_pointerOutHandler: function (e) {
			var renderer = this._getRendererFromTarget(e.target);
			if (renderer.item) {
				var item = renderer.item;
				this.updateRenderers(item);
				this.emit("treemap-item-out", {renderer: renderer, item: item, triggerEvent: e});
			}
		},

		_pointerUpHandler: function (e) {
			var renderer = this._getRendererFromTarget(e.target);
			if (renderer.item) {
				this.selectFromEvent(e, renderer.item, renderer, true);
			}
		},

		updateRenderers: function (items) {
			if (!items) {
				return;
			}
			if (!Array.isArray(items)) {
				items = [items];
			}
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				var renderer = this._getRenderer(item);
				// at init time the renderer might not be ready
				if (!renderer) {
					continue;
				}
				var selected = this.isSelected(item);
				if (selected) {
					domClass.add(renderer, "d-selected");
				} else {
					domClass.remove(renderer, "d-selected");
				}
			}
		}
	});
});
