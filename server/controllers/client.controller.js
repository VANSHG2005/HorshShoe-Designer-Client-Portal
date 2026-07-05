const Client = require('../models/Client');
const logger = require('../utils/logger');

/**
 * Get all clients with filtering, search, and pagination
 * GET /api/clients
 */
const getClients = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'asc' ? 1 : -1;

    const [clients, total] = await Promise.all([
      Client.find(query)
        .populate('createdBy', 'name email avatarUrl')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Client.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        clients,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single client by ID
 * GET /api/clients/:id
 */
const getClientById = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('createdBy', 'name email avatarUrl')
      .lean();

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { client },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new client
 * POST /api/clients
 */
const createClient = async (req, res, next) => {
  try {
    const { name, company, email, phone, website, status, address, contactPerson, notes } = req.body;

    const client = await Client.create({
      name,
      company,
      email,
      phone,
      website,
      status: status || 'active',
      address,
      contactPerson,
      notes,
      createdBy: req.user._id,
    });

    logger.info(`Client created: ${client.name} (${client._id}) by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: { client },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing client
 * PUT /api/clients/:id
 */
const updateClient = async (req, res, next) => {
  try {
    const { name, company, email, phone, website, status, address, contactPerson, notes } = req.body;

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      {
        name,
        company,
        email,
        phone,
        website,
        status,
        address,
        contactPerson,
        notes,
      },
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    logger.info(`Client updated: ${client.name} (${client._id}) by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      data: { client },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete client
 * DELETE /api/clients/:id
 */
const deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    logger.info(`Client deleted: ${client.name} (${client._id}) by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Client deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get client statistics
 * GET /api/clients/stats
 */
const getClientStats = async (req, res, next) => {
  try {
    const [total, active, lead, inactive] = await Promise.all([
      Client.countDocuments(),
      Client.countDocuments({ status: 'active' }),
      Client.countDocuments({ status: 'lead' }),
      Client.countDocuments({ status: 'inactive' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total,
          active,
          lead,
          inactive,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientStats,
};
