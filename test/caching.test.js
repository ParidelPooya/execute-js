const lab = require("lab").script();
exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Caching Test", () => {

    lab.test("the result should be {a:1} because of caching", () => {
        let execute = new Execute();

        const func = (data)=> {
            return new Promise((resolve) => {

                setTimeout(()=> {
                    console.log(data);
                    resolve(data);
                }, 0);
            });
        };

        const cacheOptions = {
            enable: true,
            ttl: 60,
            key: (data) => data.sub_id
        };

        let executionTree = Execute.prepareExecutionTree({
            concurrency: 1,
            steps :[
                {
                    cache: cacheOptions,
                    title:"step 1",
                    action: (data) => func({a: 1})
                },
                {
                    cache: cacheOptions,
                    title:"step 2",
                    action: (data) => func({b: 2})
                },
                {
                    cache: cacheOptions,
                    title:"step 3",
                    action: (data) => func({c: 3})
                },
                {
                    cache: cacheOptions,
                    title:"step 4",
                    action: (data) => func({d: 4})
                },
                {
                    cache: cacheOptions,
                    title:"step 5",
                    action: (data) => func({e: 5})
                }
            ]
        });



        let executionData = {
            sub_id :123
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            lab.expect(result.a).to.equal(1);
        });
    });

});