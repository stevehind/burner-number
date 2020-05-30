
const validateEmail = require('../../utils/validateEmail');

// Emails to test
let valid_email = 'steve.hind@gmail.com'
let invalid_no_at = 'steve.hindgmail.com'
let invalid_no_domain = 'steve.hind@gmail'
let invalid_no_address = '@gmail.com'
let invalid_escape_chars = '\steve.hind@gmail.com'
let no_email = ''

beforeEach((done) => {
    done();
})

afterEach((done) => {
    done();
})

test ('validateEmail accepts valid email address', (done) => {
    const result = validateEmail(valid_email)
    const expected = {
        isValid: true,
        error: ""
    }
    expect(result).toMatchObject(expected)
    done();
})

test ('validateEmail does not accept an email without an @ sign', (done) => {
    const result = validateEmail(invalid_no_at)
    const expected = {
        isValid: false,
        error: 'Email is invalid.'
    }
    expect(result).toMatchObject(expected)
    done();
})

test ('validateEmail does not accept an empty email.', (done) => {
    const result = validateEmail(no_email)
    const expected = {
        isValid: false,
        error: 'Email field is required.'
    }
    expect(result).toMatchObject(expected)
    done();
})

const validateEmailTest = function(test_description, test_input, expected_result) {
    test(test_description, (done) => {
        const result = validateEmail(test_input)
        expect(result).toMatchObject(expected_result) 
        done();
    })
}

validateEmailTest(
    'validateEmail rejects an email with no domain',
    invalid_no_domain,
    {
        isValid: false,
        error: 'Email is invalid.'
    }
)
