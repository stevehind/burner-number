//@flow

import React, { Component } from 'react';
import './App.css';

type client_portal_call_status_type = 'Not called yet' | 'Waiting for response' | 'Succeeded' | 'Failed'

class ManagePaymentButton extends Component {

    constructor(props){
        super(props);

        // TODO: How do you declare Flow types when using state?
        this.state = {
            called_client_portal: false,
            client_portal_call_status: 'Not called'
        }

        this.callClientPortal = this.callClientPortal.bind(this);

    }

    async callClientPortal(ev) {
        ev.preventDefault();

        this.setState({
            called_client_portal: true,
            client_portal_call_status: 'Waiting for Response'
        })
    }

    render() {
        return(
            <div>
                <button onClick={this.callClientPortal}>Manage subscription and payment method.</button>
            </div>
        )
    }

}

export default ManagePaymentButton;