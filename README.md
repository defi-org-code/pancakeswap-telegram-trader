# Telegram meme token trader
 
Use this repository to listen to a specific message on a specific group or channel, parse it and instantly buy a token and sell it after a few seconds.

Everything is done automatically.
 
## How to use:
 
```
await telegramListener(
        'Pancakeswap Pumping ©', // The group/channel name
        '6 HOURS REMAINING', // Part or all message of uset to listen to
        30, // Number of messages to fetch when searching user to listen to
        async (message) => { //  The call back with the message of the user

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
 ```

*Coming soon: fetch price of token and decide to sell it base of how much the price went up*