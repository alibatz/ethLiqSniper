import { ethers } from "ethers";
import fs from 'fs';

// This is the information which comes with the paircreated event on the UniswapV2 factory
export interface pairCreatedInfoV2 {
    token0: string,
    token1: string,
    pair: string
}

// check options for the program, must be interpreted by the code to know what to check
export let checkConditions = {
    checkOpenSource: true,
    maxBuyTax: .25, // in percent
    maxSellTax: .25, // in percent,
    checkIsMintable: true,
    maxTop10Holders: .15, // in percent
    checkIsHoneypot: true,
    checkLpLocked: true,
    checkOwnerCanChangeBalance: true,
    checkHiddenOwner: true,
    checkCannotSellAll: true,
    checkModifiableTax: true,
    checkPausableTransfer: true,
    checkIsProxy: true,
    checkCanTakeBackOwnerShip: true
};

// corresponding option - check functions, see note in sniper file

export type conditionToFunctionObject = {
    [K in keyof typeof checkConditions]: (condition: typeof checkConditions[K], report: goPlusResponse, tokenAddress: string) => boolean;
}



// Handle contract abi and addresses here so it's more readable when I have to initialize
// them in the sniper file.

export function initUniswapFactoryV2(runner: ethers.ContractRunner) {
    const contractAddress = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
    const abi = [
        'event PairCreated(address indexed token0, address indexed token1, address pair, uint)',
        `function getPair(address tokenA, address tokenB) external view returns (address pair)`
    ];
    return new ethers.Contract(contractAddress, abi, runner);
};

export function initUniswapV2Pair(runner: ethers.ContractRunner, address: string) {
    const abi = [
        `function token0() external view returns (address)`,
        `function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)`
    ]
    return new ethers.Contract(address, abi, runner);
}

/**
 * 
 * @param runner the contract runner, probably a wallet
 * @returns an interface to interact with the UniswapV2Router02 contract 
 */
export function initUniswapRouterV2(runner: ethers.Signer) {
    const contractAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
    const abi = [
        `function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
            external
            payable
            returns (uint[] memory amounts)`,
        `function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)`,
        `function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
            external
            returns (uint[] memory amounts)`,
    ];
    return new ethers.Contract(contractAddress, abi, runner);
};


export interface goPlusResponse {
    /** Should be 1 */
    code: number,
    /** Should be OK */
    message: string,
    /** The "meat" of the response; contains all the info */
    result: {
        /** Property key is token address */
        [contractAddress: string]: {
            /** Describes whether the contract has the function to modify the max amt of tokens or max token position */
            anti_whale_modifiable?: "0" | "1",
            /** Expressed out of 1 */
            buy_tax?: string, // expressed out of 100 or 1? 1
            /** Describes whether the contract can take back ownership */
            can_take_back_ownership?: "0" | "1",
            /** Describes whether the contract cannot sell all tokens */
            cannot_sell_all?: "0" | "1",
            /** The address of the contract creator */
            creator_address: string,
            /** The percentage of tokens owned by the creator */
            creator_percent: string,
            /** The liquidity information for different DEXs */
            dex: [{
                /** The name of the DEX */
                name: string,
                /** The liquidity in USD */
                liquidity: string, // in usd
                /** The pair address */
                pair?: string
            }],
            /** Describes whether the contract calls functions of other contract when primary methods are executed */
            external_call?: string,
            /** Describes whether the contract has a hidden owner */
            hidden_owner?: "0" | "1",
            /** The number of token holders */
            holder_count: string,
            /** The list of top 10 token holders */
            holders: [{
                /** The address of the holder */
                address: string,
                /** The balance of the holder */
                balance: string,
                /** Indicates if the holder is a contract */
                is_contract: number,
                /** Indicates if the holder is locked */
                is_locked: number,
                /** The details of the locked tokens */
                locked_detail: [{
                    /** The amount of locked tokens */
                    amount: string,
                    /** The unlock time */
                    end_time: string,
                    /** The time when it was locked */
                    opt_time: string
                }],
                /** The percentage of tokens owned by the holder */
                percent: string,
                /** The tag of the holder */
                tag: string
            }],
            /** The number of honeypots launched by the creator */
            honeypot_with_same_creator: string,
            /** Describes whether the contract is an airdrop scam */
            is_airdrop_scam?: "0" | "1",
            /** Describes whether the contract can limit the max amount of transactions or max token position for a single address */
            is_anti_whale?: "0" | "1",
            /** Describes whether the contract has a blacklist function, which can stop certain users from buying/selling */
            is_blacklisted?: "0" | "1",
            /** Describes whether the contract is a honeypot, or contains malicious code */
            is_honeypot?: "0" | "1",
            /** Describes whether the token is listed in a DEX */
            is_in_dex: "0" | "1",
            /** Describes whether the contract has a mint function */
            is_mintable?: "0" | "1",
            /** Describes whether the contract is open source */
            is_open_source: "0" | "1",
            /** Describes whether the contract has a proxy contract */
            is_proxy?: "0" | "1",
            /** Describes whether the token is a true token */
            is_true_token?: "0" | "1",
            /** Describes whether the token has whitelist function, which can allow certain users to buy/sell while others don't */
            is_whitelisted?: "0" | "1",
            /** Top 10 LP token holders */
            lp_holders: [{
                /** The address of the LP holder */
                address: string,
                /** The balance of the LP holder */
                balance: string,
                /** Indicates if the LP holder is a contract */
                is_contract: number,
                /** Indicates if the LP holder is locked */
                is_locked: number,
                /** The details of the locked LP tokens */
                locked_detail: [{
                    /** The amount of locked LP tokens */
                    amount: string,
                    /** The unlock time */
                    end_time: string,
                    /** The time when it was locked */
                    opt_time: string
                }],
                /** The percentage of LP tokens owned by the holder */
                percent: string,
                /** The tag of the LP holder */
                tag: string
            }],
            /** The total supply of LP tokens */
            lp_total_supply?: string,
            /** Additional notes */
            note?: string,
            /** Other potential risks */
            other_potential_risks?: string,
            /** The address of the contract owner */
            owner_address: string,
            /** The balance of the contract owner */
            owner_balance?: string,
            /** Describes whether the owner can change the balance of a token holder */
            owner_change_balance?: "0" | "1",
            /** The percentage of tokens owned by the owner */
            owner_percent?: string,
            /** Describes whether contract can set a different tax rate for each address */
            personal_slippage_modifiable?: "0" | "1",
            /** Describes whether the contract can self-destruct */
            selfdestruct?: "0" | "1",
            /** The sell tax expressed out of 1 */
            sell_tax?: string,
            /** Describes whether the trading tax is modifiable by the contract */
            slippage_modifiable?: "0" | "1",
            /** The name of the token */
            token_name: string,
            /** The symbol of the token */
            token_symbol: string,
            /** The total supply of tokens */
            total_supply: string,
            /** Describes whether there is a trading cooldown */
            trading_cooldown?: "0" | "1",
            /** Describes whether the transfer is pausable */
            transfer_pausable?: "0" | "1",
            /** Describes whether the token is on goPlus' Trusted list, I will probably never use this since we are sniping newly created pairs */
            trust_list?: "0" | "1"
        }
    }
}




// Any additional options which do not fit into the previous categories:
export let sniperOptions = {
    buyAmount: 0.001, // in eth
    takeProfit: 2,
    moonbag: 0.10,
    stopLoss: 0.25
}