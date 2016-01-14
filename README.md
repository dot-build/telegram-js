# Telegram JS

Client library to access the Telegram API. This package is based on the work of Enrico in the [Telegram Link](https://github.com/enricostara/telegram.link) library.

It's rewritten in ES6 and has far less built-in features and dependencies. It is compatible with [telegram-mt-node](https://github.com/enricostara/telegram-mt-node) and [telegram-tl-node](https://github.com/enricostara/telegram-tl-node), but is not a drop-in replacement.

## Documentation

https://doc.esdoc.org/github.com/dot-build/telegram-js/

## TL;DR - Using available open source libraries and Telegram API

```js

import { Telegram } from 'telegram-js';
import MTProto from 'telegram-mt-node';
import TypeLanguage from 'telegram-tl-node';

// Download from https://core.telegram.org/schema/json
import schema from 'api-schema.json';

var telegram = new Telegram(MTProto, TypeLanguage);
var connection = new MTProto.net.HttpConnection({});

telegram.useSchema(schema);

var client = telegram.createClient();
client.setConnection(connection);

var config = {};
var ready = client.setup(config);

ready.then(funtion(client) {
    client.callApi('help.getConfig').then(function (response) {
        // ...
    });
});

```