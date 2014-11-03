---
layout: default
title: setup
---

# setup a project using dtreemap

The `d-treemap` custom element and other modules from the dtreemap project can be consumed in two forms:

* the dtreemap built AMD layer
* the dtreemap source AMD modules

In order to install the built form:

```sh
bower install dtreemap-build
```

Similarly, for the source form:

```sh
bower install dtreemap
```

Using the source form is as simple as requiring the needed AMD modules using RequireJS:

```js
require(["delite/register", "dtreemap/TreeMap", "dtreemap/DrillDownUp", "requirejs-domready/domReady!"], 
   function (register, TreeMap, DrillDownUp) {
   //...
});
```
   
In order to consume the [built form](https://github.com/ibm-js/dtreemap-build#how-to-use) you first need to load the 
corresponding layer and then the AMD modules as follows:
 
 ```js
 require(["dtreemap/layer"], function() {
   require(["delite/register", "dtreemap/TreeMap", "dtreemap/DrillDownUp", "requirejs-domready/domReady!"], 
      function (register, TreeMap, DrillDownUp) {
      //...
   });
 });
 ```
 
 When using the source form (or the built form if needed), you can built your resulting application using 
 the [grunt-amd-build](https://github.com/ibm-js/grunt-amd-build) project.
 


