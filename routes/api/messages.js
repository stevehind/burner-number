// @flow
// $FlowFixMe
const express = require("express");
const router = express.Router();

// Import utils
const validateSession = require('../../utils/sessions').validateSession;
const returnOrCreateContact = require('../../utils/contacts').returnOrCreateContact;

// Import credentials
const keys = require("../../config/keys");

// $FlowFixMe
const MessagingResponse = require("twilio").twiml.MessagingResponse;
// $FlowFixMe
const client = require("twilio")(keys.twilioAccountSid, keys.twilioAuthToken);

// Database models
const NumberAccount = require("../../models/NumberAccount");
const Message = require("../../models/Message");

// Types
type messageSendPayload = {
    to_number: string,
    message: string
}

type twilioSendPayload = {
    to_number: string,
    from_number: string,
    sid: string,
    message: string
}

type numberAccount = {
    _id: string,
    user_id: string,
    number_account_sid: string,
    number_account_auth_token: string,
    sms_numbers: Array<string>,
    created: Date
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

    
    const lookupNumberAccount: Function = (user_id: string) => new Promise((resolve, reject) => {
        NumberAccount.findOne({ user_id: user_id })
        .then((result: numberAccount) => {
            if (!result) {
                reject(new Error("Lookup number account failed"));
            } else {
                resolve(result);
            }
        })
        .catch((error: Error) => reject(error))
    });
    
    const sendMessage: Function = ({ to_number, from_number, sid, message}: twilioSendPayload ) => new Promise((resolve, reject) => {
        // $FlowFixMe
        const client = require("twilio")(keys.twilioAccountSid, keys.twilioAuthToken, { accountSid: sid});

        client.messages.create({
            from: from_number,
            to: to_number,
            body: message
        })
        .then(message => {
            resolve(message);   
        })
        .catch(error => {
            reject(error);
        })
    });

    const saveMessage: Function = (user_id: string, twilioObject: Object) => new Promise((resolve, reject) => {
        const newMessage = new Message({
            user_id: user_id,
            twilio_message_id: twilioObject.sid,
            user_sent: true,
            user_received: false,
            succeeded: true,
            to_number: twilioObject.to,
            from_number: twilioObject.from,
            message_text: twilioObject.body
        });

        newMessage.save()
        .then(resolve("Message saved."))
        .catch(reject("Message not saved."))

    });

    const renderSuccess: any = (saveResponse: string) => {
        return res.status(200).json({ message: saveResponse });
    };

    // Now execute the functions as a series of promises
    validateSession(session_token)
    .then((validationResponse) => Promise.all([validationResponse.user_id, returnOrCreateContact({user_id: validationResponse.user_id, number: body.to_number})]))
    .then(([user_id, _contact]) => lookupNumberAccount(user_id))
    .then((numberAccount) => Promise.all([numberAccount.user_id, sendMessage({
        to_number: body.to_number,
        from_number: numberAccount.sms_numbers[0],
        sid: numberAccount.number_account_sid,
        message: body.message
    })]))
    .then(([user_id, twilioObject]) => saveMessage(user_id, twilioObject))
    .then((saveResult) => renderSuccess(saveResult))
    .catch((error) => { 
        return res.status(400).json({ error : error }); 
    });
});

module.exports = router;