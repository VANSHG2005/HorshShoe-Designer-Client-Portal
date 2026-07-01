const { z } = require('zod');

/**
 * Zod validation middleware factory
 * Validates request body, query, or params against a Zod schema
 *
 * Usage: validate(schema) or validate(schema, 'query')
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req[property]);

      if (!result.success) {
        const errors = result.error.errors.map((err) => {
          return `${err.path.join('.')}: ${err.message}`;
        });

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }

      // Replace the property with parsed (and transformed) data
      req[property] = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = validate;
