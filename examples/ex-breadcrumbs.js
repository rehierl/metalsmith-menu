
"use strict";

/* A basic example to show how to add breadcrumbs to each menu file.
 */

const util = require("util");

module.exports = function(files, metalsmith, done) {
	Object.keys(files).forEach(function(path, index, array) {
		const file = files[path];
		
		let node = file.menu;
		if( !node) return;

		let contents = [];
		let breadcrumbs = [];

		while(node.level > 0) {
			let prefix = node.keyArray.join(".");
			let suffix = (node.file) ? node.path : "dummy";
			let breadcrumb = util.format("%s - %s", prefix, suffix);
			breadcrumbs.push(breadcrumb);
			node = node.parent;
		}
		
		breadcrumbs = breadcrumbs.reverse();
		breadcrumbs = breadcrumbs.join(" >> ");
		breadcrumbs = util.format(">> %s", breadcrumbs);
		
		contents.push("# breadcrumbs");
		contents.push(breadcrumbs);
		
		contents.push("");
		contents.push(file.contents.toString());
		file.contents = contents.join("\n");
	});
	done();
};
