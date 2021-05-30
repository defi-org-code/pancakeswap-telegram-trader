const path = require('path');
const MTProto = require('@mtproto/core');
const { sleep } = require('@mtproto/core/src/utils/common');

class API {
    constructor(api_id, api_hash) {
        this.mtproto = new MTProto({
            api_id: api_id,
            api_hash: api_hash,

            storageOptions: {
                path: path.resolve(__dirname, './data/auth_session.json'),
            },
        });
    }

    async call(method, params, options = {}) {
        try {
            const result = await this.mtproto.call(method, params, options);

            return result;
        } catch (error) {
            console.log(`${method} error:`, error);

            const { error_code, error_message } = error;

            if (error_code === 420) {
                const seconds = Number(error_message.split('FLOOD_WAIT_')[1]);
                const ms = seconds * 1000;

                await sleep(ms);

                return this.call(method, params, options);
            }

            if (error_code === 303) {
                const [type, dcIdAsString] = error_message.split('_MIGRATE_');

                const dcId = Number(dcIdAsString);

                // If auth.sendCode call on incorrect DC need change default DC, because
                // call auth.signIn on incorrect DC return PHONE_CODE_EXPIRED error
                if (type === 'PHONE') {
                    await this.mtproto.setDefaultDc(dcId);
                } else {
                    Object.assign(options, { dcId });
                }

                return this.call(method, params, options);
            }

            return Promise.reject(error);
        }
    }

    listenToUpdates(listener) {
        this.mtproto.updates.on('updates', listener);
        this.mtproto.updates.on('updateShortChatMessage', listener);
        this.mtproto.updates.on('updateShortMessage', listener);
        this.mtproto.updates.on('updateShortSentMessage', listener);
    }

    stopListenToUpdate() {
        this.mtproto.updates.removeAllListeners('updates');
        this.mtproto.updates.removeAllListeners('updateShortChatMessage');
        this.mtproto.updates.removeAllListeners('updateShortMessage');
        this.mtproto.updates.removeAllListeners('updateShortSentMessage');
    }
}

module.exports = API;