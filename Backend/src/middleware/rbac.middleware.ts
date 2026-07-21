import { Request, Response, NextFunction } from 'express';
import { sendForbidden, sendUnauthorized } from '../utils/response.helper';
import { ROLE_PERMISSIONS } from '../services/jwt.service';

/**
 * Middleware to enforce Role-Based Access Control (RBAC) and permissions
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }

    // Block users with pending status
    if (user.status === 'PENDING') {
      sendForbidden(res, 'Access denied. Your account is pending administrator approval.');
      return;
    }

    // CTO and Admin bypass checks
    if (user.role === 'CTO' || user.role === 'Admin') {
      next();
      return;
    }

    // Retrieve permissions for the user's role
    const permissions = ROLE_PERMISSIONS[user.role || 'Employee'] || ROLE_PERMISSIONS.Employee;

    if (!permissions.includes(permission)) {
      sendForbidden(res, `Forbidden. Missing required permission: ${permission}`);
      return;
    }

    next();
  };
};

/**
 * Middleware to restrict endpoints to specific departments
 */
export const requireDepartment = (allowedDepartments: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }

    if (user.status === 'PENDING') {
      sendForbidden(res, 'Access denied. Your account is pending administrator approval.');
      return;
    }

    if (user.role === 'CTO' || user.role === 'Admin') {
      next();
      return;
    }

    if (!user.department || !allowedDepartments.includes(user.department)) {
      sendForbidden(res, `Forbidden. Restrained to departments: ${allowedDepartments.join(', ')}`);
      return;
    }

    next();
  };
};
