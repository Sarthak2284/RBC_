const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();
const indexRouter = require('./routes/index');
const session = require('express-session');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/royalBikeClub', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Set up EJS and static files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'secret',  // You can change this to your actual secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Should be true if using HTTPS
}));

// Use the router for handling routes
app.use('/', indexRouter);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
