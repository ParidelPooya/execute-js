'use strict';

let execute = require("../src/index");

const f1 = (data)=> {
        return {a:1};
};

const f2 = (data)=> {
    return {b:2};
};

const f3 = (data)=> {
    return {c:3};
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
                    action: f2,
                    test: data => data.JobCode,
                    if: {
                        job1: [
                            {
                                id: 'step3',
                                title:'step 3',
                                action: f3
                            }
                        ]
                    }
                }
            ]
        }
    }
];

let executionData = {
    JobCode: 'job1'
};

execute(executionTree, executionData).then( (result)=> {
    console.log("finished with this result:");
    console.log(result);
}).catch( ()=> {
    console.log("catch");
});
