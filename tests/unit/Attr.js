define([
	"intern!object",
	"intern/chai!assert",
	"delite/register",
	"dtreemap/TreeMap",
	"dstore/Memory",
	"dcolor/MeanColorModel",
	"dcolor/Color"
], function (registerSuite, assert, register, TreeMap, Memory, MeanColorModel, Color) {
	var container, store;
	registerSuite({
		name: "Attr",
		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
			store = new Memory({idProperty: "label", data:
				[
					{ label: "France", sales: 500, profit: 50, region: "EU" },
					{ label: "Germany", sales: 450, profit: 48, region: "EU" },
					{ label: "UK", sales: 700, profit: 60, region: "EU" },
					{ label: "USA", sales: 2000, profit: 250, region: "America" },
					{ label: "Canada", sales: 600, profit: 30, region: "America" },
					{ label: "Brazil", sales: 450, profit: 30, region: "America" },
					{ label: "China", sales: 500, profit: 40, region: "Asia" },
					{ label: "Japan", sales: 900, profit: 100, region: "Asia" }
				]
			});
		},
		"Regular" : function () {
			var colorModel = new MeanColorModel(new Color(Color.named.red), new Color(Color.named.green));
			var treeMap = register.createElement("d-treemap");
			treeMap.store = store;
			treeMap.areaAttr = "sales";
			treeMap.colorAttr = "profit";
			treeMap.groupsAttr = ["region"];
			treeMap.colorModel = colorModel;
			container.appendChild(treeMap);
			treeMap.startup();
			treeMap.deliver();
			
		},
		teardown : function () {
			container.parentNode.removeChild(container);
		}
	});
});

