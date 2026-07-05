const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Get all users with search, role filter, and pagination
 * GET /api/users
 */
const getUsers = async (req, res, next) => {
  try {
    const { search, role, isActive, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('clientCompany', 'name company email')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
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
 * Get single user by ID
 * GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('clientCompany', 'name company email')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new user (admin only)
 * POST /api/users
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, specializations, bio, clientCompany, hourlyRate } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: password,
      role: role || 'designer',
      phone: phone || '',
      specializations: specializations || [],
      bio: bio || '',
      clientCompany: clientCompany || null,
      hourlyRate: hourlyRate || 0,
    });

    logger.info(`User created: ${user.email} (${user.role}) by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user details (admin only)
 * PUT /api/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive, phone, specializations, bio, clientCompany, hourlyRate } = req.body;

    // If changing email, check uniqueness
    if (email) {
      const conflict = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.params.id },
      });
      if (conflict) {
        return res.status(409).json({
          success: false,
          message: 'Another user is already using this email',
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (phone !== undefined) updateData.phone = phone;
    if (specializations !== undefined) updateData.specializations = specializations;
    if (bio !== undefined) updateData.bio = bio;
    if (clientCompany !== undefined) updateData.clientCompany = clientCompany || null;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('clientCompany', 'name company email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    logger.info(`User updated: ${user.email} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (admin only)
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    // Prevent admin from deleting themselves
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    logger.info(`User deleted: ${user.email} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get team statistics
 * GET /api/users/stats
 */
const getUserStats = async (req, res, next) => {
  try {
    const [totalUsers, totalDesigners, totalClients, totalActive] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'designer' }),
      User.countDocuments({ role: 'client' }),
      User.countDocuments({ isActive: true }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalDesigners,
          totalClients,
          totalActive,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
};
