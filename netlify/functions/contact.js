const nodemailer = require('nodemailer');
const https = require('https');

exports.handler = async (event, context) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);
        const { name, email, message, recaptchaToken } = body;

        // 1. Verify ReCaptcha
        if (!recaptchaToken) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Captcha verification failed: No token provided.' })
            };
        }

        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;

        const isHuman = await new Promise((resolve, reject) => {
            https.get(verificationUrl, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    const result = JSON.parse(data);
                    resolve(result.success);
                });
            }).on('error', (err) => {
                reject(err);
            });
        });

        if (!isHuman) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Captcha verification failed. You might be a robot.' })
            };
        }

        // 2. Configure SMTP Transporter
        // Ensure you set these environment variables in Netlify:
        // SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_EMAIL
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // 3. Send Email
        await transporter.sendMail({
            from: `"${name}" <${process.env.SMTP_USER}>`, // From authenticated sender
            replyTo: email, // Reply to the visitor
            to: process.env.CONTACT_EMAIL || 'contact@diakore.com',
            subject: `New Website Inquiry: ${name}`,
            text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
            html: `
                <h3>New Message from Diakore Website</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <br/>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Message sent successfully!' })
        };

    } catch (error) {
        console.error('Error sending email:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to send message.', error: error.toString() })
        };
    }
};
