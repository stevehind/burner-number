// Credentials
// $FlowFixMe
const keys = require("../config/keys");
// $FlowFixMe
const client = require("twilio")(keys.twilioAccountSid, keys.twilioAuthToken);

const createTwilioSubAccount = (friendlyName) => {
    return client.api.accounts.create({
        friendlyName: friendlyName
    })
}

const twilio_functions = {
    createTwilioSubAccount: createTwilioSubAccount
}

module.exports = twilio_functions;


