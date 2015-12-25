(function(exports) {

    'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var NULL_SERVER_SALT = '0x0000000000000000';

/**
 * Telegram Client class
 * @class TelegramClient
 */

var TelegramClient = (function () {
    function TelegramClient(schema, mtProto, typeLanguage) {
        _classCallCheck(this, TelegramClient);

        this.schema = schema;
        this.protocol = mtProto;
        this.typeLanguage = typeLanguage;
    }

    /**
     * Set the connection to be used as the transport for API calls in
     * this client
     * @param {Object} connection
     */

    _createClass(TelegramClient, [{
        key: 'setConnection',
        value: function setConnection(connection) {
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

    }, {
        key: 'setChannel',
        value: function setChannel(channel) {
            this.channel = channel;
        }

        /**
         * Creates a plain-text channel to make API calls. Used on the initial calls
         * to create an authentication key
         */

    }, {
        key: 'createUnencryptedChannel',
        value: function createUnencryptedChannel() {
            var RpcChannel = this.protocol.net.RpcChannel;
            return new RpcChannel(this.connection);
        }

        /**
         * Creates an encrypted channel with a previously created {AuthKey}
         * @param {Object} authKey
         * @property {String} authKey.key
         * @property {String} authKey.serverSalt
         * @param {Object} options Configuration passed to the EncryptedRpcChannel
         */

    }, {
        key: 'createEncryptedChannel',
        value: function createEncryptedChannel(authKey, options) {
            var RpcChannel = this.protocol.net.EncryptedRpcChannel;
            var SequenceNumber = this.protocol.SequenceNumber;

            var keyOptions = {
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

    }, {
        key: 'createAuthKey',
        value: function createAuthKey() {
            var _this = this;

            return new Promise(function (resolve, reject) {
                var callback = function callback(error, key) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(key);
                    }
                };

                _this.protocol.auth.createAuthKey(callback, _this.createUnencryptedChannel());
            });
        }

        /**
         * Creates an authKey and setups an encrypted channel in the client with
         * this new key.
         * @param {Object} config Configuration passed in to the EncryptedRpcChannel
         * @return {Promise<Client>} Returns back the client once it finishes the setup
         */

    }, {
        key: 'authenticate',
        value: function authenticate(config) {
            var client = this;

            function callback(authKey) {
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

    }, {
        key: 'restoreFromConfig',
        value: function restoreFromConfig(config) {
            var authKey = {
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

    }, {
        key: 'setup',
        value: function setup(config) {
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

    }, {
        key: 'callApi',
        value: function callApi(apiMethod) {
            var args = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

            if (!this.channel) {
                return Promise.reject(new Error('Cannot make API calls in this client without a channel'));
            }

            var _apiMethod$split = apiMethod.split('.');

            var _apiMethod$split2 = _slicedToArray(_apiMethod$split, 2);

            var ns = _apiMethod$split2[0];
            var methodName = _apiMethod$split2[1];

            var api = this.schema;

            var invalidMethodError = new Error('Method does not exists: ' + apiMethod);

            ns = api.service[ns];
            if (!ns) {
                return Promise.reject(invalidMethodError);
            }

            var method = ns[methodName];
            if (!method) {
                return Promise.reject(invalidMethodError);
            }

            var props = {};

            if (args) {
                props = this._readProperties(args);
            }

            var channel = this.channel;

            return new Promise(function (resolve, reject) {
                var callback = function callback(error, result) {
                    if (error) {
                        return reject(error);
                    }

                    resolve(result);
                };

                method({ props: props, channel: channel, callback: callback });
            });
        }
    }, {
        key: '_readProperties',
        value: function _readProperties(params) {
            var props = {};
            var api = this.schema;

            Object.keys(params).forEach(function (key) {
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

        /**
         * @external {RcpChannel} https://github.com/enricostara/telegram-mt-node/blob/master/lib/net/rpc-channel.js
         * @external {EncryptedRpcChannel} https://github.com/enricostara/telegram-mt-node/blob/master/lib/net/encrypted-rpc-channel.js
         */

    }]);

    return TelegramClient;
})();

TelegramClient.NULL_SERVER_SALT = NULL_SERVER_SALT;

exports.TelegramClient = TelegramClient;
/**
 * Main Telegram class
 * An instance of Telegram can be used to instantiate new clients that
 * will perform the API calls
 * @class Telegram
 */

var Telegram = (function () {
    /**
     * @param {MTProto} MTProto An object with the MTProto implementation
     * @param {TL} TL An object with the Telegram's TypeLanguage implementation
     */

    function Telegram(MTProto, TL) {
        _classCallCheck(this, Telegram);

        if (!MTProto || !TL) {
            throw new Error('You must invoke new Telegram(MTProto, TypeLanguage)');
        }

        this.MTProto = MTProto;
        this.TL = TL;
    }

    /**
     * @param {Object} schema An object with all the types and methods.
     *                        The Telegram API schema can be downloaded
     *                        here: https://core.telegram.org/schema
     */

    _createClass(Telegram, [{
        key: 'useSchema',
        value: function useSchema(schema) {
            var buildTypes = this.TL.TypeBuilder.buildTypes;

            var type = { _id: 'api.type' };
            buildTypes(schema.constructors, null, type, false);

            var service = { _id: 'api.service' };
            buildTypes(schema.methods, null, service, true);

            this.schema = { type: type, service: service };
        }

        /**
         * Create a new client to interact with the API
         * @return {TelegramClient} An instance of Telegram.Client
         */

    }, {
        key: 'createClient',
        value: function createClient() {
            return new TelegramClient(this.schema, this.MTProto, this.TL);
        }

        /**
         * @param {Object} key The key config to add on MtProto layer
         * @example
         *   Telegram.addPublicKey({
         *     fingerprint: '0x123123...',
         *     modulus: '...',
         *     exponent: '010001'
         *   })
         */

    }, {
        key: 'addPublicKey',
        value: function addPublicKey(key) {
            var fingerprint = key.fingerprint;
            var modulus = key.modulus;
            var exponent = key.exponent;

            this.MTProto.security.PublicKey.addKey({
                fingerprint: fingerprint,
                modulus: modulus,
                exponent: exponent
            });
        }

        /**
         * Create a new {AuthKey} instance from a key id and a key payload.
         * These two parameters are returned from a Telegram server during the key
         * exchange.
         * @param {String} authKeyId
         * @param {String} authKeyBody
         * @return {AuthKey}
         */

    }, {
        key: 'createAuthKey',
        value: function createAuthKey(authKeyId, authKeyBody) {
            var AuthKey = this.MTProto.auth.AuthKey;
            return new AuthKey(authKeyId, authKeyBody);
        }

        /**
         * Decrypt an AuthKey buffer. This buffer is usually generated from an authKey
         *
         * @example
         * var keyBuffer = authKey.encrypt('password');
         * var key = tg.decryptKey(keyBuffer, 'password');
         *
         * @param {Buffer} keyBuffer
         * @param {String} keyPassword
         */

    }, {
        key: 'decryptKey',
        value: function decryptKey(keyBuffer, keyPassword) {
            return this.MTProto.auth.AuthKey.decryptAuthKey(keyBuffer, keyPassword);
        }

        /**
         * Utility method: converts a string to a Buffer object
         * @param {String} string
         * @param {Number} length
         */

    }, {
        key: 'string2Buffer',
        value: function string2Buffer(string, length) {
            return this.MTProto.utility.string2Buffer(string, length);
        }

        /**
         * Utility method: converts a buffer into a string in hexadecimal format
         * @param {String} buffer
         * @param {Number} length
         */

    }, {
        key: 'buffer2String',
        value: function buffer2String(buffer, length) {
            return this.MTProto.utility.buffer2String(buffer, length);
        }

        /**
         * Creates a random string of chars.
         * You can use it to generate an AuthKey encryption password
         * @param {Number} [size=128]
         */

    }, {
        key: 'createRandomPassword',
        value: function createRandomPassword() {
            var size = arguments.length <= 0 || arguments[0] === undefined ? 128 : arguments[0];

            var util = this.MTProto.utility;
            var buffer = util.createRandomBuffer(size);

            return util.buffer2String(buffer);
        }

        /**
         * @external {AuthKey} https://github.com/enricostara/telegram-mt-node/blob/master/lib/auth/auth-key.js
         * @external {Buffer} https://nodejs.org/api/buffer.html
         */

    }]);

    return Telegram;
})();

exports.Telegram = Telegram;

})(typeof module !== 'undefined' && module.exports || this);