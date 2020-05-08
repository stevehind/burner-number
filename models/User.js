const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    },
    display_name: {
        type: String,
        default: this.name
    },
    string_customer_object: {
        type: String,
        default: ''
    },
    string_payment_method: {
        type: String,
        default: ''
    }
});

module.exports = User = mongoose.model("users", UserSchema);