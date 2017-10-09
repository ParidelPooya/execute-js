let Execute = require("../src/index");

let executionTree = {
    concurrency: 1,
    steps :[
        {
            title:"step 1",
            action: (data) => {return {from: {a: 1}} ;},
            output: {
                addToResult: true,
                accessibleToNextSteps: true,
                map: {
                    source: "from",
                    destination: "different-node.subnode"
                }
            }
        },
        {
            title:"step 2",
            action: (data) => {return {from: {b: 2}} ;},
            output: {
                addToResult: true,
                accessibleToNextSteps: true,
                map: {
                    source: "from",
                    destination: "different-node.subnode"
                }
            }
        }
    ]
};



let executionData = {
    sub_id :123
};

let execute = new Execute();
execute.run(executionTree, executionData).then( (result)=> {
    console.log("finished with this result:");
    console.log(JSON.stringify(result, null, 2));
}).catch( (e)=> {
    console.log("catch", e);
});
