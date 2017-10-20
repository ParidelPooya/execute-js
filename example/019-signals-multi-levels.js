let Execute = require("../src/index");

let executionTree = [
    {
        title: "step 1",
        action: (data) => {return {a: 1};}
    },
    {
        title: "step 2",
        action: (data) => {return {b: 2};},
        test: (data) => data.type === 3,
        if: {
            true: [
                {
                    title: "step 2-1",
                    action: (data) => {return {c: 3};}
                },
                {
                    title: "step 2-2",
                    action: (data) => {return {d: 4};}
                },
                {
                    title: "step 2-3",
                    test: (data) => data.sub_type === 123,
                    if: {
                        true: Execute.executionMode.STOP_LEVEL_EXECUTION,
                        false: Execute.executionMode.CONTINUE
                    }
                },
                {
                    title: "step 2-4",
                    action: (data) => {return {e: 5};}
                },
            ],
            false: Execute.executionMode.CONTINUE
        }
    },
    {
        title: "step 3",
        action: (data) => {return {f: 6};}
    }
];



let executionData = {
    type: 2,
    sub_type :123
};

let execute = new Execute();

execute.run(executionTree, executionData).then( (result)=> {
    console.log("finished with this result:");
    console.log(JSON.stringify(result, null, 2));
}).catch( (e)=> {
    console.log("catch", e);
});
