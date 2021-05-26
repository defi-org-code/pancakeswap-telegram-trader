import {swapBNBToShitToken, swapShitTokenToBNB} from "./trader/pancakeswap";

const telegramListener = require('./telegram/telegram-listener');
const { sleep } = require('@mtproto/core/src/utils/common');

(async () => {

    const timeToWaitBeforeSellingInSeconds = 10;

    await telegramListener(
        'Pancakeswap Pumping ©',
        '6 HOURS REMAINING',
        30,
        async (message) => {

            const regex = /outputCurrency=(.*)\s/i;

            if (regex.test(message)) {
                const shitTokenAddress = message.match(regex)[1].trim();

                console.log("Found shittoken", shitTokenAddress);
                await swapBNBToShitToken(shitTokenAddress, "0.001");

                console.log(`Waiting ${timeToWaitBeforeSellingInSeconds} seconds`);
                await sleep(timeToWaitBeforeSellingInSeconds * 1000);

                console.log("Selling shittoken");
                await swapShitTokenToBNB(true, shitTokenAddress);
            }

        }
    );

})();