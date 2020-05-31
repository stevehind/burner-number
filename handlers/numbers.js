// @flow
// Load util functions
const validateSession = require('../utils/sessions').validateSession;

// Load database models
// $FlowFixMe
const NumberAccount = require("../../models/NumberAccount");

// Credentials
// $FlowFixMe
const admin_keys = require('../../config/keys').adminAPIkey;
// $FlowFixMe
const keys = require("../../config/keys");
// $FlowFixMe
const client = require("twilio")(keys.twilioAccountSid, keys.twilioAuthToken);

// Types
type createAccountPayload = {
    email: string,
    user_id: string
}

type createAccountResponse = {
    status: 200 | 400,
    body: {
        error: string | null,
        message: string | null
    }
}

// Create a Twilio sub-account, and store it in the database
const createAccount = (body: createAccountPayload, res: createAccountResponse): Promise<createAccountResponse> => {

    return NumberAccount.findOne({ user_id: body.user_id})
    .then(([result, body]) => {
        if (result.error) {
            return {
                status: 400,
                body: {
                    error: 'user_id already has an account.',
                    message: null
                }
            }    
        } else {
            throw client.api.accounts.create({
                friendlyName: body.email
            })
        }
    })
    .then(account => {
        return new NumberAccount({
            user_id: body.user_id,
            number_account_sid: account.sid,
            number_account_auth_token: account.authToken
        }).save()
    })
    .then(numberAccount => {
        return {
            status: 200,
            body: {
                error: null,
                message: 'Successfully created number account.'
            }
            
        };
    })
    .catch(error => {
        return {
            status: 400,
            body: {
                error: null,
                message: 'Could not create number account.'
            }
        };
    });
}

const numbers = {
    createAccount: createAccount
}

module.exports = numbers;