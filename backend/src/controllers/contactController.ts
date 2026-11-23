// @ts-nocheck
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { ContactInquiry } from '../models/ContactInquiry';
import { sendNotificationToUser, getIo } from '../sockets/notificationSocket';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { ActivityLog } from '../models/ActivityLog';
import { extractOptionalUser } from '../middleware/auth';

const ALLOWED_INQUIRY_STATUSES = ['Pending', 'In Progress', 'Resolved', 'Closed', 'Spam'];

const formatReplyDateTime = (date: Date): string => {
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const submitContactInquiry = async (req: Request, res: Response) => {
  try {
    const { fullName, mobile, email, subject, message } = req.body;

    if (
      typeof fullName !== 'string' ||
      (typeof mobile !== 'string' && typeof mobile !== 'number') ||
      typeof email !== 'string' ||
      typeof subject !== 'string' ||
      typeof message !== 'string'
    ) {
      return res.status(400).json({ success: false, message: 'Invalid inquiry input format' });
    }

    // Basic validations
    if (fullName.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Full Name requires minimum 3 characters' });
    }
    const cleanMobile = String(mobile).trim().replace(/[\s\-\(\)\+]/g, '').replace(/^91/, '').replace(/^0/, '');
    if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({ success: false, message: 'Invalid Mobile Number. Please provide a valid 10-digit mobile number.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid Email Address' });
    }
    if (subject.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Subject requires minimum 5 characters' });
    }
    if (message.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Message requires minimum 10 characters' });
    }

    // Priority 1 & 2: Attach verified authenticated user ONLY if submitted from a verified session.
    // Guest submissions NEVER link to an arbitrary account by matching email.
    let verifiedUserId: mongoose.Types.ObjectId | null = null;
    const authUser = extractOptionalUser(req);
    if (authUser?.id && mongoose.Types.ObjectId.isValid(authUser.id)) {
      const dbUser = await User.findById(authUser.id).select('_id').lean();
      if (dbUser?._id) {
        verifiedUserId = dbUser._id as mongoose.Types.ObjectId;
      }
    }

    const inquiry = new ContactInquiry({
      userId: verifiedUserId,
      user: verifiedUserId,
      isAuthenticatedUser: Boolean(verifiedUserId),
      fullName: fullName.trim(),
      mobile: cleanMobile,
      email: cleanEmail,
      subject: subject.trim(),
      message: message.trim(),
      status: 'Pending',
      source: 'Website',
      replies: []
    });

    await inquiry.save();

    // Send notifications exclusively to admins and superadmins (never broadcast to students)
    try {
      const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } }).select('_id').lean();
      const creatorId = admins.length > 0 ? admins[0]._id : undefined;

      const notification = new Notification({
        title: 'New Contact Inquiry',
        message: `New inquiry from ${fullName.trim()}: ${subject.trim()}`,
        targetAudience: 'admins',
        priority: 'normal',
        type: 'contact',
        notificationType: 'contact',
        inquiryId: inquiry._id,
        createdBy: creatorId,
        readBy: [],
        isRead: false,
        isDeleted: false
      });
      await notification.save();

      const io = getIo();
      if (io) {
        io.to('role:admin').to('role:superadmin').emit('notification_created', notification);
        io.to('role:admin').to('role:superadmin').emit('newNotification', notification);
        io.to('role:admin').to('role:superadmin').emit('notificationsUpdated');
      }

      if (admins.length > 0) {
        admins.forEach(admin => {
          const adminIdStr = String(admin._id);
          const payload = {
            _id: notification._id,
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            targetAudience: notification.targetAudience,
            type: notification.type,
            notificationType: notification.notificationType,
            inquiryId: notification.inquiryId,
            readBy: [],
            createdAt: notification.createdAt
          };
          sendNotificationToUser(adminIdStr, 'notification_created', payload);
          sendNotificationToUser(adminIdStr, 'notification:new', payload);
        });
      }
    } catch (notifErr: any) {
      console.warn('[Contact Inquiry] Notification error:', notifErr.message || notifErr);
    }

    // Activity Log
    try {
      await ActivityLog.create({
        action: 'Contact Inquiry Received',
        description: `New inquiry from ${fullName.trim()} (${cleanEmail}) - ${subject.trim()}`,
        module: 'Contact',
        performedBy: fullName.trim(),
        role: verifiedUserId ? 'student' : 'visitor',
        ip: req.ip
      });
    } catch {}

    res.status(201).json({ success: true, message: 'Message Sent Successfully', inquiry });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed To Send Message' });
  }
};

const normalizeMobileDigits = (val: any): string => {
  if (!val) return '';
  return String(val).trim().replace(/[\s\-\(\)\+]/g, '').replace(/^91/, '').replace(/^0/, '');
};

const findVerifiedAccountForInquiry = async (email: string, mobile?: string) => {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) return null;

  const candidates: any[] = await User.find({
    email: cleanEmail,
    emailVerified: true,
    isVerified: true,
    status: { $ne: 'Inactive' }
  })
    .select('_id name fullName email mobile mobileNumber role emailVerified isVerified')
    .lean();

  if (!Array.isArray(candidates) || candidates.length === 0) return null;

  const matchedUser = candidates[0];
  const cleanInquiryMobile = normalizeMobileDigits(mobile);
  const cleanUserMobile = normalizeMobileDigits(matchedUser.mobile || matchedUser.mobileNumber);
  const mobileMatches = Boolean(
    cleanInquiryMobile && cleanUserMobile && cleanInquiryMobile === cleanUserMobile
  );

  return {
    user: matchedUser,
    mobileMatches
  };
};

const dispatchReplyNotification = async ({
  inquiry,
  replySubdoc,
  recipientId,
  actingUserId,
  responderName,
  responderRole,
  trimmedReply,
  now
}: {
  inquiry: any;
  replySubdoc: any;
  recipientId: any;
  actingUserId?: any;
  responderName: string;
  responderRole: string;
  trimmedReply: string;
  now: Date;
}) => {
  const senderRoleLabel = responderRole === 'superadmin' ? 'SuperAdmin' : 'Admin';
  const title =
    senderRoleLabel === 'SuperAdmin'
      ? 'SuperAdmin Replied to Your Contact Inquiry'
      : 'Admin Replied to Your Contact Inquiry';

  const notificationDoc = new Notification({
    title,
    message: trimmedReply,
    targetAudience: 'individual',
    recipientId,
    recipientUserId: recipientId,
    inquiryId: inquiry._id,
    replyId: replySubdoc?._id || null,
    priority: 'high',
    type: 'contact_reply',
    notificationType: 'contact_reply',
    senderRole: senderRoleLabel,
    createdBy: actingUserId && mongoose.Types.ObjectId.isValid(actingUserId) ? actingUserId : undefined,
    readBy: [],
    isRead: false,
    readAt: null,
    isDeleted: false,
    deliveryStatus: 'sent',
    metadata: {
      inquiryId: String(inquiry._id),
      replyId: replySubdoc?._id ? String(replySubdoc._id) : null,
      inquirySubject: inquiry.subject,
      originalMessage: inquiry.message,
      adminReply: trimmedReply,
      repliedByName: responderName,
      repliedByRole: responderRole,
      senderRoleLabel,
      repliedAt: now.toISOString(),
      inquiryCreatedAt: inquiry.createdAt
    }
  });

  await notificationDoc.save();
  const createdNotification = await Notification.findById(notificationDoc._id)
    .populate('createdBy', 'name email')
    .select('-emailLogs')
    .lean();

  const recipientIdStr = String(recipientId);
  sendNotificationToUser(recipientIdStr, 'notification_created', createdNotification);
  sendNotificationToUser(recipientIdStr, 'notification:new', createdNotification);

  return createdNotification;
};

export const getContactInquiries = async (req: Request, res: Response) => {
  try {
    const inquiries: any[] = await ContactInquiry.find()
      .populate('userId', 'name fullName email mobile role emailVerified isVerified')
      .sort({ createdAt: -1 })
      .lean();

    const unlinkedEmails = Array.from(
      new Set(
        inquiries
          .filter((inc) => !inc.userId && !inc.user && inc.email)
          .map((inc) => String(inc.email).trim().toLowerCase())
      )
    );

    const verifiedUsersByEmail = new Map<string, any>();
    if (unlinkedEmails.length > 0) {
      const matchedUsers: any[] = await User.find({
        email: { $in: unlinkedEmails },
        emailVerified: true,
        isVerified: true,
        status: { $ne: 'Inactive' }
      })
        .select('_id name fullName email mobile mobileNumber role emailVerified isVerified')
        .lean();

      for (const u of matchedUsers) {
        if (u?.email) {
          verifiedUsersByEmail.set(String(u.email).trim().toLowerCase(), u);
        }
      }
    }

    const enriched = inquiries.map((inc) => {
      if (inc.userId || inc.user) return inc;
      const cleanEmail = String(inc.email || '').trim().toLowerCase();
      const matched = verifiedUsersByEmail.get(cleanEmail);
      if (!matched) return inc;

      const cleanIncMobile = normalizeMobileDigits(inc.mobile);
      const cleanUserMobile = normalizeMobileDigits(matched.mobile || matched.mobileNumber);
      return {
        ...inc,
        suggestedVerifiedUser: {
          _id: matched._id,
          name: matched.fullName || matched.name,
          email: matched.email,
          mobile: matched.mobile || matched.mobileNumber,
          mobileMatches: Boolean(cleanIncMobile && cleanUserMobile && cleanIncMobile === cleanUserMobile)
        }
      };
    });

    res.json(enriched);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to fetch inquiries' });
  }
};

export const getContactInquiry = async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid inquiry ID' });
    }
    const inquiry: any = await ContactInquiry.findById(req.params.id)
      .populate('userId', 'name fullName email mobile role emailVerified isVerified')
      .lean();
    if (!inquiry) return res.status(404).json({ success: false, message: 'Not found' });

    if (!inquiry.userId && !inquiry.user && inquiry.email) {
      const match = await findVerifiedAccountForInquiry(inquiry.email, inquiry.mobile);
      if (match?.user) {
        inquiry.suggestedVerifiedUser = {
          _id: match.user._id,
          name: match.user.fullName || match.user.name,
          email: match.user.email,
          mobile: match.user.mobile || match.user.mobileNumber,
          mobileMatches: match.mobileMatches
        };
      }
    }

    res.json(inquiry);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to fetch inquiry' });
  }
};

/**
 * Authenticated student owner (or staff) views full conversation & reply history for their inquiry
 * GET /api/contact/my/:id
 */
export const getMyContactInquiryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid inquiry ID' });
    }

    const user = (req as any).user;
    const requestingUserId = String(user?.id || user?.userId || '');
    const isStaff = user?.role === 'admin' || user?.role === 'superadmin';

    const inquiry = await ContactInquiry.findById(id).lean();
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    const ownerId = inquiry.userId ? String(inquiry.userId) : (inquiry.user ? String(inquiry.user) : '');
    if (!isStaff && (!ownerId || ownerId !== requestingUserId)) {
      return res.status(403).json({ success: false, message: 'Access denied: you do not own this inquiry' });
    }

    // Ensure legacy single adminReply appears in replies list if replies array is empty
    const repliesList = Array.isArray(inquiry.replies) && inquiry.replies.length > 0
      ? inquiry.replies
      : (inquiry.adminReply
          ? [{
              _id: 'legacy-reply',
              inquiryId: inquiry._id,
              message: inquiry.adminReply,
              replyMessage: inquiry.adminReply,
              senderRole: 'admin',
              repliedByName: 'Admin',
              repliedByRole: 'admin',
              repliedAt: inquiry.repliedAt || inquiry.updatedAt || inquiry.createdAt,
              createdAt: inquiry.repliedAt || inquiry.updatedAt || inquiry.createdAt
            }]
          : []);

    return res.json({
      success: true,
      inquiry: {
        _id: inquiry._id,
        fullName: inquiry.fullName,
        subject: inquiry.subject,
        message: inquiry.message,
        status: inquiry.status,
        createdAt: inquiry.createdAt,
        adminReply: inquiry.adminReply,
        repliedAt: inquiry.repliedAt,
        replies: repliesList
      }
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Failed to load inquiry conversation' });
  }
};

/**
 * Safely associate an unlinked/legacy inquiry with a verified registered student account (Admin/SuperAdmin only)
 * PUT /api/contact/:id/associate-user
 */
export const associateInquiryUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid inquiry ID' });
    }

    const inquiry = await ContactInquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    const { userId: explicitUserId, deliverExistingReplies = true } = req.body || {};
    let targetUser: any = null;

    if (explicitUserId) {
      if (!mongoose.Types.ObjectId.isValid(String(explicitUserId))) {
        return res.status(400).json({ success: false, message: 'Invalid user ID' });
      }
      const candidate: any = await User.findById(explicitUserId)
        .select('_id name fullName email mobile mobileNumber role emailVerified isVerified status')
        .lean();
      if (!candidate || candidate.status === 'Inactive' || candidate.emailVerified === false || candidate.isVerified === false) {
        return res.status(400).json({ success: false, message: 'Target user must be an active, verified account' });
      }
      targetUser = candidate;
    } else {
      const verifiedMatch = await findVerifiedAccountForInquiry(inquiry.email, inquiry.mobile);
      if (!verifiedMatch?.user) {
        return res.status(404).json({
          success: false,
          message: 'No active verified student account found matching this inquiry email'
        });
      }
      targetUser = verifiedMatch.user;
    }

    inquiry.userId = targetUser._id;
    inquiry.user = targetUser._id;

    let syncedNotifications = 0;

    if (deliverExistingReplies) {
      const existingReplies = Array.isArray(inquiry.replies) ? inquiry.replies : [];
      if (existingReplies.length === 0 && inquiry.adminReply && inquiry.adminReply.trim()) {
        const legacyDate = inquiry.repliedAt || inquiry.updatedAt || inquiry.createdAt || new Date();
        inquiry.replies.push({
          inquiryId: inquiry._id,
          senderId: null,
          senderRole: 'admin',
          message: inquiry.adminReply.trim(),
          replyMessage: inquiry.adminReply.trim(),
          repliedBy: null,
          repliedByName: 'Admin',
          repliedByRole: 'admin',
          deliveredToNotification: false,
          notificationId: null,
          repliedAt: legacyDate,
          createdAt: legacyDate
        });
      }

      await inquiry.save();

      // Deliver notification for latest undelivered reply if none sent yet
      const repliesNow = Array.isArray(inquiry.replies) ? inquiry.replies : [];
      const latestUndelivered = [...repliesNow].reverse().find((r: any) => !r.deliveredToNotification);
      if (latestUndelivered) {
        const alreadyExists = await Notification.findOne({
          inquiryId: inquiry._id,
          recipientId: targetUser._id,
          replyId: latestUndelivered._id,
          isDeleted: false
        }).lean();

        if (!alreadyExists) {
          const created = await dispatchReplyNotification({
            inquiry,
            replySubdoc: latestUndelivered,
            recipientId: targetUser._id,
            actingUserId: (req as any).user?.id,
            responderName: latestUndelivered.repliedByName || 'Admin',
            responderRole: latestUndelivered.repliedByRole || latestUndelivered.senderRole || 'admin',
            trimmedReply: latestUndelivered.replyMessage || latestUndelivered.message,
            now: latestUndelivered.repliedAt ? new Date(latestUndelivered.repliedAt) : new Date()
          });
          latestUndelivered.deliveredToNotification = true;
          latestUndelivered.notificationId = created?._id || null;
          syncedNotifications = 1;
        }
      }
    }

    await inquiry.save();
    const populatedInquiry = await ContactInquiry.findById(id)
      .populate('userId', 'name fullName email mobile role emailVerified isVerified')
      .lean();

    return res.json({
      success: true,
      message: syncedNotifications > 0
        ? 'Account associated & existing reply delivered to student notifications'
        : 'Verified student account associated with inquiry',
      syncedNotifications,
      inquiry: populatedInquiry
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Failed to associate student account' });
  }
};

export const updateContactInquiryStatus = async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid inquiry ID' });
    }
    const { status } = req.body;
    if (typeof status !== 'string' || !ALLOWED_INQUIRY_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }
    const inquiry = await ContactInquiry.findOneAndUpdate(
      { _id: req.params.id },
      { status },
      { returnDocument: 'after' }
    ).populate('userId', 'name fullName email mobile role emailVerified isVerified');
    if (!inquiry) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ message: 'Inquiry Status Updated Successfully', inquiry });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to update status' });
  }
};

export const replyContactInquiry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid inquiry ID' });
    }

    const { adminReply } = req.body;
    if (typeof adminReply !== 'string' || !adminReply.trim()) {
      return res.status(400).json({ success: false, message: 'Reply message cannot be empty' });
    }
    const trimmedReply = adminReply.trim();
    if (trimmedReply.length > 5000) {
      return res.status(400).json({ success: false, message: 'Reply message exceeds maximum length of 5000 characters' });
    }

    const inquiry = await ContactInquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    const actingUser = (req as any).user;
    const actingUserId = actingUser?.id || actingUser?.userId;
    let responderName = 'Admin';
    let responderRole = actingUser?.role || 'admin';
    if (actingUserId && mongoose.Types.ObjectId.isValid(actingUserId)) {
      const responder = await User.findById(actingUserId).select('name fullName role').lean();
      if (responder) {
        responderName = (responder as any).fullName || (responder as any).name || 'Admin';
        responderRole = (responder as any).role || responderRole;
      }
    }

    // Deduplicate rapid accidental double-clicks submitting identical reply within 10 seconds
    const existingReplies = Array.isArray(inquiry.replies) ? inquiry.replies : [];
    const lastReply = existingReplies.length > 0 ? existingReplies[existingReplies.length - 1] : null;
    if (
      lastReply &&
      lastReply.replyMessage === trimmedReply &&
      lastReply.repliedAt &&
      Date.now() - new Date(lastReply.repliedAt).getTime() < 10000
    ) {
      const populatedExisting = await ContactInquiry.findById(id)
        .populate('userId', 'name fullName email mobile role emailVerified isVerified')
        .lean();
      return res.json({
        success: true,
        duplicatePrevented: true,
        message: 'Reply already saved',
        notificationSent: Boolean(lastReply.deliveredToNotification),
        inquiry: populatedExisting
      });
    }

    const now = new Date();
    const senderObjId = actingUserId && mongoose.Types.ObjectId.isValid(actingUserId) ? actingUserId : null;

    // Preserve legacy adminReply in replies history if migrating an older record on first new reply
    if (existingReplies.length === 0 && inquiry.adminReply && inquiry.adminReply.trim()) {
      const legacyDate = inquiry.repliedAt || inquiry.updatedAt || inquiry.createdAt;
      inquiry.replies.push({
        inquiryId: inquiry._id,
        senderId: null,
        senderRole: 'admin',
        message: inquiry.adminReply.trim(),
        replyMessage: inquiry.adminReply.trim(),
        repliedBy: null,
        repliedByName: 'Admin',
        repliedByRole: 'admin',
        deliveredToNotification: false,
        notificationId: null,
        repliedAt: legacyDate,
        createdAt: legacyDate
      });
    }

    inquiry.replies.push({
      inquiryId: inquiry._id,
      senderId: senderObjId,
      senderRole: responderRole,
      message: trimmedReply,
      replyMessage: trimmedReply,
      repliedBy: senderObjId,
      repliedByName: responderName,
      repliedByRole: responderRole,
      deliveredToNotification: false,
      notificationId: null,
      repliedAt: now,
      createdAt: now
    });
    inquiry.adminReply = trimmedReply;
    inquiry.repliedAt = now;
    inquiry.status = 'Resolved';

    await inquiry.save();

    const savedReplySubdoc = inquiry.replies[inquiry.replies.length - 1];

    // Strict Recipient Resolution Priority:
    // 1. Valid inquiry.userId or inquiry.user linking to an active registered user
    // 2. For legacy/unlinked inquiries only: match when a VERIFIED user matches BOTH email AND mobile
    //    (Never match by phone alone; never auto-notify on unverified or email-only guest mismatches)
    let verifiedRecipient: any = null;
    let suggestedVerifiedUser: any = null;
    const ownerCandidate = inquiry.userId || inquiry.user;

    if (ownerCandidate && mongoose.Types.ObjectId.isValid(String(ownerCandidate))) {
      verifiedRecipient = await User.findById(ownerCandidate)
        .select('_id name fullName email role status')
        .lean();
      if (verifiedRecipient?.status === 'Inactive') {
        verifiedRecipient = null;
      }
    } else if (inquiry.email) {
      const verifiedMatch = await findVerifiedAccountForInquiry(inquiry.email, inquiry.mobile);
      if (verifiedMatch?.user) {
        if (verifiedMatch.mobileMatches) {
          verifiedRecipient = verifiedMatch.user;
          inquiry.userId = verifiedMatch.user._id;
          inquiry.user = verifiedMatch.user._id;
          await inquiry.save();
        } else {
          suggestedVerifiedUser = {
            _id: verifiedMatch.user._id,
            name: verifiedMatch.user.fullName || verifiedMatch.user.name,
            email: verifiedMatch.user.email,
            mobile: verifiedMatch.user.mobile || verifiedMatch.user.mobileNumber,
            mobileMatches: false
          };
        }
      }
    }

    let createdNotification: any = null;
    if (verifiedRecipient?._id) {
      createdNotification = await dispatchReplyNotification({
        inquiry,
        replySubdoc: savedReplySubdoc,
        recipientId: verifiedRecipient._id,
        actingUserId: senderObjId,
        responderName,
        responderRole,
        trimmedReply,
        now
      });

      if (savedReplySubdoc && createdNotification?._id) {
        savedReplySubdoc.deliveredToNotification = true;
        savedReplySubdoc.notificationId = createdNotification._id;
        await inquiry.save();
      }
    }

    try {
      await ActivityLog.create({
        action: 'Contact Inquiry Replied',
        description: `Replied to inquiry "${inquiry.subject}" (${verifiedRecipient ? `notified user ${verifiedRecipient.email}` : 'unlinked inquiry — saved to history'})`,
        module: 'Contact',
        performedBy: responderName,
        role: responderRole,
        ip: req.ip
      });
    } catch {}

    const populatedInquiry: any = await ContactInquiry.findById(id)
      .populate('userId', 'name fullName email mobile role emailVerified isVerified')
      .lean();

    if (populatedInquiry && !populatedInquiry.userId && suggestedVerifiedUser) {
      populatedInquiry.suggestedVerifiedUser = suggestedVerifiedUser;
    }

    return res.json({
      success: true,
      message: createdNotification
        ? 'Reply Saved & Delivered to Student Notifications'
        : suggestedVerifiedUser
          ? 'Reply Saved. Account email matched with different mobile — please verify and associate account manually to notify.'
          : 'Reply Saved to Inquiry History (Guest inquiry — no verified account linked)',
      notificationSent: Boolean(createdNotification),
      notificationId: createdNotification?._id || null,
      replyId: savedReplySubdoc?._id || null,
      inquiry: populatedInquiry
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Failed to send reply' });
  }
};

export const deleteContactInquiry = async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid inquiry ID' });
    }
    await ContactInquiry.findOneAndDelete({ _id: req.params.id });
    res.json({ message: 'Inquiry Deleted Successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to delete inquiry' });
  }
};
