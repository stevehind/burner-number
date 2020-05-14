const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NumberAccountSchema = new Schema({
    user_id: {
        type: String,
        required: true
    },
    number_account_sid: {
        type: String,
        required: true
    },
    number_account_auth_token: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

const NumberAccount = mongoose.model("number_accounts", NumberAccountSchema);

module.exports = NumberAccount;