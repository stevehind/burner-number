// @flow
const mongoose = require('mongoose');
const {Types: {ObjectId}} = mongoose;

//Helper to check if an ID is an object ID
mongoose.isObjectId = function(id) {
    return (id instanceof ObjectId);
  };

//Helper to validate a string as object ID
mongoose.isValidObjectIdOrStringInSameFormat = function(str) {
    if (mongoose.isObjectId(str)) {
        console.log("Id was an Id")
        return true
    } else if (typeof str !== 'string') {
        console.log("Id was not a string")
        return false
    } else {
        console.log("Id was a string")
        return str.match(/^[a-f\d]{24}$/i);
    }
};

type sessionValidationResponse = {
    isValid: boolean,
    user_id: string
}

const Session = require("../models/Session");

const createSession = (validatedUserId: string) => {
    const newSession = new Session({
        user_id: validatedUserId
    });

    return newSession.save()
    .then(session => {
        return session;
    })
    .catch(err => {
        console.log(err);
        return 'Failed to create new session.'
    });
}

const validateSession = (session_id: string): Promise<sessionValidationResponse> => {
    if (mongoose.isValidObjectIdOrStringInSameFormat(session_id)) {
        return Session.findOne({ _id: session_id })
        .then(session => {
            if (session) {
                const right_now = Date.now();

                if (session.expires > right_now) {
                    return {
                        isValid: true,
                        user_id: session.user_id
                    }
                } else {
                    return {
                        isValid: false,
                        user_id: ''
                    }
                }
            } else {
                return {
                    isValid: false,
                    user_id: ''
                }
            }
        })
    } else {
        return Promise.resolve({
            isValid: false,
            user_id: ''
        })
    }   
}

const sessions = {
    createSession: createSession,
    validateSession: validateSession
}

module.exports = sessions;