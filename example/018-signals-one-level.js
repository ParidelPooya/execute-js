let Execute = require("../src/index");

let executionTree = [
    {
        title: "step 1",
        action: (data) => {return {a: 1};}
    },
    {
        title: "step 2",
        action: (data) => {return {b: 2};},
        test: (data) => data.sub_id === 123,
        if: {
            true: Execute.executionMode.STOP_LEVEL_EXECUTION,
            false: Execute.executionMode.CONTINUE
        }
    },
    {
        title: "step 3",
        action: (data) => {return {c: 3};}
    }
];



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
