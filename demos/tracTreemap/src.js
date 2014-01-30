var groupByChanged, sizeByChanged, colorByChanged, MyTreeMap;

var DAY = 86400000;

var colorByPriorityFunc = function (item) {
	switch (item.priority) {
	case "blocker":
		return {r: 255, g: 0, b: 0};
	case "high":
		return {r: 170, g: 85, b: 0};
	case "low":
		return {r: 85, g: 170, b: 0};
	default:
		return {r: 0, g: 255, b: 0};
	}
	return {};
};

var colorByDateFunc = function (item) {
	var created = new Date(item.created).getTime();
	// color based on how ancient is the bug
	var old = new Date().getTime() - created;
	if (old < 8 * DAY) {
		return {r: 0, g: 255, b: 0};
	} else if (old < 35 * DAY) {
		return {r: 85, g: 170, b: 0};
	} else if (old < 400 * DAY) {
		return {r: 170, g: 85, b: 0};
	} else {
		return {r: 255, g: 0, b: 0};
	}
	return {};
};

var sizeByPriorityFunc = function (item) {
	switch (item.priority) {
	case "blocker":
		return 4;
	case "high":
		return 3;
	case "low":
		return 2;
	default:
		return 1;
	}
	return 0;
};

var sizeByCcFunc = function (item) {
	return item.cc ? item.cc.split(",").length : 1;
};

require(["dojo/ready", "dojo/dom", "dcolor/Color", "dcl/dcl", "dojo/parser",
	"dui/registry", "dui/dijit/Tooltip", "dojo/dom-style", "dojo/dom-attr", "dojo/dom-construct",
	"dui/layout/BorderContainer", "dui/layout/ContentPane", "dtreemap/TreeMap",
	"dui/form/RadioButton", "dtreemap/Keyboard",
	"dtreemap/DrillDownUp", "dstore/Memory", "dstore/Observable",
	"dojo/io/script", "dojo/when"],
	function (ready, dom, Color, dcl, parser, registry, Tooltip, domStyle, domAttr, domConstruct,
			  BorderContainer, ContentPane, TreeMap, RadioButton, Keyboard, DrillDownUp,
			  Memory, Observable, script, when) {

		//var store = new DataStore({ store: new CsvStore({url: "report_132.csv"}) });

		var query = "select * from csv where url='http://trac.dojotoolkit.org/report/179?asc=1&format=csv'";
		var request = script.get({
			url: "http://query.yahooapis.com/v1/public/yql?q=" + encodeURIComponent(query) + "&format=json",
			jsonp: "callback"
		});
		var store;

		when(request, function (response) {
			var results = response.query.results.row;
			var header = results[0];
			var rows = results.slice(1);
			var data = rows.map(function (row) {
				var ticket = {};
				for (var prop in row) {
					ticket[header[prop]] = row[prop];
				}
				return ticket;
			});
			/* jshint -W064 */
			store = Observable(new Memory({data: data, idProperty: "ticket"}));
			/* jshint +W064 */
			// depending on when we arrive here treemap
			// might already been there...
			// reset data:
			var treeMap = registry.byId("treeMap");
			if (treeMap) {
				treeMap.set("store", store);
			}
		}, function () {
			console.log("could not reach data source");
		});

		ready(function () {
			MyTreeMap = dcl([TreeMap, Keyboard, DrillDownUp], {
				createRenderer: function (item, level, kind) {
					if (kind === "leaf") {
						var div = domConstruct.create("a");
						domAttr.set(div, "href", "http://bugs.dojotoolkit.org/ticket/" + item.ticket);
						domStyle.set(div, "overflow", "hidden");
						domStyle.set(div, "position", "absolute");
						return div;
					} else {
						return this.inherited(arguments);
					}
				}
			});
			parser.parse();
			var treeMap = registry.byId("treeMap");
			treeMap.set("colorFunc", colorByPriorityFunc);
			treeMap.set("areaFunc", sizeByCcFunc);
			treeMap.set("groupAttrs", ["component"]);
			if (store) {
				treeMap.set("store", store);
			}
			treeMap.onItemRollOver = function (evt) {
				if (evt.item.summary) {
					Tooltip.show(evt.item.summary, evt.renderer);
				}
			};
			treeMap.onItemRollOut = function (evt) {
				Tooltip.hide(evt.renderer);
			};
		});

		/* jshint -W074 */
		groupByChanged = function () {
			var groupBy = [];
			if (dom.byId("g2").checked) {
				groupBy = ["owner"];
			} else if (dom.byId("g3").checked) {
				groupBy = ["component"];
			} else if (dom.byId("g4").checked) {
				groupBy = ["milestone"];
			} else if (dom.byId("g5").checked) {
				groupBy = ["status"];
			} else if (dom.byId("g6").checked) {
				groupBy = ["version"];
			}
			if (dom.byId("g22").checked) {
				groupBy.push(["owner"]);
			} else if (dom.byId("g23").checked) {
				groupBy.push(["component"]);
			} else if (dom.byId("g24").checked) {
				groupBy.push(["milestone"]);
			} else if (dom.byId("g25").checked) {
				groupBy.push(["status"]);
			} else if (dom.byId("g26").checked) {
				groupBy.push(["version"]);
			}
			var treeMap = registry.byId("treeMap");
			if (groupBy.length > 0) {
				treeMap.set("groupAttrs", groupBy);
			} else {
				treeMap.set("groupAttrs", null);
			}
		};
		/* jshint +W074 */

		sizeByChanged = function () {
			var treeMap = registry.byId("treeMap");
			if (dom.byId("s1").checked) {
				treeMap.set("areaFunc", sizeByPriorityFunc);
			} else if (dom.byId("s2").checked) {
				treeMap.set("areaFunc", sizeByCcFunc);
			}
		};

		colorByChanged = function () {
			var treeMap = registry.byId("treeMap");
			if (dom.byId("c1").checked) {
				treeMap.set("colorFunc", colorByPriorityFunc);
			} else if (dom.byId("c2").checked) {
				treeMap.set("colorFunc", colorByDateFunc);
			}
		};
	});