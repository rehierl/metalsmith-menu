
"use strict";

/* 
 * A basic example to show how to generate a global sitemap.
 */

const util = require("util");

module.exports = function(files, metalsmith, done) {
  const metadata = metalsmith.metadata();
  const root = metadata.menu;
  let contents = [];
  
  contents.push("");
  contents.push("# sitemap via root.childrenAll");
  fromChildrenAll(contents, root);
  
  contents.push("");
  contents.push("# sitemap via root.visitInOrder");
  fromVisitInOrder(contents, root);
  
  //- add the contents to the files as a virtual file
  contents.push("");
  contents = contents.join("\n");
  contents = { contents: contents };
  files["sitemap.txt"] = contents;
  
  done();
};

function fromChildrenAll(contents, root) {
  root.childrenAll.forEach(function(node, index, array) {
    let prefix = node.keyArray.join(".");
    let suffix = "";
    
    if(node.file === undefined) {
      suffix = "dummy node";
    } else {
      suffix = node.path;
    }
    
    let line = util.format("%s -> %s", prefix, suffix);
    contents.push(line);
  });
}

function fromVisitInOrder(contents, root) {
  root.visitInOrder(function callback(node) {
    if(node.level === 0) return;//- ignore the root node
    let level = node.level;
    let indent = "\t".repeat(level-1);
    let prefix = node.keyArray[level-1];
    let suffix = "";
    
    if(node.file === undefined) {
      suffix = "dummy node";
    } else {
      suffix = node.path;
    }
    
    let line = util.format("%s%s -> %s", indent, prefix, suffix);
    contents.push(line);
  });
}
