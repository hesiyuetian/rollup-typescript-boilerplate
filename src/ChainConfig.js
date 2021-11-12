const CHAIN_RPC = {
    1: 'https://mainnet.infura.io/v3/0e47785118b2494092b1a9a9b576c2bd',
    42: 'https://kovan.infura.io/v3/0e47785118b2494092b1a9a9b576c2bd',
    56: 'https://bsc-dataseed.binance.org',
    97: 'https://data-seed-prebsc-1-s3.binance.org:8545/',
    128: 'https://http-mainnet.hecochain.com',
    137: "https://matic-mainnet-full-rpc.bwarelabs.com",
    256: 'https://http-testnet.hecochain.com',
    80001: 'https://matic-mumbai.chainstacklabs.com',
    421611: 'https://rinkeby.arbitrum.io/rpc',
    42161: 'https://arb1.arbitrum.io/rpc',
};

const CHAIN_BROWSER = {
    1: "https://etherscan.io",
    42: "https://kovan.etherscan.io",
    56: "https://bscscan.com",
    97: "https://testnet.bscscan.com",
    128: "https://hecoinfo.com",
    137: "https://polygonscan.com",
    256: "https://testnet.hecoinfo.com",
    80001: "https://mumbai.polygonscan.com",
    421611: 'https://rinkeby-explorer.arbitrum.io',
    42161: 'https://arbiscan.io',
}

const CHAIN_NAME = {
    1: "Ethereum Chain Mainnet",
    42: "Ethereum Chain Kovan",
    56: "Binance Smart Chain Mainnet",
    97: "Binance Smart Chain Testnet",
    128: "HECO Chain Mainnet",
    137: "Matic Chain Mainnet",
    256: "HECO Chain Testnet",
    80001: "Matic Chain Testnet",
    421611: 'Arbitrum Chain Testnet',
    42161: 'Arbitrum Chain Mainnet',
}


const ContractsAddr = {
    56: {
        BuyToken: "0x55d398326f99059fF775485246999027B3197955",
        GameToken: "0xD9124604B5dC6EEC0e75d5B02f1610C7bA734cC1",
        GameConfig: "0x4Ef1Fee888a517293F6b43af38C85D9314BFB2ce",
        GameTicket: "0xADA799c67fC43c020c05c29E4304eB17273168c7",
        GamePool1: "0x6990d5EEeA2D095D7B0EAE32f2fd23862a5d2581",
        GamePool7: "0x185dd26Ba1fB28D1A0cD056A99f95351eBd9DF8d",
        GamePool30: "0x4b163a5B6Cba132459e3daBE341Bb7f98671eC24",
        GamePoolCS: "0x9E3Fc6A5Bba3Ae0F13D523ecB2151E2E8Fdd381A",
        GameTeam: "0x93bBf415c37dcd9C1a219b27a1bD4247d452533b",
        GameAirdrop: "",
    },
    97: {
        BuyToken: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
        GameToken: "0x9505D2C9a5CF3977a33babC55E3582607E877D15",
        GameConfig: "0x2575e5cC3992b90DC9866E99B0F85c4CF090d818",
        GameTicket: "0x0a415B25140F6b06e94Db0A56E2b92484752B4e0",
        GamePool1: "0xd8aF74F506CA4912d8a9AC50E9DeAF92379F98f9",
        GamePool7: "0x6f64b85Dbc5887bEBD19D287A7446Ec0570818B3",
        GamePool30: "0x805F3C007f17f5391fdCeA59BFe8CEED7A812742",
        GamePoolCS: "0x07833F4E593571A20e1a6bCFB5131479aE146CC1",
        GameTeam: "0xbf4645239b0efF34d26e6C8646Ca85e7FD4F6390",
        GameAirdrop: "0x5d972EB458975b5c7c3f1134be7DFB349E519736",
        GameTicket2 : "0xf99cd27065AE5b955Ab8c59D3Cb09cDAd8293950",
        GamePool21 : "0x341e301A69312FFB9D8C0098f41a2139186Fb93E",
        GamePool27 : "0x9Fc0ca1ea0ed399CcFB1bB43709808F7C63da141",
        GamePool230 : "0xacA013327f3554e639F97d947e6e468D7d1119aA",
        GamePool2CS : "0x3FA08B84072679C2d1A7BBC301aa2B19E0fcc20b",
    }
}

const ChainSymbol = {
    WToken: {
        1: "WETH",
        42: "WETH",
        56: "WBNB",
        97: "WBNB",
        128: "WHT",
        256: "WHT",
        137: "WMATIC",
        80001: "WMATIC",
        421611: "WETH",
        42161: "WETH",
    },
    ZeroToken: {
        1: "ETH",
        42: "ETH-T",
        56: "BNB",
        97: "BNB-T",
        128: "HT",
        256: "HT-T",
        137: "MATIC",
        80001: "MATIC",
        421611: "ETH",
        42161: "ETH-T",
    }
}

export { CHAIN_RPC, CHAIN_BROWSER, CHAIN_NAME, ContractsAddr, ChainSymbol };
