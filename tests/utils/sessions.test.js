const validateSession = require('../../utils/sessions').validateSession;

const mongoose = require('mongoose');

// DB Config
const db = require('../../config/keys').mongoURI_dev;

// Connect to MongoDB
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
        user_id: 'foo bar' //TODO: add a real user_id
    })
    
    valid_expired_session = new Session({
        user_id: 'foo bar',
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
        console.log("Database cleared.");
        done();
    });
})

// Tests for validateSession
test('it validates a valid id', (done) => {
    validateSession(valid_non_expired_session._id)
    .then(result => {
        expect(result.isValid).toBe(true);
        expect(result.user_id).toBe('foo bar');
        done();
    })
    .finally(() => done())
});

test('it invalidates a valid id that has expired', (done) => {
    validateSession(valid_expired_session._id)
    .then(result => {
        expect(result.isValid).toBe(false);
        expect(result.user_id).toBe('');
        done();
    })
    .finally(() => done());
});

test('it invalidates a non-existent session token', (done) => {
    validateSession('nonsense session id')
    .then(result => {
        expect(result.isValid).toBe(false);
        expect(result.user_id).toBe('');
    })
    .finally(() => done());
})

// Tests for createSession
// Break up and be granular.
let first_test = 'it takes a user_id, creates a session and writes to the database, returning a session_id'
let next_test = 'the user_id is random string, it fails to create new session'
