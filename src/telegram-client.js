const NULL_SERVER_SALT = '0x0000000000000000';

/**
 * Telegram Client class
 * @class TelegramClient
 */
class TelegramClient {
    constructor(schema, mtProto, typeLanguage) {
        this.schema = schema;
        this.protocol = mtProto;
        this.typeLanguage = typeLanguage;
    }

    /**
     * Set the connection to be used as the transport for API calls in
     * this client
     * @param {Object} connection
     */
    setConnection(connection) {
        this.connection = connection;
    }

    /**
     * A channel to execute API calls. Usually created through one of these methods:
     *
     * Client#createUnencryptedChannel
     * Client#createEncryptedChannel
     *
     * @param {RcpChannel|EncryptedRpcChannel} channel
     */
    setChannel(channel) {
        this.channel = channel;
    }

    /**
     * Creates a plain-text channel to make API calls. Used on the initial calls
     * to create an authentication key
     */
    createUnencryptedChannel() {
        let RpcChannel = this.protocol.net.RpcChannel;
        return new RpcChannel(this.connection);
    }

    /**
     * Creates an encrypted channel with a previously created {AuthKey}
     * @param {Object} authKey
     * @property {String} authKey.key
     * @property {String} authKey.serverSalt
     * @param {Object} options Configuration passed to the EncryptedRpcChannel
     */
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

    /**
     * Negotiates a new AuthKey with the server
     * @return {Promise<AuthKey>}
     */
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

    /**
     * Creates an authKey and setups an encrypted channel in the client with
     * this new key.
     * @param {Object} config Configuration passed in to the EncryptedRpcChannel
     * @return {Promise<Client>} Returns back the client once it finishes the setup
     */
    authenticate(config) {
        let client = this;

        function callback (authKey) {
            var channel = client.createEncryptedChannel(authKey, config);
            client.setChannel(channel);
            client.authKey = authKey;

            return client;
        }

        return this.createAuthKey().then(callback);
    }

    /**
     * Restores an encrypted channel in this client from a config object.
     * A previously created AuthKey must be present in the config.
     * @param {Object} config Configuration passed in to the EncryptedRpcChannel
     * @property {AuthKey} config.authKey The key stored in your app
     */
    restoreFromConfig(config) {
        let authKey = {
            key: config.authKey,
            serverSalt: NULL_SERVER_SALT
        };

        var channel = this.createEncryptedChannel(authKey, config);
        this.setChannel(channel);
    }

    /**
     * Top-level method to setup the client. Give it a configuration and
     * the client will handle the creation of an encrypted channel.
     *
     * Don't forget to set a connection in the client before starting the setup!
     */
    setup(config) {
        if (config.authKey) {
            this.restoreFromConfig(config);
            return Promise.resolve(this);
        } else {
            return this.authenticate(config);
        }
    }

    /**
     * Entry method to all the API calls
     * @param {String} apiMethod A method to call in the API, e.g. auth.sendCode
     * @param {Object} args The arguments, if any, to send with the API call
     * @return {Promise}
     */
    callApi(apiMethod, args = null) {
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

        let props = {};

        if (args) {
            props = this._readProperties(args);
        }

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

    /**
     * Creates an instance of a TL constructor defined by the API schema
     *
     * @param {String} apiType Name of the API Type constructor
     * @param {Object} [params] Optional argument with the construction parameters
     * @return {Object} An instance of the given constructor
     * @example
     *     let inputUser = client.createType('InputUserContact', {
     *         user_id: 123123
     *     });
     */
    createType(apiType, params) {
        let Type = this.schema.type[apiType];

        return new Type({
            props: params
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

TelegramClient.NULL_SERVER_SALT = NULL_SERVER_SALT;

export { TelegramClient };

/**
 * @external {RcpChannel} https://github.com/enricostara/telegram-mt-node/blob/master/lib/net/rpc-channel.js
 */

/**
 * @external {EncryptedRpcChannel} https://github.com/enricostara/telegram-mt-node/blob/master/lib/net/encrypted-rpc-channel.js
 */