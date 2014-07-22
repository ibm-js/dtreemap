var groupByChanged, sizeByChanged, colorByChanged, treeMap, groupAttrs = ["assignee"];

var DAY = 86400000;

var groupsFuncs = function () {
	return groupAttrs.map(function (attr) {
		return function (item) {
			if (item[attr]) {
				return item[attr].title || item[attr].login || item[attr].id;
			} else {
				return "not specified";
			}
		};
	});
};

var colorByPriorityFunc = function (item) {
	var priority = getPriority(item);
	switch (priority) {
	case "blocker":
		return {r: 255, g: 0, b: 0};
	case "high":
		return {r: 170, g: 85, b: 0};
	case "medium":
		return {r: 128, g: 128, b: 0};
	case "low":
		return {r: 85, g: 170, b: 0};
	default:
		return {r: 0, g: 255, b: 0};
	}
	return {};
};

var getPriority  = function (item) {
	var priority = "none";
	item.labels.some(function (label) {
		var p = label.name.charAt(0);
		switch (p) {
		case "1":
			priority = "low";
			break;
		case "2":
			priority = "medium";
			break;
		case "3":
			priority = "high";
			break;
		case "4":
			priority = "blocker";
		}
	});
	return priority;
};

var colorByDateFunc = function (item) {
	/* jshint -W106 */
	var created = new Date(item.created_at).getTime();
	/* jshint +W106 */
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
	var priority = getPriority(item);
	switch (priority) {
	case "blocker":
		return 5;
	case "high":
		return 4;
	case "medium":
		return 3;
	case "low":
		return 2;
	default:
		return 1;
	}
	return 0;
};

var sizeByCommentFunc = function (item) {
	return item.comments ? item.comments + 1 : 1;
};

require(["dcl/dcl", "dojo/request", "dcolor/Color", "delite/register",
		/*"delite/Tooltip", */ "dojo/dom-style", "dojo/dom-attr", "dojo/dom-construct",
		"deliteful/LinearLayout", "dtreemap/TreeMap", "dtreemap/Keyboard", "dtreemap/DrillDownUp",
		"dstore/Memory", "dstore/Observable", "requirejs-domready/domReady!"],
function (dcl, request, Color, register, /*Tooltip, */domStyle, domAttr, domConstruct, LinearLayout, TreeMap,
		  Keyboard, DrillDownUp, Memory, Observable) {
	register("my-treemap", [TreeMap, Keyboard, DrillDownUp], {
		createRenderer: dcl.superCall(function (sup) {
			return function (item, level, kind) {
				if (kind === "leaf") {
					var div = domConstruct.create("a");
					/*jshint -W106*/
					domAttr.set(div, "href", item.html_url);
					/*jshint +W106*/
					domStyle.set(div, "overflow", "hidden");
					domStyle.set(div, "position", "absolute");
					return div;
				} else {
					return sup.call(this, item, level, kind);
				}
			};
		})
	});
	register.parse();
	treeMap = document.getElementById("treeMap");
	treeMap.colorFunc = colorByPriorityFunc;
	treeMap.areaFunc = sizeByCommentFunc;
	treeMap.groupFuncs = groupsFuncs();
	/*
	 treeMap.onItemRollOver = function (evt) {
	 if (evt.item.summary) {
	 Tooltip.show(evt.item.summary, evt.renderer);
	 }
	 };
	 treeMap.onItemRollOut = function (evt) {
	 Tooltip.hide(evt.renderer);
	 };*/
	request.get("https://api.github.com/repos/ibm-js/deliteful/issues?per_page=100", {
		handleAs: "json"
	}).then(function (data) {
		var store = new (Memory.createSubclass(Observable))({data: data});
		// depending on when we arrive here treemap
		// might already been there...
		// reset data:
		treeMap.store = store;
	}, function () {
		console.log("could not reach data source");
	});
});

/* jshint -W074 */
groupByChanged = function () {
	groupAttrs = [];
	if (document.getElementById("g2").checked) {
		groupAttrs = ["user"];
	} else if (document.getElementById("g3").checked) {
		groupAttrs = ["assignee"];
	} else if (document.getElementById("g4").checked) {
		groupAttrs = ["milestone"];
	}
	if (document.getElementById("g22").checked) {
		groupAttrs.push(["user"]);
	} else if (document.getElementById("g23").checked) {
		groupAttrs.push(["assignee"]);
	} else if (document.getElementById("g24").checked) {
		groupAttrs.push(["milestone"]);
	}
	if (groupAttrs.length > 0) {
		treeMap.groupFuncs = groupsFuncs();
	} else {
		treeMap.groupFuncs = null;
	}
};
/* jshint +W074 */

sizeByChanged = function () {
	if (document.getElementById("s1").checked) {
		treeMap.areaFunc = sizeByPriorityFunc;
	} else if (document.getElementById("s2").checked) {
		treeMap.areaFunc = sizeByCommentFunc;
	}
};

colorByChanged = function () {
	if (document.getElementById("c1").checked) {
		treeMap.colorFunc = colorByPriorityFunc;
	} else if (document.getElementById("c2").checked) {
		treeMap.colorFunc = colorByDateFunc;
	}
};
