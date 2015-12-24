describe('Client', function() {
    describe('#constructor(schema)', function() {
        it('should keep a reference to API schema', function () {
            let schema = {};
            let client = new Client(schema);

            expect(client.schema).toBe(schema);
        });
    });

    describe('#setChannel(channel)', function() {
        it('should allow to set a channel to use in API calls', function () {
            let channel = {};
            let client = new Client({});
            client.setChannel(channel);

            expect(client.channel).toBe(channel);
        });
    });

    describe('#callApi(method, args)', function() {
        let apiService, apiType, schema, method;

        class BoolTrue {}
        class BoolFalse {}

        beforeEach(function () {
            apiService = {
                test: {
                    fooMethod: jasmine.createSpy('test.fooMethod')
                }
            };

            apiType = {
                BoolTrue,
                BoolFalse
            };

            schema = {
                type: apiType,
                service: apiService
            };

            method = 'test.fooMethod';
        });

        it('should run a method with the given arguments and return a promise', function (done) {
            let args = {
                foo: true,
                bar: false,
                baz: 1
            };

            let channel = {};
            let client = new Client(schema);
            client.setChannel(channel);

            let apiResponse = {};
            apiService.test.fooMethod.and.callFake(function (params) {
                let {props, channel, callback} = params;

                expect(props.foo instanceof BoolTrue).toBe(true);
                expect(props.bar instanceof BoolFalse).toBe(true);
                expect(props.baz).toBe(1);

                expect(channel).toBe(client.channel);

                // successful response
                callback(null, apiResponse);
            });

            let result = client.callApi(method, args);
            result.then(x => result.$$response = x);

            setTimeout(function () {
                expect(result.$$response).toBe(apiResponse);
                done();
            });
        });

        it('should reject the returned promise if the api call fails', function (done) {
            let channel = {};
            let client = new Client(schema);
            client.setChannel(channel);

            let error = {};
            apiService.test.fooMethod.and.callFake(function (props) {
                let { callback } = props;
                callback(error);
            });

            let result = client.callApi(method, {});
            result.catch(x => result.$$error = x);

            setTimeout(function () {
                expect(result.$$error).toBe(error);
                done();
            });
        });

        it('should return a rejected promise if the namespace is not registered', function (done) {
            let channel = {};
            let client = new Client(schema);
            client.setChannel(channel);

            let result = client.callApi('invalid.method', {});
            result.catch(x => result.$$error = x);

            setTimeout(function () {
                expect(result.$$error.message).toBe('Method does not exists: invalid.method');
                done();
            });
        });

        it('should return a rejected promise if the namespace is not registered', function (done) {
            let channel = {};
            let client = new Client(schema);
            client.setChannel(channel);

            let result = client.callApi('test.invalidmethod', {});
            result.catch(x => result.$$error = x);

            setTimeout(function () {
                expect(result.$$error.message).toBe('Method does not exists: test.invalidmethod');
                done();
            });
        });

        it('should return a rejected promise if the client has no channel configured', function (done) {
            let client = new Client(schema);
            client.setChannel(null);

            let result = client.callApi('any.method', {});
            result.catch(x => result.$$error = x);

            setTimeout(function () {
                expect(result.$$error.message).toBe('Cannot make API calls in this client without a channel');
                done();
            });
        });
    });
});
