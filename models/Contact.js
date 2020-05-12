const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContactSchema = new Schema({
    id: {
        type: String,
        required: true
    },
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

module.exports = User = mongoose.model("contacts", ContactSchema);