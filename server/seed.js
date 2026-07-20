/**
 * Seed Script — Creates initial admin, designers, clients, and companies
 * Usage: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Client = require('./models/Client');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Design = require('./models/Design');
const DesignVersion = require('./models/DesignVersion');
const Comment = require('./models/Comment');
const Activity = require('./models/Activity');
const logger = require('./utils/logger');

const seedClients = [
  {
    name: 'Nexus Technologies',
    company: 'Nexus Tech Global Inc.',
    email: 'contact@nexustech.io',
    phone: '+1-555-0810',
    website: 'https://nexustech.io',
    status: 'active',
    address: {
      street: '742 Evergreen Terrace',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94107',
      country: 'USA',
    },
    contactPerson: {
      name: 'Jordan Blake',
      email: 'client@horseshoe.studio',
      phone: '+1-555-0301',
      role: 'VP of Product',
    },
    notes: 'Key enterprise account. Looking for full rebrand and product design system.',
  },
  {
    name: 'Starlight Media',
    company: 'Starlight Entertainment LLC',
    email: 'info@starlightmedia.com',
    phone: '+1-555-0820',
    website: 'https://starlightmedia.com',
    status: 'active',
    address: {
      street: '100 Sunset Blvd, Suite 400',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90028',
      country: 'USA',
    },
    contactPerson: {
      name: 'Taylor Morgan',
      email: 'client2@horseshoe.studio',
      phone: '+1-555-0302',
      role: 'Creative Director',
    },
    notes: 'Streaming platform campaign graphics and mobile app revamp.',
  },
  {
    name: 'Verdant Organics',
    company: 'Verdant Foods & Health Co.',
    email: 'hello@verdantorganics.com',
    phone: '+1-555-0830',
    website: 'https://verdantorganics.com',
    status: 'lead',
    address: {
      street: '45 Pearl St',
      city: 'Boulder',
      state: 'CO',
      zipCode: '80302',
      country: 'USA',
    },
    contactPerson: {
      name: 'Elena Rostova',
      email: 'elena@verdantorganics.com',
      phone: '+1-555-0831',
      role: 'Founder & CEO',
    },
    notes: 'Inbound lead for sustainable packaging design and brand identity guidelines.',
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Connected to MongoDB for seeding');

    // Clear existing data
    await Activity.deleteMany({});
    await Comment.deleteMany({});
    await DesignVersion.deleteMany({});
    await Design.deleteMany({});
    await Task.deleteMany({});
    await Project.deleteMany({});
    await Client.deleteMany({});
    await User.deleteMany({});
    logger.info('Cleared existing data (clients, users, projects, tasks, designs, comments, activities)');

    // 1. Create Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@horseshoe.studio',
      passwordHash: 'password123',
      role: 'admin',
      phone: '+1-555-0100',
      bio: 'Lead Studio Director overseeing agency creative pipelines, client relationships, and design deliverables.',
    });

    // 2. Create Clients with createdBy pointing to Admin
    const clientsWithAdmin = seedClients.map((c) => ({ ...c, createdBy: admin._id }));
    const createdClients = await Client.create(clientsWithAdmin);
    logger.info(`Created ${createdClients.length} client companies`);

    // 3. Create Designers
    const designers = await User.create([
      {
        name: 'Sarah Mitchell',
        email: 'designer@horseshoe.studio',
        passwordHash: 'password123',
        role: 'designer',
        phone: '+1-555-0201',
        specializations: ['UI/UX Design', 'Design Systems', 'Figma', 'Prototyping'],
        bio: 'Senior Product Designer with 6+ years creating intuitive mobile apps and web platforms.',
        hourlyRate: 95,
      },
      {
        name: 'Alex Rivera',
        email: 'designer2@horseshoe.studio',
        passwordHash: 'password123',
        role: 'designer',
        phone: '+1-555-0202',
        specializations: ['Brand Identity', 'Illustration', '3D Motion', 'Typography'],
        bio: 'Brand specialist and visual artist passionate about expressive identities and typography.',
        hourlyRate: 85,
      },
    ]);
    logger.info(`Created ${designers.length} designers`);

    // 4. Create Client Users linked to their Client companies
    const clientUsers = await User.create([
      {
        name: 'Jordan Blake',
        email: 'client@horseshoe.studio',
        passwordHash: 'password123',
        role: 'client',
        phone: '+1-555-0301',
        clientCompany: createdClients[0]._id,
        bio: 'VP of Product at Nexus Technologies.',
      },
      {
        name: 'Taylor Morgan',
        email: 'client2@horseshoe.studio',
        passwordHash: 'password123',
        role: 'client',
        phone: '+1-555-0302',
        clientCompany: createdClients[1]._id,
        bio: 'Creative Director at Starlight Media.',
      },
    ]);
    logger.info(`Created ${clientUsers.length} client portal users`);

    // 5. Create Projects
    const projects = await Project.create([
      {
        title: 'Nexus Mobile Banking App Redesign',
        code: 'HSS-101',
        description: 'Comprehensive iOS and Android design overhaul with modern fintech aesthetics, biometrics UX, and transaction micro-interactions.',
        client: createdClients[0]._id,
        leadDesigner: designers[0]._id,
        team: [designers[1]._id],
        status: 'in_progress',
        priority: 'high',
        category: 'UI/UX Design',
        budget: 35000,
        spent: 18500,
        progress: 65,
        startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        tags: ['Fintech', 'Mobile App', 'Figma', 'Dark Mode'],
        createdBy: admin._id,
      },
      {
        title: 'Starlight Streaming Rebrand & Visual Identity',
        code: 'HSS-102',
        description: 'Complete studio rebrand including dynamic logo animations, typography guidelines, and digital billboard campaign templates.',
        client: createdClients[1]._id,
        leadDesigner: designers[1]._id,
        team: [designers[0]._id],
        status: 'review',
        priority: 'urgent',
        category: 'Brand Identity',
        budget: 28000,
        spent: 26000,
        progress: 90,
        startDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        tags: ['Rebranding', '3D Motion', 'Cinema 4D', 'Identity'],
        createdBy: admin._id,
      },
      {
        title: 'Verdant Sustainable Eco Packaging Suite',
        code: 'HSS-103',
        description: 'Biodegradable packaging system for organic beverage and nutrition product line with custom illustrations and recyclable foil stamps.',
        client: createdClients[2]._id,
        leadDesigner: designers[1]._id,
        team: [],
        status: 'planning',
        priority: 'medium',
        category: 'Packaging',
        budget: 16000,
        spent: 2500,
        progress: 20,
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        tags: ['Packaging', 'Print', 'Illustration', 'Eco-friendly'],
        createdBy: admin._id,
      },
      {
        title: 'Nexus Enterprise Design System & Tokens',
        code: 'HSS-104',
        description: 'Multi-brand design system with Figma token synchronizer, React accessibility components, and documentation site.',
        client: createdClients[0]._id,
        leadDesigner: designers[0]._id,
        team: [],
        status: 'completed',
        priority: 'medium',
        category: 'Design System',
        budget: 22000,
        spent: 22000,
        progress: 100,
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        tags: ['Design System', 'Tokens', 'Accessibility', 'Figma'],
        createdBy: admin._id,
      },
    ]);
    logger.info(`Created ${projects.length} design studio projects`);

    // 6. Create Kanban Tasks
    const tasks = await Task.create([
      {
        title: 'Design Biometric Authentication Flow & Micro-interactions',
        description: 'Wireframes and high-fidelity prototype of FaceID and fingerprint login screen with fallback PIN states.',
        project: projects[0]._id,
        assignee: designers[0]._id,
        status: 'in_progress',
        priority: 'urgent',
        order: 0,
        estimatedHours: 12,
        actualHours: 8,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        tags: ['Figma', 'Auth', 'UI/UX'],
        createdBy: admin._id,
      },
      {
        title: 'Dark Mode Color Audit & Contrast Testing',
        description: 'Verify WCAG AAA compliance for fintech dashboard cards and transaction list in dark mode.',
        project: projects[0]._id,
        assignee: designers[1]._id,
        status: 'todo',
        priority: 'high',
        order: 0,
        estimatedHours: 6,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tags: ['Accessibility', 'Colors'],
        createdBy: admin._id,
      },
      {
        title: 'Transaction History Screen & Filter Bottom Sheet',
        description: 'Design comprehensive filter sheet by date, category, and merchant type.',
        project: projects[0]._id,
        assignee: designers[0]._id,
        status: 'review',
        priority: 'medium',
        order: 0,
        estimatedHours: 8,
        actualHours: 7.5,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        tags: ['UI', 'Mobile'],
        createdBy: admin._id,
      },
      {
        title: 'App Onboarding Flow & Permissions Walkthrough',
        description: '3-slide animated carousel explaining budget analytics and smart notifications.',
        project: projects[0]._id,
        assignee: designers[0]._id,
        status: 'done',
        priority: 'medium',
        order: 0,
        estimatedHours: 10,
        actualHours: 9,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        tags: ['Onboarding', 'Illustration'],
        createdBy: admin._id,
      },
      {
        title: '3D Logo Motion Bumpers (4K Render)',
        description: 'Cinema 4D logo bumper with neon refraction for streaming intro cards.',
        project: projects[1]._id,
        assignee: designers[1]._id,
        status: 'review',
        priority: 'urgent',
        order: 1,
        estimatedHours: 20,
        actualHours: 18,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        tags: ['3D Motion', 'Cinema 4D'],
        createdBy: admin._id,
      },
      {
        title: 'Social Media Streaming Ad Kit (1080x1920 & 1080x1080)',
        description: 'Story templates and carousel banners for upcoming blockbuster premiere.',
        project: projects[1]._id,
        assignee: designers[0]._id,
        status: 'in_progress',
        priority: 'medium',
        order: 1,
        estimatedHours: 14,
        actualHours: 6,
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        tags: ['Marketing', 'Social'],
        createdBy: admin._id,
      },
      {
        title: 'Bottle Label Die-Cut Template & Foil Spec',
        description: 'Vector print specifications with embossed metallic gold foil and tactile varnish.',
        project: projects[2]._id,
        assignee: designers[1]._id,
        status: 'todo',
        priority: 'high',
        order: 1,
        estimatedHours: 16,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        tags: ['Packaging', 'Print'],
        createdBy: admin._id,
      },
      {
        title: 'Design System Figma Token JSON Export Script',
        description: 'Automated script to sync typography, spacing, and color hexes with front-end Tailwind config.',
        project: projects[3]._id,
        assignee: designers[0]._id,
        status: 'done',
        priority: 'low',
        order: 1,
        estimatedHours: 8,
        actualHours: 7,
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        tags: ['Tokens', 'DevSync'],
        createdBy: admin._id,
      },
    ]);
    logger.info(`Created ${tasks.length} Kanban design tasks`);

    // 7. Create Designs & Multi-Version Iterations
    const design1 = await Design.create({
      title: 'Mobile Banking Dashboard High-Fidelity Screens',
      description: 'iOS and Android responsive Figma mockups for transaction overview and card manager.',
      project: projects[0]._id,
      category: 'UI Screen',
      status: 'in_review',
      currentVersion: 2,
      thumbnailUrl: '/uploads/designs/nexus-fintech-v2.svg',
      createdBy: designers[0]._id,
    });

    await DesignVersion.create([
      {
        design: design1._id,
        versionNumber: 1,
        fileUrl: '/uploads/designs/nexus-fintech-v1.svg',
        fileName: 'nexus-fintech-v1.svg',
        fileSize: 1024 * 18,
        fileType: 'image/svg+xml',
        changelog: 'Initial wireframe layout and balance widget exploration.',
        status: 'changes_requested',
        uploadedBy: designers[0]._id,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        design: design1._id,
        versionNumber: 2,
        fileUrl: '/uploads/designs/nexus-fintech-v2.svg',
        fileName: 'nexus-fintech-v2.svg',
        fileSize: 1024 * 24,
        fileType: 'image/svg+xml',
        changelog: 'Added dark mode tokens, balance cards, and biometric authentication button.',
        status: 'in_review',
        uploadedBy: designers[0]._id,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ]);

    const design2 = await Design.create({
      title: 'Starlight Media 3D Monogram & Wordmark Suite',
      description: 'Primary logo variations, dark/light lockups, and 3D kinetic bumper guidelines.',
      project: projects[1]._id,
      category: 'Brand Asset',
      status: 'approved',
      currentVersion: 2,
      thumbnailUrl: '/uploads/designs/starlight-logo-v2.svg',
      createdBy: designers[1]._id,
    });

    await DesignVersion.create([
      {
        design: design2._id,
        versionNumber: 1,
        fileUrl: '/uploads/designs/starlight-logo-v1.svg',
        fileName: 'starlight-logo-v1.svg',
        fileSize: 1024 * 15,
        fileType: 'image/svg+xml',
        changelog: 'Typography exploration and 2D monogram marks.',
        status: 'changes_requested',
        uploadedBy: designers[1]._id,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        design: design2._id,
        versionNumber: 2,
        fileUrl: '/uploads/designs/starlight-logo-v2.svg',
        fileName: 'starlight-logo-v2.svg',
        fileSize: 1024 * 28,
        fileType: 'image/svg+xml',
        changelog: '3D gradient neon refraction marks and Cinema 4D animation assets.',
        status: 'approved',
        uploadedBy: designers[1]._id,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    ]);

    const design3 = await Design.create({
      title: 'Cold-Pressed Juice Recyclable Label Print Spec',
      description: 'Production-ready label die-line with embossed gold foil details.',
      project: projects[2]._id,
      category: 'Packaging',
      status: 'pending',
      currentVersion: 1,
      thumbnailUrl: '/uploads/designs/verdant-packaging-v1.svg',
      createdBy: designers[1]._id,
    });

    await DesignVersion.create([
      {
        design: design3._id,
        versionNumber: 1,
        fileUrl: '/uploads/designs/verdant-packaging-v1.svg',
        fileName: 'verdant-packaging-v1.svg',
        fileSize: 1024 * 22,
        fileType: 'image/svg+xml',
        changelog: 'Initial die-cut spec and typography layout.',
        status: 'pending',
        uploadedBy: designers[1]._id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ]);

    logger.info(`Created 3 versioned design assets (5 total versions)`);

    // 8. Create Comments on Design Iterations
    const d1Versions = await DesignVersion.find({ design: design1._id }).sort({ versionNumber: 1 });
    const d2Versions = await DesignVersion.find({ design: design2._id }).sort({ versionNumber: 1 });

    const comments = await Comment.create([
      {
        design: design1._id,
        version: d1Versions[0]._id,
        author: clientUsers[0]._id,
        content: 'Can we enhance the contrast on the card balance numbers? Also, our product team requested a FaceID biometric indicator.',
        type: 'revision_request',
        isResolved: true,
        resolvedBy: designers[0]._id,
        resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        design: design1._id,
        version: d1Versions[1]._id,
        author: designers[0]._id,
        content: 'Addressed in v2! Implemented WCAG AAA contrast scales and positioned the biometric authentication button directly on the primary card.',
        type: 'general',
      },
      {
        design: design1._id,
        version: d1Versions[1]._id,
        author: clientUsers[0]._id,
        content: 'Looks much sharper and intuitive. Sending to VP for final signoff tomorrow.',
        type: 'general',
      },
      {
        design: design2._id,
        version: d2Versions[1]._id,
        author: clientUsers[1]._id,
        content: 'The 3D neon refraction mark is outstanding! Full approval granted for trailer and social campaign cards.',
        type: 'approval',
        isResolved: true,
        resolvedBy: clientUsers[1]._id,
        resolvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    ]);
    logger.info(`Created ${comments.length} design discussion comments`);

    // 9. Create Activity Log Audit Trail
    const activities = await Activity.create([
      {
        user: admin._id,
        action: 'created_project',
        project: projects[0]._id,
        details: 'Admin User initialized project "Nexus Mobile Banking App Redesign"',
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        user: designers[0]._id,
        action: 'uploaded_design',
        project: projects[0]._id,
        design: design1._id,
        details: 'Sarah Mitchell published v1 of "Mobile Banking Dashboard High-Fidelity Screens"',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        user: clientUsers[0]._id,
        action: 'requested_changes',
        project: projects[0]._id,
        design: design1._id,
        details: 'Jordan Blake requested contrast revisions on v1',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
      {
        user: designers[0]._id,
        action: 'uploaded_version',
        project: projects[0]._id,
        design: design1._id,
        details: 'Sarah Mitchell uploaded iteration v2 with WCAG contrast tokens',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        user: designers[1]._id,
        action: 'uploaded_version',
        project: projects[1]._id,
        design: design2._id,
        details: 'Alex Rivera uploaded 3D neon refraction mark v2',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        user: clientUsers[1]._id,
        action: 'approved_design',
        project: projects[1]._id,
        design: design2._id,
        details: 'Taylor Morgan formally approved "Starlight Media 3D Monogram & Wordmark Suite"',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    ]);
    logger.info(`Created ${activities.length} audit trail activity records`);

    logger.info('\n✅ Seed complete! Accounts available:');
    logger.info('  → admin@horseshoe.studio (password: password123) [admin]');
    logger.info('  → designer@horseshoe.studio (password: password123) [designer]');
    logger.info('  → designer2@horseshoe.studio (password: password123) [designer]');
    logger.info('  → client@horseshoe.studio (password: password123) [client]');
    logger.info('  → client2@horseshoe.studio (password: password123) [client]');

    process.exit(0);
  } catch (error) {
    logger.error('Seed failed:', error);
    process.exit(1);
  }
};

seedDB();
