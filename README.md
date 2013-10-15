# dtreemap

This project provides a dui-based TreeMap widget.

## Status

No official release yet.

## Migration

This is the former dojox/treemap project.

Migration steps from dojox/treemap to dtreemap:

* replace any use of "dojox/treemap" AMD module path by "dtreemap"
* replace any use of .dojoxTreeMapXSomething CSS classes by .dtreemap-xsomething
* replace any use in markup of <div data-dojo-type="dojox/treemap/TreeMap" data-dojo-props="store: mystore"></div> by <d-treemap store="mystore"><d-treemap>

## Licensing

This project is distributed by the Dojo Foundation and licensed under the ["New" BSD License](https://github.com/dojo/dojo/blob/master/LICENSE#L13-L41).
All contributions require a [Dojo Foundation CLA](http://dojofoundation.org/about/claForm).

## Dependencies

This project requires the following other projects to run:
 * dojo
 * dui
 * dcl
 * dcolor

## Installation

* Manual installation of by dropping dtreemap as a sibling of the top level Dojo modules:
 * dojo
 * dui
 * dcl
 * dcolor
 * dtreemap

 To install the latest master, go to the root Dojo installation directory and clone dtreemap from github

 git clone git://github.com/ibm-dojo/dtreemap.git

## Documentation

http://livedocs.dojotoolkit.org/dojox/treemap

## Credits

* Christophe Jolif (IBM CCLA)
* Robert Dupuy (IBM CCLA)

