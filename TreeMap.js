define(["dojo/_base/lang", "dojo/_base/declare", "dojo/_base/event", "dojo/_base/Color", "dojo/touch",
		"dojo/when", "dojo/on", "dojo/query", "dojo/dom-construct", "dojo/dom-geometry", "dojo/dom-class", "dojo/dom-style",
		"./_utils", "dui/_WidgetBase", "dui/mixins/_Invalidating", "dui/mixins/Selection", "dui/mixins/StoreMap",
		"dojo/sniff", "dojo/uacss"],
	function(arr, lang, declare, event, Color, touch, when, on, query, domConstruct, domGeom, domClass, domStyle,
		utils, _WidgetBase, _Invalidating, Selection, StoreMap, has){

	return declare([_WidgetBase, _Invalidating, Selection, StoreMap], {
		// summary:
		//		A treemap widget.
		
		baseClass: "dtreemap",
		
		// store: dojo/store/api/Store
		//		The store that contains the items to display.
		store: null,
		
		// query: Object
		//		A query that can be passed to when querying the store.
		query: {},

		// queryOptions: dojo/store/api/Store.QueryOptions?
		//		Options to be applied when querying the store.
		queryOptions: null,
		
		// itemToRenderer: [protected] Object
		//		The associated array item to renderer list.
		itemToRenderer: null,

		// Data
		_dataChanged: false,
	
		// rootItem: Object
		//		The root item of the treemap, that is the first visible item.
		//		If null the entire treemap hierarchy is shown.	
		//		Default is null.
		rootItem: null,
		_rootItemChanged: false,
	
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
		_areaChanged: false,

		// areaFunc: Function
		//		A function that returns the value use to compute the area of cell from a store item. If specified takes
		//		precedence over areaAttr.
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
		// colorModel: dojox/color/api/ColorModel
		//		The optional color model that converts data to color.	
		//		Default is null.
		colorModel: null,
		_coloringChanged: false,
		
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
		_groupingChanged: false,

		mapAtInit: false,

		mappedKeys: ["tooltip", "area", "label", "color"],

		copyAllItemProps: true,

		constructor: function(){
			this.itemToRenderer = {};
			this.addInvalidatingProperties("colorModel", "groupAttrs", "groupFuncs", "areaAttr", "areaFunc",
				"labelAttr", "labelFunc", "labelThreshold", "tooltipAttr", "tooltipFunc",
				"colorAttr", "colorFunc", "rootItem");
		},
		
		getIdentity: function(item){
			return item.__treeID?item.__treeID:this.store.getIdentity(item);
		},

		resize: function(box){
			if(box){
				domGeom.setMarginBox(this.domNode, box);
				this.invalidateRendering();						
			}
		},
		
		postCreate: function(){
			this.inherited(arguments);
			this.own(on(this.domNode, "mouseover", lang.hitch(this, this._onMouseOver)));
			this.own(on(this.domNode, "mouseout", lang.hitch(this, this._onMouseOut)));
			this.own(on(this.domNode, touch.release, lang.hitch(this, this._onMouseUp)));
			this.domNode.setAttribute("role", "presentation");
			this.domNode.setAttribute("aria-label", "treemap");
		},
		
		buildRendering: function(){
			this.inherited(arguments);
			this.refreshRendering();
		},
	
		refreshRendering: function(){
			this.inherited(arguments);

			var forceCreate = false;
	
			if(this._dataChanged){
				this._dataChanged = false;
				this._groupingChanged = true;
				this._coloringChanged = true;
			}
	
			if(this._groupingChanged){
				this._groupingChanged = false;
				this._set("rootItem", null);
				this._updateTreeMapHierarchy();
				forceCreate = true;
			}
	
			if(this._rootItemChanged){
				this._rootItemChanged = false;
				forceCreate = true;
			}
	
			if(this._coloringChanged){
				this._coloringChanged = false;			
				if(this.colorModel != null && this.get("items") != null && this.colorModel.initialize){
					this.colorModel.initialize(this.get("items"), lang.hitch(this, function(item){
						return this._colorFunc(item);
					}));
				}
			}
	
			if(this._areaChanged){
				this._areaChanged = false;
				this._removeAreaForGroup();
			}
	
			if(this.domNode == undefined || this._groupeditems == null){
				return;
			}
			
			if(forceCreate){
				domConstruct.empty(this.domNode);
			}
	
			var rootItem = this.rootItem, rootParentItem;

			if(rootItem != null){
				var rootItemRenderer = this._getRenderer(rootItem);
				if(rootItemRenderer){
					if(this._isLeaf(rootItem)){
						rootItem = rootItemRenderer.parentItem;
					}
					rootParentItem = rootItemRenderer.parentItem;
				}
			}

			var box = domGeom.getMarginBox(this.domNode);
			if(rootItem != null){
				this._buildRenderer(this.domNode, rootParentItem, rootItem, {
					x: box.l, y: box.t, w: box.w, h: box.h
				}, 0, forceCreate);
			}else{
				this._buildChildrenRenderers(this.domNode, rootItem?rootItem:{ __treeRoot: true, children : this._groupeditems },
					0, forceCreate, box);
			}
		},
	
		_setRootItemAttr: function(value){
			this._rootItemChanged = true;
			this._set("rootItem", value);
		},

		_setItemsAttr: function(value){
			this._set("items", value);
			this._dataChanged = true;
			this.invalidateRendering();
		},

		_setGroupAttrsAttr: function(value){
			this._groupingChanged = true;
			if(this.groupFuncs == null){
				if(value !=null){
					this._groupFuncs = value.map(function(attr){
						return function(item){
							return item[attr];
						};
					});
				}else{
					this._groupFuncs = null;
				}
			}
			this._set("groupAttrs", value);
		},

        _setGroupFuncsAttr: function(value){
			this._groupingChanged = true;
			this._set("groupFuncs", this._groupFuncs = value);
			if(value == null && this.groupAttrs != null){
				this._groupFuncs = this.groupAttrs.map(function(attr){
					return function(item){
						return item[attr];
					};
				});
			}
		},

		_setAreaAttrAttr: function(value){
			this._areaChanged = true;
			this._set("areaAttr", value);
		},

		_setAreaFuncAttr: function(value){
			this._areaChanged = true;
			this._set("areaFunc", value);
		},

		_setColorModelAttr: function(value){
			this._coloringChanged = true;
			this._set("colorModel", value);
		},
	
		_setColorAttrAttr: function(value){
			this._coloringChanged = true;
			this._set("colorAttr", value);
		},
	
		// colorFunc: Function
		//		A function that returns from a store item the color value of cell or the value used by the 
		//		ColorModel to compute the cell color. If a color must be returned it must be in form accepted by the
		//		dojo/_base/Color constructor. If a value must be returned it must be a Number.
		//		Default implementation is using colorAttr.
		_colorFunc: function(/*Object*/ item){
			var color = item.color;
			if(!color){
				color = 0;
			}
			return parseFloat(color);
		},
		
		_setColorFuncAttr: function(value){
			this._coloringChanged = true;
			this._set("colorFunc", value);
		},
		
		createRenderer: function(item, level, kind){
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
			if(kind != "header"){
				domStyle.set(div, "overflow", "hidden");
				domStyle.set(div, "position", "absolute");					
			}
			return div;
		},
		
		styleRenderer: function(renderer, item, level, kind){
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
			switch(kind){
				case "leaf":
					domStyle.set(renderer, "background", this.getColorForItem(item).toHex());
				case "header":
					var label = this.getLabelForItem(item);
					if(label && (isNaN(this.labelThreshold) || level < this.labelThreshold)){
						renderer.innerHTML = label;
					}else{
						domConstruct.empty(renderer);
					}
					break;
				default:
				
			}				
		},
		
		_updateTreeMapHierarchy: function(){
			var items = this.get("items");
			if(items == null){
				return;
			}
			if(this._groupFuncs != null && this._groupFuncs.length > 0){
				this._groupeditems = utils.group(items, this._groupFuncs, lang.hitch(this, this._getAreaForItem)).children;
			}else{
				this._groupeditems = items;
			}
		},
	
		_removeAreaForGroup: function(item){
			var children;
			if(item != null){
				if(item.__treeValue){
					delete item.__treeValue;
					children = item.children;
				}else{
					// not a grouping item
					return;
				}
			}else{
				children = this._groupeditems;
			}
			if(children){
				for(var i = 0; i < children.length; ++i){
					this._removeAreaForGroup(children[i]);
				}
			}
		},
	
		_getAreaForItem: function(item){
			var area = parseFloat(item.area);
			return isNaN(area) ? 0 : area;
		},

		_computeAreaForItem: function(item){
			var value;
			if(item.__treeID){ // group
				value = item.__treeValue;
				if(!value){
					value = 0;
					var children = item.children;
					for(var i = 0; i < children.length; ++i){
						value += this._computeAreaForItem(children[i]);
					}
					item.__treeValue = value;
				}
			}else{
				value = this._getAreaForItem(item);
			}
			return value;
		},
	
		getColorForItem: function(item){
			// summary:
			//		Returns the color for a given item. This either use the colorModel if not null
			//		or just the result of the colorFunc.
			// item: Object
			//		The data item.
			// tags:
			//		protected	
			var value = this._colorFunc(item);
			if(this.colorModel != null){
				return this.colorModel.getColor(value);
			}else{
				return new Color(value);
			}
		},
	
		getLabelForItem: function(item){
			// summary:
			//		Returns the label for a given item.
			// item: Object
			//		The data item.
			// tags:
			//		protected
			return item.__treeName?item.__treeName:item.label.toString();
		},
	
		_buildChildrenRenderers: function(domNode, item, level, forceCreate, delta, anim){
			var children = item.children;
			var box = domGeom.getMarginBox(domNode);

			var solution = utils.solve(children, box.w, box.h, lang.hitch(this,
					this._computeAreaForItem), !this.isLeftToRight());
					
			var rectangles = solution.rectangles;
			
			if(delta){
				rectangles = rectangles.map(function(item){
					item.x += delta.l;
					item.y += delta.t;
					return item;
				});
			}
	
			var rectangle;
			for(var j = 0; j < children.length; ++j){
				rectangle = rectangles[j];
				this._buildRenderer(domNode, item, children[j], rectangle, level, forceCreate, anim);
			}
		},
		
		_isLeaf: function(item){
			return !item.children;
		},
		
		_isRoot: function(item){
			return item.__treeRoot;
		},
		
		_getRenderer: function(item, anim, parent){
			if(anim){
				// while animating we do that on a copy of the subtree
				// so we can use our hash object to get to the renderer
				for(var i = 0; i < parent.children.length; ++i){
	        		if(parent.children[i].item == item){
	            		return parent.children[i];
	                }
				}	
			}
			return this.itemToRenderer[this.getIdentity(item)];
		},

		_buildRenderer: function(container, parent, child, rect, level, forceCreate, anim){
			var isLeaf = this._isLeaf(child);
			var renderer = !forceCreate ? this._getRenderer(child, anim, container) : null;
			renderer = isLeaf ? this._updateLeafRenderer(renderer, child, level) : this._updateGroupRenderer(renderer,
					child, level);
			if(forceCreate){
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
			if(forceCreate){
				domConstruct.place(renderer, container);
			}

			domGeom.setMarginBox(renderer, {
				l: x, t: y, w: w, h: h
			});
			
			if(!isLeaf){
				var box = domGeom.getContentBox(renderer);
				this._layoutGroupContent(renderer, box.w, box.h, level + 1, forceCreate, anim);
			}
			
			this.onRendererUpdated({ renderer: renderer, item: child, kind: isLeaf?"leaf":"group", level: level });		
		},
	
		_layoutGroupContent: function(renderer, width, height, level, forceCreate, anim){
			var header = query(".dtreemap-header", renderer)[0];
			var content = query(".dtreemap-groupcontent", renderer)[0];
			if(header == null || content == null){
				return;
			}
	
			var box = domGeom.getMarginBox(header);
	
			// If the header is too high, reduce its area
			// and don't show the children..
			if(box.h > height){
				// TODO: this might cause pb when coming back to visibility later
				// as the getMarginBox of the header will keep that value?
				box.h = height;
				domStyle.set(content, "display", "none");
			}else{
				domStyle.set(content, "display", "block");
				domGeom.setMarginBox(content, {
					l: 0, t: box.h, w: width, h: (height - box.h)
				});
				this._buildChildrenRenderers(content, renderer.item, level, forceCreate, null, anim);
			}
	
			domGeom.setMarginBox(header, {
				l: 0, t: 0, w: width, h: box.h
			});
		},
	
		_updateGroupRenderer: function(renderer, item, level){
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
			if(renderer == null){
				renderer = this.createRenderer("div", level, "group");
				domClass.add(renderer, "dtreemap-group");
			}
			this.styleRenderer(renderer, item, level, "group");
			var header = query(".dtreemap-header", renderer)[0];
			header = this._updateHeaderRenderer(header, item, level);
			if(forceCreate){
				domConstruct.place(header, renderer);
			}
			var content = query(".dtreemap-groupcontent", renderer)[0];
			content = this._updateGroupContentRenderer(content, item, level);
			if(forceCreate){
				domConstruct.place(content, renderer);
			}
			return renderer;
		},
	
		_updateHeaderRenderer: function(renderer, item, level){
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
			if(renderer == null){
				renderer = this.createRenderer(item, level, "header");
				domClass.add(renderer, "dtreemap-header");
				domClass.add(renderer, "dtreemap-header_" + level);
			}
			this.styleRenderer(renderer, item, level, "header");
			return renderer;
		},
	
		_updateLeafRenderer: function(renderer, item, level){
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
			if(renderer == null){
				renderer = this.createRenderer(item, level, "leaf");
				domClass.add(renderer, "dtreemap-leaf");
				domClass.add(renderer, "dtreemap-leaf_" + level);
			}		
			this.styleRenderer(renderer, item, level, "leaf");
			if(item.tooltip){
				renderer.title = item.tooltip;
			}
			return renderer;
		},
	
		_updateGroupContentRenderer: function(renderer, item, level){
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
			if(renderer == null){
				renderer = this.createRenderer(item, level, "content");
				domClass.add(renderer, "dtreemap-groupcontent");
				domClass.add(renderer, "dtreemap-groupcontent_" + level);
			}
			this.styleRenderer(renderer, item, level, "content");
			return renderer;
		},
		
		_getRendererFromTarget: function(target){
			var renderer = target;
			while(renderer != this.domNode && !renderer.item){
				renderer = renderer.parentNode;
			}			
			return renderer;
		},

		_onMouseOver: function(e){
			var renderer = this._getRendererFromTarget(e.target);
			if(renderer.item){	
				var item = renderer.item;
				this._hoveredItem = item;
				this.updateRenderers(item);
				this.onItemRollOver({renderer: renderer, item : item, triggerEvent: e});
			}
		},
	
		_onMouseOut: function(e){
			var renderer = this._getRendererFromTarget(e.target);
			if(renderer.item){	
				var item = renderer.item;
				this._hoveredItem = null;
				this.updateRenderers(item);
				this.onItemRollOut({renderer: renderer, item : item, triggerEvent: e});
			}
		},
		
		_onMouseUp: function(e){
			var renderer = this._getRendererFromTarget(e.target);
			if(renderer.item){
				this.selectFromEvent(e, renderer.item, renderer, true);
				//event.stop(e);
			}
		},
		
		onRendererUpdated: function(){
			// summary:
			//		Called when a renderer has been updated. This is called after creation, styling and sizing for 
			//		each group and leaf renderers. For group renders this is also called after creation of children
			//		renderers. 
			// tags:
			//		callback			
		},
		
		onItemRollOver: function(){
			// summary:
			//		Called when an item renderer has been hovered.
			// tags:
			//		callback			
		},
		
		onItemRollOut: function(){
			// summary:
			//		Called when an item renderer has been rolled out.
			// tags:
			//		callback			
		},		
		
		updateRenderers: function(items){
			// summary:
			//		Updates the renderer(s) that represent the specified item(s).
			// item: Object|Array
			//		The item(s).
			if(!items){
				return;
			}			
			if(!lang.isArray(items)){
				items = [items];
			}
			for(var i=0; i<items.length;i++){
				var item = items[i];
				var renderer = this._getRenderer(item);
				// at init time the renderer might not be ready
				if(!renderer){
					continue;
				}
				var selected = this.isSelected(item);
				var ie = has("ie");
				var div;
				if(selected){
					domClass.add(renderer, "dtreemap-selected");
					if(ie && (has("quirks") || ie < 9)){
						// let's do all of this only if not already done
						div = renderer.previousSibling;
						var rStyle = domStyle.get(renderer);
						if(!div || !domClass.contains(div, "dtreemap-IEHack")){
							div = this.createRenderer(item, -10, "group");
							domClass.add(div, "dtreemap-IEHack");
							domClass.add(div, "dtreemap-selected");
							domStyle.set(div, {
								position: "absolute",
								overflow: "hidden"
							});
							domConstruct.place(div, renderer, "before");
						}
						// TODO: might fail if different border widths for different sides
						var bWidth = 2*parseInt(domStyle.get(div, "border-width"));
						if(this._isLeaf(item)){
							bWidth -= 1;
						}else{
							bWidth += 1;
						}
						// if we just drill down some renders might not be laid out?
						if(rStyle["left"] != "auto"){
							domStyle.set(div, {
								left: (parseInt(rStyle["left"])+1)+"px",
								top: (parseInt(rStyle["top"])+1)+"px",
								width: (parseInt(rStyle["width"])-bWidth)+"px",
								height: (parseInt(rStyle["height"])-bWidth)+"px"
							});
						}
					}
				}else{
					if(ie && (has("quirks") || ie < 9)){
						div = renderer.previousSibling;
						if(div && domClass.contains(div, "dtreemap-IEHack")){
							div.parentNode.removeChild(div);
						}
					}
					domClass.remove(renderer, "dtreemap-selected");

				}
				if(this._hoveredItem == item){
					domClass.add(renderer, "dtreemap-hovered");
				}else{
					domClass.remove(renderer, "dtreemap-hovered");
				}
				if(selected || this._hoveredItem == item){
					domStyle.set(renderer, "zIndex", 20);
				}else{
					domStyle.set(renderer, "zIndex", (has("ie")<=7)?0:"auto");
				}
			}
		}
	});
});
