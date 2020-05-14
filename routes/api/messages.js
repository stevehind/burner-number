// @flow
const express = require("express");
const router = express.Router();

const validateSession = require('../../utils/sessions').validateSession;

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

router.post("/send", (req, res) => {

    // validate the session header
    // req should include the session token only, to number, and message
    // use token to look up user id
    // use user id to look up number_account sid and auth token

    const body: messageSendPayload = req.body;
    const session_token: string = req.headers.authentication;

    // validate session token, return user id
    return validateSession(session_token)
    .then(validationResponse => {
        if (validationResponse.isValid) {
            let user_credentials: numberAccountEntry = NumberAccount.findOne({ user_id: validationResponse.user_id });

            console.log("user_credentials: %o", user_credentials);

            return res.status(200).json({ message: user_credentials })
        } else {
            return res.status(403).json({ invalidSessionError: "Could not validate session, please login." })
        }
    })
    .catch(error => { return res.status(403).json({ sessionValidationFailedError: error })});    

    // shadow create a contact if one doesn't exist
    


    // find a way to retrieve the sub-account's auth token.

    // TODO: Create a type of this module. https://flow.org/en/docs/libdefs/creation/
    // $FlowFixMe
    // const subClient = require("twilio")(body.subSid, body.subtoken)

    // return subClient.messages.create({
    //     from: body.from_number,
    //     to: body.to_number,
    //     body: body.message
    // })
    // .then(message => {
    //     return res.status(200).json({message: message});
    // })
    // .catch(error => {
    //     return res.status(400).json({error: error});
    // })

});

module.exports = router;