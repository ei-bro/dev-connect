const express = require('express');
const router = express.Router();
const User = require('../../model/User')
const auth = require("../../middleware/auth")
const { body, validationResult } = require('express-validator');

// @route   GET api/auth
// @desc    Register users route
// @access  Public

router.get("/", auth, async (req, res) => {

    try {
        const user = await User.findById(req.user.userId).select("-password")
        res.status(200).json({ user })
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ errors: [{ msg: "server error, please try agian" }] })
    }
})


// @route   GET api/auth/login
// @desc    Register user
// @access  Public
router.post('/login', [
    body('email', "invalid email").isEmail(),
    body('password', "password is required!").exists(),
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] })
        }
        const isPasswordCorrect = await user.comparePassword(password)
        if (!isPasswordCorrect) {
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] })
        }

        const token = user.createJWT()

        res.status(200).json({ token })
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ errors: [{ msg: "server error, please try agian" }] })
    }
}
);

module.exports = router