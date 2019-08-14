
"use strict";

const is = require("is");
const util = require("util");

module.exports = Options;

//========//========//========//========//========//========//========//========

//file[options.menuKey]
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
//    using the (<) and (>) operators
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
  //- expected signature: Array readMenuKeyFunc(path, file, options)
  //- if this function returns the value 'false', the file will be ignored
  //- if this setting has the value 'false', file[.menuKey] will be used as is
  //- if this setting evaluates to 'undefined', the default reader will be used
  this.readMenuKeyFunc = undefined;
}

//========//========//========//========//========//========//========//========

Options.prototype.combine = function (options) {
  {//- acceptance of non-object arguments
    if (arguments.length === 0) {
      //- menu() => don't use any non-default options
      options = {};
    } else if (is.string(options)) {
      //- menu("value") => apply "value" to
      //  .menukey, .menuMetalsmith, .menuFile
      options = {
        menuKey: options,
        menuMetalsmith: options,
        menuFile: options
      };
    }
  }

  //- from now on options must be an object
  if (!is.object(options)) {
    throw new TypeError("invalid options argument");
  }

  {//- do some basic validation of options
    //- non-empty string values
    ["menuKey", "menuKeySep", "menuMetalsmith", "menuFile"]
    .forEach(function(current, index, array) {
      if(options.hasOwnProperty(current)) {
        if(!isString(options[current])) {
          throw new Error(util.format(
            "options.%s must be anon-empty string", current
          ));
        }
      }
    });

    let key = undefined;

    key = "filter";
    if(options.hasOwnProperty(key)) {
      if(!isString(options[key]) && !isStringArray(options[key])) {
        throw new Error("options.filter must be a string or an array of strings");
      }
    }

    key = "readMenuKeyFunc";
    if(options.hasOwnProperty(key)) {
      if(!is.fn(options[key])) {
        throw new Error("options.readMenuKeyFunc must be a function");
      }
    }
  }

  {//- override the default settings
    let thisInstance = this;

    Object.keys(this).forEach(function (current, index, array) {
      //- if options has a property, then use it;
      //  this includes 'undefined' values
      if (options.hasOwnProperty(current)) {
        thisInstance[current] = options[current];
      }
    });
  }
};

//========//========//========//========//========//========//========//========

function isString(value) {
  if(!is.string(value)) {
    return false;
  }

  if(value.trim().length === 0) {
    return false;
  }

  return true;
}

//========//========//========//========//========//========//========//========

function isStringArray(value) {
  if(!is.array(value)) {
    return false;
  }

  for(let ix=0, ic=value.length; ix<ic; ix++) {
    if(!isString(value[ix])) {
      return false;
    }
  }

  return true;
}
