// @flow

const Contact = require("../models/Contact");

type createContactResult = {
    created: boolean,
    message?: string
}

type checkContactPayload = {
    number: string,
    user_id: string
}

type createContactPayload = {
    user_id: string,
    display_name?: string,
    number: string
}

const contactExists = ({number, user_id}: checkContactPayload): Promise<boolean> => {
    
    return Contact.findOne({number, user_id})
    .then(result => { return true })
    .catch(error => { return false })
}

const createContact = (data: createContactPayload ): Promise<createContactResult> => {

    const newContact = new Contact({
        user_id: data.user_id,
        display_name: data.display_name || null,
        number: data.number
    })

    return newContact.save()
    .then(result => {
        return {
            created: true,
            message: "Contact created."
        }
    })
    .catch(error => {
        return {
            created: false,
            message: "Could not create contact."
        }
    })
}

const contacts = {
    checkExists: contactExists,
    createContact: createContact
}

module.exports = contacts;