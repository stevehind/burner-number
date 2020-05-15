// @flow
const express = require("express");
const router = express.Router();

const validateSession = require('../../utils/sessions').validateSession;
const returnOrCreateContact = require('../../utils/contacts').returnOrCreateContact;

// $FlowFixMe
const MessagingResponse = require("twilio").twiml.MessagingResponse;

const keys = require("../../config/keys");
// $FlowFixMe
const client = require("twilio")(keys.twilioAccountSid, keys.twilioAuthToken);

const NumberAccount = require("../../models/NumberAccount");

type messageSendPayload = {
    to_number: string,
    message: string
}

type numberAccountEntry = {
    _id: string,
    user_id: string,
    number_account_sid: string,
    number_account_auth_token: string,
    created: date
}

//Debugging
process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    console.error(reason.stack);
});

router.post("/send", (req, res) => {

    // validate the session header
    // req should include the session token only, to number, and message
    // use token to look up user id
    // use user id to look up number_account sid and auth token

    const body: messageSendPayload = req.body;
    const session_token: string = req.headers.authentication;

    
    const lookupNumberAccount = (user_id) => new Promise((resolve, reject) => {
        NumberAccount.findOne({ user_id: user_id })
        .then(result => {
            if (!result) {
                reject(new Error("Lookup number account failed"));
            } else {
                resolve(result);
            }
        })
        .catch(error => reject(error))
    });
    
    const sendMessage = ({ to_number, from_number, sid, auth_token, message} ) => new Promise((resolve, reject) => {
        // $FlowFixMe
        const subClient = require("twilio")(sid, auth_token)

        subClient.messages.create({
            from: from_number,
            to: body.to_number,
            body: body.message
        })
        .then(message => {
            resolve(message);   
        })
        .catch(error => {
            reject(error);
        })
    });

    const renderSuccess = (twilioObject) => {
        return res.status(200).json({ message: twilioObject })
    };


    validateSession(session_token)
    .then((validationResponse) => Promise.all([validationResponse.user_id, returnOrCreateContact({user_id: validationResponse.user_id, number: body.to_number})]))
    .then(([user_id, _contact]) => lookupNumberAccount(user_id))
    .then(({from_number, sid, auth_token})=> sendMessage({ 
        to_number: body.to_number,
        from_number: from_number,
        sid: sid,
        auth_token: auth_token,
        message: body.message
     }))
     // Save the message to the database
    .then((twilio_code) => renderSuccess(twilio_code))
    .catch((error) => { 
        console.log("Error is: %o", error);
        return res.status(400).json({ error4 : error }); 
    });
});

module.exports = router;