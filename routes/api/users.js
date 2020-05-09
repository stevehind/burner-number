// @flow
const express = require("express");
const router = express.Router();

const validateEmail = require('../../functions/validateEmail');

// Load user model
const User = require("../../models/User");

// Declare types
// type User = {
//     id: String,
//     name: String,
//     email: String,
//     password: String,
//     created: Date,
//     display_name: String
// };

// @route POST /api/users/register
// @desc Register a user
// @access public
router.post("/register", function (req, res) {
    
    // parse the request

    // check email is an email


    // check if email in database

    // if it is:
    // // fail, point to login

    // if it isn't:
    // hash the password
    // store pw in db
    // create a session
    // return the session id

});

module.exports = router;
