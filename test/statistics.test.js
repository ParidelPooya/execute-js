const lab = require("lab").script();
exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Statistics - ", () => {

    lab.test("Extract statistics shoud return statistics", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
                test: data => data.Code === "code1",
                if: {
                    true:[
                        {
                            title:"step 2",
                            action: (data)=> {return {b: 2};}
                        }
                    ],
                    false:[
                        {
                            title:"step 3",
                            action: (data)=> {return {b: 3};}
                        }
                    ]
                }
            },
            {
                title:"step 2",
                test: data => data.Code === "code1",
                if: {
                    true:Execute.executionMode.CONTINUE
                }
            }

        ]);

        let executionData = {
            Code: "code1",
            Type: "type1"
        };

        return execute.run(executionTree, executionData).then( ()=> {
            let stat = Execute.extractStatistics(executionTree);

            lab.expect(stat.steps[0].if.true.steps[0].statistics.count).to.equal(1);
        });
    });

});