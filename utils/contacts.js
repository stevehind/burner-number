// @flow
const mongoose = require('mongoose');
const {Types: {ObjectId}} = mongoose;

//Helper to check if an ID is an object ID
mongoose.isObjectId = function(id) {
    return (id instanceof ObjectId);
  };

//Helper to validate a string as object ID
mongoose.isValidObjectIdOrStringInSameFormat = function(str) {
    if (mongoose.isObjectId(str)) {
        return true
    } else if (typeof str !== 'string') {
        return false
    } else {
        return str.match(/^[a-f\d]{24}$/i);
    }
};

const Contact = require("../models/Contact");

type contactResult = {
    created: boolean,
    number: string,
    user_id: string,
}

type contactFailure = {
    created: boolean,
    message: string
}

type createContactPayload = {
    user_id: string,
    display_name?: string,
    number: string
}

const returnOrCreateContact = ({number, user_id, display_name}: createContactPayload): Promise<contactResult> | Promise<contactFailure> => new Promise((resolve, reject) => {
    if (mongoose.isValidObjectIdOrStringInSameFormat(user_id)) {
        return Contact.findOne({number, user_id})
        .then(contact => resolve({
            created: false,
            number: contact.number,
            user_id: contact.user_id
        }))
        .catch(error => {
            return new Contact({
                user_id: user_id,
                display_name: display_name || null,
                number: number
            })
            .save()
            .then(result => {
                resolve({
                    created: true,
                    number: result.number,
                    user_id: result.user_id
                })
            })
            .catch(error => {
                reject({
                    created: false,
                    message: "Could not create not contact." 
                })
            })
        })
    } else {
        return resolve({
            created: false,
            message: 'Invalid user_id.'
        })
    }
});

const contacts = {
    returnOrCreateContact: returnOrCreateContact
}

module.exports = contacts;