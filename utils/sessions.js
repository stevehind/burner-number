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
    // TODO: Should check the expiry date is < today, as well as that there's a session at all.
    .then(session => {
        if (session) {
            let response = {
                isValid: true,
                user_id: session.user_id
            }
            
            return response;
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