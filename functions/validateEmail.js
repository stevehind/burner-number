// @flow
// $FlowFixMe
const Validator = require('validator');

type validateEmailReturn = {
    error: string,
    isValid: boolean
}

module.exports = function validateEmail(email: string):validateEmailReturn {
    let error:string = '';
    
    if (Validator.isEmpty(email)) {
        error = "Email field is required.";
    } else if (!Validator.isEmail(email)) {
        error = "Email is invalid.";
    }

    return {
        error: error,
        isValid: Validator.isEmpty(error)
    }
}