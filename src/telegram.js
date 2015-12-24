class Telegram {
    /**
     * @param {MTProto} MTProto An object with the MTProto implementation
     * @param {TL} TL An object with the Telegram's TypeLanguage implementation
     */
    constructor(MTProto, TL) {
        if (!MTProto || !TL) {
            throw new Error('You must invoke new Telegram(MtProto, TypeLanguage)');
        }

        this.MTProto = MTProto;
        this.TL = TL;
    }

    /**
     * @param {Object} schema An object with all the types and methods.
     *                        The Telegram API schema can be downloaded
     *                        here: https://core.telegram.org/schema
     */
    useSchema(schema) {
        let buildTypes = this.TL.TypeBuilder.buildTypes;

        var type = {_id: 'api.type'};
        buildTypes(schema.constructors, null, type, false);

        var service = { _id: 'api.service'};
        buildTypes(schema.methods, null, service, true);

        this.schema = { type, service };
    }

    /**
     * Create a new Client to interact with the API
     * @return {Client} An instance of Telegram.Client
     */
    static createClient() {
        return new Client(this.schema);
    }
}
