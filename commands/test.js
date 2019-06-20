module.exports = (bot) => {
    return {
        aliases: ['test'],
        rights: 'owner',
        help: {
            text: 'test command',
            examples: [
                bot.prefix + 'test'
            ]
        },
        hidden: true,
        call,
        run
    };
    
    function call(message, params){
        bot.respond(
            run(message),
            message
        );
    }
    
    function run(message){
        return bot.send(message.channel, "this is a test");
    }
};