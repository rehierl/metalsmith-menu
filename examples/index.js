
/*
 * global __dirname
 * Used to disable JsHint warning about __dirname not being declared.
 */

"use strict";

const metalsmith = require("metalsmith");
const menu = require("../src/index.js");

//========//========//========//========//========

//- declared by Node
const basedir = __dirname;

//- create a new instance and set the working directory
const msi = new metalsmith(basedir)

//- set the working directory
.directory(basedir)

//- scan this subdirectory for source files
.source("files-input")

//- write the output files to this subdirectory
.destination("files-output")

//- set file or files to not load into the pipeline
//.ignore(files)

//- set true to recreate .destination()
//.clean(true)

//- the max number of files to read/write at a time
//.concurrency(Infinity)

//- global metadata to pass to templates
//.metadata({})

//- set true to enable frontmatter parsing
//.frontmatter(true)

//========//========//========//========//========

//*
.use(menu({
	//- only process text files
	filter: "**/*.txt",
	//- analyze file.menu properties
	menuKey: "menu",
	//- string used to split file.menu if needed
	menuKeySep: ".",
	//- function used to read file.menu
	//- set undefined to not parse file.menu
	//  useful only if values of file.menu values
	//  are already as they are needed
	//readMenuKeyFunc: undefined,
	//- to which metadata property to add the menu tree
	menuMetalsmith: "menu",
	//- to which file property to add the menu tree
	menuFile: "menu"
}))//*/

//========//========//========//========//========

//- end the current expression
;

//- require example modules
const traversal = require("./ex-traversal.js");
const sitemap = require("./ex-sitemap.js");
const merge = require("./ex-merge.js");
const breadcrumbs = require("./ex-breadcrumbs.js");
const local = require("./ex-local.js");
const global = require("./ex-global.js");

//- start a new expression
msi

//- use examples that act globally
.use(traversal)
.use(sitemap)
.use(merge)

//- use examples that act locally
//  i.e. change the contents of each menu file
.use(breadcrumbs)
.use(local)
.use(global)

//========//========//========//========//========

//- run metalsmith's build process
.build(function(error, files) {
  if(!error) { return false; }
  console.log("ERROR: " + error.message);
  throw error;
});
