'use strict';

let execute = require("../src/index");

let executionTree = [
    {
        id: 'step1',
        title:'step 1',
        action: (data)=> {return {a: 1};},
        test: data => data.Code === 'code1',
        if: {
            true:[
                {
                    id: 'step2',
                    title:'step 2',
                    action: (data)=> {return {b: 2};},
                    test: data => data.Type === 'type1',
                    if: {
                        true: [
                            {
                                id: 'step3',
                                title:'step 3',
                                action: (data)=> {return {c: 3};}
                            }
                        ]
                    }
                }
            ]
        }
    }
];

let executionData = {
    Code: 'code1',
    Type: 'type1'
};

execute(executionTree, executionData).then( (result)=> {
    console.log("finished with this result:");
    console.log(result);
}).catch( ()=> {
    console.log("catch");
});
