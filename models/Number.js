const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NumberSchema = new Schema({
    id: {
        type: String,
        required: true
    },
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

module.exports = User = mongoose.model("numbers", NumberSchema);