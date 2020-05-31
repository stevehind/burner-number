const returnOrCreateContact = require('../../utils/contacts').returnOrCreateContact;

const mongoose = require('mongoose');

// DB Config
const db = require('../../config/keys').mongoURI_dev;

const Contact = require("../../models/Contact");

const valid_id = mongoose.Types.ObjectId();
const invalid_id = mongoose.Types.ObjectId();

let valid_full_contact_payload = {
    user_id: '5eb75d46d0a0f2cf088f546f',
    display_name: 'Mrs Foo Bar',
    number: '+18574988547'
}

let valid_partial_contact_payload = {
    user_id: '5eb75d46d0a0f2cf088f546f',
    number: '+18574988547'
}

let invalid_user_id_contact_payload = {
    user_id: 'foo bar',
    number: '+18574988547'
}

let invalid_number_contact_payload = {
    user_id: '5eb75d46d0a0f2cf088f546f',
    number: 'foo bar'
}

let valid_existing_contact_payload = {
    user_id: '5eb75d46d0a0f2cf088f546f',
    display_name: 'Mr Foo Bar',
    number: '+16175288447'
}


let valid_existing_contact;
let db_entries;

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

beforeEach((done) => {
    valid_existing_contact = new Contact(valid_existing_contact_payload);
    
    db_entries = [
        valid_existing_contact
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
    return Contact.remove({})
    .then(result => {
        done();
    });
})

test ('returnOrCreateContact creates a contact when given a full number, user_id, display_name payload', (done) => {
    returnOrCreateContact(valid_full_contact_payload)
    .then(result => {
        const expected = {
            created: true,
            number: valid_full_contact_payload.number,
            user_id: valid_full_contact_payload.user_id
        }
        expect(result).toMatchObject(expected);
    })
    .finally(() => done());
})

test('returnOrCreateContact creates a contact when given a payload of only number and user_id', (done) => {
    returnOrCreateContact(valid_partial_contact_payload)
    .then(result => {
        const expected ={
            created: true,
            number: valid_partial_contact_payload.number,
            user_id: valid_partial_contact_payload.user_id
        }
        expect(result).toMatchObject(expected);
    })
    .finally(() => done());
})

test ('returnOrCreateContact does not create a contact when given a payload matching an existing contact', (done) => {
    returnOrCreateContact(valid_existing_contact)
    .then(result => {
        const expected = {
            created: false,
            number: valid_existing_contact_payload.number,
            user_id: valid_existing_contact_payload.user_id
        }
        expect(result).toMatchObject(expected);
    })
    .finally(() => done());
})

test ('returnOrCreateContact returns and error message when the user_id passed is invalid.', (done) => {
    returnOrCreateContact(invalid_user_id_contact_payload)
    .then(result => {
        const expected = {
            created: false,
            message: "Invalid user_id."
        }
        expect(result).toMatchObject(expected);
    })
    .finally(() => done());
})

// TODO: Write a test for whether the phone number is valid.