# Telegram meme token trader
 
Use this repository to listen to a specific Telegram message on a specific group or channel, parse it and instantly buy a token and sell it using a time or price strategy.

Everything is done automatically, you just need to choose the parameters.
 
## How to use:

1. Go to https://my.telegram.org/apps and create a new app
2. Copy `telegram_app_id` and `telegram_api_hash`
3. Create new file call `secret.json`

    ```
    {
      "private_key": "XXX",
      "public_key": "XXX",
      "telegram_api_id": XXX,
      "telegram_api_hash": "XXX"
    }
    ```

4. On first use you will need to sign in to your Telegram account. Enter your phone number with country code and then enter the code you got
5. Modify the parameters as will

```
    const SellStrategy = SellStrategyByPrice;
    const amountToBuy = "0.1";

    await telegramListener(
        'Pancakeswap Pumping ©', // The group/channel name
        '6 HOURS REMAINING', // Part or all message of user to listen to, null means all users
        30, // Number of messages to fetch when searching user to listen to
        async (message) => { // The call back with the message of the user

            const regex = /outputCurrency=(.*)\s/i;

            if (regex.test(message)) {

                const shitTokenAddress = message.match(regex)[1].trim();

                console.log("Found shittoken", shitTokenAddress);
                await pancakeSwapRouter.swapBNBToShitToken(shitTokenAddress, amountToBuy);

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

 ```

# Sell Strategy

SellStrategyByTime
> This strategy is very simple and will sell the meme token after specific time has passed.

SellStrategyByPrice
> This strategy will sell the token when the profit from selling the token gets to a specific amount.

# TODOS

- Add TypeScript
