# dtreemap [![Build Status](https://travis-ci.org/ibm-js/dtreemap.png?branch=master)](https://travis-ci.org/ibm-js/dtreemap)

This project provides a delite-based TreeMap widget.

## Status

No official release yet.

## Migration

This is the former dojox/treemap project.

Migration steps from dojox/treemap to dtreemap:

* replace any use of `"dojox/treemap"` AMD module path by `"dtreemap"`
* replace any use of `.dojoxTreeMapXSomething` CSS classes by `.dtreemap-xsomething`
* replace any use in markup of `<div data-dojo-type="dojox/treemap/TreeMap" data-dojo-props="source: mysource"></div>` by `<d-treemap source="mysource"><d-treemap>`

## Licensing

This project is distributed by the Dojo Foundation and licensed under the ["New" BSD License](./LICENSE).
All contributions require a [Dojo Foundation CLA](http://dojofoundation.org/about/claForm).

## Dependencies

This project requires the following other projects to run:
 * dojo
 * requirejs
 * delite
 * dcl
 * dcolor
 * dpointer
 * dstore

## Installation

_Bower_ release installation:

    $ bower install dtreemap

_Manual_ master installation:

    $ git clone git://github.com/ibm-js/dtreemap.git

Then install dependencies with bower (or manually from github if you prefer to):

	$ cd dtreemap
	$ bower install

## Documentation

http://ibm-js.github.io/dtreemap/docs/master/index.html

## Credits

* Christophe Jolif (IBM CCLA)
* Robert Dupuy (IBM CCLA)

