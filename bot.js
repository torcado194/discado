/** config **/

const Discord = require('discord.js');

/** bot **/

const VERSION = '1.0.0';

function Bot(prefix = '!', modPrefix = '!'){
    let bot = this;
    
    bot.VERSION = VERSION;
    bot.Discord = Discord;
    bot.USERS_PATTERN    = new RegExp(bot.Discord.MessageMentions.USERS_PATTERN,    '');
    bot.ROLES_PATTERN    = new RegExp(bot.Discord.MessageMentions.ROLES_PATTERN,    '');
    bot.CHANNELS_PATTERN = new RegExp(bot.Discord.MessageMentions.CHANNELS_PATTERN, '');
    bot.EVERYONE_PATTERN = new RegExp(bot.Discord.MessageMentions.EVERYONE_PATTERN, '');
    
    bot.prefix = prefix;
    bot.defaultPrefix = bot.prefix;
    bot.modPrefix = modPrefix;
    bot.modDefaultPrefix = bot.modPrefix;
    bot.color = 0xf03484;
    
    bot.commands = require('./commands.js')(bot);
    bot.rights   = require('./rights.js')(bot);
    
    ////////////////////
    /** client setup **/
    ////////////////////
    
    let client = bot.client = new Discord.Client();
    
    client.on('error', console.error);
    
    client.on('ready', () => {	
        console.log(client.user.username + ' is ready');
        bot.init();
    });
    
    client.on('message', message => {
        
        let context = message.content.startsWith(bot.modPrefix) ? 'mod' : 'normal';
        
        let selfMentioned = !!message.mentions.users.get(client.user.id);
        if(!message.content.startsWith(bot.prefix) && !message.content.startsWith(bot.modPrefix) && !selfMentioned){
            return;
        }
        
        let params = bot.getParams(message.content, selfMentioned);
        
        bot.call(message, params, context);
        
    });
    
    ////////////
    /** init **/
    ////////////
    
    bot.init = () => {
        
    }
    
    ///////////////////
    /** bot methods **/
    ///////////////////
    
    bot.login = () => {
        console.log('logging in...');
        if(process.env.NODE_ENV === 'production' || process.argv[2] === '-p'){
            client.login(process.env.BOT_TOKEN);
        } else {
            client.login(process.env.TEST_BOT_TOKEN);
        }
    }
    
    bot.respond = (promise, message) => {
        promise.then(()=>{
            bot.confirm(message);
        }).catch(err => {
            bot.deny(message, err);
        });
    }
    
    bot.getParams = (command, selfMentioned) => {
        if(selfMentioned){
            return command.split(/\s+/g).slice(1);
        } else {
            return command.slice(bot.prefix.length).split(/\s+/g);
        }
    }
    
    bot.call = (message, params, context) => {
        let name = params[0].toLowerCase(),
            m = Object.keys(bot.commands);
        for(let i = 0; i < m.length; i++){
            let command = bot.commands[m[i]];
            if(command.aliases.includes(name)){
                if(bot.rights.check(message.member, command.rights)){
                    command.call(message, params, context);
                } else {
                    bot.deny(message, `insufficient rights. must be \`${command.rights}\` or higher`);
                }
                break;
            }
        }
    }
    
    bot.send = (channel, body) => {
        if(typeof channel === 'string'){
            channel = bot.client.channels.get(channel);
        }
        let segs = bot.longMessage(body.toString());
        segs = segs.map(s => channel.send({embed:{
            description: s,
            color: bot.color
        }}));
        return Promise.all(segs);
    }
    
    bot.confirm = (message) => {
        if(message){
            message.react('👍').then((reaction) => {
            }).catch(console.error);
        }
    }
    
    bot.deny = (message, error) => {
        if(error){
            bot.send(message.channel, error);
        }
        if(message){
            message.react('❌').then((reaction) => {
            }).catch(console.error);
        }
    }
    
    bot.warning = (message, error, show = false) => {
        if(show){
            bot.send(message, error);
        }
        if(message){
            message.react('⚠').then((reaction) => {
                if(!show){
                    message.awaitReactions((r, user) => !user.bot && r.emoji.name === '⚠', {max: 1}).then(collected => {
                        bot.send(message, error);
                    });
                }
            }).catch(console.error);
        }
    }
    
    bot.longMessage = (msg, delimiter, options = {}) => {
        const LAMBDA = 80,
              BODY_SIZE = 2048 - LAMBDA,
              FIELD_SIZE = 1024 - LAMBDA,
              EMBED_SIZE = 6000 - LAMBDA,
              FIELD_COUNT = 25;
        
        delimiter = delimiter || '\n';
        
        if(typeof msg === 'string'){
            if(msg.length <= BODY_SIZE){
                return options.code ? ['```' + options.code + '\n' + msg + '```'] : [msg];
            }
            let segs = msg.split(delimiter);
            for(let i = 1; i < segs.length; i++){
                let join = segs[i-1] + delimiter + segs[i];
                if(join.length < BODY_SIZE){
                    segs[i-1] = join;
                    segs.splice(i, 1);
                    i--;
                }
            }
            if(options.code){
                segs = segs.map(s => '```' + options.code + '\n' + s + '```')
            }
            return segs;
        } else {
            let fields = msg.embed.fields || [];
            for(let i = 0; i < fields.length; i++){
                if(fields[i].value.length > FIELD_SIZE){
                    let segs = fields[i].value.split(delimiter),
                        code = fields[i].code;
                    for(let j = 1; j < segs.length; j++){
                        let join = segs[j-1] + delimiter + segs[j];
                        if(join.length < FIELD_SIZE){
                            segs[j-1] = join;
                            segs.splice(j, 1);
                            j--;
                        }
                    }
                    fields.splice(i, 1, ...segs.map((s, n) => ({
                        name: n === 0 ? fields[i].name : '͘' /*fields[i].name + ' (cont.)'*/,
                        value: s,
                        code
                    })));
                    i += (segs.length - 1);
                }
            }
            if(options.code){
                msg.embed.fields = fields.map(f => ({name: f.name, value: '```' + options.code + '\n' + f.value + '```'}));
            }
            fields = fields.map(f => {
                if(f.code){
                    return {name: f.name, value: `\`\`\`${f.code}\n${f.value}\`\`\``};
                } else {
                    return f;
                }
            });
            let totalText = fields.reduce((acc, cur) => acc + cur.name + cur.value, 0);
            let fieldCount = FIELD_COUNT;
            if(totalText.length > EMBED_SIZE){
                let out = [],
                    acc = '',
                    lastIdx = 0,
                    minFields = FIELD_COUNT;
                for(let i = 0; i < fields.length; i++){
                    acc += fields[i].name + fields[i].value;
                    if(acc.length > EMBED_SIZE){
                        out.push(fields.slice(lastIdx, i));
                        if(i - lastIdx < minFields){
                            minFields = i - lastIdx;
                        }
                        lastIdx = i;
                        acc = '';
                    }
                }
                if(lastIdx < fields.length - 1){
                    out.push(fields.slice(lastIdx));
                }
                fields = [];
                out.forEach(a => fields.push(...a));
                fieldCount = 6;
            }
            if(fields.length > fieldCount){
                let count = Math.ceil(fields.length / fieldCount),
                    out = [];
                for(let i = 0; i < count; i++){
                    out.push(fields.slice(i * fieldCount, i * fieldCount + fieldCount));
                }
                let outObj = out.map((f, n) => {
                    let obj = Object.assign({}, msg.embed);
                    obj.fields = f;
                    if(n > 0){
                        obj.title = undefined;
                        obj.url = undefined;
                        obj.description = undefined;
                    }
                    return {embed:obj};
                });
                return outObj;
            } else {
                return [msg];
            }
        }
    }
    
    bot.getMentions = (message) => {
        let mentions = message.mentions.members && message.mentions.members.array();
        if(mentions[0] && mentions[0].id === bot.client.user.id){
            mentions.shift();
        }
        return mentions;
    }
    
};


module.exports = Bot;