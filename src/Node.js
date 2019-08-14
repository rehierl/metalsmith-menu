
"use strict";

module.exports = Node;

//========//========//========//========//========//========//========//========

function Node() {
  //- the file's metadata object
  //- root.file has no meaning
  //- (node.file === undefined) => empty dummy node
  //  these may still have non-dummy children!
  this.file = undefined;

  //- the file's relative path
  //- root.path has no meaning
  //- (node.path === undefined) => empty dummy node
  //  these may still have non-dummy children!
  this.path = undefined;

  //- the array that resulted from reading file[.menuKey]
  //- root.keyArray is always empty; i.e. has no meaning
  //- node.keyArray.length can be considered as the node's level
  this.keyArray = [];

  //- the topmost parent node of the tree this node is part of
  //- root.root = root
  //- node.root = parent.root
  this.root = this;

  //- the immediate parent of this node
  //- root.parent = undefined
  //- child.parent = this
  this.parent = undefined;

  //- the next sibling at the same level
  //- root.next = always undefined
  //- node.next = node.parent.children[i+1]
  //  if node = node.parent.children[i]
  //- remains undefined if there is none
  this.next = undefined;

  //- the previous sibling at the same level
  //- root.previous = always undefined
  //- node.previous = node.parent.children[i-1]
  //  if node = node.parent.children[i]
  //- remains undefined if there is none
  this.previous = undefined;

  //- an array that will hold only direct children of the current node
  //- may contain empty dummy nodes
  this.children = [];

  //- an array that will hold all child nodes of the current subtree
  //- root.childrenAll = an array of all nodes in the whole tree;
  //  this does/will not include the root node itself!
  //- may contain empty dummy nodes
  //- warning - this could cause memory issues
  this.childrenAll = [];

  //- reflects how deep into the tree a node is located
  //- root.level = 0
  //- node.level = node.parent.level + 1
  //- equals node.keyArray.length
  //- an explicit property for your convenience
  this.level = 0;
}

//========//========//========//========//========//========//========//========

//- add a new node/file to the current tree
//- allows to add different nodes/files with identical keyArrays
//- will (not always) add the given node instance to the tree
//- returns the node that reflects the file.
//  (node === result) is not always guaranteed to be the case
Node.prototype.addNode = function (node) {
  let parent = this.root;

  while (true) {//- i.e. non-recursive add
    let ic = parent.children.length;
    let level = parent.keyArray.length;
    let key = node.keyArray[level];
    let child = undefined;
    let ix = 0;

    while(ix < ic) {
      child = parent.children[ix];
      if (child.keyArray[level] === key) {
        break;
      }
      ix = ix + 1;
    }

    if(ix >= ic) {//- key not found
      //- if(node must be added deeper into the tree)
      //- key was not found, so add a dummy node
      //=> (node.file == undefined) => empty dummy node
      if ((node.keyArray.length - level) > 1) {
        child = new Node();
        //child.file = undefined;
        //child.path = undefined;
        child.keyArray = node.keyArray.slice(0, level + 1);
        child.root = parent.root;
        child.parent = parent;
        parent.children.push(child);
        parent = child;
        continue;
      }

      //- if(node must become a direct child of parent)
      node.root = parent.root;
      node.parent = parent;
      parent.children.push(node);
      return node;
    }

    else {//- if(ix < ic) {//- key was found
      //- if(node must be added deeper into the tree)
      if ((node.keyArray.length - level) > 1) {
        parent = child;
        continue;
      }

      //- if(node must become a direct child of parent)
      //- if child is an empty dummy node, then simply update that dummy node
      //- child and node have identical .keyArray properties
      if (child.file === undefined) {
        //- this will dump any additional node properties set by .readMenuKeyFunc
        child.file = node.file;
        child.path = node.path;
        return child;
      }

      //- child and node have identical .keyArray properties:
      //  i.e. two files with identical .menuKey properties - key collision!
      node.root = parent.root;
      node.parent = parent;
      parent.children.push(node);
      return node;
    }
  }//- while
};

//========//========//========//========//========//========//========//========

//- visit nodes in bottom-to-top order:
//  i.e. leafs first, parents next, root last
//- this traversal method will visit the root node
//- this will not respect any other order that the nodes/files might have
Node.prototype.visitLeafsFirst = function (visitCallback) {
  let reversedOrder = [ this.root ];
  let ix = 0;

  while(ix < reversedOrder.length) {
    let node = reversedOrder[ix];
    let jc = node.children.length;

    for(let jx=0; jx<jc; jx++) {
      let child = node.children[jx];
      reversedOrder.push(child);
    }

    ix = ix + 1;
  }

  ix = ix - 1;

  while(ix >= 0) {
    let node = reversedOrder[ix];
    visitCallback(node);
    ix = ix - 1;
  }
};

//========//========//========//========//========//========//========//========

//- visit nodes in "alphabetical" order
//  alphabetically according to the node.keyArray values
//- this should essentially get you the same order as in root.childrenAll
//- this traversal method will visit the root node
Node.prototype.visitInOrder = function (visitCallback) {
  let next = [ this.root ];

  while(next.length > 0) {
    let node = next.pop();
    let children = node.children;
    let ic = children.length;

    visitCallback(node);

    for(let ix=ic-1; ix>=0; ix--) {
      let child = children[ix];
      next.push(child);
    }
  }
};

//========//========//========//========//========//========//========//========

Node.prototype.finalize = function () {
  this.visitLeafsFirst(function(node) {
    let children = node.children;
    let ic = children.length;

    let level = node.keyArray.length;
    node.level = level;

    if(ic === 0) {
      return;
    }

    //- sort child nodes
    //- a custom sort function does not make sense
    //- see node.chilrenAll = concatenate all child.childrenAll arrays
    children.sort(function (n1, n2) {
      let k1 = n1.keyArray[level];
      let k2 = n2.keyArray[level];

      if (k1 < k2) {
        return -1;
      }

      if (k1 > k2) {
        return +1;
      }

      //- if(k1 == k2)
      return 0;
    });

    //- connect child nodes
    for (let ix = 1; ix < ic; ix++) {
      children[ix - 1].next = children[ix];
      children[ix].previous = children[ix - 1];
    }

    let nodeArray = node.childrenAll;

    //- fill node.childrenAll
    for (let ix = 0; ix < ic; ix++) {
      let child = children[ix];
      let childArray = child.childrenAll;
      let jc = childArray.length;

      nodeArray.push(child);

      for (let jx = 0; jx < jc; jx++) {
        nodeArray.push(childArray[jx]);
      }
    }
  });
};
