// @flow
// Import Regenerator Runtime
// $FlowFixMe
const regeneratorRuntime = require('regenerator-runtime');

// Load util functions
const validateSession = require('../utils/sessions').validateSession;
const validateEmail = require('../utils/validateEmail');

// Load database models
const NumberAccount = require("../models/NumberAccount");

// Load twilio functions
const twilio_functions = require("../vendor/twilio_functions");

// Credentials
const admin_keys = require('../config/keys').adminAPIkey;

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

type accountSidsArray = Array<string>;

type accountDeleteResult = {
    id: string,
    name: string,
    status: string
};

type accountDeleteResultArray = Array<?accountDeleteResult>;

type deleteAccountReturn = {
    deleted_successful: boolean,
    delete_result: accountDeleteResult,
    error: string
}

// Create a Twilio sub-account, and store it in the database
const createAccount = (body: createAccountPayload): Promise<createAccountResponse> => {

    const {error, isValid} = validateEmail(body.email);
    if (error || !isValid) {
        return Promise.resolve(
            {
                status: 400,
                body: {
                    error: 'Invalid email.',
                    message: null
                }
            }
        );
    }

    return NumberAccount.findOne({ user_id: body.user_id})
    .then((result, error) => {
        if ((!error) && (!result)) {
            return twilio_functions.createTwilioSubAccount(body.email);  
        } else if (result) {
            throw {
                status: 400,
                body: {
                    error: 'user_id already has an account.',
                    message: null
                }
            }  
        } else {
            throw {
                status: 400,
                body: {
                    error: 'DB error.',
                    message: null
                }
            }
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
        if ((error.body) && (error.body.error === 'user_id already has an account.')) {
            return error;
        } else {
            return {
                status: 400,
                body: {
                    error: 'Could not create number account.',
                    message: null
                }
            };
        }
    });
}

const deleteAccount = (payload: accountSidsArray) => {
    // Do the deleting...
    const sids: accountSidsArray = payload;

    let result:accountDeleteResultArray = [];

    async function deleteAccount(sid: string): Promise<deleteAccountReturn> {
        return twilio_functions.deleteTwilioSubAccount(sid);
    }

    return Promise.all(sids.map(sid => deleteAccount(sid)))
    .then((result_array) => {
        const successful_delete = (element) => !!element.delete_result

        if(result_array.some(successful_delete)) {
            
            let result = {
                status: 200,
                //TODO: look up sytax for filter.
                array_of_deleted_accounts: result_array.map(item => item.delete_result),
                message: 'At least one account was deleted.'
            };

            return result;
        } else {
            return {
                status: 400,
                array_of_deleted_accounts: null,
                message: 'No accounts were deleted.'
            }
        }
    })
    
}

const numbers = {
    createAccount: createAccount,
    deleteAccount: deleteAccount,
}

module.exports = numbers;