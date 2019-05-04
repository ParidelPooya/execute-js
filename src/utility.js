const getByPath = (obj, keys) => {
    if (keys.length === 0) {
        return obj;
    }

    for (let i = 0; i < keys.length; i++) {

        obj = obj[keys[i]];

        if (obj === undefined) {
            return undefined;
        }
    }

    return obj;
};

const copyData = (copyTo, copyFrom, keys) => {
    let pointer = copyTo;

    for (let i = 0; i < keys.length; i++) {

        if (i === keys.length - 1) {
            pointer[keys[i]] = copyFrom;
        } else {
            if(pointer[keys[i]] === undefined) {
                pointer[keys[i]] = {};
            }

            pointer = pointer[keys[i]];
        }
    }
};

const spreadify = (deepCopy) => {
    return function () {
        let spreadArgs = {};

        for (let i = 0; i < arguments.length; i++) {
            let currentArg = arguments[i];

            Object.keys(currentArg).map((key) => {
                if (deepCopy && typeof(spreadArgs[key]) === "object" && currentArg[key] !== null
                ) {
                    spreadArgs[key] = spreadify(deepCopy)(spreadArgs[key], currentArg[key]);
                } else {
                    spreadArgs[key] = currentArg[key];
                }
            });

        }
        return spreadArgs;
    };
};

const extend = (dest, extendFrom) => {
    if (typeof(extendFrom) === "string" ) {
        return extendFrom;
    }

    if (Array.isArray(extendFrom)) {
        if (Array.isArray(dest)) {
            return dest.concat(extendFrom);
        } else {
            return extendFrom;
        }
    }

    Object.keys(extendFrom).map((key) => {
        dest[key] = extendFrom[key];
    });
    return dest;
};

const clone = (obj) => {
    let copy;

    // Handle the 3 simple types, and null or undefined
    if (typeof(obj) !== "object" || obj === null) {
        return obj;
    }

    // I am only using this clone to clone step default settings
    // So there is no need to handle Date ot Array for now
    // // Handle Date
    // if (obj instanceof Date) {
    //     copy = new Date();
    //     copy.setTime(obj.getTime());
    //     return copy;
    // }
    //
    // // Handle Array
    // if (obj instanceof Array) {
    //     copy = [];
    //     for (let i = 0, len = obj.length; i < len; i++) {
    //         copy[i] = clone(obj[i]);
    //     }
    //     return copy;
    // }
    //
    // // Handle Object
    // if (obj instanceof Object) {
    //     copy = {};
    //     for (let attr in obj) {
    //         if (obj.hasOwnProperty(attr)) {
    //             copy[attr] = clone(obj[attr]);
    //         }
    //     }
    //     return copy;
    // }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (let i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    copy = {};
    for (let attr in obj) {
        copy[attr] = clone(obj[attr]);
    }
    return copy;

};

module.exports = {
    getByPath: getByPath,
    copyData: copyData,
    spreadify: spreadify,
    extend: extend,
    clone: clone
};