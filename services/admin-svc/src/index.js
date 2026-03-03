'use strict';

require('dotenv').config();

const Fastify = require('fastify');
const { Pool } = require('pg');

const PORT = process.env.ADMIN_SVC_PORT || 8087;

async function buildApp() {
    const app = Fastify({ logger: { level: process.env.LOG_LEVEL || 'info' } });
    await app.register(require('@fastify/sensible'));

    const db = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/urlshortner',
        max: 5,
    });
    app.decorate('db', db);

    await app.register(require('./routes/admin'), { prefix: '/api/v1/admin' });

    app.get('/health', async () => ({ status: 'ok', service: 'admin-svc' }));
    return app;
}

async function main() {
    const app = await buildApp();
    try {
        await app.listen({ port: PORT, host: '0.0.0.0' });
        app.log.info(`admin-svc listening on port ${PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

main();

module.exports = { buildApp };
