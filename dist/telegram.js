(function(global) {

    'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Telegram Client class
 */

var Client = (function () {
    function Client(schema) {
        _classCallCheck(this, Client);

        this.schema = schema;
    }

    _createClass(Client, [{
        key: 'setChannel',
        value: function setChannel(channel) {
            this.channel = channel;
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

var Telegram = (function () {
    function Telegram() {
        _classCallCheck(this, Telegram);
    }

    _createClass(Telegram, null, [{
        key: 'configure',

        /**
         * @param {MTProto} MTProto An object with the MtProto implementation
         * @param {TL} TL An object with the Telegram's TypeLanguage implementation
         */
        value: function configure(MTProto, TL) {
            Telegram.MTProto = MTProto;
            Telegram.TL = TL;
        }

        /**
         * @param {Object} schema An object with all the types and methods.
         *                        The Telegram API schema can be downloaded
         *                        here: https://core.telegram.org/schema
         */

    }, {
        key: 'useSchema',
        value: function useSchema(schema) {
            if (!Telegram.TL) {
                throw new Error('You must use Telegram.configure() first');
            }

            var buildTypes = Telegram.TL.TypeBuilder.buildTypes;

            var type = { _id: 'api.type' };
            buildTypes(schema.constructors, null, type, false);

            var service = { _id: 'api.service' };
            buildTypes(schema.methods, null, service, true);

            Telegram.schema = { type: type, service: service };
        }

        /**
         * Create a new Client to interact with the API
         * @return {Client} An instance of Telegram.Client
         */

    }, {
        key: 'createClient',
        value: function createClient() {
            return new Client(Telegram.schema);
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