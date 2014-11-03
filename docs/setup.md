---
layout: default
title: setup
---

# setup a dtreemap project

The dtreemap project and in particular the `d-treemap` custom element can be consumed in two forms:

* the dtreemap built AMD layer
* the dtreemap source AMD modules

In order to install the built form:

```sh
bower install dtreemap-build
``

The source form:

```sh
bower install dtreemap
```

Using the source form is as simple as requiring the needed AMD modules:

```js
require(["delite/register", "dtreemap/TreeMap", "dtreemap/DrillDownUp", "dojo/domReady!"], 
   function (register, TreeMap, DrillDownUp) {
   //...
});
```
   
In order to consume the [built form](https://github.com/ibm-js/delite-build#how-to-use) you need first to load the corresponding layer and then the AMD modules:
 
 ```js
 require(["dtreemap/layer"], function() {
   require(["delite/register", "dtreemap/TreeMap", "dtreemap/DrillDownUp", "dojo/domReady!"], 
      function (register, TreeMap, DrillDownUp) {
      //...
   });
 });
 ```
 
 When using the source form, you can built your resulting application using the [grunt-amd-build](https://github.com/ibm-js/grunt-amd-build) project.
 


