const fs = require('fs');

module.exports = bot => {
    let files = fs.readdirSync("./commands");
    
    console.log('::commands::', files);
    
    let commands = {},
        aliasList = [];
    
    files.forEach(f => {
        if(f.endsWith('.js')){
            let name = f.slice(0,-3)
            let cmd = require('./commands/' + f)(bot);
            cmd.aliases.forEach(a => {
                if(aliasList.includes(a)){
                    let clash,
                        names = Object.keys(commands);
                    for(let i = 0; i < names.length; i++){
                        if(commands[names[i]].aliases.includes(a)){
                            clash = names[i];
                            break;
                        }
                    }
                    console.error('ALIAS_CLASH:', `alias ${a} duplicated between ${name} and ${clash}`);
                }
            });
            commands[name] = cmd;
            aliasList.push(...cmd.aliases);
        }
    });
    
    return commands;
};