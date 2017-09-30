let execute = require("../src/index");

const func = (data)=> {
    return new Promise((resolve, reject) => {
        if (Math.random() > 0.8) {
            resolve(data);
        } else {
            reject({errorCode:1,errorMsg:"error"});
        }
    });
};


let executionTree = {
    concurrency: 1,
    steps :[
        {
            title:"step 1",
            errorHandling: {
                maxAttempts: 10
            },
            action: (data) => func({a: 1})
        }
    ]
};



let executionData = {
    sub_id :123
};

execute(executionTree, executionData).then( (result)=> {
    console.log("finished with this result:");
    console.log(JSON.stringify(result, null, 2));
});
