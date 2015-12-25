(function(global) {

    'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var NULL_SERVER_SALT = '0x0000000000000000';

/**
 * Telegram Client class
 */

var Client = (function () {
    function Client(schema, mtProto, typeLanguage) {
        _classCallCheck(this, Client);

        this.schema = schema;
        this.protocol = mtProto;
        this.typeLanguage = typeLanguage;
    }

    _createClass(Client, [{
        key: 'setConnection',
        value: function setConnection(connection) {
            this.connection = connection;
        }
    }, {
        key: 'setChannel',
        value: function setChannel(channel) {
            this.channel = channel;
        }
    }, {
        key: 'createUnencryptedChannel',
        value: function createUnencryptedChannel() {
            var RpcChannel = this.protocol.net.RpcChannel;
            return new RpcChannel(this.connection);
        }
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
    }, {
        key: 'authenticate',
        value: function authenticate(config) {
            var client = this;

            function callback(auth) {
                var channel = client.createEncryptedChannel(client.connection, config, auth.key, auth.serverSalt);
                client.setChannel(channel);
                client.authKey = auth;

                return client;
            }

            return this.createAuthKey().then(callback);
        }
    }, {
        key: 'restoreFromConfig',
        value: function restoreFromConfig(config) {
            var channel = this.createEncryptedChannel(this.connection, config, config.authKey, NULL_SERVER_SALT);
            this.setChannel(channel);
        }
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
    }, {
        key: 'callApi',
        value: function callApi(apiMethod, args) {
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

            var props = this._readProperties(args);
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
    }]);

    return Client;
})();

Client.NULL_SERVER_SALT = NULL_SERVER_SALT;

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
         * Create a new Client to interact with the API
         * @return {Client} An instance of Telegram.Client
         */

    }, {
        key: 'createClient',
        value: function createClient() {
            return new Client(this.schema, this.MTProto, this.TL);
        }
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
    }]);

    return Telegram;
})();

    Telegram.Client = Client;

    if (typeof define === 'function' && define.amd) {
        define(function() {
            return Telegram;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports.Telegram = Telegram;
    } else {
        global.Telegram = Telegram;
    }

})(this);