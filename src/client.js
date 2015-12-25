const NULL_SERVER_SALT = '0x0000000000000000';

/**
 * Telegram Client class
 */
class Client {
    constructor(schema, mtProto, typeLanguage) {
        this.schema = schema;
        this.protocol = mtProto;
        this.typeLanguage = typeLanguage;
    }

    setConnection(connection) {
        this.connection = connection;
    }

    setChannel(channel) {
        this.channel = channel;
    }

    createUnencryptedChannel() {
        let RpcChannel = this.protocol.net.RpcChannel;
        return new RpcChannel(this.connection);
    }

    createEncryptedChannel(authKey, options) {
        let RpcChannel = this.protocol.net.EncryptedRpcChannel;
        let SequenceNumber = this.protocol.SequenceNumber;

        let keyOptions = {
            authKey: authKey.key,
            serverSalt: authKey.serverSalt,
            sessionId: this.protocol.utility.createNonce(8),
            sequenceNumber: new SequenceNumber()
        };

        return new RpcChannel(this.connection, keyOptions, options);
    }

    createAuthKey() {
        return new Promise((resolve, reject) => {
            let callback = (error, key) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(key);
                }
            };

            this.protocol.auth.createAuthKey(
                callback,
                this.createUnencryptedChannel()
            );
        });
    }

    authenticate(config) {
        let client = this;

        function callback (auth) {
            var channel = client.createEncryptedChannel(client.connection, config, auth.key, auth.serverSalt);
            client.setChannel(channel);

            return client;
        }

        return this.createAuthKey().then(callback);
    }

    callApi(apiMethod, args) {
        if (!this.channel) {
            return Promise.reject(new Error('Cannot make API calls in this client without a channel'));
        }

        let [ ns, methodName ] = apiMethod.split('.');
        let api = this.schema;

        let invalidMethodError = new Error('Method does not exists: ' + apiMethod);

        ns = api.service[ns];
        if (!ns) {
            return Promise.reject(invalidMethodError);
        }

        let method = ns[methodName];
        if (!method) {
            return Promise.reject(invalidMethodError);
        }

        let props = this._readProperties(args);
        let channel = this.channel;

        return new Promise((resolve, reject) => {
            let callback = (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve(result);
            };

            method({ props, channel, callback });
        });
    }

    _readProperties(params) {
        let props = {};
        let api = this.schema;

        Object.keys(params).forEach(function(key){
            var value = params[key];

            if (value === undefined) return;

            if (value === true) {
                value = new api.type.BoolTrue();
            }

            if (value === false) {
                value = new api.type.BoolFalse();
            }

            props[key] = value;
        });

        return props;
    }

}