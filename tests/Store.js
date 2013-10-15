define(["doh", "../TreeMap", "dojo/store/JsonRest"],
	function(doh, TreeMap, JsonRest){
	doh.register("dojox.treemap.tests.Store", [
		function test_Error(t){
			var treeMap = new TreeMap();
			treeMap.on("query-success", function(){
				t.f(true, "ok fct must not have been called");
			});
			treeMap.on("query-error", function(){
				t.t(true, "failure fct must have been called");
			});
			treeMap.store = new JsonRest({ target: "/" });

			treeMap.startup();
		}
	]);
});
