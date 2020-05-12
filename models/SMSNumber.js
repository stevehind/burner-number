const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SMSNumberSchema = new Schema({
    user_id: {
        type: String,
        required: true
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

const SMSNumber = mongoose.model("sms_number", SMSNumberSchema);

module.exports = SMSNumber;