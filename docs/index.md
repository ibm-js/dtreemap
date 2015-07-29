---
layout: default
title: dtreemap/TreeMap
key: docs
---

# dtreemap/TreeMap

`dtreemap/TreeMap` displays data as a set of colored, potentially nested, rectangular cells. Treemaps can be used to explore large data sets by using convenient drill-down capabilities. They reveal data patterns and trends easily. Treemaps rely on data clustering, using areas and color information to represent the data you want to explore.

An example of a treemap is shown below. The treemap shows business sectors at the head of the hierarchy and provides the possibility to drill down to country and then company level.

![xx](treemap.png)

`dtreemap/TreeMap` supports squarified algorithms for two-dimensional treemaps, and is characterized by the ability to:

* Map the size, color, and label of treemap cells to properties in a data source.
* Choose either a predefined algorithm for computing the item colors or specify a color using a customizable color function.
* Specify the treemap levels at which labels are to appear.
* Get an event when clicking and hovering over treemap items.
* Navigate within a treemap with visual effects on drill down.

Before proceeding checkout [setup page](setup.md) on how to setup a project using dtreemap. This will be required to leverage the samples from this page.

##### Table of Contents
[Element Instantiation](#instantiation)  
[Element Configuration](#configuration)  
[Element Styling](#styling)  
[User Interactions](#interactions)  
[Mixins](#mixins)  
[Element Events](#events)  
[Enteprise Use](#enterprise)  

<a name="instantiation"></a>
## Element Instantiation

See [`delite/Widget`](/delite/docs/master/Widget.md) for full details on how instantiation lifecycle is working.

### Declarative Instantiation

```js
var dataSource;
require(["dstore/Memory", "dtreemap/TreeMap", "requirejs-domready/domReady!"], function (register, Memory) {
  dataSource = new Memory({idProperty: "label", data:
    [
      { label: "France", sales: 500, profit: 50, region: "EU" },
      { label: "Germany", sales: 450, profit: 48, region: "EU" },
      { label: "UK", sales: 700, profit: 60, region: "EU" },
      { label: "USA", sales: 2000, profit: 250, region: "America" },
      { label: "Canada", sales: 600, profit: 30, region: "America" },
      { label: "Brazil", sales: 450, profit: 30, region: "America" },
      { label: "China", sales: 500, profit: 40, region: "Asia" },
      { label: "Japan", sales: 900, profit: 100, region: "Asia" }
  ]});
});
```

```html
<html>
  <d-treemap style="width:640px;height:640px" source="dataSource" areaAttr="sales"
    colorAttr="profit" tooltipAttr="label" groupAttrs="region">
  </d-treemap>
</html>
```

### Programmatic Instantiation

```js
require(["dstore/Memory", "dtreemap/TreeMap", "requirejs-domready/domReady!"], function (Memory, TreeMap) {
  var dataSource = new Memory({idProperty: "label", data:
    [
      { label: "France", sales: 500, profit: 50, region: "EU" },
      { label: "Germany", sales: 450, profit: 48, region: "EU" },
      { label: "UK", sales: 700, profit: 60, region: "EU" },
      { label: "USA", sales: 2000, profit: 250, region: "America" },
      { label: "Canada", sales: 600, profit: 30, region: "America" },
      { label: "Brazil", sales: 450, profit: 30, region: "America" },
      { label: "China", sales: 500, profit: 40, region: "Asia" },
      { label: "Japan", sales: 900, profit: 100, region: "Asia" }
  ]});
  var treeMap = new TreeMap({source: dataSource, areaAttr: "sales", colorAttr: "profit", groupAttrs: ["region"]});
  treeMap.style.width = "640px";
  treeMap.style.height = "480px";
  treeMap.placeAt(document.body);
});
```

<a name="configuration"></a>
## Element Configuration
### Data

`dtreemap/TreeMap` can connect to any implementation of `dstore/api/Store` interface that implements the get, filter, map and getIdentity methods. It supports flat data and optionally creates a hierarchy from this data using `groupAttrs`property to group the data based on certain of their attributes.

A set of properties are available on the treemap to map the properties from the source to the treemap properties. see `delite/StoreMap`for details on mapping.

#### Mapping using attributes

In this example the data are mapped from the data source using an attribute based mapping. That means the cell size and color as well as the grouping are extracted from attributes values in the data.

<iframe width="100%" height="300" src="http://jsfiddle.net/ibmjs/jnh79/embedded/" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/jnh79/">checkout the sample on JSFiddle</a></iframe>

For the cell colors, the value of the binding is used as an input into the specified color model. In this case this is a color model that returns a color interpolated between the red and green colors with a mean neutral value. One can specify his own color model like a similar one based on average neutral value instead of mean neutral. If no color model is specified at all the color is expected to be found directly in the value of the colorAttr binding as a suitable input for the `dcolor/Color` constructor.

Note also that the `groupAttrs` property is of type array. This allows one to specify several attributes for grouping thus creating a multi-level hierarchy. As for example:


```js
groupsAttrs: ["continent", "country"]
```
Other binding attributes are available:

* the `labelAttr` that binds the cell labels to a data attribute.
* the `tooltipAttr` that binds the cell tooltips to a data attribute.

<a name="byfunc"></a>
#### Mapping using functions

In this example the data are mapped from the data source using custom functions. That means the cell size and color as well as the grouping are computed by functions specified by the application.

<iframe width="100%" height="300" src="http://jsfiddle.net/ibmjs/TWJ3z/embedded/" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/TWJ3z/">checkout the sample on JSFiddle</a></iframe>

The example is very similar to the previous one, except that it is using a function to compute the input value for the cells color. In this case instead of using the absolute profit figure we are computing the profit percentage.

The example is also leveraging the query attribute that allows to reduce the scope of the query made onto the data source in order to extract a subset of the data. Here we are choosing only data items with sales above a given threshold.

Obviously functions are also supported for binding areas, labels or tooltips.


### Properties

In addition to the mapping properties `dtreemap/TreeMap` provides other useful properties to configure the treemap.

  * The `labelThreshold` property corresponds to the maximum depth level at which labels will be displayed. If you want no labels to be displayed, choose 0, if you want only top level labels choose 1 and so on.
  * The `selectionMode` property corresponds to the type of selection you want to enable on the treemap, possible values are `"multiple"`, `"single"` or `"none"`. See `delite/Selection` for details.
  * The `selectedItems` property is the array of selected items. If you want to select only a single item you can alternatively used selectedItem property. See `delite/Selection` for details.

```js
var treeMap = new TreeMap({source: dataSource, labelThreshold: 1, selectedItem: dataSource.get("France") ,
  areaAttr: "sales", colorAttr: "profit", groupAttrs: ["region"],
  colorModel: colorModel });
```

For an exhaustive list of treemap properties see TODO LINK TO API DOC

<a name="styling"></a>
## Element Styling

`dtreemap/TreeMap` generates HTML markup that can be styled using CSS. The treemap provides a default CSS styling that is automatically included in the application. Alternate rendering can be achieved by overriding some of the CSS rules and using the classes put by the treemap on the HTML elements.

The following example shows how to:
  * center the labels
  * change the font size
  * use rounded corners on treemap cells (HTML5 browsers only)
    
<iframe width="100%" height="300" src="http://jsfiddle.net/ibmjs/u7S5z/embedded/" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/u7S5z/">checkout the sample on JSFiddle</a></iframe>

Here is an exhaustive list of CSS classes that can be used to style the treemap:

|class name|applies to|
|----------|----------|
|d-treemap |the treemap widget node
|d-treemap-leaf|a treemap cell leaf node
|d-treemap-group|a grouping cell top level node
|d-treemap-header|a grouping cell header node
|d-treemap-groupcontent|a grouping cell content node
|d-selected|added to any selected cell node
|d-treemap-leaf_n|a treemap cell leaf node displayed at n-th depth level
|d-treemap-header_n|a grouping cell header node displayed at n-th depth level
|d-treemap-groupcontent_n|a grouping cell content node displayed at n-th level

Standard CSS pseudo classes like `:hover` can also be used to customize the cell rendering under particular conditions.

<a name="interactions"></a>
## User Interactions

By default the `dtreemap/TreeMap` widget only provide mouse & touch (pointer) selection interaction. In this default configuration the following selection actions are available:


|Function|Action|
|--------|------|
|Select|Click a cell in the treemap
|Extend a selection|Hold down the CTRL key an click a cell
|Reduce a selection|Hold down the CTRL key and click an already selected cell

Other interactions must be explicitly mixed in the treemap in order to be available.

To get drill down ability on double click or double tap include the `dtreemap/DrillDown` mixin:

```js
var DrillDownTreeMap = register("drilldown-treemap", [TreeMap, DrillDownUp]);
```

You can then easily use programmatically the `DrillDownTreeMap` class or declaratively the `drilldown-treemap` tag provided that you have done the registration before use. 

This will enable the following interactions:

|Function|Action|
|--------|------|
|Drill Down|Double click a cell in the treemap
|Drill Up|Double click the top level header in the treemap

To get keyboard interaction include the `dtreemap/Keyboard` mixin:

```js
var KeyboardTreeMap = register("key-treemap", [TreeMap, Keyboard]);
```

You can then easily use programmatically the `KeyboardTreeMap` class or declaratively the `key-treemap` tag provided that you have done the registration before use. 

This will enable the following interactions:

|Function|Action|
|--------|------|
|Right/left arrow keys|Select a neighboring item that shares the same parent item.
|Up/down arrow keys	|Move up or down in the hierarchy to select a parent or child item.
|Plus key (+)|Drill down the treemap
|Minus key (-)|Drill up the treemap

<a name="mixins"></a>
## Mixins

By default each treemap cell is drawn with a fixed size label. One can leverage CSS to change the default rendering like changing the font size. However some more complex customization might not be possible with CSS, that's why the `dtreemap/TreeMap` widget conveniently proposes classes that can be mixed in the main class and will provide alternate rendering.

### GroupLabel

The first rendering mixin is the `dtreemap/GroupLabel` mixin. It allows to remove cell labels and only keep group labels centered on the groups:

<iframe width="100%" height="300" src="http://jsfiddle.net/ibmjs/GtAy7/embedded/" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/GtAy7/">checkout the sample on JSFiddle</a></iframe>

### ScaledLabel

The second rendering mixin is the `dtreemap/ScaledLabel` mixin. It allows to scale the cell labels so that they fill as much as possible the cells size:

<iframe width="100%" height="300" src="http://jsfiddle.net/ibmjs/wUbNR/embedded/" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/wUbNR/">checkout the sample on JSFiddle</a></iframe>

<a name="events"></a>
## Element Events

The `dtreemap/TreeMap` provides the following events:

|event name|dispatched|cancelable|bubbles|properties|
|----------|----------|----------|-------|----------|
|treemap-renderer-updated|after creation, styling and sizing of each group and leaf renderers|No|No|<ul><li>`render`: the updated node</li><li>`item`: the corresponding data item </li><li>`kind`: `"leaf"`or `"group"`depending on the renderer type</li><li>`level`: depth level of the renderer</li></ul>|
|treemap-item-over|when hovering a treemap cell|No|No|<ul><li>`render`: the hovered cell</li><li>`item`: the corresponding data item </li><li>`triggerEvent`: the pointer event that triggered the treemap event</li></ul>
|treemap-item-out|when rolling out of a treemap cell|No|No|<ul><li>`render`: the rolled out cell</li><li>`item`: the corresponding data item </li><li>`triggerEvent`: the pointer event that triggered the treemap event</li></ul>

In addition on can listen on the treemap to the selection events dispatched when a cell is selected. See `delite/Selection`for details.

This code excerpt shows how to listen to various events and react to them:

```js
var treeMap = ...;
treeMap.on("selection-change", function (e) {
	if (e.newValue) {
		// display the label of the selected value
    	dom.byId("output").innerHTML = e.newValue.label;
    }
});
treeMap.on("treemap-item-over", function (e) {
	if (e.item) {
		// display the label of the hovered value
    	dom.byId("output").innerHTML = e.newValue.label;
    }
});
```

<a name="enterprise"></a>
## Enterprise Use

### Accessibility


|type|status|comment|
|----|------|-------|
|Keyboard|optional|Accomplished through the `dtreemap/Keyboard` mixin see [User Interactions](#interactions).|
|Visual Formatting|ok, might require customization|Tested for high constrast and browser zoom (200%). In high contrast the color cell information is not conveyed and must be put in the label using `labelFunc` if it is important to be conveyed through text. |
|Screen Reader|ok|Tested on JAWS 15 and iOS 6 VoiceOver.|


### Globalization

`dtreemap/TreeMap` does not provide any internationalizable bundle. The only strings displayed by the treemap are coming from the user data through the `dstore`. A possible way to internationalize those user data strings would be either to serve different data based on user locale or serve string keys that will be looked up into interatonalization bundles when consumed. In this case you might use the [mapping by function](#byfunc) in order to recover the actual translated string from the string keys as follows:

```js
require(["requirejs-dplugins/i18!myapp/nls/bundle", …], function(bundle, …) {
  myTreeMap.labelFunc = function (item) {
    return bundle[item.label];
  }
}); 
```

Right to left orientation is supported by setting the `dir` attribute to `rtl`on the treemap element:

```js
<d-treemap style="width:640px;height:640px" source="dataSource" areaAttr="sales" colorAttr="profit" dir="rtl"></d-treemap>
```

### Security

This widget has no specific security concern. Refer to `delite/Widget` and `delite/StoreMap` documentation for general security advice on this base class and mixin that `dtreemap/TreeMap` is using.

### Browser Support

This widget supports all supported browsers without any degrated behavior.

## See also
### Samples
### Blog posts…



