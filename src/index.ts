import { providers, Wallet } from "ethers";
import { FlashbotsBundleProvider, FlashbotsBundleResolution } from "@flashbots/ethers-provider-bundle";

const CHAIN_ID = 5;
const provider = new providers.InfuraProvider(CHAIN_ID)

const FLASHBOTS_ENDPOINT = "https://relay-goerli.flashbots.net";

if (process.env.WALLET_PRIVATE_KEY === undefined) {
  console.error("Please provide WALLET_PRIVATE_KEY env")
  process.exit(1)
}
const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY, provider)

// ethers.js can use Bignumber.js class OR the JavaScript-native bigint. I changed this to bigint as it is MUCH easier to deal with
const GWEI = 10n ** 9n
const ETHER = 10n ** 18n
var mintResult = -1

async function attemptMint(flashbotsProvider, blockNumber) {
  const bundleSubmitResponse = await flashbotsProvider.sendBundle(
    [
      {
        transaction: {
          chainId: CHAIN_ID,
          type: 2,
          value: ETHER / 100n * 3n,
          data: "0x1249c58b",
          maxFeePerGas: GWEI * 5n,
          maxPriorityFeePerGas: GWEI * 3n,
          to: "0x20EE855E43A7af19E407E39E5110c2C1Ee41F64D"
        },
        signer: wallet
      }
    ], blockNumber + 1
  )
  if ('error' in bundleSubmitResponse) {
    console.warn(bundleSubmitResponse.error.message)
    return
  }
  else { mintResult = await bundleSubmitResponse.wait(); }

}
async function prepareForNextBlock(flashbotsProvider, blockNumber) {
  if (mintResult == FlashbotsBundleResolution.BundleIncluded) {
    console.log(`Mint successful on block number: ${blockNumber}`);
    process.exit(0)
  } else {
    await attemptMint(flashbotsProvider, blockNumber);
    await prepareForNextBlock(flashbotsProvider, blockNumber + 1);
  }
}

async function main() {
  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, Wallet.createRandom(), FLASHBOTS_ENDPOINT)
  var blockNumber = await provider.getBlockNumber();
  console.log(blockNumber)
  await prepareForNextBlock(flashbotsProvider, blockNumber + 1);


}

main();