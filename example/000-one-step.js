let Execute = require("../src/index");

let execute = new Execute();

let executionTree = Execute.prepareExecutionTree([
    {
        title: "step 1",
        action: (data) =>  {return {a: 1};}
    },
    {
        title: "step 1",
        action: (data) => {return {b: 2};}
    }
]);



let executionData = {
    sub_id :123
};

execute.run(executionTree, executionData).then( (result)=> {
    console.log("finished with this result:");
    console.log(JSON.stringify(result, null, 2));
}).catch( (e)=> {
    console.log("catch", e);
});
