# dtreemap [![Build Status](https://travis-ci.org/ibm-dojo/dtreemap.png?branch=master)](https://travis-ci.org/ibm-dojo/dtreemap)

This project provides a delite-based TreeMap widget.

## Status

No official release yet.

## Migration

This is the former dojox/treemap project.

Migration steps from dojox/treemap to dtreemap:

* replace any use of "dojox/treemap" AMD module path by "dtreemap"
* replace any use of .dojoxTreeMapXSomething CSS classes by .dtreemap-xsomething
* replace any use in markup of <div data-dojo-type="dojox/treemap/TreeMap" data-dojo-props="store: mystore"></div> by <d-treemap store="mystore"><d-treemap>

## Licensing

This project is distributed by the Dojo Foundation and licensed under the ["New" BSD License](./LICENSE).
All contributions require a [Dojo Foundation CLA](http://dojofoundation.org/about/claForm).

## Dependencies

This project requires the following other projects to run:
 * dojo
 * delite
 * dcl
 * dcolor
 * dpointer

## Installation

* Bower release installation: `bower install dtreemap`

* Manual master installation: go to the root Dojo installation directory and clone dtreemap from github:

	$ git clone git://github.com/ibm-dojo/dtreemap.git

Then install dependencies:

	$ cd dtreemap
	$ bower install

## Documentation

http://livedocs.dojotoolkit.org/dojox/treemap

## Credits

* Christophe Jolif (IBM CCLA)
* Robert Dupuy (IBM CCLA)

