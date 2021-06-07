const pancakeSwapRouter = require('./trader/pancakeswap');

const telegramListener = require('./telegram/telegram-listener');
const {sleep} = require('@mtproto/core/src/utils/common');
const BN = require('bn.js');
const Web3 = require("web3");

const SellStrategyByTime = {
    sell: async (amountToBuy, shitTokenAddress) => {
        const timeToWaitBeforeSellingInSeconds = 10;

        await pancakeSwapRouter.swapBNBToShitToken(shitTokenAddress, amountToBuy);

        console.log(`Waiting ${timeToWaitBeforeSellingInSeconds} seconds`);
        await sleep(timeToWaitBeforeSellingInSeconds * 1000);

        console.log("Selling shittoken");
        await pancakeSwapRouter.swapShitTokenToBNB(true, shitTokenAddress);
    }
};

const SellStrategyByPrice = {
    sell: async (amountToBuy, shitTokenAddress) => {
        const sellAboveInBNB = "0.5";

        await trackPriceAndDecideWhenToSell(
            shitTokenAddress,
            amountToBuy,
            3000,
            sellAboveInBNB
        );
    }
};

(async () => {

    const SellStrategy = SellStrategyByPrice;
    const amountToBuy = "0.1";

    await telegramListener(
        'Testing pump', // The group/channel name
        'Hi', // Part or all message of user to listen to, null means all users
        30, // Number of messages to fetch when searching user to listen to
        async (message) => { // The call back with the message of the user

            const regex = /outputCurrency=(.*)\s?/i;

            if (regex.test(message)) {

                const shitTokenAddress = message.match(regex)[1].trim();

                console.log("Found shittoken", shitTokenAddress);

                try {
                    // Stop listening to Telegram messages
                    return true;
                } finally {
                    await SellStrategy.sell(amountToBuy, shitTokenAddress);
                }

            } else {
                console.log(`Skipping message: ${message}`);
            }

            return false;
        }
    );

})();

const trackPriceAndDecideWhenToSell = async (shitTokenAddress, amountToBuy, pollInterval, sellAboveInBNB) => {

    const amountOfShitToken = new BN(await pancakeSwapRouter.balanceOf(shitTokenAddress));
    await pancakeSwapRouter.swapBNBToShitToken(shitTokenAddress, amountToBuy);
    const diff = new BN(await pancakeSwapRouter.balanceOf(shitTokenAddress)).sub(amountOfShitToken);
    const wBNBDecimals = 18;
    const shitTokenDecimals = await pancakeSwapRouter.decimals(shitTokenAddress);

     const buyingPrice = new BN(Web3.utils.toWei(amountToBuy, "ether").toString())
         .mul(new BN("10").pow(new BN(wBNBDecimals - shitTokenDecimals))).div(diff);

    let prevPrice;
    await pancakeSwapRouter.listenToPriceMovement(shitTokenAddress, pollInterval, async (priceInBNB) => {

        if (!prevPrice) {
            prevPrice = priceInBNB;
        }

        if (priceInBNB.eq(prevPrice)) {
            return;
        }

        if (priceInBNB.gt(buyingPrice)) {

            const amountsOutBNB = await pancakeSwapRouter.getBNBAmountFromShitToken(shitTokenAddress, diff.toString());
            const howMuchYouWillMakeInBNB = new BN(Web3.utils.toWei(amountToBuy, 'ether')).sub(new BN(amountsOutBNB));

            if (howMuchYouWillMakeInBNB.gt(new BN(sellAboveInBNB))) {
                await pancakeSwapRouter.swapShitTokenToBNB(true, shitTokenAddress);
                // Done
                process.exit(0);
            }

        }

        prevPrice = priceInBNB;

    });
};