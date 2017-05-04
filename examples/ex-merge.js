
"use strict";

/* 
 * A basic example to show how to join all menu files into a single large file.
 * Keep in mind, that this example does not transform any references from one
 * menu file to another. If you had such references, you would have to transform
 * those into internal ones.
 */

const util = require("util");

module.exports = function(files, metalsmith, done) {
  const metadata = metalsmith.metadata();
  const root = metadata.menu;
  let contents = [];
  
  root.childrenAll.forEach(function(node, index, array) {
    let prefix = node.keyArray.join(".");
    let suffix = node.file ? node.path : "dummy";
    contents.push(util.format("# %s - %s", prefix, suffix));
    
    if(node.file) {
      contents.push(node.file.contents.toString());
    } else {
      contents.push("");
    }
  });
  
  //- add contents to files as a new virtual file
  contents.push("");
  contents = contents.join("\n");
  contents = { contents: contents };
  files["merged.txt"] = contents;
  
  done();
};
