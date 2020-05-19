// @flow
// $FlowFixMe
const express = require('express');
// $FlowFixMe
const mongoose = require('mongoose');
// $FlowFixMe
const bodyParser = require('body-parser');

const users = require('./routes/api/users');
const numbers = require('./routes/api/numbers');
const messages = require('./routes/api/messages');

const app = express();

// Bodyparser middleware
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(bodyParser.json());

// DB Config
const db = require("./config/keys").mongoURI;

// Connect to MongoDB
mongoose
.connect(
    db,
    { 
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  )
.then(() => console.log("MongoDB successfully connected"))
.catch(err => console.log(err));

app.get("/", (req, res) => {
  return res.status(200).json({ message: "The server is running." })
});

// Routes
app.use("/api/users", users);
app.use("/api/numbers", numbers.router);
app.use("/api/messages", messages);

// Basic setup  
const port = process.env.PORT || 5000; // process.env.port is Heroku's port if you choose to deploy the app there

app.listen(port, () => console.log(`Server up and running on port ${port} !`));
