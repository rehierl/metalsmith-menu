
"use strict";

/* 
 * A basic example to show how to traverse the menu tree.
 * There are three methods to do this:
 * .visitLeafsFirst(), .visitInOrder(), .childrenAll[]
 */

module.exports = function(files, metalsmith, done) {
  const metadata = metalsmith.metadata();
  const root = metadata.menu;
  
  console.log("\n- root.visitLeafsFirst");
  root.visitLeafsFirst(function(node) {
    if(node === root) {
      console.log("root");
    } else {
      console.log(node.keyArray.join("-"));
    }
  });
  
  console.log("\n- root.visitInOrder");
  root.visitInOrder(function(node) {
    if(node === root) {
      console.log("root");
    } else {
      console.log(node.keyArray.join("-"));
    }
  });
  
  console.log("\n- root.childrenAll");
  root.childrenAll.forEach(function(node, index, array) {
    console.log(node.keyArray.join("-"));
  });
  
  done();
};
