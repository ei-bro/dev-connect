const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Profile = require("../../model/Profile");
const User = require('../../model/User');

const request = require('request');

// @route   GET api/profile/test
// @desc    Tests profile route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: 'Profile Works' }));




// @route   POST api/profile
// @desc    Create or edit user profile
// @access  Private
router.post("/", [auth, [
    body('status', "status is reqiured").not().isEmpty(),
    body('skills', "skils is reqiured").not().isEmpty(),
]], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Get fields
    const profileFields = {};
    profileFields.user = req.user.userId;
    if (req.body.handle) profileFields.handle = req.body.handle;
    if (req.body.company) profileFields.company = req.body.company;
    if (req.body.website) profileFields.website = req.body.website;
    if (req.body.location) profileFields.location = req.body.location;
    if (req.body.bio) profileFields.bio = req.body.bio;
    if (req.body.status) profileFields.status = req.body.status;
    if (req.body.githubusername)
        profileFields.githubusername = req.body.githubusername;
    // Skills - Spilt into array
    if (req.body.skills) {
        profileFields.skills = req.body.skills.split(',').map((skill) => skill.trim())
    }

    // Social
    const { instagram,
        linkedin,
        telegram,
        whatsApp
    } = req.body

    profileFields.social = {};
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (telegram) profileFields.social.telegram = telegram;
    if (whatsApp) profileFields.social.whatsApp = whatsApp

    try {
        let profile = await Profile.findOne({ user: profileFields.user })
        if (profile) {
            // update
            profile = await Profile.findOneAndUpdate({ user: profileFields.user }, { $set: profileFields }, { new: true })
            return res.status(201).json(profile)
        }
        else {
            profile = new Profile(profileFields)
            await profile.save()
            return res.status(201).json(profile)
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ errors: [{ msg: "server error, please try agian" }] })
    }

})


// @route   GET api/profile/all
// @desc    Get all profiles
// @access  Public
router.get("/all", async (req, res) => {
    try {
        const profile = await Profile.find().populate('user', ["name", "avatar"])
        res.status(200).json(profile)
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ errors: [{ msg: "server error, please try agian" }] })
    }
})

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get("/user/:user_id", async (req, res) => {
    const { user_id } = req.params
    try {
        const profile = await Profile.findOne({ user: user_id }).populate('user', ["name", "avatar"])
        if (!profile) {
            return res.status(404).json({ msg: "There is no profile for this user" })
        }
        return res.status(200).json(profile)
    } catch (error) {
        if (error.kind == "ObjectId") {
            return res.status(404).json({ msg: "There is no profile for this user" })
        }
        console.log(error.message);
        return res.status(500).json({ errors: [{ msg: "server error, please try agian" }] })
    }
})

// @route   DELETE api/profile
// @desc    Delete user and profile
// @access  Private

router.delete('/', auth, async (req, res) => {
    try {

        // @todo -remove users posts

        // remove profile
        await Profile.findOneAndRemove({ user: req.user.userId })

        // remove user
        await User.findOneAndRemove({ _id: req.user.userId })
        return res.json({ msg: "User deleted" })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ errors: [{ msg: "server error, please try agian" }] })
    }

})


// ################ EXPERIENCE ################



// @route   POST api/profile/experience
// @desc    Add experience to profile
// @access  Private
router.put('/experience', [auth, [
    body("title", "Title is required").not().isEmpty(),
    body("company", "Company is required").not().isEmpty(),
    body("from", "From date is required").not().isEmpty(),
]], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const { title, company, to, current, location, from, description } = req.body
    const newExp = { title, company, to, current, location, from, description }
    try {
        const profile = await Profile.findOne({ user: req.user.userId })
        profile.experience.unshift(newExp);
        await profile.save()
        return res.status(200).json(profile)
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ errors: [{ msg: "server error, please try agian" }] })
    }
})


// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.userId })

        // Get remove index
        const removeIndex = profile.experience
            .map(item => item.id)
            .indexOf(req.params.exp_id);
        if (removeIndex == -1) {
            return res.status(200).json(profile)
        }
        profile.experience.splice(removeIndex, 1)
        await profile.save()

        return res.status(200).json(profile)
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ errors: [{ msg: "server error, please try agian" }] })
    }
})


// ################ EDUCATION ################


// @route   POST api/profile/education
// @desc    Add educarion to profile
// @access  Private
router.put('/education', [auth, [
    body("school", "School is required").not().isEmpty(),
    body("degree", "Degree is required").not().isEmpty(),
    body("fieldofstudy", "Field of study is required").not().isEmpty(),
    body("from", "From date is required").not().isEmpty(),
]], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const { school, degree, to, current, fieldofstudy, from, description } = req.body
    const newEdu = { school, degree, to, current, fieldofstudy, from, description }
    try {
        const profile = await Profile.findOne({ user: req.user.userId })
        profile.education.unshift(newEdu);
        await profile.save()
        return res.status(200).json(profile)
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ errors: [{ msg: "server error, please try agian" }] })
    }
})


// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.userId })

        // Get remove index
        const removeIndex = profile.education
            .map(item => item.id)
            .indexOf(req.params.edu_id);
        if (removeIndex == -1) {
            return res.status(200).json(profile)
        }
        profile.education.splice(removeIndex, 1)
        await profile.save()
        return res.status(200).json(profile)
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ errors: [{ msg: "server error, please try agian" }] })
    }
})




// ################ GIT HUB ################


// @route   GET api/profile/github/:username
// @desc    Get user repo from Github 
// @access  Public

router.get("/github/:username", async (req, res) => {
    const { username } = req.params
    try {
        const options = {
            uri: `https://api.github.com/users/${username}/repos?per_page=5&sort=created:asc&client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_SECRET}`,
            method: "GET",
            headers: { 'user-agent': 'node.js' }
        }

        request(options, (err, response, body) => {
            if (err) {
                console.log(err);
            }
            if (response.statusCode !== 200) {
                return res.status(404).json({ msg: "No Gihub profile found" })
            }
            return res.json(JSON.parse(body))
        })

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ errors: [{ msg: "server error, please try agian" }] })
    }

})


module.exports = router;
