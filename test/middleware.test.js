const lab = require("lab").script();
const code = require("code");
const sinon = require("sinon");

const sandbox = sinon.createSandbox();

exports.lab = lab;

let Execute = require("../src/index");
let Middleware = require("../src/middleware");

const executionOptions = {
    logger: {
        info: sinon.stub(),
        error: sinon.stub(),
    },
    context: {},
    cache: {
        set: sinon.stub().resolves(true),
        get: sinon.stub().resolves(null)
    }
};

lab.experiment("Middleware Test", () => {

    lab.beforeEach(() => {
    });

    lab.afterEach(() => {
        sandbox.restore();
    });

    lab.test("should throw error when type is not defined", () => {
        //let execute = new Execute();

        let middleware = {

        };

        try{
            Execute.use(middleware);
        }
        catch(e){
            code.expect(e.message).to.equal("type is missing in middleware contract");
        }
    });

    lab.test("should throw error when type is unknown", () => {
        //let execute = new Execute();

        let middleware = {
            type: "Something-that-is-notin-the-list"
        };

        try{
            Execute.use(middleware);
        }
        catch(e){
            code.expect(e.message).to.equal("Unknown middleware type");
        }
    });

    lab.test("should throw error when type is 'action' and action is not defined", () => {
        //let execute = new Execute();

        let middleware = {
            type: "action"
        };

        try{
            Execute.use(middleware);
        }
        catch(e){
            code.expect(e.message).to.equal("Middleware action is missing");
        }
    });

    lab.test("should throw error when type is 'action' and name is not defined", () => {
        //let execute = new Execute();

        let middleware = {
            type: "action",
            action: ()=>{}
        };

        try{
            Execute.use(middleware);
        }
        catch(e){
            code.expect(e.message).to.equal("Middleware name is missing");
        }
    });

    lab.test("should return true when type is 'action' and name and action are defined", () => {
        //let execute = new Execute();

        // Clear all actions
        let oldActions = Execute._actions;
        Execute._actions = undefined;
        Execute._middleware = undefined;

        let middleware1 = {
            type: "action",
            name: "action1",
            action: ()=>{}
        };

        let res1 = Execute.use(middleware1);

        let middleware2 = {
            type: "action",
            name: "action2",
            action: ()=>{}
        };


        let res2 = Execute.use(middleware2);

        code.expect(res1).to.equal(true);
        code.expect(res2).to.equal(true);

        Execute._actions = oldActions;

    });


    lab.test("should call 'action' when the cache is missing", () => {
        //function executeStepActionCallMiddleware(step, executionData, Execute)

        // Clear all actions
        let oldActions = Execute._actions;
        Execute._actions = undefined;
        Execute._middleware = undefined;

        let middleware1 = {
            type: "action",
            name: "action1",
            action: sinon.stub().resolves(true)
        };

        let executionData = {};

        Execute.use(middleware1);

        let step = {
            actionType: "action1"
        };

        Middleware.executeStepActionCallMiddleware(step, executionData, Execute);

        sinon.assert.calledOnce(middleware1.action);

        Execute._actions = oldActions;

    });

    lab.test("should call 'action' when the cache key is returuning null or undefined", () => {
        let execute = new Execute(executionOptions);

        // Clear all actions
        let oldActions = Execute._actions;
        Execute._actions = undefined;
        Execute._middleware = undefined;

        let executionData = {};

        let middleware1 = {
            type: "action",
            name: "action1",
            action: sinon.stub().resolves(true),
            cache: {
                key: () => undefined,
                ttl: 60,
            }
        };
        Execute.use(middleware1);
        let step1 = {
            actionType: "action1"
        };

        Middleware.executeStepActionCallMiddleware.apply(execute,[step1, executionData, Execute]);

        let middleware2 = {
            type: "action",
            name: "action2",
            action: sinon.stub().resolves(true),
            cache: {
                key: () => "",
                ttl: 60,
            }
        };
        Execute.use(middleware2);
        let step2 = {
            actionType: "action2"
        };
        Middleware.executeStepActionCallMiddleware.apply(execute,[step2, executionData, Execute]);


        sinon.assert.calledOnce(middleware1.action);
        sinon.assert.calledOnce(middleware2.action);

        Execute._actions = oldActions;

    });

    lab.test("should call cache.get when the cache has data", () => {
        const executionOptions1 = {
            logger: {
                info: sinon.stub(),
                error: sinon.stub(),
            },
            context: {},
            cache: {
                set: sinon.stub().resolves(true),
                get: sinon.stub().resolves({data: "data"})
            }
        };

        let execute = new Execute(executionOptions1);

        // Clear all actions
        let oldActions = Execute._actions;
        Execute._actions = undefined;
        Execute._middleware = undefined;

        let executionData = {};

        let middleware1 = {
            type: "action",
            name: "action1",
            action: sinon.stub().resolves(true),
            cache: {
                key: () => "key1",
                ttl: 60,
            }
        };
        Execute.use(middleware1);
        let step1 = {
            actionType: "action1"
        };

        Middleware.executeStepActionCallMiddleware.apply(execute,[step1, executionData, Execute]);

        sinon.assert.notCalled(middleware1.action);
        sinon.assert.calledOnce(executionOptions1.cache.get);

        Execute._actions = oldActions;

    });

    lab.test("should call cache.set when the cache has no data", () => {
        const executionOptions1 = {
            logger: {
                info: sinon.stub(),
                error: sinon.stub(),
            },
            context: {},
            cache: {
                set: sinon.stub().resolves(true),
                get: sinon.stub().resolves(Promise.resolve(undefined))
            }
        };

        let execute = new Execute(executionOptions1);

        // Clear all actions
        let oldActions = Execute._actions;
        Execute._actions = undefined;
        Execute._middleware = undefined;

        let executionData = {};

        let middleware1 = {
            type: "action",
            name: "action1",
            action: sinon.stub().resolves(Promise.resolve(true)),
            cache: {
                key: () => "key1",
                ttl: 60,
            }
        };
        Execute.use(middleware1);
        let step1 = {
            actionType: "action1",
            action: (data) => data,
        };

        return Middleware.executeStepActionCallMiddleware.apply(execute,[step1, executionData, Execute]).then(() => {

            sinon.assert.calledOnce(middleware1.action);
            sinon.assert.calledOnce(executionOptions1.cache.get);
            sinon.assert.calledOnce(executionOptions1.cache.set);

            Execute._actions = oldActions;
        });
    });

    lab.test("should call cache.set when the cache get is returning null", () => {
        const executionOptions1 = {
            logger: {
                info: sinon.stub(),
                error: sinon.stub(),
            },
            context: {},
            cache: {
                set: sinon.stub().resolves(true),
                get: sinon.stub().resolves(Promise.resolve(null))
            }
        };

        let execute = new Execute(executionOptions1);

        // Clear all actions
        let oldActions = Execute._actions;
        Execute._actions = undefined;
        Execute._middleware = undefined;

        let executionData = {};

        let middleware1 = {
            type: "action",
            name: "action1",
            action: sinon.stub().resolves(Promise.resolve(true)),
            cache: {
                key: () => "key1",
                ttl: 60,
            }
        };
        Execute.use(middleware1);
        let step1 = {
            actionType: "action1"
        };

        return Middleware.executeStepActionCallMiddleware.apply(execute,[step1, executionData, Execute]).then(() => {

            sinon.assert.calledOnce(middleware1.action);
            sinon.assert.calledOnce(executionOptions1.cache.get);
            sinon.assert.calledOnce(executionOptions1.cache.set);

            Execute._actions = oldActions;
        });
    });
});