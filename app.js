const Web3 = require("web3");
const provider = new Web3.providers.HttpProvider("https://bsc-dataseed.binance.org/");
const Contract = require('web3-eth-contract');
Contract.setProvider(provider);
const web3 = new Web3(provider);

const max = "115792089237316195423570985008687907853269984665640564039457584007913129639935";

//---
const shitTokenAddress = '0xAC51066d7bEC65Dc4589368da368b212745d63E8';
//---

const pancakeSwapAddress = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
const wBNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
const yourAddress = '0xCADfB37bDADb4a5D486cfb1CaCbAA76E54e1F2c5';
const yourPrivateKey = 'XXX';

const pancakeswapRouterContract = new Contract(require('./pancakeswap-router-abi'), pancakeSwapAddress);
const shitTokenContract = new Contract(require('./shit-token-abi'), shitTokenAddress);
const bnbAmountToBuy = "0.001";

const swapBNBToShitToken = async () => {

    const data = pancakeswapRouterContract.methods.swapExactETHForTokens(
        1, // Min amount. 1 means 100% slippage
        [
            wBNB,
            shitTokenAddress // The address of the shitoken
        ],
        yourAddress, // Your address
        new Date().getTime() + (60 * 1000) // 1 hour from now
    ).encodeABI();

    const tx = {
        // this could be provider.addresses[0] if it exists
        from: yourAddress,
        // target address, this could be a smart contract address
        to: pancakeSwapAddress,
        // optional if you want to specify the gas limit
        gas: 500000,
        gapPrice: Web3.utils.toWei("7", "shannon"),
        // optional if you are invoking say a payable function
        value: Web3.utils.toWei(bnbAmountToBuy, "ether"),
        // this encodes the ABI of the method and the arguements
        data: data
    };

    const signedTransaction = await web3.eth.accounts.signTransaction(
        tx,
        yourPrivateKey
    );

    await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction).on('transactionHash', function(hash){
        console.log("transactionHash", hash);
    }).on('receipt', function(receipt){
        console.log("receipt - swapBNBToShitToken");
    }).on('error', console.error); // If a out of gas error, the second parameter is the receipt.;;

};

const swapShitTokenToBNB = async () => {

    const amountOfShitToken = await shitTokenContract.methods.balanceOf(yourAddress).call();

    console.log("blanace of", amountOfShitToken);

    const data = pancakeswapRouterContract.methods.swapExactTokensForETH(
        amountOfShitToken,
        1, // Min amount. 1 means 100% slippage
        [
            shitTokenAddress,
            wBNB, // WBNB
        ],
        yourAddress, // Your address
        new Date().getTime() + (60 * 1000) // 1 hour from now
    ).encodeABI();

    const tx = {
        // this could be provider.addresses[0] if it exists
        from: yourAddress,
        // target address, this could be a smart contract address
        to: pancakeSwapAddress,
        // optional if you want to specify the gas limit
        gas: 500000,
        gapPrice: Web3.utils.toWei("7", "shannon"),
        // optional if you are invoking say a payable function
        value: 0,
        // this encodes the ABI of the method and the arguements
        data: data
    };

    const signedTransaction = await web3.eth.accounts.signTransaction(
        tx,
        yourPrivateKey
    );

    await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction).on('transactionHash', function(hash){
        console.log("transactionHash", hash);
    }).on('receipt', function(receipt){
        console.log("receipt - swapShitTokenToBNB");
    }).on('error', console.error); // If a out of gas error, the second parameter is the receipt.;;

};

const approveShitToken = async () => {

    const data = shitTokenContract.methods.approve(
        pancakeSwapAddress,
        max // Infinite
    ).encodeABI();

    const tx = {
        // this could be provider.addresses[0] if it exists
        from: yourAddress,
        // target address, this could be a smart contract address
        to: shitTokenAddress,
        // optional if you want to specify the gas limit
        gas: 500000,
        gapPrice: Web3.utils.toWei("7", "shannon"),
        // optional if you are invoking say a payable function
        value: 0,
        // this encodes the ABI of the method and the arguements
        data: data
    };

    const signedTransaction = await web3.eth.accounts.signTransaction(
        tx,
        yourPrivateKey
    );

    await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction).on('transactionHash', function(hash){
        console.log("transactionHash", hash);
    }).on('receipt', function(receipt){
        console.log("receipt - approveShitToken");
    }).on('error', console.error); // If a out of gas error, the second parameter is the receipt.;;

};

(async () => {

    // 1
    //await swapBNBToShitToken();

    // 2
    //await approveShitToken();
    //await swapShitTokenToBNB();

})();