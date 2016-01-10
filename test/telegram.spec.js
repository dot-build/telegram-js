/* global Telegram, TelegramClient */
describe('Telegram', function() {
    describe('#constructor(MtProto mtProto, TypeLanguage tl)', function() {
        it('should allow to inject references to MTProto and TypeLanguage', function() {
            let mtProto = {};
            let TL = {};

            let instance = new Telegram(mtProto, TL);

            expect(instance.MTProto).toBe(mtProto);
            expect(instance.TL).toBe(TL);
        });

        it('should throw an error if the dependencies are not injected', function () {
            function test () {
                return new Telegram();
            }

            expect(test).toThrow(new Error('You must invoke new Telegram(MTProto, TypeLanguage)'));
        });
    });

    describe('#useSchema(schema, typePrefix, servicePrefix)', function() {
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

            let instance = new Telegram(MTProto, TL);
            let typePrefix = 'types';
            let servicePrefix = 'methods';

            instance.useSchema(schema, typePrefix, servicePrefix);

            let typeObject = { _id: typePrefix };
            expect(TypeBuilder.buildTypes).toHaveBeenCalledWith(schema.constructors, null, typeObject, false);

            let methodsObject = { _id: servicePrefix };
            expect(TypeBuilder.buildTypes).toHaveBeenCalledWith(schema.methods, null, methodsObject, true);

            // Types and Constructors are exposed on Telegram.schema
            expect(instance.schema.type._id).toBe(typePrefix);
            expect(instance.schema.service._id).toBe(servicePrefix);
        });
    });

    describe('#createClient()', function() {
        it('should create and return a client using the configured schema', function () {
            let schema = {};
            let MTProto = {};

            let TypeBuilder = {
                buildTypes(){}
            };

            let TL = {
                TypeBuilder
            };

            let instance = new Telegram(MTProto, TL);
            instance.useSchema(schema);

            let client = instance.createClient();

            expect(client instanceof TelegramClient).toBe(true);
            expect(client.schema).toBe(instance.schema);
        });
    });
});
