export const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

export const isAdminOrMerchant = (req, res, next) => {
  if (!['admin', 'merchant'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or Merchant privileges required.'
    });
  }
  next();
};

export const checkPermission = (permission) => {
  return (req, res, next) => {
    if (req.user.role === 'admin') {
      if (req.user.adminPermissions && req.user.adminPermissions.includes(permission)) {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: `Access denied. Need ${permission} permission.`
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Access denied.'
    });
  };
};