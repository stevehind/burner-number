// @flow
// $FlowFixMe
const express = require('express');
// $FlowFixMe
const bcrypt = require('bcryptjs');
// $FlowFixMe
const crypto = require('crypto');

const router = express.Router();

const admin_keys = require('../../config/keys').adminAPIkey;

const validateEmail = require('../../functions/validateEmail');

// Load user model
const User = require("../../models/User");

// Declare types
type UserType = {
    id: string,
    name: string,
    email: string,
    password: string,
    created: Date,
    display_name: string
};

type UserPayload = {
    name: string,
    email: string,
    password: string,
    password2: string
}

type DeleteUserPayload = {
    email: string
}

// @route POST /api/users/register
// @desc Register a user
// @access public
router.post("/register", function (req, res) {
    
    // parse the request
    const body: UserPayload = req.body;
    console.log("Request body: %o", body);

    // check email is an email, return an error if not
    let valid_email: boolean = validateEmail(body.email).isValid;

    if (!valid_email) {
        return res.status(400).json({ email: "Not a valid email. Please try again."})
    }

    // look for existing users with the provided email. error if found, otherwise create user object.
    User.findOne({ email: body.email })
        .then(user => {
            if (user) {
                return res.status(400).json({ email: "Email already exists. Please login or try again."});
            } else {
                const newUser = new User({
                    name: body.name,
                    display_name: body.name,
                    email: body.email,
                    password: body.password
                })
                // hash password, then save in DB
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) throw err;
                        newUser.password = hash;
                        newUser
                            .save()
                            .then((user) => {
                                // TODO: Create a session, return the id in the authorization header.
                                console.log("New user is: %o", user);
                                res.status(200).json(user)
                            })
                            .catch(err => console.log(err));
                    })
                })

            }
        });

    // if it is:
    // // fail, point to login

    // if it isn't:
    // hash the password
    // store pw in db
    // create a session
    // return the session id
});

// @route POST /api/users/delete
// @desc Delete a user. Requires admin API keys in request header.
// @access private

router.post("/delete", function (req, res) {

    const body: DeleteUserPayload = req.body;
    const auth_header: string = req.headers.authentication;

    console.log("body was: %o", body);
    console.log("auth header was: %o", auth_header);

    let validAdminKeys: boolean = (auth_header === admin_keys);

    if (validAdminKeys) {
        User.deleteMany({
            email: body.email
        }).then(outcome => {
            if (outcome.ok === 1 && outcome.deletedCount > 0) {
                return res.status(200).json({ message: `User ${body.email} deleted.` });
            } else {
                return res.status(400).json({ message: `User ${body.email} *was not* deleted.` })
            }
        })   
    } else {
        return res.status(403).json({ message: "Invalid API keys." })
    }

    
});

module.exports = router;
