(function(global) {

    /* content goes here */

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
