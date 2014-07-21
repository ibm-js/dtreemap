/*global module */
module.exports = function (grunt) {

	// Project configuration.
	grunt.initConfig({
		jshint: {
			src: [
				"*.js",
				"tests/*.js",
				"api/*.js"
			],
			options: {
				jshintrc: ".jshintrc"
			}
		},
		intern: {
			local: {
				options: {
					runType: "runner",
					config: "tests/intern.local",
					reporters: ["runner"]
				}
			},
			remote: {
				options: {
					runType: "runner",
					config: "tests/intern",
					reporters: ["runner"]
				}
			}
		},
		"jsdoc-amddcl": {
			"dcolor": {
				files: [
					{
						args: [
							"-c",
							"./node_modules/jsdoc-amddcl/conf.json"
						],
						src: [
							".",
							"api/.",
							"./README.md",
							"./package.json"
						]
					},
					{
						args: [
							"-X",
							"-c",
							"./node_modules/jsdoc-amddcl/conf.json"
						],
						src: [
							".",
							"./README.md",
							"./package.json"
						],
						dest: "./out/doclets.json"
					}
				]
			}
		}
	});

	// Load plugins
	grunt.loadNpmTasks("intern");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("jsdoc-amddcl");

	// Aliases
	grunt.registerTask("jsdoc", "jsdoc-amddcl");

	// Testing.
	// Always specify the target e.g. grunt test:remote, grunt test:remote
	// then add on any other flags afterwards e.g. console, lcovhtml.
	var testTaskDescription = "Run this task instead of the intern task directly! \n" +
		"Always specify the test target e.g. \n" +
		"grunt test:local\n" +
		"grunt test:remote\n\n" +
		"Add any optional reporters via a flag e.g. \n" +
		"grunt test:local:console\n" +
		"grunt test:local:lcovhtml\n" +
		"grunt test:local:console:lcovhtml";
	grunt.registerTask("test", testTaskDescription, function (target) {
		function addReporter(reporter) {
			var property = "intern." + target + ".options.reporters",
				value = grunt.config.get(property);
			if (value.indexOf(reporter) !== -1) {
				return;
			}
			value.push(reporter);
			grunt.config.set(property, value);
		}

		if (this.flags.lcovhtml) {
			addReporter("lcovhtml");
		}

		if (this.flags.console) {
			addReporter("console");
		}
		grunt.task.run("intern:" + target);
	});
};