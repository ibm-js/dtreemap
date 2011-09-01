define(["dojo/_base/array", "dojo/_base/lang", "dojo/_base/declare", "dojo/_base/fx", "dojo/_base/event", "dojo/_base/Color", 
		"dojo/on", "dojo/query", "dojo/dom-construct", "dojo/dom-geometry", "dojo/dom-class", "dojo/dom-style",
		"./utils", "dijit/_WidgetBase", "dojox/widget/_Invalidating", "dojox/widget/_Selection"],
	function(arr, lang, declare, fx, event, Color, on, query, domConstruct, domGeom, domClass, domStyle,
		utils, _WidgetBase, _Invalidating, _Selection){

	/*=====
	var _WidgetBase = dijit._WidgetBase;
	var _Selection = dojox.widget._Selection;
	var _Invalidating = dojox.widget._Invalidating;
	=====*/ 	
	
	return declare("dojox.treemap.TreeMap", [_WidgetBase, _Invalidating, _Selection], {
		baseClass: "treeMap",
		
		//	store: dojo.store.Store
		//		The store that contains the items to display.
		store: null,
		
		// query: Object
		//		A query that can be passed to when querying the store.
		query: {},
		
		//	itemToRenderer: Object
		//		The associated array item to renderer list.
		//	tags
		//		protected
		itemToRenderer: {},
		
		// Data
		_storeChanged: false,
		_dataChanged: false,
	
		// First visible Item
		_rootItem: null,
		_rootItemChanged: false,
	
		//	tooltipAttr: String
		//		The attribute of the store item that contains the tooltip text of a treemap cell.	
		//		Default is "". 
		tooltipAttr: "",
	
		//	areaAttr: String
		//		The attribute of the store item that contains the data used to compute the area of a treemap cell.	
		//		Default is "". 
		areaAttr: "",
		_areaChanged: false,
	
		//	labelAttr: String
		//		The attribute of the store item that contains the label of a treemap cell.	
		//		Default is "label". 
		labelAttr: "label",
		
		//	labelThreshold: Number
		//		The starting depth level at which the labels are not displayed anymore on cells.  
		//		If NaN no threshold is applied. The depth is the visual depth of the items on the screen not
		//		in the data (i.e. after drill down the depth of an item might change).
		//		Default is NaN.
		labelThreshold: NaN, 
		
		//	colorAttr: String
		//		The attribute of the store item that contains the data used to compute the color of a treemap cell.
		//		Default is "". 
		colorAttr: "",
		//	colorModel: dojox.color.api.ColorModel
		//		The optional color model that converts data to color.	
		//		Default is null.
		colorModel: null,
		_coloringChanged: false,
		
		//	groupAttrs: Array
		//		An array of data attributes used to group data in the treemap.	
		//		Default is []. 
		groupAttrs: [],
		_groupingChanged: false,
	
		constructor: function(){
			this.watchedProperties = [ "colorModel", "groupAttrs", "areaAttr", "areaFunc",
				"labelAttr", "labelFunc", "labelThreshold", "tooltipAttr", "tooltipFunc",
				"colorAttr", "colorFunc" ];
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
		
		destroy: function(preserveDom){
			this.inherited(arguments);
		},
		
		buildRendering: function(){
			this.inherited(arguments);
			this.refreshRendering();
		},
	
		refreshRendering: function(){
			var forceCreate = false;
	
			if(this._dataChanged){
				this._dataChanged = false;
				this._groupingChanged = true;
				this._coloringChanged = true;
			}
	
			if(this._groupingChanged){
				this._groupingChanged = false;
				this._rootItem = null;
				this._updateTreeMapHierarchy();
				forceCreate = true;
			}
	
			if(this._rootItemChanged){
				this._rootItemChanged = false;
				forceCreate = true;
			}
	
			if(this._coloringChanged){
				this._coloringChanged = false;			
				if(this.colorModel != null && this._data != null){
					this.colorModel.initialize(this._data, lang.hitch(this, function(item){
						return this.colorFunc(item, this.store);
					}));
				}
			}
	
			if(this._areaChanged){
				this._areaChanged = false;
				this._removeAreaForGroup();
			}
	
			if(this.domNode == undefined || this._items == null){
				return;
			}
			
			if(forceCreate){
				while(this.domNode.hasChildNodes()){
					this.domNode.removeChild(this.domNode.firstChild);
				}
			}
	
			var rootItem = this._rootItem;
	
			if(rootItem != null){
				if(this._isLeaf(rootItem)){
					rootItem = this.itemToRenderer[this.getIdentity(rootItem)].parentItem;
				}
			}

			var box = domGeom.getMarginBox(this.domNode);
			if(rootItem != null){
				this._buildItemRenderer(this.domNode, null, rootItem, {
					x: box.l, y: box.t, w: box.w, h: box.h
				}, 0, forceCreate);
			}else{
				this._buildChildrenRenderers(this.domNode, this._rootItem?this._rootItem:{ __treeRoot: true, children : this._items }, 0, forceCreate, box);
			}
		},
	
		rootItem: function(){
			return this._rootItem;
		},
	
		setRootItem: function(value){
			this._rootItem = value;
			this._rootItemChanged = true;
			this.invalidateRendering();
		},
	
		_setStoreAttr: function(value){
			if(value != null){
				var results = value.query(this.query);
				if(results.observe){
					// user asked us to observe the store
					results.observe(lang.hitch(this, this._updateItem), true);
				}				
				if(results.then){
					results.then(lang.hitch(this, this._initItems));
				}else{
					this._initItems(items);
				}
			}else{
				this._initItems([]);
			}
			this._set("store", value);
		},
	
		_initItems: function(items){
			this._dataChanged = true;
			this._data = items;
			this.invalidateRendering();
		},
		
		_updateItem: function(item, previousIndex, newIndex){
			if(previousIndex!=-1){
				if(newIndex!=previousIndex){
					// this is a remove or a move
					this._data.splice(previousIndex, 1);
				}else{
					// this is a put, previous and new index identical
					// we don't now what has change exactly with store API
					this._data[newIndex] = item;
				}
			}else if(newIndex!=-1){
				// this is a add 
				this._data.splice(newIndex, 0, item);
			}
			// as we have no details let's refresh everything...
			this._dataChanged = true;			
			this.invalidateRendering();
		},
	
		_setGroupAttrsAttr: function(value){
			this._groupingChanged = true;			
			this._set("groupAttrs", value);
		},

		_setAreaAttrAttr: function(value){
			this._areaChanged = true;
			this._set("areaAttr", value);
		},
	
		//	areaFunc: Function
		//		A function that returns the value use to compute the area of cell from a store item.	
		//		Default implementation is using areaAttr.	
		areaFunc: function(/*Object*/ item, /*dojo.store.api.Store*/ store){
			return (this.areaAttr && this.areaAttr.length > 0)?parseFloat(item[this.areaAttr]):1;
		},
		
		_setAreaFuncAttr: function(value){
			this._areaChanged = true;
			this._set("areaFunc", value);
		},

		//	labelFunc: Function
		//		A function that returns the label of cell from a store item.	
		//		Default implementation is using labelAttr.
		labelFunc: function(/*Object*/ item, /*dojo.store.api.Store*/ store){
			var label = (this.labelAttr && this.labelAttr.length > 0)?item[this.labelAttr]:null;
			return label?label.toString():null;
		},
	
		//	tooltipFunc: Function
		//		A function that returns the tooltip of cell from a store item.	
		//		Default implementation is using tooltipAttr.
		tooltipFunc: function(/*Object*/ item, /*dojo.store.api.Store*/ store){
			var tooltip = (this.tooltipAttr && this.tooltipAttr.length > 0)?item[this.tooltipAttr]:null;
			return tooltip?tooltip.toString():null;
		},

		_setColorModelAttr: function(value){
			this._coloringChanged = true;
			this._set("colorModel", value);
		},
	
		_setColorAttrAttr: function(value){
			this._coloringChanged = true;
			this._set("colorAttr", value);
		},
	
		//	colorFunc: Function
		//		A function that returns from a store item the color value of cell or the value used by the 
		//		ColorModel to compute the cell color.	
		//		Default implementation is using colorAttr.
		colorFunc: function(/*Object*/ item, /*dojo.store.api.Store*/ store){
			var color = (this.colorAttr && this.colorAttr.length > 0)?item[this.colorAttr]:0;
			if(color == null){
				color = 0;
			}
			return parseFloat(color);
		},
		
		_setColorFuncAttr: function(value){
			this._coloringChanged = true;
			this._set("colorFunc", value);
		},
		
		//	summary: 
		//		Creates an item renderer of the specified kind. 
		//	item: Object
		//		The data item.
		//	kind: String
		//		The specified kind. This can either be "leaf", "group", "header" or "content". 
		//	returns: DomNode
		//		The renderer use for the specified kind.
		//	tags
		//		protected	
		createRenderer: function(item, kind){
			return domConstruct.create("div");
		},
	
		_updateTreeMapHierarchy: function(){
			if(this._data == null){
				return;
			}
			if(this.groupAttrs != null && this.groupAttrs.length > 0){
				this._items = utils.group(this._data, arr.map(this.groupAttrs, function(item){
					return {
						name: item,
						values: []
					}
				}), dojo.hitch(this, this._getAreaForItem)).children;
			}else{
				this._items = this._data;
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
				children = this._items;
			}
			if(children){
				for(var i = 0; i < children.length; ++i){
					this._removeAreaForGroup(children[i]);
				}
			}
		},
	
		_getAreaForItem: function(item){
			var area = this.areaFunc(item, this.store);
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
	
		_getColorForItem: function(item){
			var value = this.colorFunc(item, this.store);
			if(this.colorModel != null){
				return this.colorModel.getColor(value);
			}else{
				return new Color(value);
			}
		},
	
		_getLabelForItem: function(item){
			return item.__treeName?item.__treeName:this.labelFunc(item, this.store);
		},
	
		_buildChildrenRenderers: function(domNode, item, level, forceCreate, delta){
			var children = item.children;
			var box = domGeom.getMarginBox(domNode);

			var solution = utils.solve(children, box.w, box.h, lang.hitch(this,
					this._computeAreaForItem));
					
			var rectangles = solution.rectangles;
			
			if(delta){
				rectangles = arr.map(rectangles, function(item){
					item.x += delta.l;
					item.y += delta.t;
					return item;
				});
			}
	
			var max = 0, rectangle;
			for(var j = 0; j < children.length; ++j){
				rectangle = rectangles[j];
				max = Math.max(max, rectangle.x + rectangle.w);
				this._buildItemRenderer(domNode, item, children[j], rectangle, level, forceCreate);
			}
		},
		
		_isLeaf: function(item){
			return !item.children;
		},
		
		_isRoot: function(item){
			return item.__treeRoot;
		},

		_buildItemRenderer: function(container, parent, child, rect, level, forceCreate){
			var isLeaf = this._isLeaf(child);
			var renderer = !forceCreate ? this.itemToRenderer[this.getIdentity(child)] : null;
			renderer = isLeaf ? this._updateLeafRenderer(renderer, child, level) : this._updateGroupRenderer(renderer,
					child, level);
			if(forceCreate){
				renderer.level = level;
				renderer.item = child;
				renderer.parentItem = parent;
				this.itemToRenderer[this.getIdentity(child)] = renderer;
				on(renderer, "mouseover", lang.hitch(this, this._onMouseOver));
				on(renderer, "mouseout", lang.hitch(this, this._onMouseOut));
				on(renderer, "dblclick", lang.hitch(this, this._onDoubleClick));
				on(renderer, "mouseup", lang.hitch(this, this._onMouseUp));
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
				container.appendChild(renderer);
			}

			domGeom.setMarginBox(renderer, {
				l: x, t: y, w: w, h: h
			});
	
			if(!isLeaf){
				var box = domGeom.getContentBox(renderer);
				this._layoutGroupContent(renderer, box.w, box.h, level + 1, forceCreate);
			}
		},
	
		_layoutGroupContent: function(renderer, width, height, level, forceCreate){
			var header = query(".dojoxTreeMapHeader", renderer)[0];
			var content = query(".dojoxTreeMapGroupContent", renderer)[0];
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
				this._buildChildrenRenderers(content, renderer.item, level, forceCreate);
			}
	
			domGeom.setMarginBox(header, {
				l: 0, t: 0, w: width, h: box.h
			});
		},
	
		_updateGroupRenderer: function(renderer, item, level){
			var forceCreate = renderer == null;
			if(renderer == null){
				renderer = this.createRenderer("div", "group");
			}
			domClass.add(renderer, "dojoxTreeMapGroup");
	
			var header = query(".dojoxTreeMapHeader", renderer)[0];
			header = this._updateHeaderRenderer(header, item, level);
			if(forceCreate){
				renderer.appendChild(header);
			}
	
			var content = query(".dojoxTreeMapGroupContent", renderer)[0];
			content = this._updateGroupContentRenderer(content, item, level);
			if(forceCreate){
				renderer.appendChild(content);
			}
	
			return renderer;
		},
	
		updateHeaderRenderer: function(renderer, item, level){
			if(renderer == null){
				renderer = this.createRenderer(item, "header");
			}
			if(isNaN(this.labelThreshold) || level < this.labelThreshold){
				renderer.innerHTML = this._getLabelForItem(item);
			}else{
				renderer.innerHTML = null;
			}
			return renderer;
		},
	
		_updateHeaderRenderer: function(renderer, item, level){
			if(renderer != null){
				return this.updateHeaderRenderer(renderer, item, level);
			}else{
				renderer = this.updateHeaderRenderer(renderer, item, level);
				domClass.add(renderer, "dojoxTreeMapHeader");
				domClass.add(renderer, "dojoxTreeMapHeader_" + level);
				return renderer;
			}
		},
	
		styleLeafRenderer: function(renderer, item, level){
			domStyle.set(renderer, "background", this._getColorForItem(item).toHex());
		},
	
		updateLeafRenderer: function(renderer, item, level){
			if(renderer == null){
				renderer = this.createRenderer(item, "leaf");
			}
			this.styleLeafRenderer(renderer, item, level);
			if(isNaN(this.labelThreshold) || level < this.labelThreshold){
				renderer.innerHTML = this._getLabelForItem(item);
			}else{
				renderer.innerHTML = null;
			}
			renderer.title = this.tooltipFunc(item, this.store);
			return renderer;
		},
	
		_updateLeafRenderer: function(renderer, item, level){
			if(renderer != null){
				return this.updateLeafRenderer(renderer, item, level);
			}else{
				renderer = this.updateLeafRenderer(renderer, item, level);
				domClass.add(renderer, "dojoxTreeMapLeaf");
				domClass.add(renderer, "dojoxTreeMapLeaf_" + level);
				return renderer;
			}
		},
	
		updateGroupContentRenderer: function(renderer, item, level){
			if(renderer == null){
				renderer = this.createRenderer(item, "content");
			}
			return renderer;
		},
	
		_updateGroupContentRenderer: function(renderer, item, level){
			if(renderer != null){
				return this.updateGroupContentRenderer(renderer, item, level);
			}else{
				renderer = this.updateGroupContentRenderer(renderer, item, level);
				domClass.add(renderer, "dojoxTreeMapGroupContent");
				domClass.add(renderer, "dojoxTreeMapGroupContent_" + level);
				return renderer;
			}
		},
	
		_onDoubleClick: function(e){
			var renderer = e.currentTarget;
			var item = renderer.item;
			if(!this._isLeaf(item)){
				// Drill up
				if(this._rootItem == item){
					this.drillUp(renderer);
				}else{
					this.drillDown(renderer);
				}
			}
			event.stop(e);
		},
		
		drillUp: function(renderer){
			var box = domGeom.position(this.domNode, true);
			var item = renderer.item;

			// Remove the current rootItem renderer
			// rebuild the tree map
			// and animate the old renderer before deleting it.

			this.domNode.removeChild(renderer);
			var parent = this.itemToRenderer[this.getIdentity(item)].parentItem;
			this.setRootItem(parent);
			this.validateRendering(); // Must call this to create the treemap now

			// re-add the old renderer to show the animation
			this.domNode.appendChild(renderer);

			var finalBox = domGeom.position(this.itemToRenderer[this.getIdentity(item)], true);

			fx.animateProperty({
				node: renderer, duration: 500, properties: {
					left: {
						end: finalBox.x - box.x
					}, top: {
						end: finalBox.y - box.y
					}, height: {
						end: finalBox.h
					}, width: {
						end: finalBox.w
					}
				}, onAnimate: lang.hitch(this, function(values){
					var box2 = domGeom.getContentBox(renderer);
					this._layoutGroupContent(renderer, box2.w, box2.h, renderer.level + 1, false);
				}), onEnd: lang.hitch(this, function(){
					this.domNode.removeChild(renderer);
				})
			}).play();
		},
		
		drillDown: function(renderer){
			var box = domGeom.position(this.domNode, true);
			var item = renderer.item;
			
			// Set the new root item into the rootPanel to make it appear on top
			// of the other nodes, and keep the same global location
			var parentNode = renderer.parentNode;
			var spanInfo = domGeom.position(renderer, true);
			parentNode.removeChild(renderer);
			this.domNode.appendChild(renderer);
			domStyle.set(renderer, {
				left: spanInfo.x - box.x + "px", top: spanInfo.y - box.y + "px"
			});

			fx.animateProperty({
				node: renderer, duration: 500, properties: {
					left: {
						end: 0
					}, top: {
						end: 0
					}, height: {
						end: box.h
					}, width: {
						end: box.w
					}
				}, onAnimate: lang.hitch(this, function(values){
					var box2 = domGeom.getContentBox(renderer);
					this._layoutGroupContent(renderer, box2.w, box2.h, renderer.level + 1, false);
				}), onEnd: lang.hitch(this, function(){
					this.setRootItem(item);
				})
			}).play();
		},

		_onMouseOver: function(e){
			var item = e.currentTarget.item;
			this._hoveredItem = item;
			this.updateItemRenderer(item);
		},
	
		_onMouseOut: function(e){
			var item = e.currentTarget.item;
			this._hoveredItem = null;
			this.updateItemRenderer(item);
		},
		
		_onMouseUp: function(e){
			var item = e.currentTarget.item;
			this.selectFromEvent(e, item, e.currentTarget, true);
			event.stop(e);
		},
		
		updateItemsRenderers: function(items){
			for(var i=0; i<items.length;i++){
				this.updateItemRenderer(items[i]);
			}
		},
		
		updateItemRenderer: function(item){
			//	summary:
			//		Updates all the renderers that represents the specified item.
			//	item: Object
			//		The render item.
			
			if(item == null){
				return;
			}
			
			var renderer = this.itemToRenderer[this.getIdentity(item)];
			
			var selected = this.isItemSelected(item);
			if(selected){
				domClass.add(renderer, "dojoxTreeMapSelected")
			}else{
				domClass.remove(renderer, "dojoxTreeMapSelected");
			}
			
			if(selected || this._hoveredItem == item){
				domStyle.set(renderer, "zIndex", 10000);
			}else{
				domStyle.set(renderer, "zIndex", "auto");
			}
		}
	});

});