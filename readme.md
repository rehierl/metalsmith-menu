
metalsmith-menu
===============

A [metalsmith](https://github.com/segmentio/metalsmith)
plugin to read menu structures from simple frontmatter properties.

## Installation

```js
npm install metalsmith-menu
```

## Overview

At first you need to mark your files with some property. The easiest way to achieve
this is to specify these using YAML frontmatter:

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

- Notice that all keys must be fully qualified: There is no other way to specify
  "1.2.3" by omitting any prefix; e.g. "2.3" will always be attached to "2".
- Notice that no file has key "1" assigned to it. As a result, the generation
  of the menu tree is forced to include a dummy node. These can be easily detected
  by testing the `node.file` properties.
- Notice that "4.txt" reuses the key (i.e. "1.1") that is already used by "1.txt".
  In other words: you will need to keep an eye open for such key collisions.

Once the plugin has created the menu tree and attached it to metalsmith's data,
you can use these nodes to add:

- a sitemap.
- a global menu - in order to display the first couple of levels
  of the whole menu structure.
- add breadcrumbs - in order to display how to reach the current
  node (menu file) from the root.
- add local menus - in order to display what the parent node is and what the
  direct child nodes are.

You could even use the menu tree to merge all menu files into one large file.  
See the `./examples` sub-folder for more details.

## Usage

```js
const menu = require('metalsmith-menu');

//- don't use any non-default values
.use(menu())

//- apply the given string value to
//  .menuKey, .menuMetalsmith, .menuFile
.use(menu("menu"))

//- supply an object to use custom settings
.use(menu(options));
```

For `options` you only need to pass a simple javascript object that has the
following properties (see `./lib/Options.js` for more details):

```js
Options properties {
  //- a multimatch pattern to select which files to process.
  //- files that don't match will be ignored.
  filter: "**",
  //- the name of the file property to read from.
  //- files will be ignored, if file[menuKey] is missing.
  menuKey: "menu",
  //- if file[menuKey] holds a string value, then
  //  this setting defines which separator to use to
  //  split that string into an array.
  menuKeySep: ".",
  //- to which metadata property to add the menu tree's root node.
  menuMetalsmith: "menu",
  //- to which file property to add a file's menu tree node.
  //- all file[menuKey] values will be replaced if
  //  (options.menuKey == options.menuFile)!
  menuFile: "menu"
  //- a custom function used to read Node.file[menuKey]
  //- expected signature: Array function(Node, Options)
  //- do not uncomment! - see below
  //readMenuKeyFunc: <default reader function>,
}
```

Once the plugin has run, node objects will be attached to metalsmith's
metadata object (see `options.menuMetalsmith`) and/or each menu file (see
`options.menuFile`). These objects have the following properties (see
`./lib/Node.js` for more details):

```js
Node properties {
  //- undefined, or corresponds to files[i]
  //- e.g. one of your menu file is marked with "1.1", but none with "1";
  //  in that case a node is generated for "1" with no file object attached to
  //  it (i.e. undefined, aka dummy node).
  file: undefined,
  //- undefined, or corresponds to the path of files[i]; i.e. the key of files[i]
  //- e.g. files["test.txt"] = {...} will get you:
  //  node.file = {...}, node.path = "test.txt"
  path: undefined,
  //- the fully qualified menu path
  //- e.g. [1, 2, 3] if your file is marked with "1.2.3"
  keyArray: [],
  //- the topmost node of the menu tree
  //- root.root = root (circular!)
  root: this,
  //- undefined, or the next node when moving one step closer towards the root
  parent: undefined,
  //- undefined, or the next sibling; same level, same parent
  next: undefined,
  //- undefined, or the previous sibling; same level, same parent
  previous: undefined,
  //- all direct child nodes of the current node
  //- nodes in ascending order
  children: [ Node ],
  //- all child nodes of the current subtree
  //- nodes in ascending order
  childrenAll: [ Node ],
  //- tells you how deep into the tree a node is located
  //- root.level = 0, node.level = node.parent.level + 1
  //- same as keyArray.length
  level: 0
}
```

A very basic method to visit all menu nodes in ascending order could be:

```js
.use(function(files, metalsmith, done) {
  const metadata = metalsmith.metadata();
  const root = metadata.menu;
  root.childrenAll.forEach(function(node, index, array) {
    console.log(node.keyArray.join('-'));
  });
})
```

Notice, that the plugin can be used to produce different menu trees by letting
it run multiple times, each time using different values for `menuKey`,
`menuMetalsmith` and `menuFile`.

### Options.readMenuKeyFunc

This property is expected to hold a function that has the following signature:  
`Array function(Node, Options)`.

If this property is completely missing, a default reader function will be used.
This default reader does some checking and only basic transformations on
`file[menuKey]` values: convert to an array, `trim()` all values,
convert `"N" (N in [0-9]*)` to numbers. Therefore, the default reader will best
work with keys that follow the pattern: `[0-9]{1,*}(\.[0-9]{1,*})*`.

By specifying a custom reader function, it is possible to use keys like
"XIII" (roman letters), "Index A" or "Chapter 1". Such a function is expected to:

- Transform `node.file[options.menuKey]` into a non-empty array:
  - `node1.keyArray[i]` can be compared with `node2.keyArray[i]`
  - `node1.keyArray[i]` won't be compared with `node2.keyArray[j]` with `i != j`
- Return the resulting array, don't just assign it to `node.keyArray`.
- Return `undefined` if you choose to skip the current file (`node.file`).

In the case that some pre-processing has already been done to turn all 
`file[menuKey]` values into valid arrays, then undefine this property:
i.e. `{... readMenuKeyFunc: undefined ...}`. This will tell the plugin to
basically expect these arrays to be valid.

## License

MIT
