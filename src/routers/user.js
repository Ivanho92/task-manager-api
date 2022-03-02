const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer'); // File upload support
const sharp = require('sharp'); // File resizing and formatting
const auth = require('../middleware/auth');
const User = require('../models/user');
const { sendWelcomeEmail, sendCancelFollowUpEmail} = require('../emails/account');

const router = new express.Router();

/** User Login Routes */
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (error) {
        res.status(400).send();
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
})

/** User CRUD Routes */
router.post('/users', async (req, res) => {
    const user = new User(req.body);
    
    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();    
        res.status(201).send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
});

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

router.get('/users/:id', async (req, res) => {
    const _id = req.params.id;

    try {
        const user = await User.findById(_id);
        if (!user) return res.status(404).send();
        res.send(user);
    } catch (error) {
        if (error instanceof mongoose.CastError) return res.status(404).send();
        res.status(500).send(error);
    }
})

router.patch('/users/me', auth, async (req, res) => {
    const allowedUpdates = ['name', 'age', 'email', 'password'];
    const updates = Object.keys(req.body);
    const isValidUpdate = updates.every(update => allowedUpdates.includes(update));
    if (!isValidUpdate) return res.status(400).send({ error: 'Invalid update!' });

    try {       
        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();
        res.send(req.user);
    } catch (error) {
        res.status(400).send(error);
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        sendCancelFollowUpEmail(req.user.email, req.user.name);
        res.send(req.user);
    } catch (error) {
        if (error instanceof mongoose.CastError) return res.status(404).send();
        res.status(500).send();
    }
})

/** Upload files routes */
const upload = multer({ 
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/))
            return callback(new Error('Only images (jpg, jpeg, png) can be uploaded!'));
        callback(undefined, true);
    }
});
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send({ success: 'Avatar has been deleted!' });
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user || !user.avatar) throw new Error();
        res.set('Content-Type', 'image/png');
        res.send(user.avatar); 
    } catch (error) {
        res.status(404).send();
    }
})

module.exports = router;