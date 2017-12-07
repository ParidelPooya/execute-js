let Execute = require("../src/index");

let execute = new Execute();

let executionTree = Execute.prepareExecutionTree([
    {
        title: "step 1",
        actionType: "map",
        action:{
            array: (data) => data.array,
            reducer: (data) => {return data + 1;}
        },
        output: {
            addToResult: true,
            accessibleToNextSteps: true,
            map: {
                destination: "different-node"
            }
        }
    }
]);

let executionData = {
    array :[1,2,3]
};

execute.run(executionTree, executionData).then( (result)=> {
    console.log("finished with this result:");
    console.log(JSON.stringify(result, null, 2));
}).catch( (e)=> {
    console.log("catch", e);
});
