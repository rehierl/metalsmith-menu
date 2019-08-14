
"use strict";

/*
 * A basic example to show how to add a global menu to a menu file.
 * "global menu" as in a display of the first two levels of the menu tree.
 */

const util = require("util");

module.exports = function(files, metalsmith, done) {
  const metadata = metalsmith.metadata();
  const root = metadata.menu;

  Object.keys(files).forEach(function(path, index, array) {
    const file = files[path];

    let node = file.menu;
    if( !node) return;

    let contents = [];
    let menu = [ "# global menu"];

    root.children.forEach(function(node, index, array) {
      let prefix = node.keyArray.join(".");
      let suffix = node.file ? node.path : "dummy";
      let current = util.format("%s - %s", prefix, suffix);
      let children = [];

      node.children.forEach(function(child, index, array) {
        prefix = child.keyArray.join(".");
        suffix = child.file ? child.path : "dummy";
        children.push(util.format("%s - %s", prefix, suffix));
      });

      children = children.join(", ");
      menu.push(util.format("%s { %s }", current, children));
    });

    contents.push(menu.join("\n"));
    contents.push("");
    contents.push(file.contents.toString());
    file.contents = contents.join("\n");
  });
  done();
};
