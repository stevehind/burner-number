const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContactSchema = new Schema({
    user_id: {
        type: String,
        required: true
    },
    display_name: {
        type: String,
        required: false
    },
    number: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

const Contact = mongoose.model("contacts", ContactSchema);

module.exports = Contact;