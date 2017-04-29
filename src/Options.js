
"use strict";

const is = require("is");

module.exports = Options;

//========//========//========//========//========//========//========//========

//metalsmith.files[file][options.menuKey]
//- a file will not contribute to the menu, if such a property evaluates to false
//  i.e. if(!file[options.menuKey]) then ignore
//- can be a string - e.g. "1.2."
//  - such values will be split into arrays using options.menuKeySep
//    as separator character/string; "1.2." -> sep is "." -> ["1", "2", ""]
//  - if you are using yaml frontmatter or the like, make sure
//    you don't unintentionally get floating point values
//- can be an array - e.g. ["1", "2", ""]
//  - all string components will be trimmed; i.e. " 1 " -> "1", " " -> ""
//- these arrays define an order over all menu entries/files
//  - empty strings will be replaced by ""
//  - strings that hold number values will be converted into numbers; e.g. "1" -> 1
//  - sorting/comparison will then be done first-to-last, one component at a time,
//		using the (<) and (>) operators
//  - as a result, you always have to supply a fully qualified key;
//    in terms of filesystem path values, there is no support for relative paths

//========//========//========//========//========//========//========//========

function Options() {
	//- a multimatch path pattern used to filter file objects
	//- only files that multimatch this pattern are taken into account
	//- this value is only used by the multimatch node module
	//- can be a single string or an array of string patterns
	this.filter = "**";

	//- from which file metadata property to take a file's menu key/location
	//- only files that have this property will be processed
	//- file[menuKey] will be replaced if (.menuKey == .menuFile);
	//  other than that, file[menuKey] won't be written to; read-only access
	this.menuKey = "menu";

	//- the separator ("." by default) used to split a menuFlag string
	//- caution: you don't want to let your frontmatter parser transform
	//  your value (e.g. "menu: 1.2") into a floating point value!
	//- either use a different separator, or enclose the value in quotes
	//- ".1. .2." will be split into ["", "1", " ", "2", ""]
	//  and each part will be trimmed => ["", "1", "", "2", ""]
	this.menuKeySep = ".";

	//- to which metalsmith metadata property to write the menu's root object/node
	//- set undefined to skip this operation
	this.menuMetalsmith = "menu";

	//- to which file metadata property to attach the file's node
	//- this will add a new file metadata property if (.menuKey != .menuFile)
	//- this will replace the file metadata property if (.menuKey == .menuFile)
	//- set undefined to skip this operation
	this.menuFile = "menu";

	//- a function that takes file[.menuKey] and
	//  transforms it into an array of comparable values,
	//  which it returns as it's result.
	//- this means that a[i] can be compared with b[i];
	//  this does not mean that a[i] can be compared with a[j], if i != j
	//- expected signature: Array readMenuKeyFunc(node, options)
	//- if this function returns undefined, the file will be ignored
	//- if this setting is undefined, file[.menuKey] will be used as is
	//this.readMenuKeyFunc = undefined;
}

//========//========//========//========//========//========//========//========

Options.prototype.combine = function (userOptions) {
	{//- acceptance of non-object arguments
		if (arguments.length === 0) {
			//- menu() => don't use any non-default options
			userOptions = {};
		} else if (is.string(userOptions)) {
			//- menu("value") => apply "value" to
			//  .menukey, .menuMetalsmith, .menuFile
			userOptions = {
				menuKey: userOptions,
				menuMetalsmith: userOptions,
				menuFile: userOptions
			};
		}
	}

	//- at this point, userOptions must be an object
	if (!is.object(userOptions)) {
		throw new TypeError("invalid options argument");
	}

	{//- basic validation of userOptions
		//- userOptions properties are tested if, and only if,
		//  a property exists *and* if it's value is not undefined
		let value = undefined;

		value = userOptions.filter;
		if ((value !== undefined) && !(is.string(value) || is.array(value))) {
			throw new TypeError("options.filter must be a string or an array");
		}

		value = userOptions.menuKey;
		if ((value !== undefined) && !is.string(value)) {
			throw new TypeError("options.menuKey must be a string value");
		}

		value = userOptions.menuKeySep;
		if ((value !== undefined) && !is.string(value)) {
			throw new TypeError("options.menuKeySep must be a string value");
		}

		value = userOptions.readMenuKeyFunc;
		if ((value !== undefined) && !is.fn(value)) {
			throw new TypeError("options.readMenuKeyFunc must be a function");
		}

		value = userOptions.menuMetalsmith;
		if ((value !== undefined) && !is.string(value)) {
			throw new TypeError("options.menuMetalsmith must be a string value");
		}

		value = userOptions.menuFile;
		if ((value !== undefined) && !is.string(value)) {
			throw new TypeError("options.menuFile must be a string value");
		}
	}

	{//- override the default settings with the user's options
		let thisInstance = this;

		Object.keys(this).forEach(function (current, index, array) {
			//- if userOptions has a property, then use it's value;
			//  whatever that may be - this includes 'undefined' values
			if (userOptions.hasOwnProperty(current)) {
				thisInstance[current] = userOptions[current];
			}
		});
	}
};
