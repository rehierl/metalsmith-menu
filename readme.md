
metalsmith-menu
===============

This [Metalsmith](https://github.com/segmentio/metalsmith) plugin reads a
hierarchical menu structure from file properties and attaches it as a tree of
nodes to Metalsmith's metadata and/or file data objects. That tree structure can
then be used to create a sitemap, a global menu, breadcrumbs, local menus or
even to merge all files into a single large file.

## Installation

```js
npm install metalsmith-menu
```

## Overview

At first you need to mark your files with some property. The easiest way to do
this is to use YAML frontmatter:

```
---
menu: "1.2.3"
---
file content
```

It is also allowed to define the key as an array; e.g. `[1, 2, 3]`. To be more
accurate: How exactly you attach such keys to file objects is not important. You
could also use Javascript to assign keys.

- Notice: The default reader function works best with simple integer sequences
  defined as above. Custom reader functions can be used to support more complex
  components like roman letters. (see `Options.readMenuKeyFunc` for more details)

Once the plugin runs, it reads these keys into a menu tree. As an example, such
a tree could have the the following structure:

```
root
  [1] => dummy
  .  [1, 1] => 1.txt
  .  [1, 1] => 4.txt
  .  [1, 2] => 2.txt
  .  .  [1, 2, 3] => 3.txt
  [2] => 5.txt
```

Assuming you have used the following keys:

```
//- read (path, key) as files[path].menu = key
("1.txt", "1.1"), ("2.txt", "1.2"), ("3.txt", "1.2.3"), ("4.txt", "1.1"), ("5.txt", "2")
```

When the plugin builds the tree, it starts at the root and fetches the key from
the current file. It then takes the first component of the key and compares
it with the first component of all child nodes that are already attached to the
root. The plugin will add a new node if that component wasn't found. It will then
use the new node, or the child node it found as new root.

- Notice: No file has key "1" assigned to it. As a result, the generation of the
  menu tree is forced to include a dummy node (e.g. `[1]`). These nodes can easily
  be detected by testing the condition `(node.file === undefined)`.
- Notice: Files "1.txt" and "4.txt" use the same key. In other words: This plugin
  does not require that keys are unique.

Once the plugin has built the menu tree and attached it to metalsmith's data
objects, you can use it to create:

- a sitemap.
- a global menu - to display the first levels of the global menu structure.
- breadcrumbs - to display how to reach the current node (menu file) from the root.
- local menus - to display what the parent menu is and what the sub-menus are.

You could even use the menu tree to merge all files into a single large file.

See the `./examples` sub-folder for details.

## Usage

```js
const menu = require('metalsmith-menu');

//- this will use only default options
.use(menu())

//- this will use the given string value for
//  menuKey, menuMetalsmith, menuFile
.use(menu("menu"))

//- supply an object with custom settings
.use(menu(options));
```

For options you only need to pass a simple javascript object that has the
following properties (see `./src/Options.js` for more details):

```js
Options {
  //- a multimatch pattern to select which files to process.
	//- an array of patterns is supported.
  //- files that don't match (any pattern) will be ignored.
  filter: "**",

  //- the name of the file property to read from.
  //- files will be ignored if there is no such property.
  menuKey: "menu",

  //- if file[menuKey] holds a string value, then this setting
  //  defines which separator to use to split that value.
  menuKeySep: ".",

  //- to which metadata property to attach the menu tree's root node.
  menuMetalsmith: "menu",

  //- to which file property to attach a file's menu tree node.
  //- all file[menuKey] properties will be overwritten if
  //  (options.menuKey == options.menuFile)!
  menuFile: "menu"

  //- a custom function used to read all file[menuKey]
  //- expected signature is: Array function(Node, Options)
	//- see below for it's expected behavior
  readMenuKeyFunc: <default reader function>,
}
```

- Notice: If any property is missing (e.g. commented out), then a default
  value will be used. The above definition showcases the values used by default.
- Notice: metadata[menuMetalsmith] and all file[menuFile] properties will
  refer to different nodes of the same tree.
- Notice: By letting the plugin run multiple times with different values for
  menuKey, menuMetalsmith and menuFile it is possible to generate multiple
  distinct menu trees.

Once the plugin has run, node objects will be attached to metalsmith's metadata
object and/or each menu file. These objects have the following properties (see
`./src/Node.js` for more details):

```js
Node {
  //- undefined, or corresponds to files[i]
  //- e.g. one of your menu file is marked with "1.1", but none with "1";
  //  in that case, a node is generated for "1" with no file object attached to
  //  it (i.e. undefined, aka dummy node).
  file: undefined,

  //- undefined, or corresponds to the path of files[i]
  //  i.e. the key of a file assigned to it by the files object
  //- e.g. files["test.txt"] = {...} will get you:
  //  node.file = {...}, node.path = "test.txt"
  path: undefined,

  //- the fully qualified menu path
  //- e.g. [1, 2, 3] if your file is marked with "1.2.3"
  keyArray: [],

  //- the topmost node of the menu tree
  //- root.root = root (circular!)
  root: this,

  //- undefined, or the next node when moving one step up towards the root
  parent: undefined,

  //- undefined, or the next sibling; same level, same parent
  next: undefined,

  //- undefined, or the previous sibling; same level, same parent
  previous: undefined,

  //- all direct child nodes of the current node
  //- nodes will be sorted in ascending order
  children: [ Node ],

  //- all child nodes of the current sub-tree
  //- nodes will be sorted in ascending order
  childrenAll: [ Node ],

  //- how deep into the tree a node is located
  //- root.level = 0, node.level = node.parent.level + 1
  //- this value is identical to keyArray.length
  level: 0
}
```

A crude method to visit all menu nodes in ascending order is:

```js
.use(function(files, metalsmith, done) {
  const metadata = metalsmith.metadata();
  const root = metadata.menu;
  root.childrenAll.forEach(function(node, index, array) {
    console.log(node.keyArray.join('-'));
  });
})

//- assuming the menu tree from the above example,
//  this will print the following values (one per line and in that order):
1, 1-1, 1-1, 1-2, 1-2-3, 2
```

### Options.readMenuKeyFunc

If this property evaluates to `undefined`, a default reader function will be used.
This default reader does some checking and only performs basic transformations
on file[menuKey] values: (1) convert to an array (2) trim() all components
(3) convert strings like `"N"` to numbers, if the value matches `/[0-9]+/`.
Therefore, the default reader will best work with simple number sequences.

In the case that some pre-processing has already been done to turn all keys
into valid arrays, set this property to `false`. This will tell the plugin
to expect these arrays to already have their final value/form. The plugin will
then do basic checks, but won't visit or alter any key components.

For a custom reader, assign a function to this property that has the following
signature: `Array function(Node, Options)`

Such a custom reader functions are expected to:

- Transform node.file[options.menuKey] values into non-empty arrays in a way
  that `node1.keyArray[i]` can be compared with `node2.keyArray[i]`. These
  comparisons will only be done amongst children of the same node.
- Return the resulting array without assigning it to node.keyArray.
- If the reader returns `false`, node.file will be ignored.

This will allow you to use keys that have complex components like "XIII" (roman
numbers), "Index A" or "Chapter 1". The most simplistic method to implement a
custom reader would be to transform all key components into integer values.

## License

MIT
