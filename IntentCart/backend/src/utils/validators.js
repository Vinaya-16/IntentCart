import { body, validationResult } from 'express-validator';

export const validateSignup = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9\s]+$/)
    .withMessage('Username can only contain letters, numbers, and spaces'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),
  
  body('role')
    .isIn(['customer', 'merchant'])
    .withMessage('Role must be either customer or merchant'),
  
  // Conditional validation for merchant fields
  body('businessName')
    .if(body('role').equals('merchant'))
    .notEmpty()
    .withMessage('Business name is required for merchants')
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be 2-100 characters'),
  
  body('businessDescription')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Business description cannot exceed 500 characters'),
  
  body('businessPhone')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Please enter a valid phone number')
];

export const validateSignin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};