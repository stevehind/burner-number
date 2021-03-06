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
const SMSNumber = require("../../models/SMSNumber");

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

type messageSavePayload = {
    user_id: string,
    message_text: string,
    message_sid: string,
    to_number: string,
    from_number: string
}

type userIdAndNumber = {
    user_id: string,
    number: string,
}

type message = {
    succeeded: boolean,
    _id: string,
    user_id: string,
    twilio_message_id: string,
    user_sent: boolean,
    user_received: boolean,
    to_number: string,
    from_number: string,
    message_text: string,
    created: Date,
    __v: 0
}

type messageList = Array<message>


//Debugging
process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    console.error(reason.stack);
});

router.post("/send", (req, res) => {

    // Extract constants from the request
    const body: messageSendPayload = req.body;
    const session_token: string = req.headers.authentication;

    // Create a set of functions required to handle the request and produce the response.
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

    const saveSentMessage: Function = (user_id: string, twilioObject: Object) => new Promise((resolve, reject) => {
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
    .then(([user_id, twilioObject]) => saveSentMessage(user_id, twilioObject))
    .then((saveResult) => renderSuccess(saveResult))
    .catch((error) => { 
        return res.status(400).json({ error : error }); 
    });
});

router.post("/receive", (req, res) => {

    // Extract constants from request
    const message_text: string = req.body.Body;
    const to_number: string = req.body.To;
    const from_number: string = req.body.From;
    const message_sid:string = req.body.SmsMessageSid;

    const twiml = new MessagingResponse();

    // Set up a functions
    // use number to look up user id
    const retrieveUserIdFromNumber = (to_number) => new Promise((resolve, reject) => {
        SMSNumber.findOne({ number: to_number })
        .then(sms_number => resolve(sms_number.user_id))
        .catch(error => reject(error));
    });
    
    // save the message with the user id and message attributes
    const saveReceivedMessage = ({ user_id, message_text, message_sid, to_number, from_number }: messageSavePayload) => new Promise((resolve, reject) => {;
        
        const newMessage = new Message({
            user_id: user_id,
            user_sent: false,
            user_received: true,
            succeeded: true,
            twilio_message_id: message_sid,
            to_number: to_number,
            from_number: from_number,
            message_text: message_text
        });

        newMessage.save()
        .then(resolve("Message saved."))
        .catch(reject("Message not saved."))
    });

    // Use functions in a chain of promises
    retrieveUserIdFromNumber(to_number)
    .then(user_id => Promise.all([user_id, saveReceivedMessage({ user_id, to_number, from_number, message_sid, message_text })]))
    .then(([user_id, response]) => returnOrCreateContact({ user_id: user_id, number: from_number }))
    .catch(error => { res.status(400).json({ error2: error }) })
    .then(contact => {
        twiml.message(message_text);

        res.writeHead(200, { 'Content-Type': 'text/xml'});
        res.end(twiml.toString());
    })
    .catch(error => { res.status(400).json({ error3: error }) });

});

router.get("/list", (req, res) => {

    // get the auth token
    const session_token: string = req.headers.authentication;

    const retrieveNumberFromUserId = (user_id: string) => new Promise((resolve, reject) => {
        SMSNumber.findOne({ user_id: user_id })
        .then(sms_number => resolve({
            number: sms_number.number,
            user_id: sms_number.user_id
        }))
        .catch(error => reject(error));
    });

    const lookupMessages = ({ user_id, number }: userIdAndNumber) => new Promise((resolve, reject) => {
        const query = { user_id: user_id, $or:[ { to_number: number }, { from_number: number } ] }
        
        Message.find(query)
        .then(messages_list => resolve(messages_list))
        .catch(error => reject(error));

    });

    const formatAndReturnMessages = (messages_list: messageList) => {
        // TODO: Format these messages to suit, e.g., how the client handles them
        return res.status(200).json({ messages: messages_list });
    };

    validateSession(session_token)
    .then(validationResponse => retrieveNumberFromUserId(validationResponse.user_id))
    .then((sms_number) => lookupMessages(sms_number))
    .then((messages) => formatAndReturnMessages(messages))
    .catch(error => res.status(400).json({ error: error }))

});

module.exports = router;