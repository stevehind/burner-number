// @flow

// $FlowFixMe
const express = require("express");
const router = express.Router();

// Handlers 
const numbersHandler = require('../../handlers/numbers')

// Util functions
const validateSession = require('../../utils/sessions').validateSession;

// Credentials
const admin_keys = require('../../config/keys').adminAPIkey;
const keys = require("../../config/keys");
// $FlowFixMe
const client = require("twilio")(keys.twilioAccountSid, keys.twilioAuthToken);

// Load numberAccount model
const NumberAccount = require("../../models/NumberAccount");
const SMSNumber = require("../../models/SMSNumber")

// Define types
type accountSidsArray = Array<string>;

type deletePayload = {
    account_sids: accountSidsArray
};

type accountDeleteResult = {
    id: string,
    name: string,
    status: string
};

type accountDeleteResultArray = Array<?accountDeleteResult>;

type buyNumberPayload = {
    email: string,
    sid: string
}
type numberSearchPayload = {
    smsEnabled: boolean
}

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

// @route POST api/numbers/create-account
// @desc Validate session, then create a Twilio sub-account
// @access Public
router.post("/create-account", (req, res) => {

    const headers = req.headers;
    const body = req.body;

    return validateSession(headers.authentication)
    .then(validationResponse => {
        if (validationResponse.isValid) {
            const createAccountPayload: createAccountPayload = {
                email: body.email,
                user_id: validationResponse.user_id
            }

            return numbersHandler.createAccount(createAccountPayload, res)
            .then((result: createAccountResponse) => {
                res.status(result.status).json(result.body);
            })
        } else {
            return res.status(403).json({
                error: 'Invalid session token. Please sign in.',
                message: null
            })
        }
    })
});

// @route POST api/numbers/buy
// @desc Provision a Twilio SMS number for the user
// @access Public
router.post("/buy", (req, res) => {

    const headers = req.headers;
    const body: buyNumberPayload = req.body;

    // Validate the session token sent.
    return validateSession(headers.authentication)
    .then( validationResponse => {

        if (!validationResponse.isValid) {
            return res.status(403).json({ message: 'Invalid session token. Please sign in.' });
        } else {
            // TODO: Consider adding back the ability to specify the area code of the number.
            let search_payload: numberSearchPayload = {
                smsEnabled: true,
            }            
            return client.availablePhoneNumbers('US').local.list(search_payload)
            .catch(error => { return res.status(400).json({ errorSearchingNumber: error }) })
            .then(list => {
                // Purchase the first available number on the list, and return the number.
                return client.incomingPhoneNumbers.create({
                    phoneNumber: list[0].phoneNumber,
                    // Change this when in production.
                    smsUrl: "https://fbe30584.ngrok.io/api/numbers/receive"
                })
            })
            .catch(error => { return res.status(400).json({ errorCreatingNumber: error }) })
            .then(incoming_phone_number => {
                return client.incomingPhoneNumbers(incoming_phone_number.sid)
                .update({ 
                    accountSid: body.sid,
                    friendlyName: body.email
                })
            })
            .catch(error => { return res.status(400).json({ errorUpdatingNumber: error }) })
            .then( updated_phone_number => { 
                console.log("Updated number is: %o", updated_phone_number);

                const newSMSNumber = new SMSNumber({
                    user_id: validationResponse.user_id,
                    number: updated_phone_number.phoneNumber
                })

                // TODO: save the new SMSnumber to the NumberAccount model

                return newSMSNumber.save() 
            })
            .catch(error => { return res.status(400).json({ numberSaveError: error }) })
            .then(user => {
                return res.status(200).json({
                    number: user.number
                });
            })
        }
    })
    .catch(error => { 
        console.log("Validation error was: %o", error);
        return res.status(400).json({ message: 'Could not run session validation.' })
    })
});

// @route POST api/numbers/delete
// @desc Delete a list of Twilio sub-accounts
// @access Private
router.post("/delete-account", (req, res) => {

    // Validate that the master admin API key is being used.
    const auth_header: string = req.headers.authentication;
    let validAdminKeys: boolean = (auth_header === admin_keys);

    const account_sids: accountSidsArray = req.body.account_sids.split(",");

    if (validAdminKeys) {
        return numbersHandler.deleteAccount(account_sids)
        .then(result => {
            console.log('Deleted accounts: %o', result.array_of_deleted_accounts)
            return res.status(result.status).json({ message: result.message });
        })
        .catch(error => {
            return res.status(error.status).json({ message: error.message })
        })
        
    } else {
        return res.status(403).json({ message: 'Invalid API keys.'});
    }

});

const numbers = {
    router: router
}

module.exports = numbers;
