/**
 * Telegram Client class
 */
class Client {
    constructor(schema) {
        this.schema = schema;
    }

    setChannel(channel) {
        this.channel = channel;
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