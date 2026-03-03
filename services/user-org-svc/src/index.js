'use strict';

require('dotenv').config();

const Fastify = require('fastify');
const { Pool } = require('pg');

const PORT = process.env.USER_ORG_SVC_PORT || 8084;

async function buildApp() {
    const app = Fastify({ logger: { level: process.env.LOG_LEVEL || 'info' } });
    await app.register(require('@fastify/sensible'));

    const db = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/urlshortner',
        max: 10,
    });
    app.decorate('db', db);

    await app.register(require('./routes/users'));
    await app.register(require('./routes/orgs'));

    app.get('/health', async () => ({ status: 'ok', service: 'user-org-svc' }));

    return app;
}

async function main() {
    const app = await buildApp();
    try {
        await app.listen({ port: PORT, host: '0.0.0.0' });
        app.log.info(`user-org-svc listening on port ${PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

main();

module.exports = { buildApp };
