import BigNumber from "bignumber.js";

class BaseInstance {
    constructor(provider, abi, address) {
        this.address = address;
        this.provider = provider;
        this.abi = abi;
        this.subscribes = [];
        this.subscriptions = [];
        if(address) {
            this.contract = new this.provider.web3.eth.Contract(abi, address);
        }
    }
    initAfter() {}
}

class BaseByName {
    constructor(provider, abi, name) {
        this.provider = provider;
        this.abi = abi;
        this.address = '';
        this.name = name;
        provider.registerModule(this);
        if(this.provider.chainId) {
            this.initialize(this.provider.chainId);
        }
    }

    initialize(chainId, account=null) {
        this.provider.chainId = chainId;
        if(account) {
            this.provider.account = account;
        }
        this.address = this.provider.getContractAddr(this.name);
        if(this.abi && this.address) {
            this.contract = this.provider.getContract(this.abi, this.address);
        }
    }

    initAfter() {}
}


class ERC20Token extends BaseInstance {
    constructor(provider, address) {
        let abi = [{"inputs":[{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_symbol","type":"string"},{"internalType":"uint8","name":"_decimals","type":"uint8"},{"internalType":"uint256","name":"_totalSupply","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}];
        super(provider, abi, address);
    }

    async balanceOf(user) {
        if (!user) {
            user = this.provider.account;
        }
        let _token = await this.info();
        let res = '0'
        if (this.provider.isZeroAddress(this.address)) {
            res = await this.provider.web3.eth.getBalance(user);
        } else {
            res = await this.contract.methods.balanceOf(user).call();
        }
        return new BigNumber(res).shiftedBy(-1 * _token.decimals).toFixed();
    }

    async tokenBalanceOf(user) {
        if (!user) {
            user = this.provider.account;
        }
        let _token = await this.info();
        let res = '0'
        if (!this.provider.isZeroAddress(this.address)) {
            res = await this.contract.methods.balanceOf(user).call();
        }
        console.log('tokenBalanceOf:', this.address, res);
        return new BigNumber(res).shiftedBy(-1 * _token.decimals).toFixed();
    }

    async totalSupply() {
        let _token = await this.info();
        let res = '0'
        if (!this.provider.isZeroAddress(this.address)) {
            res = await this.contract.methods.totalSupply().call();
        }
        return new BigNumber(res).shiftedBy(-1 * _token.decimals).toFixed();
    }

    async showBalanceOf(fmt, user) {
        let d = await this.info();
        return new BigNumber(await this.balanceOf(user)).shiftedBy(-1 * d.decimals).toFixed(fmt);
    }

    async info() {
        let cache = this.provider.tokens[this.address.toLocaleLowerCase()];
        if (cache) {
            return cache;
        }
        let res = {};
        if (this.provider.isZeroAddress(this.address)) {
            res = {
                address: this.address,
                symbol: this.provider.getZeroSymbol(),
                totalSupply: 0,
                decimals: 18
            };
        } else {
            res = {
                address: this.address,
                symbol: await this.contract.methods.symbol().call(),
                totalSupply: await this.contract.methods.totalSupply().call(),
                decimals: await this.contract.methods.decimals().call()
            };
        }
        this.provider.tokens[this.address.toLocaleLowerCase()] = res;
        return res;
    }

    async approve(spender) {
        if (!spender) {
            throw ('Illegal approve');
        }

        let total = await this.contract.methods.totalSupply().call();
        return await this.provider.executeContract(this.contract, 'approve', 0, [spender, total]);
    }

    async allowance(user, spender) {
        if (this.provider.isZeroAddress(this.address)) {
            return new BigNumber(10).shiftedBy(30).toFixed();
        }
        let _token = await this.info();
        let res = await this.contract.methods.allowance(user, spender).call();
        return new BigNumber(res).shiftedBy(-1 * _token.decimals).toFixed();
    }

    async transfer(to, amount) {
        let _token = await this.info()
        amount = new BigNumber(amount).shiftedBy(1 * _token.decimals).toFixed();
        return await this.provider.executeContract(this.contract, 'transfer', 0, [to, amount]);
    }
}


class _GameTicket extends BaseByName {
    constructor(provider) {
        let abi = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Bought","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_user","type":"address"},{"indexed":true,"internalType":"address","name":"_old","type":"address"},{"indexed":true,"internalType":"address","name":"_new","type":"address"}],"name":"ConfigChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"_old","type":"uint256"},{"indexed":true,"internalType":"uint256","name":"_new","type":"uint256"}],"name":"FeeRateChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_user","type":"address"},{"indexed":true,"internalType":"address","name":"_old","type":"address"},{"indexed":true,"internalType":"address","name":"_new","type":"address"}],"name":"OwnerChanged","type":"event"},{"anonymous":false,"inputs":[],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_old","type":"address"},{"indexed":true,"internalType":"address","name":"_new","type":"address"}],"name":"RewardPoolChanged","type":"event"},{"anonymous":false,"inputs":[],"name":"Unpaused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"reward","type":"uint256"},{"indexed":false,"internalType":"address","name":"feeTo","type":"address"},{"indexed":false,"internalType":"uint256","name":"fee","type":"uint256"}],"name":"Withdrawed","type":"event"},{"inputs":[],"name":"admin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_value","type":"uint256"},{"internalType":"address","name":"_to","type":"address"}],"name":"buy","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256[]","name":"_values","type":"uint256[]"},{"internalType":"address[]","name":"_tos","type":"address[]"}],"name":"buyBatch","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"buyToken","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"changeOwner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"config","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"dev","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"feeRate","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_buyToken","type":"address"},{"internalType":"uint256","name":"_unit","type":"uint256"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rewardPool","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_rate","type":"uint256"}],"name":"setFeeRate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_pool","type":"address"}],"name":"setRewardPool","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_unit","type":"uint256"}],"name":"setUnit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_config","type":"address"}],"name":"setupConfig","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"team","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"tickets","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"total","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"unit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"uploader","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"withdraw","outputs":[{"internalType":"uint256","name":"reward","type":"uint256"},{"internalType":"uint256","name":"fee","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];
        super(provider, abi, 'GameTicket');
        this.pool = null;
        this.buyTokenInfo = null;
    }

    async getBuyToken() {
        if(this.buyTokenInfo) return this.buyTokenInfo;
        let buyToken = await this.contract.methods.buyToken().call();
        this.tokenIns = new ERC20Token(this.provider, buyToken);
        this.buyTokenInfo = await this.tokenIns.info();
        return this.buyTokenInfo;
    }

    async getUnit() {
        let amount = await this.contract.methods.unit().call();
        let tokenInfo = await this.getBuyToken();
        return new BigNumber(amount).shiftedBy(-1 * tokenInfo.decimals).toFixed();
    }

    async getBalance() {
        let amount = await this.contract.methods.getBalance().call();
        let tokenInfo = await this.getBuyToken();
        return new BigNumber(amount).shiftedBy(-1 * tokenInfo.decimals).toFixed();
    }

    async getTotal() {
        let amount = await this.contract.methods.total().call();
        let tokenInfo = await this.getBuyToken();
        return new BigNumber(amount).shiftedBy(-1 * tokenInfo.decimals).toFixed();
    }

    async getTicket(user) {
        if(!user) {
            user = this.provider.account;
        }
        let amount = await this.contract.methods.tickets(user).call();
        let tokenInfo = await this.getBuyToken();
        return new BigNumber(amount).shiftedBy(-1 * tokenInfo.decimals).toFixed();
    }

    async getFeeRate() {
        let rate = await this.contract.methods.feeRate().call();
        if(rate != '0') {
            return new BigNumber(rate).dividedBy(10000).toFixed();
        }
        return rate;
    }

    async buy(amount, user) {
        if(!user) {
            user = this.provider.account;
        }
        console.log('buy:', amount, user);
        let tokenInfo = await this.getBuyToken();
        amount = new BigNumber(amount).shiftedBy(1 * tokenInfo.decimals).toFixed();
        let value = '0';
        if (tokenInfo.address.toLocaleLowerCase() == this.provider.ZERO_ADDR) {
            value = amount;
        }
        return await this.provider.executeContract(this.contract, 'buy', value, [amount, user]);
    }

    async buyBatch(amounts, users) {
        let tokenInfo = await this.getBuyToken();
        let value = '0';
        let total = new BigNumber(0);
        for(let i=0; i<amounts.length; i++)  {
            let amount = new BigNumber(amounts[i]).shiftedBy(1 * tokenInfo.decimals);
            if (tokenInfo.address.toLocaleLowerCase() == this.provider.ZERO_ADDR) {
                total = total.plus(amount);
            }
            amounts[i] = amount.toFixed();
        }
        if (tokenInfo.address.toLocaleLowerCase() == this.provider.ZERO_ADDR) {
            value = total.toFixed();
        }
        return await this.provider.executeContract(this.contract, 'buyBatch', value, [amounts, users]);
    }

    async setUnit(_unit) {
        let tokenInfo = await this.getBuyToken();
        _unit = new BigNumber(amount).shiftedBy(1 * tokenInfo.decimals).toFixed();
        return await this.provider.executeContract(this.contract, 'setUnit', 0, [_unit]);
    }

    async setFeeRate(_rate) {
        return await this.provider.executeContract(this.contract, 'setFeeRate', 0, [_rate]);
    }

}

class GameTicket extends BaseInstance {
    constructor(provider, address, abi=null) {
        if(abi == null) {
            abi = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Bought","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_user","type":"address"},{"indexed":true,"internalType":"address","name":"_old","type":"address"},{"indexed":true,"internalType":"address","name":"_new","type":"address"}],"name":"ConfigChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"_old","type":"uint256"},{"indexed":true,"internalType":"uint256","name":"_new","type":"uint256"}],"name":"FeeRateChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_user","type":"address"},{"indexed":true,"internalType":"address","name":"_old","type":"address"},{"indexed":true,"internalType":"address","name":"_new","type":"address"}],"name":"OwnerChanged","type":"event"},{"anonymous":false,"inputs":[],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_old","type":"address"},{"indexed":true,"internalType":"address","name":"_new","type":"address"}],"name":"RewardPoolChanged","type":"event"},{"anonymous":false,"inputs":[],"name":"Unpaused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"reward","type":"uint256"},{"indexed":false,"internalType":"address","name":"feeTo","type":"address"},{"indexed":false,"internalType":"uint256","name":"fee","type":"uint256"}],"name":"Withdrawed","type":"event"},{"inputs":[],"name":"admin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_value","type":"uint256"},{"internalType":"address","name":"_to","type":"address"}],"name":"buy","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"buyToken","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"changeOwner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"config","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"dev","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"feeRate","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_buyToken","type":"address"},{"internalType":"uint256","name":"_unit","type":"uint256"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rewardPool","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_rate","type":"uint256"}],"name":"setFeeRate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_pool","type":"address"}],"name":"setRewardPool","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_unit","type":"uint256"}],"name":"setUnit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_config","type":"address"}],"name":"setupConfig","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"team","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"tickets","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"total","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"unit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"uploader","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"withdraw","outputs":[{"internalType":"uint256","name":"reward","type":"uint256"},{"internalType":"uint256","name":"fee","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];
        }
        super(provider, abi, address);
        this.pool = null;
        this.buyTokenInfo = null;
    }


    async getBuyToken() {
        if(this.buyTokenInfo) return this.buyTokenInfo;
        let buyToken = await this.contract.methods.buyToken().call();
        this.tokenIns = new ERC20Token(this.provider, buyToken);
        this.buyTokenInfo = await this.tokenIns.info();
        return this.buyTokenInfo;
    }

    async getUnit() {
        let amount = await this.contract.methods.unit().call();
        let tokenInfo = await this.getBuyToken();
        return new BigNumber(amount).shiftedBy(-1 * tokenInfo.decimals).toFixed();
    }

    async getBalance() {
        let amount = await this.contract.methods.getBalance().call();
        let tokenInfo = await this.getBuyToken();
        return new BigNumber(amount).shiftedBy(-1 * tokenInfo.decimals).toFixed();
    }

    async getTotal() {
        let amount = await this.contract.methods.total().call();
        let tokenInfo = await this.getBuyToken();
        return new BigNumber(amount).shiftedBy(-1 * tokenInfo.decimals).toFixed();
    }

    async getTicket(user) {
        if(!user) {
            user = this.provider.account;
        }
        let amount = await this.contract.methods.tickets(user).call();
        let tokenInfo = await this.getBuyToken();
        return new BigNumber(amount).shiftedBy(-1 * tokenInfo.decimals).toFixed();
    }

    async buy(amount, user) {
        if(!user) {
            user = this.provider.account;
        }
        console.log('buy:', amount, user);
        let tokenInfo = await this.getBuyToken();
        amount = new BigNumber(amount).shiftedBy(1 * tokenInfo.decimals).toFixed();
        let value = '0';
        if (tokenInfo.address.toLocaleLowerCase() == this.provider.ZERO_ADDR) {
            value = amount;
        }
        return await this.provider.executeContract(this.contract, 'buy', value, [amount, user]);
    }

    async setUnit(_unit) {
        let tokenInfo = await this.getBuyToken();
        _unit = new BigNumber(amount).shiftedBy(1 * tokenInfo.decimals).toFixed();
        return await this.provider.executeContract(this.contract, 'setUnit', 0, [_unit]);
    }

    async setFeeRate(_rate) {
        return await this.provider.executeContract(this.contract, 'setFeeRate', 0, [_rate]);
    }

}


class GameTicket2 extends GameTicket {
    constructor(provider, address) {
        let abi = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_from","type":"address"},{"indexed":true,"internalType":"address","name":"_to","type":"address"},{"indexed":false,"internalType":"uint256","name":"buyValue","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"burnValue","type":"uint256"}],"name":"Bought","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_user","type":"address"},{"indexed":true,"internalType":"address","name":"_old","type":"address"},{"indexed":true,"internalType":"address","name":"_new","type":"address"}],"name":"ConfigChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"_old","type":"uint256"},{"indexed":true,"internalType":"uint256","name":"_new","type":"uint256"}],"name":"FeeRateChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_user","type":"address"}],"name":"Joined","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_user","type":"address"},{"indexed":true,"internalType":"address","name":"_old","type":"address"},{"indexed":true,"internalType":"address","name":"_new","type":"address"}],"name":"OwnerChanged","type":"event"},{"anonymous":false,"inputs":[],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_old","type":"address"},{"indexed":true,"internalType":"address","name":"_new","type":"address"}],"name":"RewardPoolChanged","type":"event"},{"anonymous":false,"inputs":[],"name":"Unpaused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"reward","type":"uint256"},{"indexed":false,"internalType":"address","name":"feeTo","type":"address"},{"indexed":false,"internalType":"uint256","name":"fee","type":"uint256"}],"name":"Withdrawed","type":"event"},{"inputs":[],"name":"admin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_value","type":"uint256"},{"internalType":"address","name":"_to","type":"address"}],"name":"buy","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256[]","name":"_values","type":"uint256[]"},{"internalType":"address[]","name":"_tos","type":"address[]"}],"name":"buyBatch","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"buyToken","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"changeOwner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"config","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"dev","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"feeRate","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"gameToken","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"gameTokenUnit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_buyToken","type":"address"},{"internalType":"address","name":"_gameToken","type":"address"},{"internalType":"uint256","name":"_buyTokenUnit","type":"uint256"},{"internalType":"uint256","name":"_gameTokenUnit","type":"uint256"},{"internalType":"uint256","name":"_joinAmount","type":"uint256"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"join","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"joinAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rewardPool","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_rate","type":"uint256"}],"name":"setFeeRate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_joinAmount","type":"uint256"}],"name":"setJoinAmount","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_pool","type":"address"}],"name":"setRewardPool","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_buyTokenUnit","type":"uint256"},{"internalType":"uint256","name":"_gameTokenUnit","type":"uint256"}],"name":"setUnit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_config","type":"address"}],"name":"setupConfig","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"status","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"team","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"tickets","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"total","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"unit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"uploader","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"withdraw","outputs":[{"internalType":"uint256","name":"reward","type":"uint256"},{"internalType":"uint256","name":"fee","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];
        super(provider, abi, address);
        this.gameTokenInfo = null;
    }

    async getGameToken() {
        if(this.gameTokenInfo) return this.gameTokenInfo;
        let token = await this.contract.methods.gameToken().call();
        this.tokenIns = new ERC20Token(this.provider, token);
        this.gameTokenInfo = await this.tokenIns.info();
        return this.gameTokenInfo;
    }

    async getGameTokenUnit() {
        let amount = await this.contract.methods.gameTokenUnit().call();
        let tokenInfo = await this.getGameToken();
        return new BigNumber(amount).shiftedBy(-1 * tokenInfo.decimals).toFixed();
    }

    async getJoinAmount() {
        let amount = await this.contract.methods.joinAmount().call();
        let tokenInfo = await this.getGameToken();
        return new BigNumber(amount).shiftedBy(-1 * tokenInfo.decimals).toFixed();
    }

    async status() {
        return await this.contract.methods.status(user).call();
    }

    async join() {
        return await this.provider.executeContract(this.contract, 'join', 0, []);
    }
}

class GamePool extends BaseInstance {
    constructor(provider, address) {
        let abi = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"uint128","name":"orderId","type":"uint128"},{"indexed":false,"internalType":"uint128","name":"winAmount","type":"uint128"},{"indexed":false,"internalType":"uint128","name":"shareAmount","type":"uint128"}],"name":"Claimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_user","type":"address"},{"indexed":true,"internalType":"address","name":"_old","type":"address"},{"indexed":true,"internalType":"address","name":"_new","type":"address"}],"name":"ConfigChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"_old","type":"uint256"},{"indexed":true,"internalType":"uint256","name":"_new","type":"uint256"}],"name":"FeeRateChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint128","name":"value","type":"uint128"}],"name":"NewRound","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_user","type":"address"},{"indexed":true,"internalType":"address","name":"_old","type":"address"},{"indexed":true,"internalType":"address","name":"_new","type":"address"}],"name":"OwnerChanged","type":"event"},{"anonymous":false,"inputs":[],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[],"name":"Unpaused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"reward","type":"uint256"},{"indexed":false,"internalType":"address","name":"feeTo","type":"address"},{"indexed":false,"internalType":"uint256","name":"fee","type":"uint256"}],"name":"Withdrawed","type":"event"},{"inputs":[],"name":"admin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"buyToken","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint128","name":"_orderId","type":"uint128"}],"name":"canClaim","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"changeOwner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint128","name":"_orderId","type":"uint128"}],"name":"claim","outputs":[{"internalType":"uint128","name":"winAmount","type":"uint128"},{"internalType":"uint128","name":"shareAmount","type":"uint128"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint128","name":"_start","type":"uint128"},{"internalType":"uint128","name":"_end","type":"uint128"}],"name":"claimAll","outputs":[{"internalType":"uint128","name":"winAmount","type":"uint128"},{"internalType":"uint128","name":"shareAmount","type":"uint128"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint128","name":"_start","type":"uint128"},{"internalType":"uint128","name":"_end","type":"uint128"}],"name":"claimAllForZero","outputs":[{"internalType":"uint128","name":"winAmount","type":"uint128"},{"internalType":"uint128","name":"shareAmount","type":"uint128"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint128","name":"","type":"uint128"}],"name":"claimLogs","outputs":[{"internalType":"uint128","name":"orderId","type":"uint128"},{"internalType":"uint128","name":"claimedWin","type":"uint128"},{"internalType":"uint128","name":"claimedShareParticipationAmount","type":"uint128"},{"internalType":"uint128","name":"claimedShareTopAmount","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"config","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_rewardSource","type":"address"},{"internalType":"address","name":"_shareToken","type":"address"},{"internalType":"address","name":"_nextPool","type":"address"},{"internalType":"uint128","name":"_nextPoolRate","type":"uint128"},{"internalType":"uint64","name":"_epoch","type":"uint64"},{"internalType":"uint64","name":"_shareReleaseEpoch","type":"uint64"},{"internalType":"bool","name":"_isFromTicket","type":"bool"},{"internalType":"bool","name":"_enableRoundOrder","type":"bool"}],"name":"configure","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint128","name":"_round","type":"uint128"}],"name":"countRoundOrder","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"countUserOrder","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"dev","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"enableRoundOrder","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"epoch","outputs":[{"internalType":"uint64","name":"","type":"uint64"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"feeRate","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint128","name":"_orderId","type":"uint128"}],"name":"getOrderResult","outputs":[{"components":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint128","name":"orderId","type":"uint128"},{"internalType":"uint64","name":"roundNumber","type":"uint64"},{"internalType":"uint64","name":"startTime","type":"uint64"},{"internalType":"uint64","name":"rank","type":"uint64"},{"internalType":"uint64","name":"score","type":"uint64"},{"internalType":"uint128","name":"ticketAmount","type":"uint128"},{"internalType":"uint128","name":"claimedWin","type":"uint128"},{"internalType":"uint128","name":"claimedShareParticipationAmount","type":"uint128"},{"internalType":"uint128","name":"claimedShareTopAmount","type":"uint128"},{"internalType":"uint128","name":"claimWin","type":"uint128"},{"internalType":"uint128","name":"claimShareParticipationAmount","type":"uint128"},{"internalType":"uint128","name":"claimShareTopAmount","type":"uint128"},{"internalType":"uint128","name":"claimShareTopAvaliable","type":"uint128"}],"internalType":"struct GamePool.OrderResult","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint128","name":"_strategySn","type":"uint128"},{"internalType":"uint128","name":"_rank","type":"uint128"}],"name":"getRankTopRate","outputs":[{"internalType":"uint128","name":"rate","type":"uint128"},{"internalType":"uint128","name":"count","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTopEnd","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint128","name":"_sn","type":"uint128"}],"name":"getTopEndInStrategy","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint128","name":"_strategySn","type":"uint128"}],"name":"getTopRates","outputs":[{"components":[{"internalType":"uint128","name":"rate","type":"uint128"},{"internalType":"uint64","name":"start","type":"uint64"},{"internalType":"uint64","name":"end","type":"uint64"}],"internalType":"struct GamePool.TopRate[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint64","name":"","type":"uint64"}],"name":"historys","outputs":[{"internalType":"uint128","name":"ticketTotal","type":"uint128"},{"internalType":"uint128","name":"winTotal","type":"uint128"},{"internalType":"uint128","name":"rewardTotal","type":"uint128"},{"internalType":"uint128","name":"scoreTotal","type":"uint128"},{"internalType":"uint128","name":"topScoreTotal","type":"uint128"},{"internalType":"uint128","name":"topStrategySn","type":"uint128"},{"internalType":"uint128","name":"shareParticipationAmount","type":"uint128"},{"internalType":"uint128","name":"shareTopAmount","type":"uint128"},{"internalType":"uint64","name":"startTime","type":"uint64"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"isFromTicket","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint128","name":"_round","type":"uint128"},{"internalType":"uint128","name":"_start","type":"uint128"},{"internalType":"uint128","name":"_end","type":"uint128"}],"name":"iterateReverseRoundOrders","outputs":[{"components":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint128","name":"orderId","type":"uint128"},{"internalType":"uint64","name":"roundNumber","type":"uint64"},{"internalType":"uint64","name":"startTime","type":"uint64"},{"internalType":"uint64","name":"rank","type":"uint64"},{"internalType":"uint64","name":"score","type":"uint64"},{"internalType":"uint128","name":"ticketAmount","type":"uint128"},{"internalType":"uint128","name":"claimedWin","type":"uint128"},{"internalType":"uint128","name":"claimedShareParticipationAmount","type":"uint128"},{"internalType":"uint128","name":"claimedShareTopAmount","type":"uint128"},{"internalType":"uint128","name":"claimWin","type":"uint128"},{"internalType":"uint128","name":"claimShareParticipationAmount","type":"uint128"},{"internalType":"uint128","name":"claimShareTopAmount","type":"uint128"},{"internalType":"uint128","name":"claimShareTopAvaliable","type":"uint128"}],"internalType":"struct GamePool.OrderResult[]","name":"list","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"},{"internalType":"uint128","name":"_start","type":"uint128"},{"internalType":"uint128","name":"_end","type":"uint128"}],"name":"iterateReverseUserOrders","outputs":[{"components":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint128","name":"orderId","type":"uint128"},{"internalType":"uint64","name":"roundNumber","type":"uint64"},{"internalType":"uint64","name":"startTime","type":"uint64"},{"internalType":"uint64","name":"rank","type":"uint64"},{"internalType":"uint64","name":"score","type":"uint64"},{"internalType":"uint128","name":"ticketAmount","type":"uint128"},{"internalType":"uint128","name":"claimedWin","type":"uint128"},{"internalType":"uint128","name":"claimedShareParticipationAmount","type":"uint128"},{"internalType":"uint128","name":"claimedShareTopAmount","type":"uint128"},{"internalType":"uint128","name":"claimWin","type":"uint128"},{"internalType":"uint128","name":"claimShareParticipationAmount","type":"uint128"},{"internalType":"uint128","name":"claimShareTopAmount","type":"uint128"},{"internalType":"uint128","name":"claimShareTopAvaliable","type":"uint128"}],"internalType":"struct GamePool.OrderResult[]","name":"list","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nextPool","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nextPoolRate","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nextPoolTotal","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"orders","outputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint64","name":"roundNumber","type":"uint64"},{"internalType":"uint32","name":"rank","type":"uint32"},{"internalType":"uint32","name":"score","type":"uint32"},{"internalType":"uint128","name":"ticketAmount","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rewardSource","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint128","name":"","type":"uint128"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"roundOrders","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint128","name":"_rate","type":"uint128"}],"name":"setFeeRate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint128","name":"_nextPoolRate","type":"uint128"}],"name":"setNexPoolRate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint128","name":"_shareParticipationAmount","type":"uint128"},{"internalType":"uint128","name":"_shareTopAmount","type":"uint128"}],"name":"setShareAmount","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint128[]","name":"_levels","type":"uint128[]"},{"components":[{"internalType":"uint128","name":"rate","type":"uint128"},{"internalType":"uint64","name":"start","type":"uint64"},{"internalType":"uint64","name":"end","type":"uint64"}],"internalType":"struct GamePool.TopRate[]","name":"_values","type":"tuple[]"}],"name":"setTopRate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_config","type":"address"}],"name":"setupConfig","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"shareParticipationAmount","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"shareReleaseEpoch","outputs":[{"internalType":"uint64","name":"","type":"uint64"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"shareToken","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"shareTopAmount","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"team","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"tickets","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint128","name":"","type":"uint128"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"topStrategies","outputs":[{"internalType":"uint128","name":"rate","type":"uint128"},{"internalType":"uint64","name":"start","type":"uint64"},{"internalType":"uint64","name":"end","type":"uint64"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalRound","outputs":[{"internalType":"uint64","name":"","type":"uint64"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalTopStrategy","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint32","name":"rank","type":"uint32"},{"internalType":"uint32","name":"score","type":"uint32"},{"internalType":"uint128","name":"ticketAmount","type":"uint128"}],"internalType":"struct GamePool.PlayData[]","name":"datas","type":"tuple[]"}],"name":"uploadBatch","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint32","name":"rank","type":"uint32"},{"internalType":"uint32","name":"score","type":"uint32"},{"internalType":"uint128","name":"ticketAmount","type":"uint128"}],"internalType":"struct GamePool.PlayData","name":"data","type":"tuple"}],"name":"uploadOne","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint64","name":"_startTime","type":"uint64"},{"internalType":"uint128","name":"_ticketTotal","type":"uint128"},{"internalType":"uint128","name":"_scoreTotal","type":"uint128"},{"internalType":"uint128","name":"_topScoreTotal","type":"uint128"}],"name":"uploaded","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"uploader","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"userOrders","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint128","name":"","type":"uint128"}],"name":"userRoundOrderMap","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"withdraw","outputs":[{"internalType":"uint256","name":"reward","type":"uint256"},{"internalType":"uint256","name":"fee","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];
        super(provider, abi, address);
        this.buyTokenInfo = null;
        this.shareTokenInfo = null;
        this.info = null;
    }

    async getBuyToken() {
        if(this.buyTokenInfo) return this.buyTokenInfo;
        let token = await this.contract.methods.buyToken().call();
        this.tokenIns = new ERC20Token(this.provider, token);
        this.buyTokenInfo = await this.tokenIns.info();
        return this.buyTokenInfo;
    }

    async getShareToken() {
        if(this.shareTokenInfo) return this.shareTokenInfo;
        let token = await this.contract.methods.shareToken().call();
        this.tokenIns = new ERC20Token(this.provider, token);
        this.shareTokenInfo = await this.tokenIns.info();
        return this.shareTokenInfo;
    }

    async getTicket(user) {
        let amount = await this.contract.methods.tickets(user).call();
        let tokenInfo = await this.getBuyToken();
        return new BigNumber(amount).shiftedBy(-1 * tokenInfo.decimals).toFixed();
    }

    async getInfo() {
        // if(this.info) return this.info;
        this.info = {
            buyToken: await this.getBuyToken(),
            shareToken: await this.getShareToken(),
            nextPool: await this.contract.methods.nextPool().call(),
            nextPoolRate: await this.contract.methods.nextPoolRate().call(),
            epoch: await this.contract.methods.epoch().call(),
            shareReleaseEpoch: await this.contract.methods.shareReleaseEpoch().call(),
            isFromTicket: await this.contract.methods.isFromTicket().call(),
            totalRound: await this.contract.methods.totalRound().call(),
            shareParticipationAmount: await this.contract.methods.shareParticipationAmount().call(),
            shareTopAmount: await this.contract.methods.shareTopAmount().call(),
            topEnd: await this.getTopEnd()
        }
        this.info.shareParticipationAmount = new BigNumber(this.info.shareParticipationAmount).shiftedBy(-1* this.info.shareToken.decimals).toFixed();
        this.info.shareTopAmount = new BigNumber(this.info.shareTopAmount).shiftedBy(-1* this.info.shareToken.decimals).toFixed();
        return this.info;
    }

    async countUserOrder(user) {
        if(!user) {
            user = this.provider.account;
        }
        console.log('countUserOrder user:', user);
        return await this.contract.methods.countUserOrder(user).call();
    }

    async epoch() {
        return await this.contract.methods.epoch().call();
    }

    async totalRound() {
        return await this.contract.methods.totalRound().call();
    }

    async historys(roundId) {
        return await this.contract.methods.historys(roundId).call();
    }

    async getTopEnd() {
        return await this.contract.methods.getTopEnd().call();
    }

    async getTopRates(sn) {
        let res = await this.contract.methods.getTopRates(sn).call();
        let _list = res.map((item,index) => ({
            level: index,
            rate: item.rate,
            start: item.start,
            end: item.end
        }))
        _list.splice(0,1);
        return _list
    }

    async getLatestTopRates() {
        let sn = await this.contract.methods.totalTopStrategy().call();
        return await this.getTopRates(sn);
    }

    async getBalance() {
        await this.getBuyToken();
        let balance = await this.contract.methods.getBalance().call();
        return new BigNumber(balance).shiftedBy(-1 * this.buyTokenInfo.decimals).toFixed()
    }

    async getRewardSourceBalance() {
        let rewardSource = await this.contract.methods.rewardSource().call();
        let sourceIns = new GamePool(this.provider, rewardSource);
        return await sourceIns.getBalance();
    }

    async getFeeRate() {
        let rate = await this.contract.methods.feeRate().call();
        if(rate != '0') {
            return new BigNumber(rate).dividedBy(10000).toFixed();
        }
        return rate;
    }

    async iterateReverseUserOrders(start, end, user) {
        if(!user) {
            user = this.provider.account;
        }
        let count = await this.countUserOrder(user);
        count = Number(count);
        if(end > count) {
            end = count;
        }
        let data = [];
        if(count == 0) {
            return data;
        }
        let feeRate = await this.getFeeRate();
        await this.getBuyToken();
        await this.getShareToken();
        let res = await this.contract.methods.iterateReverseUserOrders(user, start, end).call();
        if(res && res.length > 0) {
            for(let i = 0; i < res.length; i++) {
                let d = {...res[i]};
                d.buyTokenSymbol = this.buyTokenInfo.symbol;
                d.shareTokenSymbol = this.shareTokenInfo.symbol;
                d.ticketAmount = new BigNumber(d.ticketAmount).shiftedBy(-1 * this.buyTokenInfo.decimals).toFixed();
                d.claimedWin = new BigNumber(d.claimedWin).shiftedBy(-1 * this.buyTokenInfo.decimals).toFixed();
                d.claimedShareParticipationAmount = new BigNumber(d.claimedShareParticipationAmount).shiftedBy(-1 * this.shareTokenInfo.decimals).toFixed();
                d.claimedShareTopAmount = new BigNumber(d.claimedShareTopAmount).shiftedBy(-1 * this.shareTokenInfo.decimals).toFixed();
                d.claimWin = new BigNumber(d.claimWin).shiftedBy(-1 * this.buyTokenInfo.decimals).toFixed();
                d.claimWinAvaliable = new BigNumber(d.claimWin).minus(d.claimedWin).toFixed();
                d.claimShareParticipationAmount = new BigNumber(d.claimShareParticipationAmount).shiftedBy(-1 * this.shareTokenInfo.decimals).toFixed();
                d.claimShareParticipationAvaliable = new BigNumber(d.claimShareParticipationAmount).minus(d.claimedShareParticipationAmount).toFixed();
                d.claimShareTopAmount = new BigNumber(d.claimShareTopAmount).shiftedBy(-1 * this.shareTokenInfo.decimals).toFixed();
                d.claimShareTopAvaliable = new BigNumber(d.claimShareTopAvaliable).shiftedBy(-1 * this.shareTokenInfo.decimals).toFixed();
                d.claimShareTopLock = new BigNumber(d.claimShareTopAmount).minus(d.claimedShareTopAmount).minus(d.claimShareTopAvaliable).toFixed();
                d.feeRate = feeRate;
                data.push(d);
            }
        }

        return data;
    }

    async countRoundOrder(round) {
        return await this.contract.methods.countRoundOrder(round).call();
    }

    async iterateReverseRoundOrders(round, start, end) {
        let count = await this.countRoundOrder(round);
        count = Number(count);
        if(end > count) {
            end = count;
        }
        let data = [];
        if(count == 0) {
            return data;
        }
        await this.getBuyToken();
        await this.getShareToken();
        let res = await this.contract.methods.iterateReverseRoundOrders(round, start, end).call();
        if(res && res.length > 0) {
            for(let i = 0; i < res.length; i++) {
                let d = {...res[i]};
                d.buyTokenSymbol = this.buyTokenInfo.symbol;
                d.shareTokenSymbol = this.shareTokenInfo.symbol;
                d.ticketAmount = new BigNumber(d.ticketAmount).shiftedBy(-1 * this.buyTokenInfo.decimals).toFixed();
                d.claimedWin = new BigNumber(d.claimedWin).shiftedBy(-1 * this.buyTokenInfo.decimals).toFixed();
                d.claimedShareParticipationAmount = new BigNumber(d.claimedShareParticipationAmount).shiftedBy(-1 * this.shareTokenInfo.decimals).toFixed();
                d.claimedShareTopAmount = new BigNumber(d.claimedShareTopAmount).shiftedBy(-1 * this.shareTokenInfo.decimals).toFixed();
                d.claimWin = new BigNumber(d.claimWin).shiftedBy(-1 * this.buyTokenInfo.decimals).toFixed();
                d.claimWinAvaliable = new BigNumber(d.claimWin).minus(d.claimedWin).toFixed();
                d.claimShareParticipationAmount = new BigNumber(d.claimShareParticipationAmount).shiftedBy(-1 * this.shareTokenInfo.decimals).toFixed();
                d.claimShareParticipationAvaliable = new BigNumber(d.claimShareParticipationAmount).minus(d.claimedShareParticipationAmount).toFixed();
                d.claimShareTopAmount = new BigNumber(d.claimShareTopAmount).shiftedBy(-1 * this.shareTokenInfo.decimals).toFixed();
                d.claimShareTopAvaliable = new BigNumber(d.claimShareTopAvaliable).shiftedBy(-1 * this.shareTokenInfo.decimals).toFixed();
                d.claimShareTopLock = new BigNumber(d.claimShareTopAmount).minus(d.claimedShareTopAmount).minus(d.claimShareTopAvaliable).toFixed();
                data.push(d);
            }
        }

        return data;
    }

    async claim(orderId) {
        return await this.provider.executeContract(this.contract, 'claim', 0, [orderId]);
    }

    async claimAll(_start, _end) {
        return await this.provider.executeContract(this.contract, 'claimAll', 0, [_start, _end]);
    }

    async setNexPoolRate(_nextPoolRate) {
        return await this.provider.executeContract(this.contract, 'setNexPoolRate', 0, [_nextPoolRate]);
    }

    async setShareAmount(_shareParticipationAmount, _shareTopAmount) {
        await this.getShareToken();
        _shareParticipationAmount = new BigNumber(_shareParticipationAmount).shiftedBy(1 * this.shareTokenInfo.decimals).toFixed();
        _shareTopAmount = new BigNumber(_shareTopAmount).shiftedBy(1 * this.shareTokenInfo.decimals).toFixed();
        return await this.provider.executeContract(this.contract, 'setShareAmount', 0, [_shareParticipationAmount, _shareTopAmount]);
    }

    async setTopRate(param) {
        let _levels=[], _values=[];
        for(let i=0; i<param.length; i++) {
            _levels.push(param[i].level);
            let values = [param[i].rate, param[i].start, param[i].end];
            _values.push(values);
        }

        return await this.provider.executeContract(this.contract, 'setTopRate', 0, [_levels, _values]);
    }

    async uploadOne(user, rank, ticketAmount, score) {
        await this.getBuyToken()
        ticketAmount = new BigNumber(ticketAmount).shiftedBy(1 * this.buyTokenInfo.decimals).toFixed()
        let param = {
            user, rank, score, ticketAmount
        }
        return await this.provider.executeContract(this.contract, 'uploadOne', 0, [param]);
    }

    async uploadBatch(params) {
        await this.getBuyToken();
        for(let i=0; i<params.length; i++) {
            params[i].ticketAmount = new BigNumber(params[i].ticketAmount).shiftedBy(1 * this.buyTokenInfo.decimals).toFixed();
        }
        return await this.provider.executeContract(this.contract, 'uploadBatch', 0, [params]);
    }

    async uploaded(_startTime, _ticketTotal, _scoreTotal, _topScoreTotal) {
        await this.getBuyToken();
        _ticketTotal = new BigNumber(_ticketTotal).shiftedBy(1 * this.buyTokenInfo.decimals).toFixed();
        return await this.provider.executeContract(this.contract, 'uploaded', 0, [_startTime, _ticketTotal, _scoreTotal, _topScoreTotal]);
    }
}


class GameTeam extends BaseByName {
    constructor(provider) {
        let abi = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_user","type":"address"},{"indexed":true,"internalType":"address","name":"_old","type":"address"},{"indexed":true,"internalType":"address","name":"_new","type":"address"}],"name":"ConfigChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_user","type":"address"},{"indexed":true,"internalType":"address","name":"_old","type":"address"},{"indexed":true,"internalType":"address","name":"_new","type":"address"}],"name":"OwnerChanged","type":"event"},{"inputs":[],"name":"admin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"changeOwner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"config","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"countUser","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"dev","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"foundUser","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getUserRates","outputs":[{"components":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"rate","type":"uint256"}],"internalType":"struct GameTeam.UserRate[]","name":"list","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_shareToken","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"rates","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address[]","name":"_users","type":"address[]"},{"internalType":"uint256[]","name":"_values","type":"uint256[]"}],"name":"setRate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_config","type":"address"}],"name":"setupConfig","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"shareToken","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"team","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"uploader","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"users","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}];
        super(provider, abi, 'GameTeam');
        this.shareTokenInfo = null;
        this.withdrawShareTokenBalance = 0;
    }

    async getShareToken() {
        if(this.shareTokenInfo) return this.shareTokenInfo;
        let token = await this.contract.methods.shareToken().call();
        this.tokenIns = new ERC20Token(this.provider, token);
        this.withdrawShareTokenBalance = await new ERC20Token(this.provider, token).balanceOf(this.address);
        this.shareTokenInfo = await this.tokenIns.info();
        return this.shareTokenInfo;
    }

    async getUserRates(){
        return await this.contract.methods.getUserRates().call();
    }

    async getShareTokenBalance() {
        await this.getShareToken();
        return {
            balance: this.withdrawShareTokenBalance,
            ...this.shareTokenInfo
        }
    }

    async setRate(params){
        let _user=[], _values=[];
        params.forEach(item => {
            _user.push(item.user)
            _values.push(item.rate)
        })
        return await this.provider.executeContract(this.contract, 'setRate', 0, [_user, _values]);
    }

    async withdraw() {
        await this.getShareToken();
        const _amount = new BigNumber(this.withdrawShareTokenBalance).shiftedBy(1 * this.shareTokenInfo.decimals).toFixed();
        console.log(_amount, this.withdrawShareTokenBalance)
        return await this.provider.executeContract(this.contract, 'withdraw', 0, [_amount]);
    }
}

class GameAirdrop extends BaseByName {
    constructor(provider) {
        let abi = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Claim","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_user","type":"address"},{"indexed":true,"internalType":"address","name":"_old","type":"address"},{"indexed":true,"internalType":"address","name":"_new","type":"address"}],"name":"ConfigChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_user","type":"address"},{"indexed":true,"internalType":"address","name":"_old","type":"address"},{"indexed":true,"internalType":"address","name":"_new","type":"address"}],"name":"OwnerChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"admin","type":"address"},{"indexed":false,"internalType":"uint256","name":"oldStart","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"oldEnd","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newStart","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newEnd","type":"uint256"}],"name":"SetTime","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"admin","type":"address"},{"indexed":false,"internalType":"address","name":"oldOne","type":"address"},{"indexed":false,"internalType":"address","name":"newOne","type":"address"}],"name":"SetToken","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"admin","type":"address"},{"indexed":false,"internalType":"uint256","name":"oldOne","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newOne","type":"uint256"}],"name":"SetTotal","type":"event"},{"inputs":[],"name":"admin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"allowanceList","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"balance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address[]","name":"_users","type":"address[]"},{"internalType":"uint256[]","name":"_values","type":"uint256[]"}],"name":"batchSetAllowanceList","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"_users","type":"address[]"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"batchSetAllowanceListSame","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"changeOwner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"claimed","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"claimedCount","outputs":[{"internalType":"uint256","name":"count","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"config","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"dev","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"endTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_total","type":"uint256"},{"internalType":"uint256","name":"_startTime","type":"uint256"},{"internalType":"uint256","name":"_endTime","type":"uint256"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"setAllowanceList","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_startTime","type":"uint256"},{"internalType":"uint256","name":"_endTime","type":"uint256"}],"name":"setTime","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_token","type":"address"}],"name":"setToken","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_total","type":"uint256"}],"name":"setTotal","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_config","type":"address"}],"name":"setupConfig","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"startTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"team","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"total","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"uploader","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}]
        super(provider, abi, 'GameAirdrop');
        this.tokenInfo = null;
    }

    async getTokenInfo() {
        if (this.tokenInfo) return this.tokenInfo;
        let token = await this.contract.methods.token().call();
        let tokenIns = new ERC20Token(this.provider, token);
        this.tokenInfo = await tokenIns.info();
        return this.tokenInfo;
    }

    async getAirdopInfo() {
        let tokenInfo = await this.getTokenInfo();
        return {
            tokenSymbol: tokenInfo.symbol,
            tokenDecimals: tokenInfo.decimals,
            total: await this.contract.methods.total().call(),
            balance: await this.contract.methods.balance().call(),
            startTime: await this.contract.methods.startTime().call(),
            endTime: await this.contract.methods.endTime().call(),
            cliamedCount: await this.contract.methods.claimedCount().call()
        }
    }

    async getAmount(user) {
        let claimed = await this.contract.methods.claimed(user).call();
        if (claimed) return 0;
        let allowance = await this.contract.methods.allowanceList(user).call();
        let tokenInfo = await this.getTokenInfo()
        return new BigNumber(allowance).shiftedBy(-1 * tokenInfo.decimals).toFixed();
    }

    async setToken(token) {
        return await this.provider.executeContract(this.contract, 'setToken', 0, [token])
    } 

    async setTotal(total) {
        let tokenInfo = await this.getTokenInfo()
        return await this.provider.executeContract(this.contract, 'setTotal', 0, [new BigNumber(total).shiftedBy(1 * tokenInfo.decimals)])
    } 

    async setTime(start, end) {
        return await this.provider.executeContract(this.contract, 'setTime', 0, [new BigNumber(start), new BigNumber(end)])
    }

    async batchSetAllowanceList(users, values) {
        let tokenInfo = await this.getTokenInfo()
        let amounts = []
        for (let i = 0; i < users.length; i++) {
            let _old = await this.getAmount(users[i]);
            let _new = new BigNumber(values[i]);
            let _amount = new BigNumber(_old).plus(_new);
            // console.log('item:', users[i], _amount.toFixed());
            amounts.push(_amount.shiftedBy(1 * tokenInfo.decimals).toFixed(0));
        }
        // console.log('batchSetAllowanceList:', users, amounts);
        return await this.provider.executeContract(this.contract, 'batchSetAllowanceList', 0, [users, amounts])
    }

    async claim() {
        return await this.provider.executeContract(this.contract, 'claim', 0, [])
    }
}


export { ERC20Token, _GameTicket, GameTicket, GameTicket2, GamePool, GameTeam, GameAirdrop }
