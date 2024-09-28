/* Connect to the Ethereum blockchain (later BSC also) using Infura provider and privKey

 * Create smart contracts for the factory and router contracts of both v2 and v3

 * Create listener for pair/pool created event
 * 
 * Upon creation, use given addresses to run the token through a safety check (where?)
 * 
 * Make additional user customization for min/max liquidity, tax, etc. (low priority)
 * 
 * After token passes all checks, use the router matching to the factory to purchase
 * a specified amount of the token
 * 
 * Display success/failure message to console/terminal, then utilize a autosell (moonbag?)
 * 
 * Possible to do this asynchronously? (Other searches will continue?)
 * 
 * V2 Factory seems to be much more active, prioritize a V2 sniper
 */

import { ethers } from "ethers";
import { ethSniperV2 } from "./sniperv2";
import * as readline from "node:readline/promises";
import { stdin, stdout } from 'node:process';

let privKey: string;
let infuraKey: string;
let Wallet: ethers.Wallet;
let Provider: ethers.InfuraWebSocketProvider;

const rl = readline.createInterface({ input: stdin, output: stdout });

async function initialize() {
    privKey = await rl.question('Enter your private key: ');
    infuraKey = await rl.question('Enter your Infura WSS API key: ');
    rl.close();

    Wallet = new ethers.Wallet(privKey);
    Provider = new ethers.InfuraWebSocketProvider('mainnet', infuraKey);

    let sniper = new ethSniperV2(Provider, Wallet);
    sniper.beginsnipe();
}

initialize().catch(console.error);