'use strict';

let execute = require("../src/index");

const f1 = (data)=> {
        return {a:1};
};

const f2 = (data)=> {
    return {b:2};
};

let executionTree = [
    {
        id: 'step1',
        title:'step 1',
        action: f1,
        test: data => data.JobCode,
        if: {
            job1:[
                {
                    id: 'step2',
                    title:'step 2',
                    action: f2
                }
            ]
        }
    }
];

let executionData = {
    JobCode: 'job1'
};

execute(executionTree, executionData).then( ()=> {
    console.log("finished");
}).catch( ()=> {
    console.log("catch");
});
