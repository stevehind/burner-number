// Credentials
// $FlowFixMe
const keys = require("../config/keys");
// $FlowFixMe
const client = require("twilio")(keys.twilioAccountSid, keys.twilioAuthToken);

type deleteAccountResult = {
    id: string,
    name: string,
    status: string
}

type deleteAccountResultObject = {
    deleted_successful: boolean,
    delete_result: null | deleteAccountResult,
    error: null | string
}

const createTwilioSubAccount = (friendlyName) => {
    return client.api.accounts.create({
        friendlyName: friendlyName
    })
}

const deleteTwilioSubAccount = (sid: string): Promise<deleteAccountResultObject> => {
    return client.api.accounts(sid)
    .update({ status: 'closed' })
    .then(account => {
        console.log("Account is: %o", account.sid);
        let delete_result: accountDeleteResult = {
                    id: account.sid,
                    name: account.friendlyName,
                    status: account.status
                };

        console.log("Result is: %o", result);

        return {
            deleted_successful: true,
            delete_result: delete_result,
            error: null
        }
    })
    .catch(error => {
        console.log("Error is: %o", error.message)
        return {
            deleted_successful: false,
            delete_result: null,
            error: error.message
        }
    });
}

const twilio_functions = {
    createTwilioSubAccount: createTwilioSubAccount,
    deleteTwilioSubAccount: deleteTwilioSubAccount
}

module.exports = twilio_functions;


