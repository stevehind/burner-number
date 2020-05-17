// @flow

// $FlowFixMe
const express = require("express");
const router = express.Router();

const validateSession = require('../../utils/sessions').validateSession;

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


// @route POST api/numbers/create-account
// @desc Provision a Twilio sub-account for the user
// @access Public
router.post("/create-account", (req, res) => {

    const headers = req.headers;
    const body = req.body;

    // Validate the session token sent.

    return validateSession(headers.authentication)
    .then( validationResponse => {
        console.log(validationResponse);

        if (!validationResponse.isValid) {
            return res.status(403).json({ message: 'Invalid session token. Please sign in.' });
        } else {
            client.api.accounts.create({
                friendlyName: body.email
            })
            .then(account => {
                const newNumberAccount = new NumberAccount({
                    user_id: validationResponse.user_id,
                    number_account_sid: account.sid,
                    number_account_auth_token: account.authToken
                });
    
                newNumberAccount.save()
                .then(numberAccount => {
                    return res.status(200).json({ message: 'Successfully created number account.' });
                })
                .catch(error => {
                    console.log('Error is: %o', error);
                    return res.status(400).json({ message: 'Could not save number account to DB.' });
                });
            })
            .catch(error => {
                return res.status(400).json({ message: 'Could not create new number account.' })
            });
        }
    })
    .catch(error => { res.status(400).json({ message: 'Could not run session validation.' })})
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

    if (validAdminKeys) {
        // Do the deleting...
        const body: deletePayload = req.body;
        const sids: accountSidsArray = req.body.account_sids.split(",");

        console.log("Sids array: %o", sids);

        let result:accountDeleteResultArray = [];

        async function deleteAccount(sid: string): Promise<accountDeleteResult | string> {
            return client.api.accounts(sid)
            .update({ status: 'closed' })
            .then(account => {
                console.log("Account is: %o", account.sid);
                let result: accountDeleteResult = {
                            id: account.sid,
                            name: account.friendlyName,
                            status: account.status
                        };

                console.log("Result is: %o", result);

                return result
            })
            .catch(error => {
                console.log("Error is: %o", error.message)
                return error.message
            });
        }

        sids.forEach(sid => {
            deleteAccount(sid);
        });

        return res.status(200).json({ message: 'See console for outcome.' });
    } else {
        return res.status(403).json({ message: 'Invalid API keys.'});
    }

});

module.exports = router;
