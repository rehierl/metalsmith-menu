
"use strict";

/* 
 * A basic example to show how to add a local menu to a menu file.
 * "local menu" as in a display of the previous upper and next child menu entries.
 */

const util = require("util");

module.exports = function(files, metalsmith, done) {
	Object.keys(files).forEach(function(path, index, array) {
		const file = files[path];
		
		let node = file.menu;
		if( !node) return;

		let contents = [];
		let menu = [ "# local menu"];
		
		let parent = node.parent;
		let prefix, suffix;
		
		if(parent.level > 0) {
			//- add a link to the next "upper" menu file
			prefix = parent.keyArray.join(".");
			suffix = parent.file ? parent.path : "dummy";
			menu.push(util.format("%s - %s", prefix, suffix));
		}
		
		//- add the node entry itself
		prefix = node.keyArray.join(".");
		suffix = node.file ? node.path : "dummy";
		menu.push(util.format("%s - %s (current)", prefix, suffix));
		
		node.children.forEach(function(child, index, array) {
			prefix = child.keyArray.join(".");
			suffix = child.file ? child.path : "dummy";
			menu.push(util.format("%s - %s", prefix, suffix));
		});
		
		contents.push(menu.join("\n"));
		contents.push("");
		contents.push(file.contents.toString());
		file.contents = contents.join("\n");
	});
	done();
};
