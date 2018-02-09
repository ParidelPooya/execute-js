const lab = require("lab").script();
exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Caching Execution Tree Test", () => {

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
            cache: cacheOptions,
            steps :[
                {
                    title:"step 1",
                    action: (data) => func({a: 1})
                }
            ]
        });

        let executionData = {
            sub_id :123
        };

        return execute.run(executionTree, executionData).then( ()=> {

            let stat = Execute.extractStatistics(executionTree);

            lab.expect(stat.statistics.cache.missesNo).to.equal(1);
            lab.expect(stat.statistics.cache.hitsNo).to.equal(0);

            executionTree = Execute.prepareExecutionTree({
                concurrency: 1,
                cache: cacheOptions,
                steps :[
                    {
                        title:"step 1",
                        action: (data) => func({a: 2})
                    }
                ]
            });

            return execute.run(executionTree, executionData).then( (result)=> {
                lab.expect(result.a).to.equal(1);

                let stat = Execute.extractStatistics(executionTree);

                lab.expect(stat.statistics.cache.missesNo).to.equal(0);
                lab.expect(stat.statistics.cache.hitsNo).to.equal(1);

            });

        });
    });


    lab.test("statistics should show hits and misses", () => {
        let execute = new Execute();

        const func = (data)=> {
            return new Promise((resolve) => {

                setTimeout(()=> {
                    console.log(data);
                    resolve(data);
                }, 0);
            });
        };

        let newKey = (Math.random()*10000000).toString();

        const cacheOptions = {
            enable: true,
            ttl: 60,
            key: (data) => newKey + data.sub_id
        };

        let executionTree = Execute.prepareExecutionTree({
            cache: cacheOptions,
            concurrency: 1,
            steps :[
                {
                    title:"step 1",
                    action: (data) => func({a: 1})
                },
                {
                    title:"step 2",
                    action: (data) => func({b: 2})
                },
                {
                    title:"step 3",
                    action: (data) => func({c: 3})
                },
                {
                    title:"step 4",
                    action: (data) => func({d: 4})
                },
                {
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

            let stat = Execute.extractStatistics(executionTree);
            let cacheCount =
                stat.statistics.cache.missesNo +
                stat.statistics.cache.hitsNo;

            lab.expect(cacheCount).to.equal(1);

        });
    });

    lab.test("if key is undefined it should ignore cache", () => {
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
            key: (data) => undefined
        };

        let executionTree = Execute.prepareExecutionTree({
            concurrency: 1,
            cache: cacheOptions,
            steps :[
                {
                    title:"step 1",
                    action: (data) => func({a: 1})
                },
                {
                    title:"step 2",
                    action: (data) => func({b: 2})
                },
                {
                    title:"step 3",
                    action: (data) => func({c: 3})
                },
                {
                    title:"step 4",
                    action: (data) => func({d: 4})
                },
                {
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

            let stat = Execute.extractStatistics(executionTree);
            let cacheCount =
                stat.steps[0].statistics.cache.missesNo +
                stat.steps[0].statistics.cache.hitsNo;

            lab.expect(cacheCount).to.equal(0);

        });
    });
});