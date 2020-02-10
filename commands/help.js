module.exports = (bot) => {
    return {
        aliases: ['help', 'h'],
        help: {
            text: 'displays documentation for all commands or a specific command',
            examples: [
                bot.prefix + 'help',
                bot.prefix + 'help {command}'
            ]
        },
        call,
        run
    };
    
    function call(message, params){
        bot.respond(
            run(message, params[1]),
            message
        );
    }
    
    function run(message, command){
        let sections = [
            {
                name: 'description',
                value: 'bot description'
            }
        ]
        
        return new Promise((resolve, reject) => {
            if(command){
                let name = command,
                    m = Object.keys(bot.commands);
                for(let i = 0; i < m.length; i++){
                    let command = bot.commands[m[i]];
                    let hasRights = !command.rights || bot.rights.check(message.member, command.rights);
                    if(hasRights && command.aliases.includes(name)){
                        
                        message.channel.send({embed:{
                            title: '‣ ' + m[i],
                            description: [
                                '```yaml',
                                command.help.examples.join('\n'),
                                '```',
                                command.help.text,
                                '⸺*aliases*⸺',
                                command.aliases.map(e=>'`'+e+'`').join(', '),
                            ].join('\n'),
                            color: bot.color
                        }});
                        
                        break;
                    }
                }
            } else {
                let commands = Object.keys(bot.commands).filter(n => {
                    let c = bot.commands[n];
                    if(c.hidden){
                        return false;
                    }
                    if(c.rights && bot.rights.check(message.member, c.rights)){
                        return false;
                    }
                    return true;
                });
                let segments = bot.longMessage({embed:{
                    author: {
                        name: `version ${bot.VERSION}`,
                        iconURL: bot.client.user.avatarURL || undefined
                    },
                    description: sections.find(s => s.name === 'description').value,
                    fields: [
                        {
                            name: 'commands',
                            value: commands.map(name => [
                                '\r**‣ ' + name + '**',
                                '```YAML',
                                bot.commands[name].help.examples.join('\n'),
                                '```' + bot.commands[name].help.text,
                                '⸺*aliases*⸺',
                                bot.commands[name].aliases.map(e=>'`'+e+'`').join(', '),
                            ].join('\n')).join('\n')
                        }
                    ],
                    color: bot.color
                }}, '\r');
                segments.forEach(s => message.channel.send(s));
            }
        });
    }
};
