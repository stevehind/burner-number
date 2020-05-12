// @flow
// $FlowFixMe
const express = require('express');
// $FlowFixMe
const bcrypt = require('bcryptjs');
// $FlowFixMe
const crypto = require('crypto');

const router = express.Router();

const admin_keys = require('../../config/keys').adminAPIkey;
const createSession = require('../../utils/sessions').createSession

const validateEmail = require('../../utils/validateEmail');

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

type RegisterPayload = {
    name: string,
    email: string,
    password: string,
    password2: string
}

type LoginPayload = {
    email: string,
    password: string
}

type DeleteUserPayload = {
    email: string
}

// @route POST /api/users/register
// @desc Register a user. Return a session token.
// @access public
router.post("/register", function (req, res) {
    
    // parse the request
    const body: RegisterPayload = req.body;

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
                });

                // hash password, then save in DB
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) throw err;
                        newUser.password = hash;
                        newUser
                            .save()
                            .then((user) => {
                                // create a session and return its id
                                return createSession(user._id)
                                .then(session => {
                                    let auth_header = { Authentication: session };
                                    return res.status(200).set(auth_header).json(user);  
                                })
                                .catch(err => {
                                    return res.status(400).json({ error: 'Session creation failed.' })
                                });
                            })
                            .catch(err => console.log(err));
                    })
                })
            }
        });
});

// @route POST /api/users/delete
// @desc Delete a user. Requires admin API keys in request header.
// @access private
router.post("/delete", function (req, res) {

    const body: DeleteUserPayload = req.body;
    const auth_header: string = req.headers.authentication;

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

// @route POST /api/users/login
// @desc Log in a user. Return a session token.
// @access private
router.post("/login", function (req, res) {

    const body: LoginPayload = req.body;
    console.log("body is: %o", body);

    // TODO validate the payload

    // is there a user with this email?
    // find email in Users DB
    User.findOne({ email: body.email })
    .then(user => {
        if (!user) {
            res.status(400).json({ error: 'No user with this email exists. Please register or try again.' });
        } 

        console.log("User: %o", user);
        // check if the passwords match
        bcrypt.compare(body.password, user.password)
        .then(isMatch => {
            if (isMatch) {
                console.log('isMatch: %o', isMatch);
                // create a session and return its id
                return createSession(user._id)
                .then(session => {
                    let auth_header = { Authentication: session };
                    return res.status(200).set(auth_header).json(user);  
                })
                .catch(err => {
                    return res.status(400).json({ error: 'Session creation failed.' })
                });
            } else {
                return res.status(400).json({ error: 'Incorrect password. Try again.' });
            }
        })    
    });
});

module.exports = router;
