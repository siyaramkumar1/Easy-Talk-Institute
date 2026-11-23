// @ts-nocheck
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import Reservation from '../models/Reservation';
import { getIoInstance } from '../sockets/notificationSocket';
import bcrypt from 'bcryptjs';

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'superadmin' && req.user?.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Only superadmin can modify a superadmin' });
    }
    user.status = status;
    await user.save();
    res.json({ success: true, message: 'User status updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating user status' });
  }
};

const logActivity = async (action: string, module: string, req: Request) => {
  try {
    await ActivityLog.create({
      action,
      module,
      performedBy: req.user?.name || 'Unknown',
      role: req.user?.role || 'Unknown',
      ip: req.ip
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

export const getAdmins = async (req: Request, res: Response) => {
  try {
    const { role, roleGroup, type, status, search } = req.query;
    const group = (roleGroup || type || role || '').toString().toLowerCase();

    let roleFilter: any = {};
    if (group === 'student' || group === 'students' || group === 'user' || group === 'users') {
      // Student / User Management API: Return ONLY student and user
      roleFilter = { role: { $in: ['student', 'user'] } };
    } else if (group === 'all') {
      // Aggregated system stats if explicitly requested
      roleFilter = {};
    } else if (group === 'superadmin') {
      roleFilter = { role: 'superadmin' };
    } else if (group === 'admin_only') {
      roleFilter = { role: 'admin' };
    } else {
      // Admin Users API: Return ONLY admin and superadmin
      roleFilter = { role: { $in: ['admin', 'superadmin'] } };
    }

    const filter: any = { ...roleFilter };

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      const sRegex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: sRegex },
        { fullName: sRegex },
        { email: sRegex },
        { mobile: sRegex },
        { whatsapp: sRegex }
      ];
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
};

export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, mobile, whatsapp, status } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const callerRole = req.user?.role || 'admin';
    let targetRole = (role || 'student').toString().toLowerCase();

    // Security check: Only superadmin can create superadmin accounts
    if (targetRole === 'superadmin' && callerRole !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Only SuperAdmin can create SuperAdmin accounts' });
    }

    // Role enum validation
    if (!['superadmin', 'admin', 'student', 'user'].includes(targetRole)) {
      targetRole = 'student';
    }

    // Mobile number validation (User schema requires 10-digit mobile)
    let cleanMobile = (mobile || whatsapp || '').toString().trim().replace(/\D/g, '');
    if (cleanMobile.length > 10) {
      cleanMobile = cleanMobile.slice(-10);
    }
    if (cleanMobile.length !== 10) {
      cleanMobile = '9431885389'; // Safe default fallback if not provided
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name: name.trim(),
      fullName: name.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      mobileNumber: cleanMobile,
      whatsapp: whatsapp ? String(whatsapp).trim() : cleanMobile,
      password: hashedPassword,
      role: targetRole,
      status: status || 'Active',
      isVerified: true,
      emailVerified: true
    });

    await newUser.save();
    await logActivity(`User Created (${targetRole})`, 'Users', req);

    res.status(201).json({
      success: true,
      message: `${targetRole === 'superadmin' ? 'SuperAdmin' : targetRole.charAt(0).toUpperCase() + targetRole.slice(1)} account created successfully`,
      admin: {
        id: newUser._id,
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        role: newUser.role,
        status: newUser.status
      },
      user: {
        id: newUser._id,
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        role: newUser.role,
        status: newUser.status
      }
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error creating user' });
  }
};

export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, role, mobile, whatsapp, status } = req.body;
    const admin = await User.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Account not found' });

    // SuperAdmin protection
    if (admin.role === 'superadmin' && req.user?.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Only SuperAdmin can modify SuperAdmin accounts' });
    }

    // Admin cannot promote to SuperAdmin
    if (role === 'superadmin' && req.user?.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Only SuperAdmin can assign the SuperAdmin role' });
    }

    // Prevent demoting the only superadmin
    if (admin.role === 'superadmin' && role && role !== 'superadmin') {
      const superadminCount = await User.countDocuments({ role: 'superadmin' });
      if (superadminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot demote the only SuperAdmin account' });
      }
    }

    if (name) {
      admin.name = name.trim();
      admin.fullName = name.trim();
    }
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail !== admin.email) {
        const emailTaken = await User.findOne({ email: cleanEmail, _id: { $ne: admin._id } });
        if (emailTaken) {
          return res.status(400).json({ success: false, message: 'Email is already registered to another account' });
        }
        admin.email = cleanEmail;
      }
    }
    if (mobile) {
      const cleanMobile = mobile.toString().replace(/\D/g, '').slice(-10);
      if (cleanMobile.length === 10) {
        admin.mobile = cleanMobile;
        admin.mobileNumber = cleanMobile;
      }
    }
    if (whatsapp) {
      admin.whatsapp = whatsapp.toString().trim();
    }
    if (status && ['Active', 'Inactive'].includes(status)) {
      admin.status = status;
    }
    if (role && ['admin', 'superadmin', 'student', 'user'].includes(role)) {
      admin.role = role;
    }

    await admin.save();
    await logActivity(`User Updated (${admin.email})`, 'Users', req);
    res.json({ success: true, message: 'Account updated successfully' });
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error updating account' });
  }
};

export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Account not found' });

    if (admin.role === 'superadmin' && req.user?.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Only SuperAdmin can delete SuperAdmin accounts' });
    }
    if (admin.role === 'superadmin') {
      const superadminCount = await User.countDocuments({ role: 'superadmin' });
      if (superadminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot delete the only SuperAdmin account' });
      }
    }

    await admin.deleteOne();
    await logActivity(`User Deleted (${admin.email})`, 'Users', req);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error deleting account' });
  }
};

export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching activity logs' });
  }
};

/**
 * Permanently delete a seat reservation from MongoDB
 * DELETE /api/admin/reservations/:id
 */
export const deleteReservation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid reservation ID' });
    }

    // Check if reservation exists
    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    const studentName = reservation.fullName || 'Student';

    // Permanently remove from MongoDB (no soft delete)
    await Reservation.findByIdAndDelete(id);

    // Record Activity Log
    try {
      const performer = req.user?.name || req.user?.email || (req.user?.role === 'superadmin' ? 'Super Admin' : 'Admin');
      await ActivityLog.create({
        action: 'Reservation Deleted',
        description: `Admin deleted reservation of ${studentName}`,
        module: 'Reservations',
        performedBy: performer,
        role: req.user?.role || 'admin',
        ip: req.ip || req.socket?.remoteAddress || '127.0.0.1'
      });
    } catch (logErr) {
      console.error('Failed to create activity log for reservation deletion:', logErr);
    }

    // Emit real-time socket event for instant platform sync
    try {
      getIoInstance()?.emit('reservationsUpdated');
    } catch (socketErr) {
      console.error('Socket emission error:', socketErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Reservation deleted successfully'
    });
  } catch (error: any) {
    console.error('Error permanently deleting reservation:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting reservation',
      error: error.message
    });
  }
};

/**
 * Get real-time aggregated reservation statistics
 * GET /api/admin/reservations/stats
 */
export const getReservationStats = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, total: 0, pending: 0, confirmed: 0, cancelled: 0 });
    }
    const [total, pending, confirmed, cancelled] = await Promise.all([
      Reservation.countDocuments(),
      Reservation.countDocuments({ status: { $in: ['Pending', 'Contacted'] } }),
      Reservation.countDocuments({ status: { $in: ['Confirmed', 'Approved', 'Reserved', 'Converted'] } }),
      Reservation.countDocuments({ status: { $in: ['Cancelled', 'Rejected'] } }),
    ]);
    return res.json({ success: true, total, pending, confirmed, cancelled });
  } catch (error: any) {
    console.error('Error fetching reservation stats:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching reservation stats' });
  }
};

/**
 * Manually resend WhatsApp notification to all active admins
 * POST /api/admin/reservations/:id/resend-whatsapp
 */
export const resendReservationWhatsApp = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid reservation ID' });
    }

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    // Import service dynamically or statically
    const { sendReservationWhatsAppNotification } = await import('../services/whatsappNotificationService');
    const adminUser = req.user as any;
    const adminName = adminUser?.name || adminUser?.fullName || 'Admin';

    const result = await sendReservationWhatsAppNotification(id, {
      forceResend: true,
      triggeredBy: `Admin (${adminName})`
    });

    return res.json({
      success: true,
      message: `WhatsApp notification successfully resent to ${result.recipientsCount} active admin(s).`,
      result
    });
  } catch (error: any) {
    console.error('Error resending reservation WhatsApp notification:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error resending WhatsApp notification'
    });
  }
};

