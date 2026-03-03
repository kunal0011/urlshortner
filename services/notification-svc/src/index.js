'use strict';

require('dotenv').config();

const Fastify = require('fastify');
const notifyRoutes = require('./routes/notify');

const PORT = process.env.NOTIFICATION_SVC_PORT || 8086;

async function buildApp() {
    const app = Fastify({ logger: { level: process.env.LOG_LEVEL || 'info' } });
    await app.register(require('@fastify/sensible'));
    await app.register(notifyRoutes, { prefix: '/api/v1' });
    app.get('/health', async () => ({ status: 'ok', service: 'notification-svc' }));
    return app;
}

async function main() {
    const app = await buildApp();
    try {
        await app.listen({ port: PORT, host: '0.0.0.0' });
        app.log.info(`notification-svc listening on port ${PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

main();

module.exports = { buildApp };
