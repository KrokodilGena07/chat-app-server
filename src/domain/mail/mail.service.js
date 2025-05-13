const nodemailer = require('nodemailer');

class MailService {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    async sendMail(to, link) {
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject: `Registration on ${process.env.API_URL}`,
            html: `<a href='${link}'>${link}</a>`
        });
    }
}

module.exports = new MailService();