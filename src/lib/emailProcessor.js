require('dotenv').config();

// ============================================================================
// EMAIL PROCESSOR CONFIGURATION
// ============================================================================

// Email service configuration - now dynamically loaded from user.json
let EMAIL_CONFIGS = {};

// ============================================================================
// EMAIL PROCESSOR FUNCTIONS
// ============================================================================

/**
 * Initialize email configurations from user.json
 */
async function initializeEmailConfigs() {
  try {
    console.log('Initializing email configurations...');
    const fs = require('fs').promises;
    const path = require('path');
    const userFilePath = path.join(process.cwd(), 'data', 'user.json');
    
    const data = await fs.readFile(userFilePath, 'utf8');
    const userData = JSON.parse(data);
    
    EMAIL_CONFIGS = {};
    userData.users.forEach(user => {
      EMAIL_CONFIGS[user.email] = {
        name: user.name,
        email: user.email,
        password: user.password,
        smtp: {
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: {
            user: user.email,
            pass: process.env[user.password.replace('process.env.', '')] || user.password
          }
        }
      };
    });
    
    console.log(`Initialized ${Object.keys(EMAIL_CONFIGS).length} email configurations`);
  } catch (error) {
    console.error('Error initializing email configurations:', error);
    throw error;
  }
}

/**
 * Main function to process email queue entries
 */
async function processEmailQueue() {
  try {
    console.log('=== Starting email queue processing ===');
    
    // Initialize email configurations
    await initializeEmailConfigs();
    
    // First, process any scheduled emails that are due
    console.log('Processing scheduled emails...');
    await processScheduledEmails();
    
    // Read the email queue and templates
    const emailQueue = await readEmailQueue();
    const templates = await readTemplates();
    
    if (!emailQueue || !emailQueue.queue || emailQueue.queue.length === 0) {
      console.log('No emails in queue to process');
      return;
    }
    
    console.log(`Found ${emailQueue.queue.length} emails in queue`);
    
    // Process each queue entry
    const processedEntryIds = [];
    
    for (const entry of emailQueue.queue) {
      const wasProcessed = await processQueueEntry(entry, templates);
      if (wasProcessed) {
        processedEntryIds.push(entry.id);
      }
    }
    
    // Remove processed entries from the queue file
    if (processedEntryIds.length > 0) {
      await removeProcessedEntries(processedEntryIds);
      console.log(`Removed ${processedEntryIds.length} processed entries from queue`);
    }
    
    // Update processing statistics
    const failedCount = emailQueue.queue.filter(entry => entry.status === 'failed').length;
    await updateProcessingStats(processedEntryIds.length, failedCount);
    
    console.log('=== Email queue processing completed ===');
    
  } catch (error) {
    console.error('Error processing email queue:', error);
    throw error;
  }
}

/**
 * Process a single queue entry
 */
async function processQueueEntry(entry, templates) {
  try {
    console.log(`Processing entry ${entry.id} for ${entry.recipientEmail}`);
    
    // Find the template
    const template = templates.templates.find(t => t.id === entry.templateId);
    if (!template) {
      console.error(`Template not found for entry ${entry.id}`);
      await updateQueueEntryStatus(entry.id, 'failed', 'Template not found');
      return false;
    }
    
    // Check if sender email is configured
    if (!EMAIL_CONFIGS[entry.senderEmail]) {
      console.error(`Sender email ${entry.senderEmail} not configured`);
      await updateQueueEntryStatus(entry.id, 'failed', 'Sender email not configured');
      return false;
    }
    
    // Process based on send mode
    switch (entry.sendMode) {
      case 'send':
        await processSendEmail(entry, template);
        return true;
      case 'draft':
        await processCreateDraft(entry, template);
        return true;
      default:
        console.error(`Invalid send mode: ${entry.sendMode}`);
        await updateQueueEntryStatus(entry.id, 'failed', 'Invalid send mode');
        return false;
    }
    
  } catch (error) {
    console.error(`Error processing entry ${entry.id}:`, error);
    await updateQueueEntryStatus(entry.id, 'failed', error.message);
    return false;
  }
}

/**
 * Process sending an email immediately or schedule it
 */
async function processSendEmail(entry, template) {
  try {
    console.log(`Preparing to send email for entry ${entry.id}`);
    
    const emailData = {
      to: entry.recipientEmail,
      subject: template.subject,
      body: template.body,
      senderEmail: entry.senderEmail,
      senderName: entry.senderName,
      recipientName: entry.recipientName
    };
    
    if (entry.scheduledDate) {
      // Schedule the email
      await scheduleEmail(entry.id, emailData, entry.scheduledDate);
      await updateQueueEntryStatus(entry.id, 'scheduled', 'Email scheduled for sending');
      console.log(`Email scheduled for ${entry.scheduledDate}`);
    } else {
      // Send immediately
      await sendEmail(emailData);
      await updateQueueEntryStatus(entry.id, 'sent', 'Email sent successfully');
      console.log(`Email sent to ${entry.recipientEmail}`);
    }
    
  } catch (error) {
    console.error(`Error sending email for entry ${entry.id}:`, error);
    await updateQueueEntryStatus(entry.id, 'failed', error.message);
    throw error;
  }
}

/**
 * Process creating a draft
 */
async function processCreateDraft(entry, template) {
  try {
    console.log(`Creating draft for entry ${entry.id}`);
    
    const emailData = {
      to: entry.recipientEmail,
      subject: template.subject,
      body: template.body,
      senderEmail: entry.senderEmail,
      senderName: entry.senderName,
      recipientName: entry.recipientName
    };
    
    await createDraft(emailData);
    await updateQueueEntryStatus(entry.id, 'draft_created', 'Draft created successfully');
    console.log(`Draft created for ${entry.recipientEmail}`);
    
  } catch (error) {
    console.error(`Error creating draft for entry ${entry.id}:`, error);
    await updateQueueEntryStatus(entry.id, 'failed', error.message);
    throw error;
  }
}

/**
 * Send email using configured SMTP
 */
async function sendEmail(emailData) {
  try {
    console.log(`Sending email to ${emailData.to} from ${emailData.senderEmail}`);
    
    const transporter = require('nodemailer').createTransport(EMAIL_CONFIGS[emailData.senderEmail].smtp);
    
    const mailOptions = {
      from: `"${emailData.senderName}" <${emailData.senderEmail}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.body
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${emailData.to}. Message ID: ${result.messageId}`);
    
  } catch (error) {
    console.error(`Error sending email to ${emailData.to}:`, error);
    throw error;
  }
}

/**
 * Schedule email for later sending
 */
async function scheduleEmail(entryId, emailData, scheduledDate) {
  console.log(`Scheduling email for entry ${entryId} at ${scheduledDate}`);
  
  try {
    // Read current scheduled emails
    const fs = require('fs').promises;
    const path = require('path');
    const scheduledEmailsPath = path.join(process.cwd(), 'data', 'scheduledEmails.json');
    
    let scheduledEmails = [];
    try {
      const data = await fs.readFile(scheduledEmailsPath, 'utf8');
      scheduledEmails = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start with empty array
      scheduledEmails = [];
    }
    
    // Add the new scheduled email
    const scheduledEmail = {
      id: entryId,
      emailData,
      scheduledDate,
      createdAt: new Date().toISOString(),
      status: 'scheduled'
    };
    
    scheduledEmails.push(scheduledEmail);
    
    // Write back to file
    await fs.writeFile(scheduledEmailsPath, JSON.stringify(scheduledEmails, null, 2));
    
    console.log('Email scheduling details:', {
      entryId,
      scheduledDate,
      to: emailData.to,
      subject: emailData.subject,
      from: emailData.senderEmail
    });
    
    return true;
  } catch (error) {
    console.error('Error scheduling email:', error);
    throw error;
  }
}

/**
 * Process scheduled emails that are due to be sent
 */
async function processScheduledEmails() {
  try {
    // Initialize email configurations first
    await initializeEmailConfigs();
    
    const fs = require('fs').promises;
    const path = require('path');
    const scheduledEmailsPath = path.join(process.cwd(), 'data', 'scheduledEmails.json');
    
    // Read scheduled emails
    let scheduledEmails = [];
    try {
      const data = await fs.readFile(scheduledEmailsPath, 'utf8');
      scheduledEmails = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, nothing to process
      return;
    }
    
    const now = new Date();
    const emailsToSend = [];
    const remainingEmails = [];
    
    // Check which emails are due to be sent
    for (const scheduledEmail of scheduledEmails) {
      const scheduledTime = new Date(scheduledEmail.scheduledDate);
      
      if (scheduledTime <= now) {
        // Email is due to be sent
        emailsToSend.push(scheduledEmail);
      } else {
        // Email is not due yet, keep it in the list
        remainingEmails.push(scheduledEmail);
      }
    }
    
    // Send emails that are due
    for (const scheduledEmail of emailsToSend) {
      try {
        console.log(`Processing scheduled email ${scheduledEmail.id}`);
        
        // Send the email
        await sendEmail(scheduledEmail.emailData);
        
        // Update the queue entry status if it exists
        try {
          await updateQueueEntryStatus(scheduledEmail.id, 'sent', 'Scheduled email sent successfully');
        } catch (error) {
          console.log(`Queue entry ${scheduledEmail.id} not found, skipping status update`);
        }
        
        console.log(`Scheduled email ${scheduledEmail.id} sent successfully`);
      } catch (error) {
        console.error(`Error sending scheduled email ${scheduledEmail.id}:`, error);
        try {
          await updateQueueEntryStatus(scheduledEmail.id, 'failed', `Scheduled email failed: ${error.message}`);
        } catch (statusError) {
          console.log(`Queue entry ${scheduledEmail.id} not found, skipping status update`);
        }
      }
    }
    
    // Update the scheduled emails file with remaining emails
    await fs.writeFile(scheduledEmailsPath, JSON.stringify(remainingEmails, null, 2));
    
    if (emailsToSend.length > 0) {
      console.log(`Processed ${emailsToSend.length} scheduled emails`);
    }
    
  } catch (error) {
    console.error('Error processing scheduled emails:', error);
  }
}

/**
 * Create draft in email client
 */
async function createDraft(emailData) {
  console.log(`Creating draft for ${emailData.to}`);
  
  // This is a placeholder implementation
  // In a real application, you would use an email API like Gmail API
  console.log('Draft creation details:', {
    to: emailData.to,
    subject: emailData.subject,
    from: emailData.senderEmail,
    senderName: emailData.senderName
  });
  
  // Here you would implement actual draft creation logic
  // Example with Gmail API:
  /*
  const gmail = google.gmail({version: 'v1', auth: oauth2Client});
  const draft = await gmail.users.drafts.create({
    userId: 'me',
    resource: {
      message: {
        raw: Buffer.from(
          `To: ${emailData.to}\r\n` +
          `Subject: ${emailData.subject}\r\n` +
          `Content-Type: text/html; charset=utf-8\r\n\r\n` +
          `${emailData.body}`
        ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      }
    }
  });
  */
}

/**
 * Read email queue from JSON file
 */
async function readEmailQueue() {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const filePath = path.join(process.cwd(), 'data', 'emailQueue.json');
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading email queue:', error);
    throw error;
  }
}

/**
 * Read templates from JSON file
 */
async function readTemplates() {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const filePath = path.join(process.cwd(), 'data', 'templates.json');
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading templates:', error);
    throw error;
  }
}

/**
 * Update queue entry status
 */
async function updateQueueEntryStatus(entryId, status, message) {
  try {
    console.log(`Updating entry ${entryId} status to: ${status}`);
    
    const fs = require('fs').promises;
    const path = require('path');
    const filePath = path.join(process.cwd(), 'data', 'emailQueue.json');
    
    // Read current queue
    const data = await fs.readFile(filePath, 'utf8');
    const emailQueue = JSON.parse(data);
    
    // Find and update the entry
    const entry = emailQueue.queue.find(e => e.id === entryId);
    if (entry) {
      entry.status = status;
      entry.processedAt = new Date().toISOString();
      entry.message = message;
    }
    
    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(emailQueue, null, 2));
    console.log(`Entry ${entryId} status updated successfully`);
    
  } catch (error) {
    console.error('Error updating queue entry status:', error);
    throw error;
  }
}

/**
 * Remove processed entries from the queue file
 */
async function removeProcessedEntries(processedEntryIds) {
  try {
    console.log(`Removing ${processedEntryIds.length} processed entries from queue file`);
    
    const fs = require('fs').promises;
    const path = require('path');
    const filePath = path.join(process.cwd(), 'data', 'emailQueue.json');
    
    // Read current queue
    const data = await fs.readFile(filePath, 'utf8');
    const emailQueue = JSON.parse(data);
    
    // Filter out processed entries
    const originalCount = emailQueue.queue.length;
    emailQueue.queue = emailQueue.queue.filter(entry => 
      !processedEntryIds.includes(entry.id)
    );
    
    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(emailQueue, null, 2));
    
    console.log(`Removed ${originalCount - emailQueue.queue.length} entries from queue file`);
    
  } catch (error) {
    console.error('Error removing processed entries:', error);
    throw error;
  }
}

/**
 * Update processing statistics
 */
async function updateProcessingStats(processed, failed) {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const statsFilePath = path.join(process.cwd(), 'data', 'processingStats.json');
    
    // Read current stats
    let stats = {
      totalProcessed: 0,
      totalFailed: 0,
      lastProcessingTime: null,
      sessionProcessed: 0,
      sessionFailed: 0
    };
    
    try {
      const statsContent = await fs.readFile(statsFilePath, 'utf8');
      stats = JSON.parse(statsContent);
    } catch (error) {
      // If file doesn't exist, use default
      console.log('Processing stats file not found, creating new one');
    }
    
    // Update stats
    stats.totalProcessed += processed;
    stats.totalFailed += failed;
    stats.sessionProcessed += processed;
    stats.sessionFailed += failed;
    stats.lastProcessingTime = new Date().toISOString();
    
    // Write back to file
    await fs.writeFile(statsFilePath, JSON.stringify(stats, null, 2));
    
    console.log(`Updated processing stats: +${processed} processed, +${failed} failed`);
    
  } catch (error) {
    console.error('Error updating processing stats:', error);
    throw error;
  }
}

/**
 * Get current email configurations
 */
function getEmailConfigs() {
  return EMAIL_CONFIGS;
}

// Export functions for use in other files
module.exports = {
  processEmailQueue,
  processScheduledEmails,
  getEmailConfigs,
  initializeEmailConfigs
}; 