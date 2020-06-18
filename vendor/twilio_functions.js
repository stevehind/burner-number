// @flow

// Credentials
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

type numberSearchPayload = {
    smsEnabled: boolean
}

type buyNumberPayload = {
    email: string,
    sid: string
}

type buyNumberAttemptResult = {
    succeeded: boolean,
    error: null | string
}

const createTwilioSubAccount = (friendlyName: string) => {
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

const buyTwilioSMSNumber = (search_payload: numberSearchPayload, buy_payload: buyNumberPayload): Promise<buyNumberAttemptResult> => {
    return client.availablePhoneNumbers('US').local.list(search_payload)
    .then(list => {
        return client.incomingPhoneNumbers.create({
            phoneNumber: list[0].phoneNumber,
            // Change this when in production.
            smsUrl: "https://fbe30584.ngrok.io/api/numbers/receive"
        })
    })
    .then(incoming_phone_number => {
        return client.incomingPhoneNumbers(incoming_phone_number.sid)
        .update({
            accountSid: buy_payload.sid,
            friendlyName: buy_payload.email
        })
    })
    //TODO: make this return the actual result and handle it better. Needs to return something that can be saved to the database as an SMSNumber
    .then(() => {
        return {
            succeeded: true,
            error: null
        };
    })
    .catch(error => {
        return {
            succeeded: false,
            error: error
        };
    })
}

const twilio_functions = {
    createTwilioSubAccount: createTwilioSubAccount,
    deleteTwilioSubAccount: deleteTwilioSubAccount,
    buyTwilioSMSNumber: buyTwilioSMSNumber
}

module.exports = twilio_functions;


