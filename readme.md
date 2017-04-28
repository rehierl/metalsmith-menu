
metalsmith-menu
===============

This [Metalsmith](https://github.com/segmentio/metalsmith) plugin read a
hierarchical menu structure from simple file properties and attaches it to
Metalsmith's metadata and/or file objects. That structure can then be used to
create a sitemap, a global menu, breadcrumbs, local menus or even to combine all
files into a single large file.

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

Of course, using Javascript to attach such keys to your `file` objects is also
possible. Once the plugin runs, it will read these keys and use them to create a
menu tree, which will be attached to your file objects and/or metalsmith's
`metadata` object.

A menu tree could have the following structure:

```
root
  [1] => dummy
  .  [1, 1] => 1.txt
  .  [1, 1] => 4.txt
  .  [1, 2] => 2.txt
  .  .  [1, 2, 3] => 3.txt
  [2] => 5.txt
```

Assuming you have the the following keys in use:

```
//- read (path, key) as files[path].menu = key
("1.txt", "1.1"), ("2.txt", "1.2"), ("3.txt", "1.2.3"), ("4.txt", "1.1"), ("5.txt", "2")
```

- Notice: All keys must be fully qualified: It is not possible to assign
  "1.2.3" by omitting any prefix; e.g. "2.3" will always be attached to "2".
- Notice: No file has key "1" assigned to it. As a result, the generation
  of the menu tree is forced to include a dummy node (e.g. `[1]`). These can be
  easily detected by testing the `node.file` properties.
- Notice: "1.txt" and "4.txt" use the same key. In other words: This plugin
  does not require that keys are unique. You will have to take care to not reuse
  any keys.

Once the plugin has created the menu tree and attached it to metalsmith's data
objects, you can use it to create:

- a sitemap.
- a global menu - to display the first levels of the global menu structure.
- breadcrumbs - to display how to reach the current node (menu file) from the root.
- local menus - to display what the parent menu is and what the sub-menus are.

You could even use the menu tree to combine all marked files into a single large file.  
See the `./examples` sub-folder for more details.

## Usage

```js
const menu = require('metalsmith-menu');

//- this will use only default options
.use(menu())

//- apply the given string value to
//  .menuKey, .menuMetalsmith, .menuFile
.use(menu("menu"))

//- supply an object with custom settings
.use(menu(options));
```

For `options` you only need to pass a simple javascript object that has the
following properties (see `./src/Options.js` for more details):

```js
Options {
  //- a multimatch pattern to select which files to process.
  //- files that don't match will be ignored.
  filter: "**",
  //- the name of the file property to read from.
  //- files will be ignored if there is no such property.
  menuKey: "menu",
  //- if file[menuKey] holds a string value, then this setting
  //  defines which separator to use to split that value.
  menuKeySep: ".",
  //- to which metadata property to add the menu tree's root node.
  //  i.e. metalsmith.metadata()[options.menuMetalsmith] = <menu-tree>
  menuMetalsmith: "menu",
  //- to which file property to add a file's menu tree node.
  //- all file[menuKey] properties will be replaced if
  //  (options.menuKey == options.menuFile)!
  menuFile: "menu"
  //- a custom function used to read Node.file[menuKey]
  //- expected signature: Array function(Node, Options)
  //- do not uncomment! - see below
  //readMenuKeyFunc: <default reader function>,
}
```

- Notice: If any property is missing (e.g. commented out), it's default value
  will be used.
- Notice: `metadata[menuMetalsmith]` and all `file[menuFile]` properties will
  reference to different nodes of the same menu tree.
- Notice: By letting the plugin run multiple times with different values for
  `menuKey`, `menuMetalsmith` and `menuFile` it is possible to generate multiple
  distinct menu trees.

Once the plugin has run, node objects will be attached to metalsmith's
metadata object (see `options.menuMetalsmith`) and/or each menu file (see
`options.menuFile`). These objects have the following properties (see
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

A very basic method to visit all menu nodes in ascending is:

```js
.use(function(files, metalsmith, done) {
  const metadata = metalsmith.metadata();
  const root = metadata.menu;
  root.childrenAll.forEach(function(node, index, array) {
    console.log(node.keyArray.join('-'));
  });
})

//- assuming the menu tree from the above example,
//  this will print the following lines:
1
1-1
1-1
1-2
1-2-3
2
```

### Options.readMenuKeyFunc

This property is expected to hold a function that has the following signature:
`Array function(Node, Options)`

If this property is completely missing, a default reader function will be used.
This default reader does some checking and only basic transformations on
`file[menuKey]` values: convert to an array, `trim()` all components,
convert `"N"` to numbers, if the value matches `/[0-9]+/`. Therefore, the default
reader will best work with keys that follow the pattern: `[0-9]+(\.[0-9]+)*`.

By writing a custom reader function, it is possible to use keys like
"XIII" (roman letters), "Index A" or "Chapter 1". Such a function is expected to:

- Transform `node.file[options.menuKey]` into a non-empty array:
  - `node1.keyArray[i]` can be compared with `node2.keyArray[i]`.  
    These comparisons will only be done between children of a single node.
  - `node1.keyArray[i]` won't be compared with `node1.keyArray[j]` with `i != j`
- Return the resulting array without assigning it to `node.keyArray`.
- Return `undefined` if the decision has been made to skip the current file (`node.file`).

In the case that some pre-processing has already been done to turn all 
`file[menuKey]` values into valid arrays, then undefine this property:
i.e. `{... readMenuKeyFunc: undefined ...}`. This will tell the plugin to
basically expect these arrays to already have their final value/form.

## License

MIT
