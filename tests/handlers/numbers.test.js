const createAccount = require('../../handlers/numbers').createAccount;
const deleteAccount = require('../../handlers/numbers').deleteAccount;

// Load twilio functions
const twilio_functions = require("../../vendor/twilio_functions");

// DB Config
const mongoose = require('mongoose');
const db = require('../../config/keys').mongoURI_dev;

const NumberAccount = require("../../models/NumberAccount");
const Session = require("../../models/Session");

// Mock twilio modules
const twilio_funtions = require('../../vendor/twilio_functions');
jest.mock('../../vendor/twilio_functions');

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
let db_entries;
let valid_non_expired_session;
let existing_number_account;

const USER_ID_FOR_DB = '5eb75d46d0a0f2cf088f546f'

// Before and after each test - create and remove sessions
beforeEach((done) => {
    existing_number_account = new NumberAccount({
        user_id: USER_ID_FOR_DB,
        number_account_sid: 'foo bar',
        number_account_auth_token: 'bar foo'
    })
    
    db_entries = [
        existing_number_account
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
    return NumberAccount.deleteMany({})
    .then(result => {
        done();
    });
})

let descriptions = [
    'createAccount returns 400 when the email in the request doesn`t pass email validation',
]

let valid_payload = {
    email: 'valid@email.com',
    user_id: '1fb75d46d0a0f2cf088f546f'
}

let invalid_payload_existing_user_id = {
    email: 'valid@email.com',
    user_id: USER_ID_FOR_DB
}

let invalid_payload_invalid_email = {
    email: 'invalid',
    user_id: '1fb75d46d0a0f2cf088f546f'
}

test ('createAccount saves a new NumberAccount database object when given valid token and email address', (done) => {
    twilio_functions.createTwilioSubAccount.mockResolvedValue({
        sid: 'foo bar',
        authToken: 'bar foo'
    });

    createAccount(valid_payload)
    .then(result => {
        expect(result.body.error).toBe(null);
        expect(result.status).toBe(200);
        expect(result.body.message).toBe('Successfully created number account.')
    })
    .finally(() => done());
});

test ('createAccount does not create a new NumberAccount when one already exists for this user_id', (done) => {
    twilio_functions.createTwilioSubAccount.mockResolvedValue({
        sid: 'foo bar',
        authToken: 'bar foo'
    });

    createAccount(invalid_payload_existing_user_id)
    .then(result => {
        expect(result.status).toBe(400);
        expect(result.body.error).toBe('user_id already has an account.');
        expect(result.body.message).toBe(null);
    })
    .finally(() => done());
})

test('createAccount returns 400 when the email in the request doesn`t pass email validation', (done) => {
    twilio_functions.createTwilioSubAccount.mockResolvedValue({
        sid: 'foo bar',
        authToken: 'bar foo'
    });

    createAccount(invalid_payload_invalid_email)
    .then(result => {
        expect(result.status).toBe(400);
        expect(result.body.error).toBe('Invalid email.');
        expect(result.body.message).toBe(null);
    })
    .finally(() => done());
})

test('createAccount returns 400 and a DB error when the DB returns an error', done => {
    const originalImplementation = NumberAccount.findOne;
    NumberAccount.findOne = jest.fn().mockImplementation((_params) => {
        return {
            then: (cb => {
                try {
                    return Promise.resolve(cb(null, {error: true}));
                } catch(e) {
                    return Promise.reject(e);
                }
            })
        }
    })
    
    // Run test
    createAccount(valid_payload)
    .then(result => {
        expect(result.status).toBe(400);
        expect(result.body.error).toBe('Could not create number account.')
        expect(result.body.message).toBe(null)
    })
    .finally(() => done());

    // Reset NumberAccount
    NumberAccount.findOne = originalImplementation;
})

test('deleteAccount deletes a single account', done => {
    twilio_functions.deleteTwilioSubAccount.mockResolvedValue({
      deleted_successful: true,
      delete_result: {
        id: 'foo bar',
        name: 'bar foo',
        status: 'closed'
      },
      error: null  
    })

    let target_object = [
        {
            id: 'foo bar',
            name: 'bar foo',
            status: 'closed'
        }
    ]

    deleteAccount(['foo bar'])
    .then(result => {
        expect(result.status).toBe(200),
        expect(result.array_of_deleted_accounts).toMatchObject(target_object)
        expect(result.message).toBe('At least one account was deleted.')
    })
    .finally(() => done());
}) 

let test_to_write = 'deleteAccount deletes an array of multiple accounts.'

let another_test_to_write = 'deleteAccount does not delete an account that doesn`t exist'


