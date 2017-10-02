const lab = require("lab").script();
exports.lab = lab;

let execute = require("../src/index");

lab.experiment("Error Handling Test", () => {

    lab.test("should continue after throwing error", () => {
        let executionTree = [
            {
                title: "step 1",
                action: (data) => {
                    return {a: 1};
                }
            },
            {
                title: "step 2",
                action: (data) => {
                    return Promise.reject({name: "error", message: "custom error"});
                },
                errorHandling: {
                    continueOnError: true
                }
            },
            {
                title: "step 3",
                action: (data) => {
                    return {c: 3};
                }
            }
        ];


        let executionData = {
            sub_id: 123
        };

        return execute(executionTree, executionData).then((result) => {
            lab.expect(result.c).to.equal(3);
        }).catch(() => {

        });
    });

    lab.test("should add data from onErrorResponse to result", () => {
        let executionTree = [
            {
                title: "step 1",
                action: (data) => {
                    return {a: 1};
                }
            },
            {
                title: "step 2",
                action: (data) => {
                    return Promise.reject({name: "error", message: "custom error"});
                },
                errorHandling: {
                    continueOnError: true,
                    onErrorResponse: {b:-1}
                }
            },
            {
                title: "step 3",
                action: (data) => {
                    return {c: 3};
                }
            }
        ];


        let executionData = {
            sub_id: 123
        };

        return execute(executionTree, executionData).then((result) => {
            lab.expect(result.b).to.equal(-1);
        }).catch(() => {

        });
    });

});