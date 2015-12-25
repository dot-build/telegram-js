/* global Client */
describe('Client', function() {
    describe('#constructor(schema, protocol, typeLanguage)', function() {
        it('should keep a reference to injected properties', function () {
            let schema = {};
            let protocol = {};
            let tl = {};
            let client = new Client(schema, protocol, tl);

            expect(client.schema).toBe(schema);
            expect(client.protocol).toBe(protocol);
            expect(client.typeLanguage).toBe(tl);
        });
    });

    describe('#createUnencryptedChannel()', function() {
        it('should create an RPC channel with the connection of this instance', function () {
            let channel = {};

            let mt = {};
            mt.net = {};
            let RpcChannel = jasmine.createSpy().and.returnValue(channel);
            mt.net = { RpcChannel };

            let client = new Client({}, mt, {});

            let connection = {};
            client.setConnection(connection);

            let result = client.createUnencryptedChannel();
            expect(result).toBe(channel);
            expect(RpcChannel).toHaveBeenCalledWith(client.connection);
        });
    });

    describe('#createEncryptedChannel(authKey, options)', function() {
        it('should create an encrypted channel from an AuthKey and channel options', function () {
            let options = {};
            let authKey = {
                key: '0xfffffffff',
                serverSalt: 'a1s2d3f4g5h67j'
            };

            let nonce = '0x1231312312312';
            let mt = {};
            let channel = {};

            class SequenceNumber {}
            mt.SequenceNumber = SequenceNumber;

            // used to generate the session id
            mt.utility = {};
            mt.utility.createNonce = () => nonce;

            // creates the new channel
            mt.net = {};
            let Channel = mt.net.EncryptedRpcChannel = jasmine.createSpy().and.returnValue(channel);

            let client = new Client({}, mt, {});

            let connection = {};
            client.setConnection(connection);

            let result = client.createEncryptedChannel(authKey, options);

            let [usedConnection, keyConfig, appConfig] = Channel.calls.argsFor(0);
            expect(usedConnection).toBe(client.connection);

            expect(keyConfig.authKey).toBe(authKey.key);
            expect(keyConfig.serverSalt).toBe(authKey.serverSalt);
            expect(keyConfig.sessionId).toBe(nonce);
            expect(keyConfig.sequenceNumber instanceof SequenceNumber).toBe(true);

            expect(appConfig).toBe(options);

            expect(result).toBe(channel);
        });
    });

    describe('#setConnection(connection)', function() {
        it('should allow to set a connection to use in the API calls', function () {
            let connection = {};
            let client = new Client({});
            client.setConnection(connection);

            expect(client.connection).toBe(connection);
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

    describe('#createAuthKey()', function() {
        it('should open a RPC channel and gather an AuthKey', function (done) {
            let mt = {};
            let channel = {};

            // Signature: mt.auth.createAuthKey(callback, channel)
            let createAuthKey =  jasmine.createSpy('createAuthKey');
            mt.auth = { createAuthKey };

            let client = new Client({}, mt, {});
            spyOn(client, 'createUnencryptedChannel').and.returnValue(channel);

            let authKey = {};
            createAuthKey.and.callFake(function (callback, _channel) {
                expect(_channel).toBe(channel);
                callback(null, authKey);
            });

            let result = client.createAuthKey();

            result.then(function (key) {
                result.key = key;
            });

            setTimeout(function () {
                expect(result.key).toBe(authKey);
                done();
            });
        });
    });

    describe('#authenticate(config)', function() {
        it('should create an AuthKey and configure an encrypted channel with the given configuration', function (done) {
            let connection = {};
            let client = new Client({}, {}, {});

            client.setConnection(connection);

            let authKey = {
                key: '0x1231312312312',
                serverSalt: 'a1s2d3f4g5h67j'
            };

            let channel = {};

            spyOn(client, 'createAuthKey').and.returnValue(Promise.resolve(authKey));
            spyOn(client, 'createEncryptedChannel').and.returnValue(channel);

            let config = {};

            let result = client.authenticate(config);

            result.then(function (value) {
                result.value = value;
            });

            setTimeout(function () {
                expect(client.createAuthKey).toHaveBeenCalled();

                expect(client.createEncryptedChannel).toHaveBeenCalled();
                let channelArgs = client.createEncryptedChannel.calls.argsFor(0);

                expect(channelArgs[0]).toBe(connection);
                expect(channelArgs[1]).toBe(config);
                expect(channelArgs[2]).toBe(authKey.key);
                expect(channelArgs[3]).toBe(authKey.serverSalt);

                expect(client.channel).toBe(channel);
                expect(result.value).toBe(client);
                done();
            });
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
