// @flow
const express = require("express");
const router = express.Router();
// $FlowFixMe
const MessagingResponse = require("twilio").twiml.MessagingResponse;

const keys = require("../../config/keys");
// $FlowFixMe
const client = require("twilio")(keys.twilioAccountSid, keys.twilioAuthToken);

type messageSendPayload = {
    subSid: string,
    subtoken: string,
    from_number: string,
    to_number: string,
    message: string
}

router.post("/send", (req, res) => {

    // validate the session header

    const body: messageSendPayload = req.body;

    // shadow create a contact if one doesn't exist
    
    

    // TODO: Create a type of this module. https://flow.org/en/docs/libdefs/creation/
    // find a way to retrieve the sub-account's auth token.
    // $FlowFixMe
    const subClient = require("twilio")(body.subSid, body.subtoken)

    return subClient.messages.create({
        from: body.from_number,
        to: body.to_number,
        body: body.message
    })
    .then(message => {
        return res.status(200).json({message: message});
    })
    .catch(error => {
        return res.status(400).json({error: error});
    })

});

module.exports = router;