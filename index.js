let prefix;
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
    prefix = '!';
}

let bot = new (require('./bot.js'))(prefix);

bot.login();