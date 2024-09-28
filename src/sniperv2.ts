import { BigNumberish, ethers, FixedNumber, toBigInt } from "ethers";
import { initUniswapFactoryV2, initUniswapRouterV2, conditionToFunctionObject, checkConditions, goPlusResponse, sniperOptions, initUniswapV2Pair } from "./types";

// Infura provider and wallet signer




// UniswapV2 factory and router contracts

const WETHAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

export class ethSniperV2 {
    // Infura provider and wallet signer
    Provider: ethers.Provider;
    WalletSigner: ethers.Wallet;

    // UniswapV2 factory and router contracts
    uniswapFactoryV2: ethers.Contract;
    uniswapRouterV2: ethers.Contract;


    // I have some properties in the token safety analysis returned by go+
    // However, the way I express the things I want to check in this report don't exactly
    // match with the go+ one
    // For example, if I say "contractVerified: true", I want to run code to make sure it is 
    // true. If its false, I don't want to run any code at all
    // If I have a "maxbuytax: n", I want to make sure the buytax property is below that 
    // number. I can assign different functions for each property to be called, taking in 
    // the condition from my options(true/false, number) and checking that against the go+
    // response. Then, while performing the token check during the snipe, i can loop through
    // my optns object properties, calling the corresponding function found under the same
    // name and passing in the given condition

    buyAmount = sniperOptions.buyAmount;

    constructor(provider: ethers.Provider, wallet: ethers.Wallet) {
        this.Provider = provider;
        this.WalletSigner = wallet;
        this.Provider.getBlockNumber().then((blockNumber) => {
            console.log('Connected to Ethereum blockchain');
            console.log(`Current block number: ${blockNumber}`);
        });
        this.uniswapFactoryV2 = initUniswapFactoryV2(this.Provider);
        this.uniswapRouterV2 = initUniswapRouterV2(this.WalletSigner);
    }

    static checkFunctions: conditionToFunctionObject = {
        checkOpenSource: (check: boolean, report: goPlusResponse, tokenAddress: string) => {
            // Check if the token is open source
            // If the token is open source, return true
            // If the token is not open source, return false
            if (check === true) {
                return report.result[tokenAddress].is_open_source === "1";
            } else {
                return true;
            }
        },
        maxBuyTax: (maxTax: number, report: goPlusResponse, tokenAddress: string) => {
            // Check if the buy tax is below the given condition
            // If the buy tax is below the given condition, return true
            // If the buy tax is above the given condition, return false
            let buyTax = report.result[tokenAddress]?.buy_tax;
            return typeof buyTax === "string" && parseInt(buyTax) < maxTax;
        },
        maxSellTax: (maxTax: number, report: goPlusResponse, tokenAddress: string) => {
            // Check if the sell tax is below the given condition
            // If the sell tax is below the given condition, return true
            // If the sell tax is above the given condition, return false
            let sellTax = report.result[tokenAddress]?.sell_tax;
            return typeof sellTax === "string" && parseInt(sellTax) < maxTax;

        },
        checkIsMintable: (check: boolean, report: goPlusResponse, tokenAddress: string) => {
            // Check if the token is mintable
            // If the token is mintable, return true
            // If the token is not mintable, return false
            if (check === true) {
                return report.result[tokenAddress]?.is_mintable === "0"
            } else {
                return true;
            }
        },
        maxTop10Holders: (maxHoldings: number, report: goPlusResponse, tokenAddress: string) => {
            // Check if the top 10 holders own less than the given condition
            // If the top 10 holders own less than the given condition, return true
            // If the top 10 holders own more than the given condition, return false
            if (maxHoldings === 101) {
                return true;
            } else {
                let topTenHoldingPercentage = 0;
                for (let holder of report.result[tokenAddress].holders) {
                    topTenHoldingPercentage += (parseInt(holder.percent) * 100);
                }
                return topTenHoldingPercentage <= maxHoldings;
            }
        },
        checkIsHoneypot: (check: boolean, report: goPlusResponse, tokenAddress: string) => {
            // Check if the token is a honeypot
            // If the token is a honeypot, return false
            // If the token is not a honeypot, return true
            if (!check) {
                return true;
            } else {
                return report.result[tokenAddress]?.is_honeypot === "0"
            }
        },
        checkLpLocked: (check: boolean, report: goPlusResponse, tokenAddress: string) => {
            // Check if the liquidity is locked
            // If the liquidity is locked, return true
            // If the liquidity is not locked, return false
            if (!check) {
                return true;
            } else {
                for (let lpHolder of report.result[tokenAddress].lp_holders) {
                    if (!lpHolder.is_locked) {
                        return false
                    }
                }
                // ATP, the top 10 (there's probably only 1) LP holders are locked, so:
                return true;
            }
        },
        checkOwnerCanChangeBalance: (check: boolean, report: goPlusResponse, tokenAddress: string) => {
            // Check if the owner can change the balance
            // If the owner can change the balance, return false
            // If the owner cannot change the balance, return true
            if (!check) {
                return true;
            } else {
                return report.result[tokenAddress]?.owner_change_balance === "0"
            }
        },
        checkHiddenOwner: (check: boolean, report: goPlusResponse, tokenAddress: string) => {
            // Check if the owner is hidden
            // If the owner is hidden, return false
            // If the owner is not hidden, return true
            if (!check) {
                return true;
            } else {
                return report.result[tokenAddress]?.hidden_owner === "0";
            }
        },
        checkCannotSellAll: (check: boolean, report: goPlusResponse, tokenAddress: string) => {
            if (!check) {
                return true;
            } else {
                return report.result[tokenAddress]?.cannot_sell_all === "0";
            }
        },
        checkModifiableTax(check: boolean, report: goPlusResponse, tokenAddress: string) {
            if (!check) {
                return true;
            } else {
                return report.result[tokenAddress]?.slippage_modifiable === "0";
            }
        },
        checkPausableTransfer(check: boolean, report: goPlusResponse, tokenAddress: string) {
            if (!check) {
                return true;
            } else {
                return report.result[tokenAddress]?.transfer_pausable === "0";
            }
        },
        checkIsProxy(check: boolean, report: goPlusResponse, tokenAddress: string) {
            if (!check) {
                return true;
            } else {
                return report.result[tokenAddress]?.is_proxy === "0";
            }
        },
        checkCanTakeBackOwnerShip(check: boolean, report: goPlusResponse, tokenAddress: string) {
            if (!check) {
                return true;
            } else {
                return report.result[tokenAddress]?.can_take_back_ownership === "0";
            }
        }
    }

    async buyToken(tokenAddress: string) { // returns promise of swapExactETHForTokens call, 
        // Buy token amount from the router
        let blockTime = (await this.Provider.getBlock(await this.Provider.getBlockNumber()))?.timestamp;
        return this.uniswapRouterV2.swapExactETHForTokens(
            0,
            [WETHAddress, tokenAddress],
            this.WalletSigner.address,
            blockTime ? blockTime + 14 : 13, // revert after the next block is mined or in 12 seconds
            { value: this.buyAmount }
        );
    };

    async sellToken(tokenAddress: string, sellAmount: BigNumberish) { // returns promise of swapExactTokensForETH call
        // Sell token amount to the router
        return this.uniswapRouterV2.swapExactTokensForETH(
            sellAmount,
            0,
            [tokenAddress, WETHAddress],
            this.WalletSigner.address,
            Date.now() + 1000 * 30, // 30 seconds deadline
        );
    };

    isGoPlusResponse(obj: any): obj is goPlusResponse {
        if (typeof obj !== 'object' || obj === null) return false;
        if (typeof obj.code !== 'number') return false;
        if (obj.code !== 1) return false;
        if (typeof obj.message !== 'string') return false;
        if (obj.message !== 'OK') return false;
        if (typeof obj.result !== 'object' || obj.result === null) return false;
    
        for (const key in obj.result) {
            const contract = obj.result[key];
            if (typeof contract !== 'object' || contract === null) return false;
            if (typeof contract.creator_address !== 'string') return false;
            if (typeof contract.creator_percent !== 'string') return false;
            if (!Array.isArray(contract.dex)) return false;
            for (const dex of contract.dex) {
                if (typeof dex.name !== 'string') return false;
                if (typeof dex.liquidity !== 'string') return false;
            }
            if (typeof contract.holder_count !== 'string') return false;
            if (!Array.isArray(contract.holders)) return false;
            for (const holder of contract.holders) {
                if (typeof holder.address !== 'string') return false;
                if (typeof holder.balance !== 'string') return false;
                if (typeof holder.is_contract !== 'number') return false;
                if (typeof holder.is_locked !== 'number') return false;
                if (!Array.isArray(holder.locked_detail)) return false;
                for (const detail of holder.locked_detail) {
                    if (typeof detail.amount !== 'string') return false;
                    if (typeof detail.end_time !== 'string') return false;
                    if (typeof detail.opt_time !== 'string') return false;
                }
                if (typeof holder.percent !== 'string') return false;
                if (typeof holder.tag !== 'string') return false;
            }
            if (typeof contract.honeypot_with_same_creator !== 'string') return false;
            if (contract.is_in_dex !== '0' && contract.is_in_dex !== '1') return false;
            if (contract.is_open_source !== '0' && contract.is_open_source !== '1') return false;
            if (!Array.isArray(contract.lp_holders)) return false;
            for (const lp_holder of contract.lp_holders) {
                if (typeof lp_holder.address !== 'string') return false;
                if (typeof lp_holder.balance !== 'string') return false;
                if (typeof lp_holder.is_contract !== 'number') return false;
                if (typeof lp_holder.is_locked !== 'number') return false;
                if (!Array.isArray(lp_holder.locked_detail)) return false;
                for (const detail of lp_holder.locked_detail) {
                    if (typeof detail.amount !== 'string') return false;
                    if (typeof detail.end_time !== 'string') return false;
                    if (typeof detail.opt_time !== 'string') return false;
                }
                if (typeof lp_holder.percent !== 'string') return false;
                if (typeof lp_holder.tag !== 'string') return false;
            }
            if (typeof contract.owner_address !== 'string') return false;
            if (typeof contract.token_name !== 'string') return false;
            if (typeof contract.token_symbol !== 'string') return false;
            if (typeof contract.total_supply !== 'string') return false;
        }
    
        return true;
    }



    async checkTokenSafety(tokenAddress: string): Promise<{safe: boolean, message: string}> {
        // Check if token is safe to buy
        // Run through the token safety checks
        // If any of the checks fail, return false
        // If all checks pass, return true
        
        // First step: get the go+ token report
        // Second step: loop through the token safety checks
        // Third step: call the corresponding function for each check
        // Fourth step: if any of the checks fail, return false
        // Fifth step: if all checks pass, return true
        const URL = `https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=${tokenAddress}`;
        let tokenReport;
        do {
            tokenReport = await (await fetch(URL)).json();
            console.log(tokenReport);
            await new Promise(resolve => setTimeout(resolve, 2500));
        } while (!this.isGoPlusResponse(tokenReport));
        for (let checkFunction in ethSniperV2.checkFunctions) {
            let functionKey = checkFunction as keyof conditionToFunctionObject; // Why do I need to do this?
            let safetyFunction = ethSniperV2.checkFunctions[functionKey] as (condition: number | boolean, report: goPlusResponse, tokenAddress: string) => boolean; // Why do I need to do this?
            if (!safetyFunction(checkConditions[functionKey], tokenReport, tokenAddress.toLowerCase())) {
                let message = '';
                switch (functionKey) { 
                    case 'checkOpenSource':
                        message = 'Contract is not open source'
                        break;
                    case 'maxBuyTax':
                        message = 'Buy tax exceeds maximum'
                        break;
                    case 'maxSellTax':
                        message = 'sell tax esceeds maximum'
                        break;
                    case 'checkIsMintable':
                        message = 'Mint function exists'
                        break;
                    case 'maxTop10Holders':
                        message = 'Top ten hold too much'
                        break;
                    case 'checkIsHoneypot':
                        message = 'Token contains honeypot code'
                        break;
                    case 'checkLpLocked':
                        message = 'LP is not locked';
                        break;
                    case 'checkOwnerCanChangeBalance':
                        message = 'Owner can change balance'
                        break;
                    case 'checkHiddenOwner':
                        message = 'Token has hidden owner'
                        break;
                    case 'checkCannotSellAll':
                        message = 'Not All of token can be sold'
                        break;
                    case 'checkModifiableTax':
                        message = 'Token has modifiable tax'
                        break;
                    case 'checkPausableTransfer':
                        message = 'Transfer Pausable'
                        break;
                    case 'checkIsProxy':
                        message = 'Token has proxy contract'
                        break;
                    case 'checkCanTakeBackOwnerShip':
                        message = 'Token ownership can be taken back'
                        break;
                }
                return {
                    safe: false,
                    message: message
                }
            }
        }
        return {
            safe: true,
            message: 'All checks passed'
        }
    }

    async getPairContract(pairAddress: string) {
        // Get the pair contract
        let address = await this.uniswapFactoryV2.getPair(pairAddress, WETHAddress);
        return initUniswapV2Pair(this.WalletSigner, address);
    }




    boughtTokenAmounts = new Map<string, BigNumberish>(); // map token addresses to the amount of that token bought
    beginsnipe(): void {
        this.uniswapFactoryV2.on('PairCreated', async (token0: string, token1: string, pairAddress: string) => {
            // Check if the token is the token0 or token1, then perform checks
            console.log(`PAIR CREATED:\nTOKEN0: ${token0}\nTOKEN1: ${token1}\nAT PAIR ${pairAddress}`);
            let tokenAddress = token0 === WETHAddress ? token1 : token0;
            let tokenSafety = await this.checkTokenSafety(tokenAddress);
            if (tokenSafety.safe) {
                console.log('Token has passed all safety checks');
                console.log('Awaiting swap...');
                try {
                    this.boughtTokenAmounts.set(tokenAddress, (await this.buyToken(tokenAddress) as BigNumberish[])[1]);
                } catch (e) {
                    // the transaction will revert if it is not included in the next block.
                    if (ethers.isCallException(e)) {
                        console.log('Swap was reverted');
                        return;
                    } else {
                        console.error(e);
                    }
                }
                console.log('Transaction successful')
                // check the new price every block and sell at the threshold.
                let percentageOfOriginalPosition: FixedNumber;
                this.Provider.on('block', async (blockNumber: BigNumberish, event: ethers.EventPayload<any>) => {
                    let tokenAmount = this.boughtTokenAmounts.get(tokenAddress) as BigNumberish;
                    let ETHPosition = (await this.uniswapRouterV2.getAmountsOut(tokenAmount, [tokenAddress, WETHAddress]) as BigNumberish[])[1];
                    percentageOfOriginalPosition = FixedNumber.fromValue(toBigInt(ETHPosition)/toBigInt(this.buyAmount));
                    console.log(`ETH Position: ${ethers.parseEther(ETHPosition.toString())}\n${percentageOfOriginalPosition}x`);
                    if (percentageOfOriginalPosition >= FixedNumber.fromValue(sniperOptions.takeProfit) || percentageOfOriginalPosition <= FixedNumber.fromValue(sniperOptions.stopLoss)) {
                        const FINALSELL = (await this.sellToken(tokenAddress, tokenAmount) as BigNumberish[])[1];
                        console.log(`Auto sell triggered for ${ethers.parseEther(FINALSELL.toString())} ETH`);
                        event.removeListener();
                    }
                });
            } else {
                console.log(`Token failed safety check: ${tokenSafety.message}`);
                return;
            }
        });
    }

    beginWatch(): void {
        this.uniswapFactoryV2.on('PairCreated', async (token0: string, token1: string, pairAddress: string) => {
            // Check if the token is the token0 or token1, then perform checks
            console.log(`PAIR CREATED:\nTOKEN0: ${token0}\nTOKEN1: ${token1}\nAT PAIR ${pairAddress}`);
            let tokenAddress = token0 === WETHAddress ? token1 : token0;
            let tokenSafety = await this.checkTokenSafety(tokenAddress);
            if (tokenSafety.safe) {
                console.log('Token has passed all safety checks');
                // console.log('Awaiting swap...');
                // let PairContract = await this.getPairContract(pairAddress);
                // let WETHPosition = (await PairContract.token0() === WETHAddress) ? 0 : 1;
                // let initLiq = (await PairContract.getReserves())[WETHPosition];
                // let percentageOfOriginalPosition: FixedNumber;
                // Provider.on('block', async (blockNumber: BigNumberish, event: ethers.EventPayload<any>) => {
                //     let currentLiquidity = (await PairContract.getReserves())[WETHPosition];
                //     percentageOfOriginalPosition = FixedNumber.fromValue(currentLiquidity/initLiq);
                //     console.log(`ETH Position: ${ethers.parseEther(currentLiquidity.toString())}\n${percentageOfOriginalPosition}x`);
                //     if (percentageOfOriginalPosition >= FixedNumber.fromValue(sniperOptions.takeProfit) || percentageOfOriginalPosition <= FixedNumber.fromValue(sniperOptions.stopLoss)) {
                //         console.log('Auto \'sell\' triggered');
                //         event.removeListener();
                //     }
                // });
            } else {
                console.log(`Token failed safety check: ${tokenSafety.message}`);
                return;
            }
        });
    }
}

