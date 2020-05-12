// @flow

type sessionValidationResponse = {
    isValid: boolean,
    user_id: string
}

const Session = require("../models/Session");

const createSession = (validatedUser: string) => {
    const newSession = new Session({
        user_id: validatedUser
    });

    return newSession.save()
    .then(session => {
        return session._id;
    })
    .catch(err => {
        console.log(err);
        return 'Failed to create new session.'
    });
}

const validateSession = (session_id: string): Promise<sessionValidationResponse> => {
    return Session.findOne({ _id: session_id })
    .then(session => {
        if (session) {
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
    })
}

const sessions = {
    createSession: createSession,
    validateSession: validateSession
}

module.exports = sessions;