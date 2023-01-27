
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Post = require("../../model/Post");
const Profile = require("../../model/Profile");
const User = require('../../model/User');




// @route   GET api/posts/test
// @desc    Tests post route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: 'Posts Works' }));



// @route   POST api/posts
// @desc    Create post
// @access  Private
router.post('/', [auth, [
    body('text', 'Text is rquired').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);

    // Check Validation
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findById(req.user.userId).select('-password')
        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.userId
        })
        const post = await newPost.save()
        return res.json(post)
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ errors: [{ msg: "server error, please try agian" }] })
    }

}
);

// @route   GET api/posts
// @desc    Get all posts
// @access  private
router.get('/', auth, async (req, res) => {
    try {
        const post = await Post.find().sort({ date: -1 })
        res.json(post)
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ errors: [{ msg: "server error, please try agian" }] })
    }
});

// @route   GET api/posts/:id
// @desc    Get post by id
// @access  private
router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
        if (!post) {
            return res.status(404).json({ nopostfound: 'No post found with that ID' })
        }
        return res.json(post)
    } catch (error) {
        if (error.kind == 'ObjectId') {
            return res.status(404).json({ nopostfound: 'No post found with that ID' })
        }
        console.log(error.message);
        res.status(500).json({ errors: [{ msg: "server error, please try agian" }] })
    }
});


// @route   DELETE api/posts/:id
// @desc    Get post by id
// @access  private
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
        if (!post) {
            return res.status(404).json({ msg: 'No post found with that ID' })
        }
        if (post.user.toString() !== req.user.userId) {
            return res.status(401).json({ msg: 'User not authorized' });
        }
        else {
            await post.remove()
            return res.json({ msg: "post deleted" })
        }


    } catch (error) {
        if (error.kind == 'ObjectId') {
            return res.status(404).json({ nopostfound: 'No post found with that ID' })
        }
        console.log(error.message);
        res.status(500).json({ errors: [{ msg: "server error, please try agian" }] })
    }
});


// ################# LIKE #########################

// @route   PUT api/posts/like/:id
// @desc    Like post
// @access  Private
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        if (post.likes.filter(like => like.user.toString() === req.user.userId).length > 0) {
            return res.status(400).json({ msg: 'User already liked this post' });
        }

        // Add user id to likes array
        post.likes.unshift({ user: req.user.userId });
        await post.save()

        return res.json(post.likes)

    } catch (error) {
        if (error.kind == 'ObjectId') {
            return res.status(404).json({ nopostfound: 'No post found with that ID' })
        }
        console.log(error.message);
        res.status(500).json({ errors: [{ msg: "server error, please try agian" }] })
    }

}
);


// @route   POST api/posts/unlike/:id
// @desc    Unlike post
// @access  Private
router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
        if (post.likes.filter(like => like.user.toString() === req.user.userId).length === 0) {
            return res.status(400).json({ msg: 'Post has not yet been liked' });
        }

        // Get remove index
        const removeIndex = post.likes.map(item => item.user.toString()).indexOf(req.user.userId);
        // Splice out of array
        post.likes.splice(removeIndex, 1);
        await post.save()
        return res.json(post.likes)

    } catch (error) {
        if (error.kind == 'ObjectId') {
            return res.status(404).json({ nopostfound: 'No post found with that ID' })
        }
        console.log(error.message);
        res.status(500).json({ errors: [{ msg: "server error, please try agian" }] })
    }

}
);


// ################# COMMENT #########################


// @route   POST api/posts/comment/:id
// @desc    Add comment to post
// @access  Private
router.post('/comment/:id', [auth, [
    body('text', 'Text is rquired').not().isEmpty()
]], async (req, res) => {

    const errors = validationResult(req);
    // Check Validation
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findById(req.user.userId).select('-password')
        const post = await Post.findById(req.params.id)

        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.userId
        }
        // Add to comments array
        post.comments.unshift(newComment);

        await post.save()

        return res.json(post.comments)
    } catch (error) {
        if (error.kind == 'ObjectId') {
            return res.status(404).json({ nopostfound: 'No post found with that ID' })
        }
        console.log(error.message);
        res.status(500).json({ errors: [{ msg: "server error, please try agian" }] })
    }

}
);


// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Remove comment from post
// @access  Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        const comment = post.comments.filter((comment) => comment._id.toString() === req.params.comment_id)
        // make sure comment exists
        if (comment.length == 0) {
            return res.status(404).json({ msg: 'Comment does not exist' });
        }


        //check user 
        if (comment[0].user.toString() !== req.user.userId) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Get remove index
        const removeIndex = post.comments
            .map(comment => comment.user.toString())
            .indexOf(req.user.userId);

        // Splice comment out of array
        post.comments.splice(removeIndex, 1);
        await post.save()

        return res.json(post.comments)
    } catch (error) {
        if (error.kind == 'ObjectId') {
            return res.status(404).json({ msg: 'No post found with that ID' })
        }
        console.log(error.message);
        res.status(500).json({ errors: [{ msg: "server error, please try agian" }] })
    }

}
);



module.exports = router;


