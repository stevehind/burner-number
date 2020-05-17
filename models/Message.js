const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    user_id: {
        type: String,
        required: true
    },
    twilio_message_id: {
        type: String,
        required: true
    },
    user_sent: {
        type: Boolean,
        required: true
    },
    user_received: {
        type: Boolean,
        required: true
    },
    succeeded: {
        type: Boolean,
        default: true
    },
    to_number: {
        type: String,
        required: true
    },
    from_number: {
        type: String,
        required: true
    },
    message_text: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

const Message = mongoose.model("messages", MessageSchema);

module.exports = Message;