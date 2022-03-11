const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const Task = require('../src/models/task');
const { 
    userOne, 
    userTwo, 
    taskOne, 
    setupDatabase 
} = require('./fixtures/db');

beforeEach(setupDatabase);

afterAll( () => {
    mongoose.connection.close();
});

test('Should create task for user', async () => {
    const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'New task from my automated test case!'
        })
        .expect(201);
    
    // Assert task is indeed in db
    const task = await Task.findById(response.body._id);
    expect(task).toMatchObject({
        description: 'New task from my automated test case!',
        completed: false,
        owner: userOne._id
    })
});

test('Should fetch all user tasks', async () => {
    const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);

    // Assert number of tasks for user one is 2
    expect(response.body.length).toBe(2);
});

test('Should not delete other users tasks', async () => {
    await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(404);

    // Assert task is still in database
    const task = await Task.findById(taskOne._id);
    expect(task).not.toBeNull();
});

//
// Extra tasks tests ideas...
//
// Should not create task with invalid description/completed
// Should not update task with invalid description/completed
// Should delete user task
// Should not delete task if unauthenticated
// Should not update other users task
// Should fetch user task by id
// Should not fetch user task by id if unauthenticated
// Should not fetch other users task by id
// Should fetch only completed tasks
// Should fetch only incomplete tasks
// Should sort tasks by description/completed/createdAt/updatedAt
// Should fetch page of tasks