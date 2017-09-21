"use strict";

// create a unique, global symbol name
// -----------------------------------

const DATA_KEY = Symbol.for("TinyCache.data");

// check if the global object has this symbol
// add it if it does not have the symbol, yet
// ------------------------------------------
var globalSymbols = Object.getOwnPropertySymbols(global);
var hasData = (globalSymbols.indexOf(DATA_KEY) > -1);

if (!hasData){
    global[DATA_KEY] = {};
}

// define the singleton API
// ------------------------
var singleton = {
    get: function(key){
        return global[DATA_KEY][key];
    },
    has: function(key){
        return global[DATA_KEY][key] ? true : false;
    },
    set: function(key, value){
        global[DATA_KEY][key] = value;
        return true;
    }
};

// ensure the API is never changed
// -------------------------------
Object.freeze(singleton);

// export the singleton API only
// -----------------------------
module.exports = singleton;