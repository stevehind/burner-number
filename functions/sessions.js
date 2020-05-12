// @flow

const Session = require("../models/Session");

async function createSession(validatedUser: string): Promise<string> {
    const newSession = new Session({
        user_id: validatedUser
    });

    let id = await newSession.save()
    .then(session => {
        return session._id;
    })
    .catch(err => {
        console.log(err);
        return 'Failed to create new session.'
    });

    return id;
}

const validateSession = (session_id: string): boolean => {
    return Session.findOne({ _id: session_id })
    .then(session => {
        if (session) {
            return true
        } else {
            return false
        }
    })
}

const sessions = {
    createSession: createSession,
    validateSession: validateSession
}

module.exports = sessions;