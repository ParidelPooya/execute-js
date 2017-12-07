let Execute = require("../src/index");

let execute = new Execute();

const func = (data)=> {
    return new Promise((resolve, reject) => {
        if (Math.random() > 0.9) {
            resolve(data);
        } else {
            reject({errorCode:1,errorMsg:"error"});
        }
    });
};


let executionTree = Execute.prepareExecutionTree({
    concurrency: 1,
    steps :[
        {
            title:"step 1",
            errorHandling: {
                maxAttempts: 10,
                tryCondition: (e) => e.errorCode === 2 ? true : false
            },
            action: (data) => func({a: 1})
        }
    ]
});



let executionData = {
    sub_id :123
};

execute.run(executionTree, executionData).then( (result)=> {
    console.log("finished with this result:");
    console.log(JSON.stringify(result, null, 2));
}).catch( (e)=> {
    console.log("catch", e);
});
