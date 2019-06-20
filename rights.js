module.exports = bot => {  
    
    class Rights extends Map {
        constructor(iterable) {
            super(iterable);
        }
        
        check(entity, right) {
            if(!right || right.length === 0){
                return true;
            }
            if(Array.isArray(right)){
                right = right[0];
            }
            if(typeof right === 'string'){
                right = this.get(right);
                if(!right){
                    return false;
                }
            }
            let list = [...this.entries()];
            for(let i = 0; i < list.length; i++){
                let name = list[i][0],
                    checks = list[i][1];
                for(let j = 0; j < checks.length; j++){
                    let check = checks[j];
                    if(typeof check === 'string'){ //user id
                        if(entity.id && entity.id === check){
                            return true;
                        }
                    } else if(check instanceof bot.Discord.User){ //user
                        if(entity === check){
                            return true;
                        }
                    } else if(typeof check === 'number'){ //permission by flag
                        if(entity.hasPermission && entity.hasPermission(check)){
                            return true;
                        }
                    }
                }
                if(list[i][1] === right){
                    return false;
                }
            }
            return false;
        }
        
        add(right, check) {
            this.get(right).push(check);
        }
        
    }
    
    
    return new Rights([
        ['owner', [
            '128364623308128256', //torcado
        ]],
        ['admin', [
            bot.Discord.Permissions.FLAGS.ADMINISTRATOR
        ]]
    ]);
    
}