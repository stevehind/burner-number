import React from 'react';
import ManagePaymentButton from '../../client/src';

let container = null;
beforeEach(() => {
  // setup a DOM element as a render target
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  // cleanup on exiting
  unmountComponentAtNode(container);
  container.remove();
  container = null;
});

it("Changes the state when the button is clicked", () => {
    //TODO - how to mock a button being pressed?
    // "https://jestjs.io/docs/en/tutorial-jquery"
})