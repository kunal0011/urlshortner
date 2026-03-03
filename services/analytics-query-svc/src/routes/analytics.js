'use strict';

/**
 * Analytics routes for querying ClickHouse click data.
 * Routes:
 *   GET /api/v1/analytics/:shortCode/summary
 *   GET /api/v1/analytics/:shortCode/timeseries
 *   GET /api/v1/analytics/org/:orgId
 */
async function analyticsRoutes(fastify) {
    /**
     * GET /api/v1/analytics/:shortCode/summary
     * Returns aggregate click metrics for a short code.
     */
    fastify.get('/:shortCode/summary', async (request, reply) => {
        const { shortCode } = request.params;
        const query = `
      SELECT
        count()                                         AS total_clicks,
        uniq(ip_hash)                                   AS unique_visitors,
        countIf(device_type = 'mobile')                 AS mobile_clicks,
        countIf(device_type = 'desktop')                AS desktop_clicks,
        topK(5)(country)                                AS top_countries,
        topK(5)(referrer)                               AS top_referrers,
        min(clicked_at)                                 AS first_click,
        max(clicked_at)                                 AS last_click
      FROM clicks
      WHERE short_code = {shortCode:String}
    `;
        const resultSet = await fastify.clickhouse.query({
            query,
            query_params: { shortCode },
            format: 'JSONEachRow',
        });
        const rows = await resultSet.json();
        return reply.send(rows[0] || {});
    });

    /**
     * GET /api/v1/analytics/:shortCode/timeseries?granularity=day&from=ISO&to=ISO
     * Returns click counts bucketed by day/hour.
     */
    fastify.get('/:shortCode/timeseries', async (request, reply) => {
        const { shortCode } = request.params;
        const { granularity = 'day', from, to } = request.query;

        const truncFn = granularity === 'hour' ? 'toStartOfHour' : 'toStartOfDay';
        const query = `
      SELECT
        ${truncFn}(clicked_at) AS bucket,
        count()                AS clicks
      FROM clicks
      WHERE short_code = {shortCode:String}
        ${from ? 'AND clicked_at >= {from:DateTime}' : ''}
        ${to ? 'AND clicked_at <= {to:DateTime}' : ''}
      GROUP BY bucket
      ORDER BY bucket ASC
    `;
        const resultSet = await fastify.clickhouse.query({
            query,
            query_params: { shortCode, from, to },
            format: 'JSONEachRow',
        });
        const rows = await resultSet.json();
        return reply.send({ short_code: shortCode, granularity, data: rows });
    });

    /**
     * GET /api/v1/analytics/org/:orgId?from=ISO&to=ISO
     * Returns aggregated stats across all links in an org.
     */
    fastify.get('/org/:orgId', async (request, reply) => {
        const { orgId } = request.params;
        const { from, to } = request.query;
        const query = `
      SELECT
        short_code,
        count()             AS total_clicks,
        uniq(ip_hash)       AS unique_visitors
      FROM clicks
      WHERE org_id = {orgId:String}
        ${from ? 'AND clicked_at >= {from:DateTime}' : ''}
        ${to ? 'AND clicked_at <= {to:DateTime}' : ''}
      GROUP BY short_code
      ORDER BY total_clicks DESC
      LIMIT 100
    `;
        const resultSet = await fastify.clickhouse.query({
            query,
            query_params: { orgId, from, to },
            format: 'JSONEachRow',
        });
        const rows = await resultSet.json();
        return reply.send({ org_id: orgId, links: rows });
    });
}

module.exports = analyticsRoutes;
