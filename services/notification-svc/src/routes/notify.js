'use strict';

const nodemailer = require('nodemailer');
const axios = require('axios');

/**
 * Creates a transporter using SMTP credentials from environment.
 */
function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });
}

/**
 * Notification routes.
 * POST /api/v1/notify/email  — send email notification
 * POST /api/v1/notify/slack  — send Slack message via webhook
 */
async function notifyRoutes(fastify) {
    const transporter = createTransporter();

    /**
     * POST /api/v1/notify/email
     * Body: { to, subject, html, text }
     */
    fastify.post('/notify/email', async (request, reply) => {
        const { to, subject, html, text } = request.body || {};
        if (!to || !subject) return reply.badRequest('to and subject are required');

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'noreply@urlshortner.example.com',
            to,
            subject,
            html,
            text,
        });

        return reply.code(200).send({ message: 'email sent' });
    });

    /**
     * POST /api/v1/notify/slack
     * Body: { text, channel? }
     */
    fastify.post('/notify/slack', async (request, reply) => {
        const { text, channel } = request.body || {};
        if (!text) return reply.badRequest('text is required');

        const webhookUrl = process.env.SLACK_WEBHOOK_URL;
        if (!webhookUrl) {
            return reply.internalServerError('SLACK_WEBHOOK_URL is not configured');
        }

        await axios.post(webhookUrl, { text, channel });

        return reply.code(200).send({ message: 'slack message sent' });
    });
}

module.exports = notifyRoutes;
