// In-memory notifications log for real-time audit trail
const notificationLogs = [];

export const notificationService = {
  sendIssueAlert: ({ ticketId, priority, category, department, address, officerPhone, officerEmail }) => {
    const timestamp = new Date();
    const smsLog = {
      id: `ntf-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'SMS_ALERT',
      recipient: officerPhone || '+1 (555) 019-2831',
      recipientRole: 'Department Engineer',
      department,
      ticketId,
      message: `[CIVIX-ALERT] ${priority.toUpperCase()} ${category} issue logged at ${address}. Ticket #${ticketId}. SLA clock started. View: https://civix.gov/t/${ticketId}`,
      timestamp,
      status: 'DELIVERED',
    };

    const emailLog = {
      id: `ntf-em-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'EMAIL_DISPATCH',
      recipient: officerEmail || 'engineer@civix.gov',
      recipientRole: 'Department Executive',
      department,
      ticketId,
      subject: `[DISPATCH] Priority ${priority}: ${category} at ${address}`,
      message: `Formal grievance ticket #${ticketId} dispatched. AI Vision hazard assessment confirmed. Immediate field inspection required.`,
      timestamp,
      status: 'SENT',
    };

    notificationLogs.unshift(smsLog, emailLog);
    console.log(`[CivixAI Notification] SMS & Email dispatched for #${ticketId} to ${department}`);
    return [smsLog, emailLog];
  },

  sendCitizenStatusUpdate: ({ ticketId, citizenPhone, newStatus, note }) => {
    const log = {
      id: `ntf-cz-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'CITIZEN_SMS',
      recipient: citizenPhone || '+1 (555) 234-5678',
      recipientRole: 'Citizen Reporter',
      ticketId,
      message: `[CivixAI Update] Your civic report #${ticketId} status has changed to: "${newStatus}". Note: ${note || 'Official action taken'}. Track real-time progress in CivixAI.`,
      timestamp: new Date(),
      status: 'DELIVERED',
    };
    notificationLogs.unshift(log);
    return log;
  },

  getRecentLogs: (limit = 20) => {
    return notificationLogs.slice(0, limit);
  },
};
