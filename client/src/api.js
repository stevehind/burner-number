// @flow

import axios from 'axios';

type userAuthToken = string;

const HOST: string = 'http://localhost:3000/';

// TODO: this is fairly boilerplate - needs to be updated.
// TODO: It should return a url which the user is redirected to.
// TODO: Define a type that reprsents the response from Stripe, attach to `res` below.
const getCustomerPortalRedirect = (data: userAuthToken) => {
    return axios.post(`${HOST}/customer-portal`, data)
    .then((res) => {
        if (res.status === 200) {
            return res.data;
        } else if (res.status === 400) {
            return { error: res.error };
        } else {
            return res.data
        }
    })
    //TODO: Type `data` below. Will be server response.
    .then((data) => {
        if (!data || data.error) {
            throw Error ("Error is: %o", data);
        } else {
            //TODO: May want to just return the URL, not the entire response body
            return data;
        }
    })
}