'use strict';

let execute = require("../src/index");

const step1 = (data)=> {
    return {a:1};
};

const step2 = (data)=> {
    return {b:2};
};

const step3 = (data)=> {
    return {c:3};
};

const step4 = (data)=> {
    return {d:4};
};

const step5 = (data)=> {
    return {e:5};
};

let executionTree = [
    {
        title:'step 1',
        action: step1,
    },
    {
        title:'step 2',
        action: step2,
    },
    {
        title:'step 3',
        action: step3,
    },
    {
        title:'step 4',
        action: step4,
    },
    {
        title:'step 5',
        action: step5,
    }
];

let executionData = {};

execute(executionTree, executionData).then( (result)=> {
    console.log("finished with this result:");
    console.log(result);
}).catch( ()=> {
    console.log("catch");
});
