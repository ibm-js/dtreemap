define([
	"intern!object",
	"intern/chai!assert",
	"delite/register",
	"dtreemap/TreeMap",
	"dstore/Memory",
	"dcolor/MeanColorModel",
	"dcolor/Color"
], function (registerSuite, assert, register, TreeMap, Memory, MeanColorModel, Color) {
	var container, source;
	registerSuite({
		name: "Attr",
		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
			source = new Memory({idProperty: "label", data:
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
			treeMap.style.height = "480px";
			treeMap.source = source;
			treeMap.areaAttr = "sales";
			treeMap.colorAttr = "profit";
			treeMap.groupAttrs = ["region"];
			treeMap.colorModel = colorModel;
			container.appendChild(treeMap);
			treeMap.attachedCallback();
			treeMap.deliver();
			var div = treeMap.firstChild;
			var groups = div.querySelectorAll(".d-treemap-group");
			assert.strictEqual(groups.length, 3, "groups");
			for (var i = 0; i < groups.length; i++) {
				var headers = groups[i].querySelectorAll(".d-treemap-header");
				assert.strictEqual(headers.length, 1, "headers");
				var content = groups[i].querySelectorAll(".d-treemap-groupcontent");
				assert.strictEqual(content.length, 1, "content");
				var leafs = content[0].querySelectorAll(".d-treemap-leaf");
				assert.strictEqual(leafs.length, (i === 2 ? 2 : 3), "leafs");
			}
		},
		teardown : function () {
			container.parentNode.removeChild(container);
		}
	});
});

