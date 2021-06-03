const util = require('util');
const readline = require('readline');
const API = require('./api');

// If message was found by from_id not exist then message is of channel owner
const CHANNEL_USER_ID = 'channel_user_id';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question[util.promisify.custom] = (arg) => {
    return new Promise((resolve) => {
        rl.question(arg, resolve);
    });
};

const question = util.promisify(rl.question);

const api = new API(require('../secret').telegram_api_id, require('../secret').telegram_api_hash);

const signIn = async () => {

    try {
        const phoneNumber = await question('Enter phone number with country code (e.g +972547642935)\n');

        console.log("phoneNumber", phoneNumber)
        const result = await api.call('auth.sendCode', {
            phone_number: phoneNumber,
            api_id: require('../secret').telegram_api_id,
            api_hash: require('../secret').telegram_api_hash,
            settings: {
                _: 'codeSettings',
            }
        });

        const code = await question('Enter confirmation code\n');

        await api.call('auth.signIn', {
            phone_number: phoneNumber,
            phone_code: code,
            phone_code_hash: result.phone_code_hash,
        });
    } catch (e) {
        console.log("riten", e);
    }


};

const successfulLogin = () => {
    rl.close();
};

const startListening = async () => {

    try {
        await api.call('updates.getState').then(result => {
            console.log('updates.getState', result);
        });
    } catch (e) {
        if (e.error_code === 401) {
            // User did not login
            await signIn();
            await startListening();
        }
    }

    successfulLogin();
};

const getChatByName = async (name) => {
    const allChats = await api.call('messages.getAllChats', {
        except_ids: []
    });

    return allChats.chats.find((chat) => chat.title === name);
};

const findUserByMessage = async (messageToFind, chat, limit = 10) => {
    const result = await api.call('messages.getHistory', {
        peer: chat._ === 'chat' ? {
            _: 'inputPeerChat',
            chat_id: chat.id
        } : {
            _: 'inputPeerChannel',
            channel_id: chat.id,
            access_hash: chat.access_hash
        },
        limit: limit
    });

    for (const message of result.messages) {
        if (message.message && message.message.indexOf(messageToFind) !== -1) {
            return message.from_id || CHANNEL_USER_ID;
        }
    }

    return null;
};

function readMessage(message, chat, user, callback) {

    let chatId;
    let fromId;

    if (message.peer_id) {
        chatId = message.peer_id._ === 'peerChannel' ? message.peer_id.channel_id : message.peer_id._ === 'peerChat' ? message.peer_id.chat_id : null;
    } else {
        chatId = message.chat_id;
    }

    if (message.from_id && message.from_id._) {
        fromId = message.from_id._ === 'peerUser' ? message.from_id.user_id : null;
    } else {
        fromId = message.from_id;
    }

    if (chatId === chat.id && (user === CHANNEL_USER_ID || fromId === user.user_id)) {
        if (callback(message.message)) {
            api.stopListenToUpdate();
        }
    }
}

/**
 * Telegram listener
 *
 * @param chatName - the group or channel you want to listen to (you have to be a member of that chat)
 * @param partOfMessageToFindUser - Part or all of a message to use in order to listen to a specific user
 * @param limitOfMessages - How many messages to fetch when looking for user's messages
 * @param callback - The callback with the message that the user sent
 *
 * Please notice that in channels the user who send the messages is the channel itself and not a specific user
 * @returns {Promise<void>}
 */
module.exports = async (chatName, partOfMessageToFindUser, limitOfMessages, callback) => {

    await startListening();

    const chat = await getChatByName(chatName);

    if (!chat) {
        throw 'Couldn\'t find Chat';
    }

    const user = await findUserByMessage(partOfMessageToFindUser, chat, limitOfMessages);

    if (!user) {
        throw 'Couldn\'t find user';
    }

    api.listenToUpdates(async (updateInfo) => {

        if (updateInfo.updates) {
            for (const update of updateInfo.updates) {

                if (update.message) {

                    readMessage(update.message, chat, user, callback);

                }

            }
        } else if (updateInfo.message) { // updateInfo.message is the actual text message not the message object

            readMessage(updateInfo, chat, user, callback);

        }

    })

};