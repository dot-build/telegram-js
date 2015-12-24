/* global Telegram */
describe('Telegram', function() {
    describe('::createClient(config)', function() {
        // xit('should create and return a client instance', function() {});
    });

    describe('::configure(MtProto mtProto, TypeLanguage tl)', function() {
        it('should allow to inject references to MtProto and TypeLanguage', function() {
            let mtProto = {};
            let TL = {};

            Telegram.configure(mtProto, TL);

            expect(Telegram.MTProto).toBe(mtProto);
            expect(Telegram.TL).toBe(TL);
        });
    });

    describe('::useSchema(schema)', function() {
        it('should build the types and methods used on clients from schema', function() {
            // From Telegram API schema
            let constructors = [
                {
                  'id': '-1132882121',
                  'predicate': 'boolFalse',
                  'params': [],
                  'type': 'Bool'
                }
            ];

            let methods = [{
                'id': '-878758099',
                'method': 'invokeAfterMsg',
                'params': [{
                    'name': 'msg_id',
                    'type': 'long'
                },{
                    'name': 'query',
                    'type': '!X'
                }],
                'type': 'X'
            }];

            let schema = { methods, constructors };

            let MTProto = {};

            // From https://github.com/enricostara/telegram-tl-node/blob/master/lib/builder/type-builder.js
            // buildTypes(schemas, types, targetModule, isTypeFunction)
            let TypeBuilder = {
                buildTypes: jasmine.createSpy('buildTypes')
            };

            let TL = {
                TypeBuilder
            };

            Telegram.configure(MTProto, TL);
            Telegram.useSchema(schema);

            let typeObject = { _id: 'api.type' };
            expect(TypeBuilder.buildTypes).toHaveBeenCalledWith(schema.constructors, null, typeObject, false);

            let methodsObject = { _id: 'api.service' };
            expect(TypeBuilder.buildTypes).toHaveBeenCalledWith(schema.methods, null, methodsObject, true);

            // Types and Constructors are exposed on Telegram.schema
            expect(Telegram.schema.type._id).toBe('api.type');
            expect(Telegram.schema.service._id).toBe('api.service');
        });

        it('should throw an error if the library is not configured yet', function () {
            Telegram.configure(null, null);

            function test () {
                Telegram.useSchema({});
            }

            expect(test).toThrow(new Error('You must use Telegram.configure() first'));
        });
    });
});
