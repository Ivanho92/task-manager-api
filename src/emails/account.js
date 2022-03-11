const sgMail = require('@sendgrid/mail');

const sgApiKey = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(sgApiKey);

function sendWelcomeEmail (email, name) {
    sgMail.send({
        to: email,
        from: 'ivanho92@hotmail.be',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    })
    .catch(error => console.error(error))
}

function sendCancelFollowUpEmail (email, name) {
    sgMail.send({
        to: email,
        from: 'ivanho92@hotmail.be',
        subject: 'We\'re sad you\'re leaving :( ...',
        text: `${name}, why are you leaving us ? Can we help you somehow ?`
    })
    .catch(error => console.error(error))
}

module.exports = {
    sendWelcomeEmail,
    sendCancelFollowUpEmail
}