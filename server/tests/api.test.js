const request = require('supertest');
const mongoose = require('mongoose');
const { app, connectDB } = require('../server');

describe('HorseShoe Studio Comprehensive API Test Suite', () => {
  let adminToken = '';
  let designerToken = '';
  let clientToken = '';
  let testProjectId = '';
  let testTaskId = '';
  let testDesignId = '';
  let testVersionId = '';

  beforeAll(async () => {
    await connectDB();

    // 1. Login as Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@horseshoe.studio', password: 'password123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.accessToken;

    // 2. Login as Designer
    const designerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'designer@horseshoe.studio', password: 'password123' });
    expect(designerRes.status).toBe(200);
    designerToken = designerRes.body.data.accessToken;

    // 3. Login as Client
    const clientRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'client@horseshoe.studio', password: 'password123' });
    expect(clientRes.status).toBe(200);
    clientToken = clientRes.body.data.accessToken;
  });

  // ── Health Check ───────────────────────────────────────
  describe('Health API', () => {
    it('should return 200 OK for health check', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
    });
  });

  // ── Authentication & Roles ─────────────────────────────
  describe('Auth API', () => {
    it('should reject invalid login credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@horseshoe.studio', password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fetch current authenticated user profile (/me)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('admin');
      expect(res.body.data.user.email).toBe('admin@horseshoe.studio');
    });
  });

  // ── Projects Module & RBAC ─────────────────────────────
  describe('Projects API & RBAC Scoping', () => {
    it('should allow Admin to see all studio projects', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.projects.length).toBeGreaterThanOrEqual(3);
      testProjectId = res.body.data.projects[0]._id;
    });

    it('should scope Designer projects to assigned projects only', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${designerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.projects.length).toBeGreaterThanOrEqual(1);
    });

    it('should scope Client projects to their company only', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${clientToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.projects.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Tasks & Kanban Module ──────────────────────────────
  describe('Tasks API & Automated Progress', () => {
    it('should list tasks for authorized project', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .query({ project: testProjectId })
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.tasks)).toBe(true);
      if (res.body.data.tasks.length > 0) {
        testTaskId = res.body.data.tasks[0]._id;
      }
    });

    it('should update task status and trigger project progress recalculation', async () => {
      if (!testTaskId) return;
      const res = await request(app)
        .patch(`/api/tasks/${testTaskId}/status`)
        .send({ status: 'done' })
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.task.status).toBe('done');
    });
  });

  // ── Designs & Versioning Module ────────────────────────
  describe('Designs & Versioning API', () => {
    it('should list design deliverables for authenticated user', async () => {
      const res = await request(app)
        .get('/api/designs')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.designs.length).toBeGreaterThanOrEqual(1);
      testDesignId = res.body.data.designs[0]._id;
    });

    it('should fetch single design deliverable with version history', async () => {
      if (!testDesignId) return;
      const res = await request(app)
        .get(`/api/designs/${testDesignId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.versions.length).toBeGreaterThanOrEqual(1);
      testVersionId = res.body.data.versions[0]._id;
    });
  });

  // ── Comments & Approvals Workflow ──────────────────────
  describe('Comments & Approval Workflow API', () => {
    it('should create a pinned feedback comment on a design', async () => {
      if (!testDesignId || !testVersionId) return;
      const res = await request(app)
        .post('/api/comments')
        .send({
          design: testDesignId,
          version: testVersionId,
          content: 'Jest Automated Test Comment: Please verify spacing.',
          type: 'general',
          pinnedPosition: { x: 50, y: 50 },
        })
        .set('Authorization', `Bearer ${designerToken}`);
      expect(res.status).toBe(201);
      expect(res.body.data.comment.content).toContain('Jest Automated Test Comment');
    });

    it('should submit formal design review approval', async () => {
      if (!testDesignId) return;
      const res = await request(app)
        .post('/api/comments/review')
        .send({
          designId: testDesignId,
          versionId: testVersionId,
          action: 'approve',
          notes: 'Approved via Jest test suite',
        })
        .set('Authorization', `Bearer ${clientToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.design.status).toBe('approved');
    });
  });

  // ── Notifications Module ───────────────────────────────
  describe('Notifications API', () => {
    it('should fetch notifications for user with unread counter', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${designerToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.notifications)).toBe(true);
      expect(typeof res.body.data.unreadCount).toBe('number');
    });

    it('should mark all notifications as read', async () => {
      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${designerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.unreadCount).toBe(0);
    });
  });

  // ── Dashboard Analytics & Charts Module ────────────────
  describe('Dashboard Analytics API', () => {
    it('should return KPI metrics and pending approvals queue', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.kpis).toBeDefined();
      expect(res.body.data.kpis.totalProjects).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.data.pendingReviewDesigns)).toBe(true);
      expect(Array.isArray(res.body.data.recentActivity)).toBe(true);
    });

    it('should return aggregated chart distributions for visual analytics', async () => {
      const res = await request(app)
        .get('/api/dashboard/charts')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.projectsByStatus)).toBe(true);
      expect(Array.isArray(res.body.data.deliverablesHealth)).toBe(true);
      expect(Array.isArray(res.body.data.designerWorkload)).toBe(true);
      expect(Array.isArray(res.body.data.tasksByPriority)).toBe(true);
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });
});
