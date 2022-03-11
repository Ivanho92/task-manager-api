const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const User = require('../src/models/user');
const { userOne, setupDatabase } = require('./fixtures/db');

beforeEach(setupDatabase);

afterAll( () => {
    mongoose.connection.close();
});

test('Should signup a new user', async () => {
    const response = await request(app)
        .post('/users')
        .send({
            name: 'Ivan',
            age: 30,
            email: 'ivan.joel.rodrigues@gmail.com',
            password: 'abcd123456'
        })
        .expect(201);

    // Assert that the database was changed correctly
    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull();

    // Assertions about the response
    expect(response.body).toMatchObject({
        user: {
            name: 'Ivan',
            email: 'ivan.joel.rodrigues@gmail.com'
        },
        token: user.tokens[0].token
    });

    // Assert password is correctly hashed
    expect(user.password).not.toBe('abcd123456');

    // Assert that token in response matches user's generated token
    expect(response.body.token).toBe(user.tokens[0].token);
});

test('Should login existing user', async () => {
    const response = await request(app)
        .post('/users/login')
        .send({
            email: userOne.email,
            password: userOne.password
        })
        .expect(200);

    // Assert that token in response matches user's seecond token
    const user = await User.findById(userOne._id);
    expect(user).not.toBeNull();

    expect(response.body.token).toBe(user.tokens[1].token);
});

test('Should fail login nonexistent user', async () => {
    await request(app)
        .post('/users/login')
        .send({
            email: 'abc@d.com',
            password: 'aaaaaaaaa'
        })
        .expect(400);
});

test('Should get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);
});

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401);
});

test('Should delete account for user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);

    // Assert user is not present in database anymore
    const user = await User.findById(userOne._id);
    expect(user).toBeNull();
});

test('Should not delete account for unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401);
});

test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200);

    // Assert there's a buffer inserted in database
    const user = await User.findById(userOne._id);
    expect(user.avatar).toEqual(expect.any(Buffer));
});

test('Should update valid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'Roberto',
            password: 'carlos123456',
            age: 55
        })
        .expect(200);


    // Assert updated data
    const user = await User.findById(userOne._id);
    expect(user).toMatchObject({
        name: 'Roberto',
        age: 55
    });
});

test('Should not update invalid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            tokens: [],
            _id: 'newID',
            location: 'Brussels'
        })
        .expect(400);
})

//
// Extra user tests ideas...
//
// Should not signup user with invalid name/email/password
// Should not update user if unauthenticated
// Should not update user with invalid name/email/password
// Should not delete user if unauthenticated