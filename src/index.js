
"use strict";

const is = require("is");
const util = require("util");
const multimatch = require("multimatch");

const Options = require("./Options.js");
const Node = require("./Node.js");

module.exports = plugin;

//========//========//========//========//========//========//========//========

/**
 * the plugin's constructor function.
 * 
 * @param {Options} options - see ./Options.js for a detailed description
 *   @property {string} filter - a multimatch pattern used to filter file objects.
 *   defaults to "**".
 *   @property {string} menuKey - used to access file[menuKey]. defaults to "menu".
 *   @property {string} menuKeySep - used to execute file[menuKey].split(menuKeySep).
 *   but only if file[menuKey] is a string, and not an array.
 *   @property {Function} readMenuKeyFunc - used to read file[menuKey]. expected
 *   signature is "Array function(node, options)".
 *   @property {string} menuMetalsmith - to which property to add the tree's root
 *   node; i.e. metalsmith.metadata()[menuMetalsmith] = root. defaults to "menu".
 *   @property {string} menuFile - to which property to add the file's tree node;
 *   i.e. file[menuFile] = node. defaults to "menu", which will replace file[menuKey]
 *   if menuKey still has it's default value.
 * @returns {Function} - the plugin's worker function
 */
function plugin(options) {
	const settings = new Options();
	//- validate input options and use these to override the default values
	//- this will also override .readMenuKeyFunc if the user specifies his own
	//  reader function, or if he assigns undefined to that property
	settings.combine(options);
	
	let readFunc = undefined;
	
	if(settings.readMenuKeyFunc === undefined) {
		//- the user didn't choose anything, use the default reader
		readFunc = readMenuKeyFuncDefault;
	} else if(settings.readMenuKeyFunc === false) {
		//- the keyArray properties need no further processing
		readFunc = readMenuKeyFuncAsIs;
	} else {
		//- use the user's custom reader function
		readFunc = settings.readMenuKeyFunc;
	}

	/**
	 * the plugin's worker function.
	 * 
	 * @param {object} files - metalsmith's file's container
	 * @param {object} metalsmith - metalsmith's main object
	 * @param {Function} done - when finished, execute done() to not block the
	 * pipeline. execute done(error) if a fatal error occurs.
	 * @returns {undefined}
	 */
	return function main(files, metalsmith, done) {
		const root = new Node();
		
		let keys = Object.keys(files);
		multimatch(keys, settings.filter)
		.forEach(function (current, index, array) {
			//- you can't assume that file1 is processed before file2
			//- don't make any assumptions about the order
			var file = files[current];
			
			if( !file.hasOwnProperty(settings.menuKey)) {
				//- this file doesn't have the .menuKey property
				return;//- skip/ignore this file
			}
			
			//- transform file[menuKey] into an array of values
			//- do not use any node properties to store values;
			//  it might work, but it isn't guaranteed to always work.
			//  see Node.js on dummy nodes
			let result = readFunc(current, file, settings);
			
			if(result === false) {
				//- the reader function's signal to not process this file
				return;//- skip/ignore this file
			}

			if (!is.array(result) || is.empty(result)) {
				//- the reader function is expected to return a non-empty array
				throw new TypeError("options.readMenuKeyFunc must return a non-empty array");
			}
			
			let node = new Node();
			node.file = file;
			node.path = current;
			
			//- now, these arrays are expected as they are supposed to be
			//- node1.keyArray[i] can be compared with node2.keyArray[i];
			//  that doesn't mean that node.keyArray[i] can/will be
			//  compared with node.keyArray[k], where i != k
			node.keyArray = result;
			
			//- add this node/file to the structure
			//- the input argument won't necessarily be added to the tree.
			//  the node returned will be part of the tree and is associated with
			//  the current file.
			//- (node !== result) will occasionally be true
			node = root.addNode(node);

			if (settings.menuFile) {
				//- assign the file's node; i.e. (file === node.file)
				//- use file[menuFile].root, if you need to access the whole tree
				file[settings.menuFile] = node;
			}
		});
		
		//- no more nodes to add, so finalize the structure
		//- sort child nodes, update .next, .previous and .childrenAll
		root.finalize();

		if (settings.menuMetalsmith) {
			//- assigne the tree's root node
			let metadata = metalsmith.metadata();
			metadata[settings.menuMetalsmith] = root;
		}

		done();
	};
};

//========//========//========//========//========//========//========//========

/**
 * - used as reader function if the user assigns undefined to .readMenukeyFunc;
 *   i.e. the property is defined, but it's value is undefined
 * 
 * @param {String} path - the file's path taken from metalsmith's 'files' object
 * @param {Object} file - the file's object taken from metalsmith's 'files' object
 * @param {Options} options - options from which to take .menuKey and .menuKeySep
 * @returns {Array|undefined} - the parsed node.file[options.menuKey] array,
 * or undefined if node.file has to be skipped/ignored
 * @throws {TypeError} - if node.file[options.menuKey] is not as expected
 */
function readMenuKeyFuncAsIs(path, file, options) {
	let keyArray = file[options.menuKey];
	
	if(keyArray === undefined) {
		return undefined;//- skip/ignore this file
	}
	
	if (!is.array(keyArray)) {
		throw new TypeError("invalid file.menuKey value");
	}
	
	if (keyArray.length === 0) {
		throw new TypeError("file.menuKey array must not be empty");
	}
	
	return keyArray;
}

//========//========//========//========//========//========//========//========

/**
 * - the default method used to read file[.menuKey] values
 * in short it
 * - (if file[.menuKey] is a string) splits a string value into an array
 * - makes sure each array component is defined and primitive
 * - use trim() on any string array component
 * - replaces any empty string array component by ""
 * - replaces any stringified integer array component by its number: "N" -> N
 * 
 * @param {String} path - the file's path taken from metalsmith's 'files' object
 * @param {Object} file - the file's object taken from metalsmith's 'files' object
 * @param {Options} options - options from which to take .menuKey and .menuKeySep
 * @returns {Array|undefined} - the parsed node.file[options.menuKey] array,
 * or undefined if node.file has to be skipped/ignored
 * @throws {TypeError} - if node.file[options.menuKey] is not as expected
 */
function readMenuKeyFuncDefault(path, file, options) {
	let keyArray = file[options.menuKey];
	
	if(keyArray === undefined) {
		return undefined;//- skip/ignore this file
	}
	
	if (is.string(keyArray)) {
		keyArray = keyArray.split(options.menuKeySep);
	}
	
	if (!is.array(keyArray)) {
		throw new TypeError("invalid file.menuKey value");
	}
	
	if (keyArray.length === 0) {
		throw new TypeError("file.menuKey array must not be empty");
	}
	
	keyArray.forEach(function(current, index, array) {
		if (!is.primitive(current)) {
			//- object, functions, arrays won't be accepted
			//- values that evaluate to false will pass this test
			throw new TypeError("file.menuKey contains non-primitive values");
		}

		if (is.undef(current)) {//- disallow undefined
			throw new TypeError("file.menuKey contains undefined values");
		}

		if (is.nil(current)) {//- disallow null
			throw new TypeError("file.menuKey contains null values");
		}

		if (is.number(current)) {
			if (is.nan(current)) {//- disallow NaN (= not a number)
				console.log(typeof current);
				throw new TypeError("file.menuKey contains NAN numbers");
			}

			if (is.infinite(current)) {//- disallow Infinity, +Infinity, -Infinity
				throw new TypeError("file.menuKey contains infinite numbers");
			}

			//- leave it as it is
			return;
		}

		if (is.string(current)) {
			//- ignore whitespace at the beginning or the end
			let value = current.trim();

			if (value.length === 0) {
				//- allow empty strings to support things like "1.2."
				//  "1.2." => menuKeySep="." => ["1", "2", ""]
				//- hence, " " and "" will be considered to be equal
				keyArray[index] = "";
				return;
			}

			if (/^[0-9]+$/.test(value)) {
				//- make sure to not compare numbers as strings
				//- we need (2 < 10), not ("2" > "10")
				keyArray[index] = Number.parseInt(value, 10);
				return;
			}

			//- nothing to do other than to only use trimmed values
			keyArray[index] = value;
			return;
		}

		//- e.g. true, false, ...
		//- leave it as it is
		return;
	});

	return keyArray;
}
