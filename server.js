console.clear();
const mongoose = require("mongoose");
mongoose.set('strictQuery', false);

const express = require('express');
const app = express()
const connectDB = require('./db/connect');
require("dotenv").config();

// routes
const users = require('./routes/api/users');
const profile = require('./routes/api/profile');
const posts = require('./routes/api/posts');
const auth = require("./routes/api/auth")

// middlewares
app.use(express.json());


// Use Routes
app.use('/api/auth', auth);
app.use('/api/users', users);
app.use('/api/profile', profile);
app.use('/api/posts', posts);

const port = process.env.PORT || 5000

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        app.listen(port, () =>
            console.log(`Server is listening on port  ${port}...`)
        );
    } catch (error) {
        console.log(error);
    }
};


start();


