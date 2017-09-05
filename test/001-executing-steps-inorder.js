'use strict';

let execute = require("../src/index");

const step1 = (data)=> {
    return {a:1};
};

const step2 = (data)=> {
    return {b:2};
};

let executionTree = [
    {
        title:'step 1',
        action: step1,
    },
    {
        title:'step 2',
        action: step2
    }
];

let executionData = {};

execute(executionTree, executionData).then( ()=> {
    console.log("finished");
}).catch( ()=> {
    console.log("catch");
});
