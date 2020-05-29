const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const date = new Date();
const one_month_from_now = date.setDate(date.getDate() + 30);

const SessionSchema = new Schema({
    user_id: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now()
    },
    expires: {
        type: Date,
        default: one_month_from_now
    }
});

const Session = mongoose.model("sessions", SessionSchema);

module.exports = Session;