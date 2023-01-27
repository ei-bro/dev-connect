const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const User = require("../../model/User");

const { body, validationResult } = require('express-validator');

// @route   GET api/users/test
// @desc    Register users route
// @access  Public
router.get('/test', (req, res) => {
    res.json({ msg: 'Users Works' }
    )
}
);


// @route   GET api/users/register
// @desc    Register user
// @access  Public
router.post('/register', [
    body('name', "name is reqiured").not().isEmpty(),
    body('email', "invalid email").isEmail(),
    body('password', "please enter a password with 6 or more character").isLength({ min: 6 }),
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, email, password } = req.body;
        const avatar = gravatar.url(email, {
            s: '200', // Size
            r: 'pg', // Rating
            d: 'mm' // Default
        });
        const userExists = await User.findOne({ email })
        if (userExists) {
            return res.status(400).json({ errors: [{ msg: 'User already exists' }] })
        }
        const user = await User.create({ name, email, avatar, password });
        const token = user.createJWT();
        res.status(201).json({
            result: [{
                user: {
                    name: user.name,
                    email: user.email,
                    token
                }
            }]
        })
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ errors: [{ msg: "server error, please try agian" }] })
    }
}
);



module.exports = router;
