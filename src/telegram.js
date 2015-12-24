class Telegram {
    static configure(MTProto, TL) {
        Telegram.MTProto = MTProto;
        Telegram.TL = TL;
    }

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
}
