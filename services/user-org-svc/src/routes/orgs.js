'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Organization routes.
 * POST   /api/v1/orgs
 * GET    /api/v1/orgs/:id
 * GET    /api/v1/orgs
 * DELETE /api/v1/orgs/:id
 * GET    /api/v1/orgs/:id/members
 * POST   /api/v1/orgs/:id/members
 */
async function orgRoutes(fastify) {
    fastify.post('/api/v1/orgs', async (request, reply) => {
        const { name, plan = 'free', ownerId } = request.body || {};
        if (!name) return reply.badRequest('name is required');

        const id = uuidv4();
        const result = await fastify.db.query(
            `INSERT INTO organizations (id, name, plan, owner_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, plan, owner_id, created_at`,
            [id, name, plan, ownerId]
        );
        return reply.code(201).send(result.rows[0]);
    });

    fastify.get('/api/v1/orgs/:id', async (request, reply) => {
        const result = await fastify.db.query(
            'SELECT id, name, plan, owner_id, created_at FROM organizations WHERE id = $1',
            [request.params.id]
        );
        if (!result.rows.length) return reply.notFound('organization not found');
        return reply.send(result.rows[0]);
    });

    fastify.get('/api/v1/orgs', async (request) => {
        const { page = 1, page_size = 20 } = request.query;
        const offset = (page - 1) * page_size;
        const result = await fastify.db.query(
            'SELECT id, name, plan, owner_id, created_at FROM organizations ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [page_size, offset]
        );
        return { orgs: result.rows, page: Number(page), page_size: Number(page_size) };
    });

    fastify.delete('/api/v1/orgs/:id', async (request, reply) => {
        await fastify.db.query('DELETE FROM organizations WHERE id = $1', [request.params.id]);
        return reply.code(204).send();
    });

    // List members of an org
    fastify.get('/api/v1/orgs/:id/members', async (request) => {
        const result = await fastify.db.query(
            'SELECT id, email, name, role, created_at FROM users WHERE org_id = $1 ORDER BY created_at',
            [request.params.id]
        );
        return { org_id: request.params.id, members: result.rows };
    });

    // Add a member to an org
    fastify.post('/api/v1/orgs/:id/members', async (request, reply) => {
        const { userId, role = 'member' } = request.body || {};
        if (!userId) return reply.badRequest('userId is required');
        await fastify.db.query(
            'UPDATE users SET org_id = $1, role = $2 WHERE id = $3',
            [request.params.id, role, userId]
        );
        return reply.code(200).send({ message: 'member added' });
    });
}

module.exports = orgRoutes;
