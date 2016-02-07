(function() {
    var exports = {};

    /* content goes here */

    if (typeof define === 'function' && define.amd) {
        define(function() { return exports; });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports.Telegram = exports.Telegram;
        module.exports.TelegramClient = exports.TelegramClient;
    } else {
        window.Telegram = exports.Telegram;
        window.TelegramClient = exports.TelegramClient;
    }
})();
