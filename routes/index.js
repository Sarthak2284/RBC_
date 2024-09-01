const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User'); // Import the User model
const Bike = require('../models/Bike'); // Import the Bike model
const session = require('express-session');

// Home page route
router.get('/', (req, res) => {
    res.render('index'); // Renders the index.ejs view
});

// Register page route
router.get('/register', (req, res) => {
    res.render('register'); // Renders the register.ejs view
});

// Handle user registration form submission
router.post('/create-user', async (req, res) => {
    const { firstName, lastName, email, password, phone, age } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ firstName, lastName, email, password: hashedPassword, phone, age });

        await newUser.save();
        req.session.userName = firstName; // Store username in session

        res.redirect(`/welcome?name=${firstName}`);

    } catch (err) {
        console.error(err);
        res.redirect('/register');
    }
});

// Login page route
router.get('/login', (req, res) => {
    res.render('login'); // Renders the login.ejs view
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userName = user.firstName; // Store username in session
        res.redirect(`/welcome?name=${user.firstName}`);
    } else {
        res.redirect('/login');
    }
});

// Welcome page route
router.get('/welcome', (req, res) => {
    const { name } = req.query;
    res.render('welcome', { name }); // Pass the user's name to the welcome page
});

// Shop page route
router.get('/shop', async (req, res) => {
    try {
        const bikes = await Bike.find(); // Fetch all bikes from the database
        res.render('shop', { bikes }); // Render the shop.ejs view with bike data
    } catch (err) {
        console.error(err);
        res.redirect('/'); // Redirect to home on error
    }
});

// Rent page route
// Rent page route
router.get('/rent', async (req, res) => {
    try {
        const bikes = await Bike.find(); // Fetch all bikes from the database
        res.render('rent', { bikes }); // Pass the bikes data to the EJS template
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// Handle Rent Now button click
router.get('/rent-now', async (req, res) => {
    try {
        const bikes = await Bike.find(); // Fetch all bikes from the database
        res.render('rent-now', { bikes }); // Pass the bikes data to the EJS template
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Route to display a specific bike's details for rent
// Route to display a specific bike's details for rent
router.get('/rent-now/:id', async (req, res) => {
    try {
        const bike = await Bike.findById(req.params.id); // Fetch the bike by ID
        if (!bike) {
            return res.status(404).send('Bike not found');
        }
        res.render('rent-details', { bike }); // Render details page for the single bike
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// Handle checkout for rental
router.post('/rent-now/:id/checkout', async (req, res) => {
    try {
        const bike = await Bike.findById(req.params.id);
        const { days } = req.body;
        const totalPrice = bike.rentalPrice * days;

        // Assuming you have access to the user object from the session or a database
        const user = await User.findOne({ firstName: req.session.userName });

        res.render('checkout', {
            user, // Pass the full user object
            bike,
            numberOfDays: days,
            totalPayment: totalPrice
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Route to display checkout page with bike ID
router.get('/checkout/:id', async (req, res) => {
    try {
        const bikeId = req.params.id;
        const bike = await Bike.findById(bikeId);
        const numberOfDays = req.query.days || 1; // Default to 1 day if not specified
        const totalPayment = bike.rentalPrice * numberOfDays;

        res.render('checkout', {
            userName: req.session.userName, // Retrieve username from session
            bike,
            numberOfDays,
            totalPayment
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// Route to display bike details for purchase
router.get('/buy-now/:id', async (req, res) => {
    try {
        const bike = await Bike.findById(req.params.id);
        if (bike) {
            res.render('buy-now', { bike });
        } else {
            res.redirect('/shop'); // Redirect to shop page if bike not found
        }
    } catch (err) {
        console.error(err);
        res.redirect('/shop'); // Redirect to shop page on error
    }
});

// Route to handle payment for purchase
router.get('/payment', async (req, res) => {
    const bikeId = req.query.bikeId;

    try {
        // Fetch bike information using bikeId
        const bike = await Bike.findById(bikeId);

        if (!bike) {
            return res.status(404).send('Bike not found');
        }

        // Render payment page with bike details
        res.render('payment', {
            bike // Passing the bike object to the template
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Handle payment processing
router.post('/process-purchase', async (req, res) => {
    const { cardName, bikeId } = req.body;

    console.log(`Received bikeId: ${bikeId}`); // Debugging line to check bikeId

    try {
        // Ensure bikeId is valid and of correct type
        if (!bikeId) {
            console.error('Bike ID is missing in the request');
            return res.status(400).send('Bike ID is required');
        }

        const bike = await Bike.findById(bikeId);
        console.log(`Fetched bike: ${bike}`); // Check if bike is fetched correctly

        if (!bike) {
            console.error(`Bike with ID ${bikeId} not found`);
            return res.status(404).send('Bike not found');
        }

        res.render('thank-you', {
            cardName,
            bikeName: bike.name,
            bikePrice: bike.price
        });
    } catch (error) {
        console.error('Error processing purchase:', error);
        res.status(500).send('Internal Server Error');
    }
});
// Handle rental form submission and redirect to payment
router.post('/process-rental', async (req, res) => {
    const { bikeId, days, totalPrice } = req.body;

    try {
        const bike = await Bike.findById(bikeId);
        if (!bike) {
            return res.status(404).send('Bike not found');
        }

        res.render('payment', {
            bike,
            numberOfDays: days,
            totalPayment: totalPrice
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
// Handle rental completion
// Handle rental completion
router.post('/complete-rent', async (req, res) => {
    const { userName, bikeId, numberOfDays, totalPayment } = req.body;

    try {
        const bike = await Bike.findById(bikeId);
        if (!bike) {
            return res.status(404).send('Bike not found');
        }

        res.render('thank-you-rent', {
            userName,
            bike,
            numberOfDays,
            totalPayment
        });
    } catch (err) {
        console.error('Error processing rental:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle rental payment
router.post('/rent-payment', async (req, res) => {
    const { bikeId, days, totalPrice } = req.body;

    try {
        const bike = await Bike.findById(bikeId);
        if (!bike) {
            return res.status(404).send('Bike not found');
        }

        res.render('rent-payment', {
            bike,
            numberOfDays: days,
            totalPayment: totalPrice
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
