'use strict';

let execute = require("../src/index");

let executionData = {
    Code: 'code1',
    Type: 'type1'
};

let executionTree = [
    {
        id: 'step1',
        title:'step 1',
        test: executionData.Code === 'code1',
        if: {
            true:[
                {
                    id: 'step2',
                    title:'step 2',
                    action: (data)=> {return {b: 2};}
                }
            ],
            false:[
                {
                    id: 'step3',
                    title:'step 3',
                    action: (data)=> {return {b: 3};}
                }
            ]
        }
    }
];

execute(executionTree, executionData).then( (result)=> {
    console.log("finished with this result:");
    console.log(JSON.stringify(result, null, 2));
}).catch( ()=> {
    console.log("catch");
});
