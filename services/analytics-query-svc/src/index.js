'use strict';

require('dotenv').config();

const Fastify = require('fastify');
const analyticsRoutes = require('./routes/analytics');
const { createClickHouseClient } = require('./clickhouse');

const PORT = process.env.ANALYTICS_QUERY_SVC_PORT || 8083;

async function buildApp() {
    const app = Fastify({
        logger: {
            level: process.env.LOG_LEVEL || 'info',
        },
    });

    await app.register(require('@fastify/sensible'));

    const ch = createClickHouseClient();
    app.decorate('clickhouse', ch);

    await app.register(analyticsRoutes, { prefix: '/api/v1/analytics' });

    app.get('/health', async () => ({ status: 'ok', service: 'analytics-query-svc' }));

    return app;
}

async function main() {
    const app = await buildApp();
    try {
        await app.listen({ port: PORT, host: '0.0.0.0' });
        app.log.info(`analytics-query-svc listening on port ${PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

main();

module.exports = { buildApp };
