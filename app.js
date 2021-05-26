const {swapShitTokenToBNB, swapBNBToShitToken} = require('./trader/pancakeswap');

const telegramListener = require('./telegram/telegram-listener');
const { sleep } = require('@mtproto/core/src/utils/common');

(async () => {

    const timeToWaitBeforeSellingInSeconds = 10;

    await telegramListener(
        'Pancakeswap Pumping ©', // The group/channel name
        '6 HOURS REMAINING', // Part or all message of user to listen to
        30, // Number of messages to fetch when searching user to listen to
        async (message) => { // The call back with the message of the user

            const regex = /outputCurrency=(.*)\s/i;

            if (regex.test(message)) {

                const shitTokenAddress = message.match(regex)[1].trim();

                console.log("Found shittoken", shitTokenAddress);
                await swapBNBToShitToken(shitTokenAddress, "0.1");

                console.log(`Waiting ${timeToWaitBeforeSellingInSeconds} seconds`);
                await sleep(timeToWaitBeforeSellingInSeconds * 1000);

                console.log("Selling shittoken");
                await swapShitTokenToBNB(true, shitTokenAddress);

            } else {
                console.log(`Skipping message: ${message}`);
            }

        }
    );

})();