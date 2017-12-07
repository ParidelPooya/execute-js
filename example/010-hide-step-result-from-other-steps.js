let Execute = require("../src/index");

let execute = new Execute();

let executionTree = Execute.prepareExecutionTree({
    concurrency: 1,
    steps :[
        {
            title:"step 1",
            action: (data) => {return {a: 1};},
            output: {
                addToResult: false,
                accessibleToNextSteps: false
            }
        },
        {
            title:"step 2",
            action: (data) => {return {b: 2};}
        },
        {
            title:"step 3",
            action: (data) => {return {c: 3};}
        },
        {
            title:"step 4",
            action: (data) => {return {d: 4};}
        },
        {
            title:"step 5",
            action: (data) => {
                console.log("a:", data.a); // this line should log undefined because of accessibleToNextSteps: false
                return {e: 5};
            }
        }
    ]
});

let executionData = {
    sub_id :123
};

execute.run(executionTree, executionData).then( (result)=> {
    console.log("finished with this result:");
    console.log(JSON.stringify(result, null, 2));
});
