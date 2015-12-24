class Telegram {
    /**
     * @param {MTProto} MTProto An object with the MtProto implementation
     * @param {TL} TL An object with the Telegram's TypeLanguage implementation
     */
    static configure(MTProto, TL) {
        Telegram.MTProto = MTProto;
        Telegram.TL = TL;
    }

    /**
     * @param {Object} schema An object with all the types and methods.
     *                        The Telegram API schema can be downloaded
     *                        here: https://core.telegram.org/schema
     */
    static useSchema(schema) {
        if (!Telegram.TL) {
            throw new Error('You must use Telegram.configure() first');
        }

        let buildTypes = Telegram.TL.TypeBuilder.buildTypes;

        var type = {_id: 'api.type'};
        buildTypes(schema.constructors, null, type, false);

        var service = { _id: 'api.service'};
        buildTypes(schema.methods, null, service, true);

        Telegram.schema = { type, service };
    }

    /**
     * Create a new Client to interact with the API
     * @return {Client} An instance of Telegram.Client
     */
    static createClient() {
        return new Client(Telegram.schema);
    }
}
