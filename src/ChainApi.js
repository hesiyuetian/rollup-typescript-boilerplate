import chainWeb3 from './ChainWeb3.js';
import BigNumber from "bignumber.js";
import {ERC20Token, _GameTicket, GameTicket, GameTicketActivity, GamePoolActivity, GamePoolCS, GameTicket2, GameTeam, GamePool, GameAirdrop} from './SquidGame.js';

let _newToken = {}, _newGamePool = {}, _newGameTicket = {},
    _gameTicket2, _gameTicketActivity, _gamePoolCS, _gamePoolActivity;

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

const newGameTicketActivity = (address) => {
    if(!_gameTicketActivity) {
        _gameTicketActivity = new GameTicketActivity(chainWeb3, address)
    }
    return _gameTicketActivity;
}

const newGamePoolCS = (address) => {
    if(!_gamePoolCS) {
        _gamePoolCS = new GamePoolCS(chainWeb3, address)
    }
    return _gamePoolCS;
}

const newGamePoolActivity = (address) => {
    if(!_gamePoolActivity) {
        _gamePoolActivity = new GamePoolActivity(chainWeb3, address)
    }
    return _gamePoolActivity;
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
    newGameTicketActivity,
    newGamePoolActivity,
    newGamePoolCS,
    BigNumber
}
