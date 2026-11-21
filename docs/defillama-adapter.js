// DeFiLlama TVL Adapter for Kradl (https://kradl.xyz)
// Submit via PR to: https://github.com/DefiLlama/DefiLlama-Adapters
// Target path in DefiLlama-Adapters: projects/kradl/index.js

const { sumTokensExport } = require("../helper/unwrapLPs");
const ADDRESSES = require("../helper/coreAssets.json");

const KRADL_LAUNCHPAD = "0x2FEE1b921F68A19bFdA0B587dff8bC245727D518";

module.exports = {
  methodology:
    "TVL tracks native ETH locked in KradlLaunchpad bonding curves on Base Mainnet (8453) and Robinhood Chain Mainnet (4663) prior to automatic DEX graduation.",
  base: {
    tvl: sumTokensExport({
      owner: KRADL_LAUNCHPAD,
      tokens: [ADDRESSES.null],
    }),
  },
  // Note: Once DeFiLlama adds the `robinhood` chain key, uncomment below:
  // robinhood: {
  //   tvl: sumTokensExport({
  //     owner: KRADL_LAUNCHPAD,
  //     tokens: [ADDRESSES.null],
  //   }),
  // },
};
