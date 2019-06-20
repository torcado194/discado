let prefix,
    modPrefix;
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
    prefix = '!';
    modPrefix = '!';
}

let bot = new (require('./bot.js'))(prefix, modPrefix);

bot.login();