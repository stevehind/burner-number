const validateSession = require('../../utils/sessions').validateSession;
const createSession = require('../../utils/sessions').createSession;

const mongoose = require('mongoose');

// DB Config
const db = require('../../config/keys').mongoURI_dev;

const Session = require("../../models/Session");

const date = new Date();
const one_day_ago = date.setDate(date.getDate() - 1);
const two_days_ago = date.setDate(date.getDate() - 2);

const valid_id = mongoose.Types.ObjectId();
const invalid_id = mongoose.Types.ObjectId();

// Need to work on this. https://jestjs.io/docs/en/setup-teardown

let valid_non_expired_session
let valid_expired_session
let invalid_session
let db_entries

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
        console.log("MongoDB successfully connected");
        done();
    })
    .catch(err => console.log(err));
})

afterAll(() => {
    return mongoose.connection.close();
})

beforeEach((done) => {
    valid_non_expired_session = new Session({
        user_id: '5eb75d46d0a0f2cf088f546f'
    })
    
    valid_expired_session = new Session({
        user_id: '5eb75d46d0a0f2cf088f546f',
        created: two_days_ago,
        expires: one_day_ago
    })
    
    invalid_session = new Session({
        user_id: 'bar foo'
    })
    
    db_entries = [
        valid_non_expired_session,
        valid_expired_session,
        invalid_session
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

// Tests for validateSession
test('validateSession validates a valid id', (done) => {
    validateSession(valid_non_expired_session._id)
    .then(result => {
        expect(result.isValid).toBe(true);
        expect(result.user_id).toBe('5eb75d46d0a0f2cf088f546f');
        done();
    })
    .finally(() => done())
});

test('validateSession invalidates a valid id that has expired', (done) => {
    validateSession(valid_expired_session._id)
    .then(result => {
        expect(result.isValid).toBe(false);
        expect(result.user_id).toBe('');
        done();
    })
    .finally(() => done());
});

test('validateSession invalidates a non-existent session token', (done) => {
    validateSession('nonsense session id')
    .then(result => {
        expect(result.isValid).toBe(false);
        expect(result.user_id).toBe('');
    })
    .finally(() => done());
})

// Tests for createSession
// Break up and be granular.

// inputs
let a_test = 'it takes a random string and fails to create the session.'
let b_test = 'it takes a user_id Object and creates the session.'
let c_test = 'it takes a user_id String and fails to create the session.'

test('createSession takes a user_id String and creates the session', (done) => {
    createSession('5eb75d46d0a0f2cf088f546f')
    .then(result => {
        expect(result).toBeInstanceOf(Session);
    })
    .finally(() => done());
})

test('createSession takes a user_id Object and creates the session', (done) => {
    createSession(valid_non_expired_session.user_id)
    .then(result => {
        expect(result).toBeInstanceOf(Session);
    })
    .finally(() => done());
})

test('createSession rejects an invalid user_id', (done) => {
    createSession('foo bar')
    .then(result => {
        expect(result).toBe('Invalid user_id.');
    })
    .finally(() => done());
})

test('createSession returns an expiry date approx 30 days from now', (done) => {
    createSession(valid_non_expired_session.user_id)
    .then(result => {
        let expiry_interval = result.expires - result.created;
        let approx_thirty_days_in_secs_nano = 30 * 24 * 60 * 60 * 1000
        expect(expiry_interval).toBeCloseTo(approx_thirty_days_in_secs_nano, -1);
    })
    .finally(() => done());
})