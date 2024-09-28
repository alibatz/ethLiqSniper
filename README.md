# ethLiqSniper
EVM-compatible microcap token trader fitted with liquidity detection and safety checks.

### How it works:
  - It utilizes the [ethers.js](https://docs.ethers.org/v6/) library to interact with the blockchain. More specifically, it listens for liquidity creation events from factory contracts which launch the tokens.
  - The [Go+ Security API](https://docs.gopluslabs.io/reference/api-overview) is used to check the newly created token and its liquidity pool for red flags such as: closed source contract, unlocked liquidity, mint function, and more.



### Known Problems:

As of right now it's in a quite primitive state. The biggest problems are:
  - It only works with ethereum as the blockchain and UniswapV2 as the DEX/factory. Some parts of the code need to be revamped to allow customization.
  - I overestimated the ability of the security API. While you can get good results on established tokens, when you attempt to use it on a newly created one as we do here, big chunks of the response are often missing, in which case the program keeps making calls until a good response is received (this usually takes awhile, at least a couple blocks). The checks should be changed so that incomplete responses can be accepted depending on the user's preference, which leads me to:
  - The most simple problem is that the check conditions are currently hardcoded into the files. It would be significantly easier for a user to edit a configuration file rather than having to change and rebuild the source code every time they try new settings. <ins>This could be an easy first issue for new users.<ins/>

I intend to get working on these when things clear up for me, but any contributions are welcome and appreciated.
