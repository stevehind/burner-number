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

const valid_non_expired_session = new Session({
    user_id: 'foo bar' //TODO: add a real user_id
})

const valid_expired_session = new Session({
    user_id: 'foo bar',
    created: two_days_ago,
    expires: one_day_ago
})

const invalid_session = new Session({
    user_id: 'bar foo'
})

const db_entries = [
    valid_non_expired_session,
    valid_expired_session,
    invalid_session
]

// Need to work on this. https://jestjs.io/docs/en/setup-teardown

beforeAll(() => {
    return mongoose
    .connect(
        db,
        { 
        useNewUrlParser: true,
        useUnifiedTopology: true
        }
    )
    .then(() => console.log("MongoDB successfully connected"))
    .catch(err => console.log(err));
})

afterAll(() => {
    return mongoose.connection.close();
})

beforeEach(() => {
    return Promise.all(db_entries
        .map(entry => {
            return entry.save()
            .then(() => console.log("Entry added to test db"))
            .catch(error => console.log("Error: %o", error));
        })
    )
})

afterEach(() => {
    return Session.remove({})
    .then(result => {
        console.log("Database cleared.");
    });
})

test('it validates a valid id', (done) => {
    validateSession(valid_non_expired_session._id)
    .then(result => {
        expect(result.isValid).toBe(true);
        expect(result.user_id).toBe('foo bar');
        done();
    })
});

test('it invalidates a valid id that has expires', (done) => {
    validateSession(valid_expired_session._id)
    .then(result => {
        expect(result.isValid).toBe(false);
        expect(result.user_id).toBe('foo bar');
        done();
    })
});