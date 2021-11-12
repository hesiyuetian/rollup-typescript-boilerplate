import chainWeb3 from './ChainWeb3.js';
import {ERC20Token, _GameTicket, GameTicket, GameTicket2, GameTeam, GamePool, GameAirdrop} from './SquidGame.js';

let _newToken = {}, _newGamePool = {}, _newGameTicket = {}, _gameTicket2;

function newToken(address) {
    if(!_newToken[address]){
        _newToken[address] = new ERC20Token(chainWeb3, address)
    }
    return _newToken[address];
}

function newGamePool(address) {
    if(!_newGamePool[address]){
        _newGamePool[address] = new GamePool(chainWeb3, address)
    }
    return _newGamePool[address];
}

function newGameTicket(address) {
    if(!_newGameTicket[address]){
        _newGameTicket[address] = new GameTicket(chainWeb3, address)
    }
    return _newGameTicket[address];
}

const newGameTicket2 = (address) => {
    if(!_gameTicket2) {
        _gameTicket2 = new GameTicket2(chainWeb3, address)
    }
    return _gameTicket2;
}

export default {
    ERC20Token: (address) => new ERC20Token(chainWeb3, address),
    gameTicket: new _GameTicket(chainWeb3),
    gameTeam: new GameTeam(chainWeb3),
    gameAirdrop: new GameAirdrop(chainWeb3),
    newGameTicket2,
    newGameTicket,
    chainWeb3,
    GamePool,
    newToken,
    newGamePool,
}
