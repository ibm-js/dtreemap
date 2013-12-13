define(["dojo/_base/lang", "dcl/dcl", "dui/register", "dojo/_base/Color",
	"dojo/when", "dojo/on", "dojo/query", "dojo/dom-construct", "dojo/dom-geometry", "dojo/dom-class", "dojo/dom-style",
	"./_utils", "dpointer/events", "dui/Widget", "dui/Invalidating", "dui/Selection",
	"dui/StoreMap", "dojo/uacss"],
	function (lang, dcl, register, Color, when, on, query, domConstruct, domGeom, domClass, domStyle,
			  utils, pointer, Widget, Invalidating, Selection, StoreMap) {

	return register("d-treemap", [HTMLElement, Widget, Invalidating, Selection, StoreMap], {
		// summary:
		//		A treemap widget.

		baseClass: "d-treemap",

		// itemToRenderer: [protected] Object
		//		The associated array item to renderer list.
		itemToRenderer: null,

		// rootItem: Object
		//		The root item of the treemap, that is the first visible item.
		//		If null the entire treemap hierarchy is shown.	
		//		Default is null.
		rootItem: null,

		// tooltipAttr: String
		//		The attribute of the store item that contains the tooltip text of a treemap cell.	
		//		Default is "". 
		tooltipAttr: "",

		// tooltipFunc: Function
		//		A function that returns the tooltip text of a treemap cell from a store item. If specified takes
		//		precedence over tooltipAttr.
		tooltipFunc: null,

		// areaAttr: String
		//		The attribute of the store item that contains the data used to compute the area of a treemap cell.	
		//		Default is "".
		areaAttr: "",

		// areaFunc: Function
		//		A function that returns the value use to compute the area of cell from a store item. If specified
		// 		takes precedence over areaAttr.
		areaFunc: null,

		// labelAttr: String
		//		The attribute of the store item that contains the label of a treemap cell.	
		//		Default is "label". 
		labelAttr: "label",

		// labelFunc: Function
		//		A function that returns the label of a treemap cell from a store item. If specified takes
		//		precedence over labelAttr.
		labelFunc: null,

		// labelThreshold: Number
		//		The starting depth level at which the labels are not displayed anymore on cells.  
		//		If NaN no threshold is applied. The depth is the visual depth of the items on the screen not
		//		in the data (i.e. after drill down the depth of an item might change).
		//		Default is NaN.
		labelThreshold: NaN,

		// colorAttr: String
		//		The attribute of the store item that contains the data used to compute the color of a treemap cell.
		//		Default is "". 
		colorAttr: "",

		// colorFunc: Function
		//		A function that returns from a store item the data used to compute the color of a treemap cell.
		// 		If specified takes precedence over colorAttr.
		colorFunc: null,

		// colorModel: dcolor/api/ColorModel
		//		The optional color model that converts data to color.
		//		Default is null.
		colorModel: null,

		// groupAttrs: Array
		//		An array of data attributes used to group data in the treemap.	
		//		Default is []. 
		groupAttrs: [],

		// groupFuncs: Array
		//		An array of grouping functions used to group data in the treemap.
		//		When null, groupAttrs is to compute grouping functions.
		//		Default is null.
		groupFuncs: null,

		_groupFuncs: null,

		mapAtInit: false,

		copyAllItemProps: true,

		preCreate: function () {
			this.allowRemap = true;
			this.itemToRenderer = {};
			this.addInvalidatingProperties("colorModel",  "labelThreshold",  "rootItem",
				{
					"areaAttr": "invalidateProperty",
					"areaFunc": "invalidateProperty",
					"labelAttr": "invalidateProperty",
					"labelFunc": "invalidateProperty",
					"tooltipAttr": "invalidateProperty",
					"tooltipFunc": "invalidateProperty",
					"colorAttr": "invalidateProperty",
					"colorFunc": "invalidateProperty",
					"items": "invalidateProperty",
					"groupAttrs": "invalidateProperty",
					"groupFuncs": "invalidateProperty"
				});
		},

		getIdentity: function (item) {
			return item.__treeID ? item.__treeID : this.store.getIdentity(item);
		},

		resize: function (box) {
			if (box) {
				domGeom.setMarginBox(this, box);
				this.invalidateRendering();
			}
		},

		postCreate: function () {
			this.own(on(this, "pointerover", lang.hitch(this, this._pointerOverHandler)));
			this.own(on(this, "pointerout", lang.hitch(this, this._pointerOutHandler)));
			this.own(on(this, "pointerup", lang.hitch(this, this._pointerUpHandler)));
			this.setAttribute("role", "presentation");
			this.setAttribute("aria-label", "treemap");
		},

		// we need to call Store.refreshProperties
		refreshProperties: dcl.superCall(function (sup) {
			return function (props) {
				sup.call(this, props);
				if (this.items && this._mappedKeys.some(function (item) {
					return props[item + "Attr"] || props[item + "Func"];
				})) {
					this.remap();
				}
				if (props.items || props.groupAttrs || props.groupFuncs) {
					this._set("rootItem", null);
				}
				if (props.items) {
					props.groupAttrs = true;
					props.colorAttr = true;
				}
			};
		}),

		refreshRendering: function (props) {
			if (props.groupAttrs || props.groupFuncs) {
				this._updateTreeMapHierarchy();
			}

			if ((props.colorAttr || props.colorFunc || props.colorModel) &&
				(this.colorModel != null && this.items != null && this.colorModel.initialize)) {
				this.colorModel.initialize(this.items, lang.hitch(this, this._colorFunc));
			}

			if (props.areaAttr || props.areaFunc) {
				this._removeAreaForGroup();
			}

			if (this._groupeditems == null) {
				return;
			}

			if (props.rootItem) {
				domConstruct.empty(this);
				this._render(true);
			} else {
				this._render(false);
			}
		},

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
				this._buildRenderer(this, rootParentItem, rootItem, {
					x: box.l,
					y: box.t,
					w: box.w,
					h: box.h
				}, 0, forceCreate);
			} else {
				this._buildChildrenRenderers(this,
					rootItem ? rootItem : { __treeRoot: true, children: this._groupeditems },
					0, forceCreate, box);
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
			var color = item.color;
			if (!color) {
				color = 0;
			}
			return parseFloat(color);
		},

		createRenderer: function (item, level, kind) {
			// summary:
			//		Creates an item renderer of the specified kind. This is called only when the treemap
			//		is created. Default implementation always create div nodes. It also sets overflow
			//		to hidden and position to absolute on non-header renderers.
			// item: Object
			//		The data item.
			// level: Number
			//		The item depth level.		
			// kind: String
			//		The specified kind. This can either be "leaf", "group", "header" or "content". 
			// returns: DomNode
			//		The renderer use for the specified kind.
			// tags:
			//		protected					
			var div = domConstruct.create("div");
			if (kind !== "header") {
				domStyle.set(div, "overflow", "hidden");
				domStyle.set(div, "position", "absolute");
			}
			return div;
		},

		styleRenderer: function (renderer, item, level, kind) {
			// summary:
			//		Style the item renderer. This is called each time the treemap is refreshed.
			//		For leaf items it colors them with the color computed from the color model. 
			//		For other items it does nothing.
			// renderer: DomNode
			//		The item renderer.
			// item: Object
			//		The data item.
			// level: Number
			//		The item depth level.
			// kind: String
			//		The specified kind. This can either be "leaf", "group", "header" or "content". 
			// tags:
			//		protected
			switch (kind) {
			case "leaf":
				domStyle.set(renderer, "background", this.getColorForItem(item).toHex());
				/* falls through */
			case "header":
				var label = this.getLabelForItem(item);
				if (label && (isNaN(this.labelThreshold) || level < this.labelThreshold)) {
					renderer.innerHTML = label;
				} else {
					domConstruct.empty(renderer);
				}
				break;
			default:

			}
		},

		_updateTreeMapHierarchy: function () {
			var items = this.items;
			if (items == null) {
				return;
			}
			if (this._groupFuncs != null && this._groupFuncs.length > 0) {
				this._groupeditems = utils.group(items, this._groupFuncs,
												lang.hitch(this, this._getAreaForItem)).children;
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

		getColorForItem: function (item) {
			// summary:
			//		Returns the color for a given item. This either use the colorModel if not null
			//		or just the result of the colorFunc.
			// item: Object
			//		The data item.
			// tags:
			//		protected	
			var value = this._colorFunc(item);
			if (this.colorModel != null) {
				return this.colorModel.getColor(value);
			} else {
				return new Color(value);
			}
		},

		getLabelForItem: function (item) {
			// summary:
			//		Returns the label for a given item.
			// item: Object
			//		The data item.
			// tags:
			//		protected
			return item.__treeName ? item.__treeName : item.label.toString();
		},

		_buildChildrenRenderers: function (domNode, item, level, forceCreate, delta, anim) {
			var children = item.children;
			var box = domGeom.getMarginBox(domNode);

			var solution = utils.solve(children, box.w, box.h, lang.hitch(this,
				this._computeAreaForItem), !this.isLeftToRight());

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
				domConstruct.place(renderer, container);
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
			var header = query(".d-treemap-header", renderer)[0];
			var content = query(".d-treemap-groupcontent", renderer)[0];
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
				domStyle.set(content, "display", "none");
			} else {
				domStyle.set(content, "display", "block");
				domGeom.setMarginBox(content, {	l: 0, t: box.h, w: width, h: (height - box.h) });
				this._buildChildrenRenderers(content, renderer.item, level, forceCreate, null, anim);
			}

			domGeom.setMarginBox(header, { l: 0, t: 0, w: width, h: box.h });
		},

		_updateGroupRenderer: function (renderer, item, level) {
			// summary:
			//		Update a group renderer. This creates the renderer if not already created,
			//		call styleRender for it and recurse into children.
			// renderer: DomNode
			//		The item renderer.
			// item: Object
			//		The data item.
			// level: Number
			//		The item depth level.
			// tags:
			//		private				
			var forceCreate = renderer == null;
			if (renderer == null) {
				renderer = this.createRenderer("div", level, "group");
				domClass.add(renderer, "d-treemap-group");
			}
			this.styleRenderer(renderer, item, level, "group");
			var header = query(".d-treemap-header", renderer)[0];
			header = this._updateHeaderRenderer(header, item, level);
			if (forceCreate) {
				domConstruct.place(header, renderer);
			}
			var content = query(".d-treemap-groupcontent", renderer)[0];
			content = this._updateGroupContentRenderer(content, item, level);
			if (forceCreate) {
				domConstruct.place(content, renderer);
			}
			return renderer;
		},

		_updateHeaderRenderer: function (renderer, item, level) {
			// summary:
			//		Update a leaf renderer. This creates the renderer if not already created,
			//		call styleRender for it and set the label as its innerHTML.
			// renderer: DomNode
			//		The item renderer.
			// item: Object
			//		The data item.
			// level: Number
			//		The item depth level.
			// tags:
			//		private			
			if (renderer == null) {
				renderer = this.createRenderer(item, level, "header");
				domClass.add(renderer, "d-treemap-header");
				domClass.add(renderer, "d-treemap-header_" + level);
			}
			this.styleRenderer(renderer, item, level, "header");
			return renderer;
		},

		_updateLeafRenderer: function (renderer, item, level) {
			// summary:
			//		Update a leaf renderer. This creates the renderer if not already created,
			//		call styleRender for it and set the label as its innerHTML.
			// renderer: DomNode
			//		The item renderer.
			// item: Object
			//		The data item.
			// level: Number
			//		The item depth level.
			// tags:
			//		private				
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

		_updateGroupContentRenderer: function (renderer, item, level) {
			// summary:
			//		Update a group content renderer. This creates the renderer if not already created,
			//		and call styleRender for it.
			// renderer:
			//		The item renderer.
			// item: Object
			//		The data item.
			// level: Number
			//		The item depth level.
			// tags:
			//		private				
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
				this.emit("treemap-item-over", {renderer: renderer, item: item, triggerEvent: e});
			}
		},

		_pointerUpHandler: function (e) {
			var renderer = this._getRendererFromTarget(e.target);
			if (renderer.item) {
				this.selectFromEvent(e, renderer.item, renderer, true);
			}
		},

		updateRenderers: function (items) {
			// summary:
			//		Updates the renderer(s) that represent the specified item(s).
			// item: Object|Array
			//		The item(s).
			if (!items) {
				return;
			}
			if (!lang.isArray(items)) {
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
