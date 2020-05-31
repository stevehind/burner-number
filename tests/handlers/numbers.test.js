const createAccount = require('../../handlers/numbers').createAccount;

// DB Config
const mongoose = require('mongoose');
const db = require('../../config/keys').mongoURI_dev;

const Session = require("../../models/Session");

// Connect to and disconnect from database
beforeAll((done) => {
    // Connect to MongoDB
    return mongoose
    .connect(
        db,
        { 
        useNewUrlParser: true,
        useUnifiedTopology: true
        }
    )
    .then(() => {
        done();
    })
    .catch(err => console.log(err));
})

afterAll(() => {
    return mongoose.connection.close();
})

// Instantiate object variables
let valid_non_expired_session;

// Before and after each test - create and remove sessions
beforeEach((done) => {
    valid_non_expired_session = new Session({
        user_id: '5eb75d46d0a0f2cf088f546f'
    })
    
    db_entries = [
        valid_non_expired_session,
    ]

    return Promise.all(db_entries
        .map(entry => {
            return entry.save()
            .then(() => {
            })
            .catch(error => console.log("Error: %o", error));
        })
    ).then(promise => {return done()});
})

afterEach((done) => {
    return Session.remove({})
    .then(result => {
        done();
    });
})

let descriptions = [
    'createAccount returns 400 when there is no email provided in request body',
    'createAccount returns 400 when the email in the request doesn`t pass email validation',
    'createAccount returns 400 when the user_id already has a Twilio sub-account',
    'crateAccount saves a new NumberAccount database object when given valid token and email address'

]