const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/task');
const auth = require('../middleware/auth');

const router = new express.Router();

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    // const task = new Task(req.body);

    try {
        const createdTask = await task.save();
        res.status(201).send(createdTask);
    } catch(error) {
        res.status(400).send(error);
    }

    // task.save()
    //     .then(task => res.status(201).send(task))
    //     .catch(error => res.status(400).send(error));
});

router.get('/tasks', auth, async (req, res) => {
    const match = {};
    const sort = {};

    if (req.query.completed && ['true', 'false'].includes(req.query.completed))
        match.completed = req.query.completed;

    if (req.query.sort) {
        const parts = req.query.sort.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    try {
        /** Option 1 */
            // const tasks = await Task.find({ owner: req.user._id });
            // res.send(tasks);
        
        /** Option 2 */
            await req.user.populate({
                path: 'tasks',
                match,
                options: {
                    limit: parseInt(req.query.limit),
                    skip: parseInt(req.query.skip),
                    sort
                }
            }).execPopulate();
            res.send(req.user.tasks);
    } catch (error) {
        res.status(500).send();
    }


    // Task.find()
    //     .then(tasks => res.send(tasks))
    //     .catch(error => res.status(500).send());
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    try {
        // const task = await Task.findById(_id);
        const task = await Task.findOne({ _id, owner: req.user._id });
        if (!task) return res.status(404).send();
        res.send(task);
    } catch (error) {
        if (error instanceof mongoose.CastError) return res.status(404).send();
        res.status(500).send();
    }

    // Task.findById(_id)
    //     .then(task => {
    //         if (!task) return res.status(404).send();
    //         res.send(task);
    //     })
    //     .catch(error => {
    //         if (error instanceof mongoose.CastError) return res.status(404).send();
    //         res.status(500).send();
    //     });
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const allowedUpdates = ['description', 'completed'];
    const updates = Object.keys(req.body);
    const isValidUpdate = updates.every(update => allowedUpdates.includes(update));
    if (!isValidUpdate) return res.status(400).send({ error: 'Invalid update!'});
    
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        // const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).send();
        
        updates.forEach(update => task[update] = req.body[update]);
        
        await task.save();
        res.send(task);
    } catch (error) {
        res.status(400).send();
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        // const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) return res.status(404).send();
        res.send(task);
    } catch (error) {
        if (error instanceof mongoose.CastError) res.status(404).send();
        res.status(500).send();
    }
})

module.exports = router;