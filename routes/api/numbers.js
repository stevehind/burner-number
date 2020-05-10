// @flow

// $FlowFixMe
const express = require("express");
const router = express.Router();

// const MessagingResponse = require("twilio").twiml.MessagingResponse;
// const listAllMessages = require("../../functions/messages");
// const sendMessage = require("../../functions/send");
const validateSession = require('../../functions/sessions').validateSession;

const admin_keys = require('../../config/keys').adminAPIkey;
const keys = require("../../config/keys");
// $FlowFixMe
const client = require("twilio")(keys.twilioAccountSid, keys.twilioAuthToken);

// Load numberAccount model
const NumberAccount = require("../../models/NumberAccount");

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
    area_code?: string,
    email: string,
    sid: string
}
type numberSearchPayload = {
    areaCode?: string,
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
                    number_account_sid: account.sid
                })
    
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
        console.log(validationResponse);

        if (!validationResponse.isValid) {
            return res.status(403).json({ message: 'Invalid session token. Please sign in.' });
        } else {
            let search_payload: numberSearchPayload = {
                smsEnabled: true,
                areaCode: body.area_code
            }

            // If no area code is provided, search without specifying an area codes
            if (search_payload.areaCode.length === 0) {
                console.log("No area code provided, will choose at random.");

                let search_payload = {
                    smsEnabled: true
                };
            // If an area code _is_ provided, it needs to be three digits
            } else if (search_payload.areaCode.length != 3 || isNaN(area_code)) {
                    return res.status(400).json({ message: "Provide a three digit area code."});
            }

            return client.availablePhoneNumbers('US').local.list(search_payload)
            .then(list => {
                // Purchase the first available number on the list, and return the number.
                client.incomingPhoneNumbers.create({
                    phoneNumber: list[0].phoneNumber,
                    // Change this when in production.
                    smsUrl: "https://fbe30584.ngrok.io/api/numbers/receive"
                })
                .then(incoming_phone_number => {
                    client.incomingPhoneNumbers(incoming_phone_number.sid)
                    .update({ 
                        accountSid: user_sid,
                        friendlyName: user_email 
                    })
                    .then( updated_phone_number => { return res.status(200).json(updated_phone_number) })
                    // TODO: write the phone number and its id to the database under the user's id.
                    .catch( updated_phone_number => { return res.status(400).json(updated_phone_number) });
                });
            });

        }
    })
    .catch(error => { res.status(400).json({ message: 'Could not run session validation.' })})

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
