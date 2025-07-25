// ============================================================================
// EMAIL PROCESSOR CONFIGURATION
// ============================================================================
// Change the sender email here to switch between different senders
let SENDER_EMAIL = "user1@example.com"; // Change this to switch senders

// Email service configuration (you can add more senders here)
const EMAIL_CONFIGS = {
  "user1@example.com": {
    name: "User 1",
    smtp: {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "user1@example.com",
        pass: "your-app-password-here" // Replace with actual app password
      }
    }
  },
  "user2@example.com": {
    name: "User 2", 
    smtp: {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "user2@example.com",
        pass: "your-app-password-here" // Replace with actual app password
      }
    }
  },
  "user3@example.com": {
    name: "User 3",
    smtp: {
      host: "smtp.gmail.com", 
      port: 587,
      secure: false,
      auth: {
        user: "user3@example.com",
        pass: "your-app-password-here" // Replace with actual app password
      }
    }
  }
};

// ============================================================================
// EMAIL PROCESSOR FUNCTIONS
// ============================================================================

/**
 * Main function to process email queue entries
 * This function should be called after emailQueue.json is populated
 */
async function processEmailQueue() {
  try {
    console.log('Starting email queue processing...');
    
    // Read the email queue
    const emailQueue = await readEmailQueue();
    const templates = await readTemplates();
    
    if (!emailQueue || !emailQueue.queue || emailQueue.queue.length === 0) {
      console.log('No emails in queue to process');
      return;
    }
    
    console.log(`Found ${emailQueue.queue.length} emails in queue`);
    
    // Process each queue entry
    for (const entry of emailQueue.queue) {
      await processQueueEntry(entry, templates);
    }
    
    console.log('Email queue processing completed');
    
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
      return;
    }
    
    // Check if sender email is configured
    if (!EMAIL_CONFIGS[entry.senderEmail]) {
      console.error(`Sender email ${entry.senderEmail} not configured`);
      await updateQueueEntryStatus(entry.id, 'failed', 'Sender email not configured');
      return;
    }
    
    // Process based on send mode
    switch (entry.sendMode) {
      case 'send':
        await processSendEmail(entry, template);
        break;
      case 'draft':
        await processCreateDraft(entry, template);
        break;
      default:
        console.error(`Invalid send mode: ${entry.sendMode}`);
        await updateQueueEntryStatus(entry.id, 'failed', 'Invalid send mode');
    }
    
  } catch (error) {
    console.error(`Error processing entry ${entry.id}:`, error);
    await updateQueueEntryStatus(entry.id, 'failed', error.message);
  }
}

/**
 * Process sending an email immediately or schedule it
 */
async function processSendEmail(entry, template) {
  try {
    const emailData = {
      to: entry.recipientEmail,
      subject: template.subject,
      body: template.body,
      senderEmail: entry.senderEmail,
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
    const emailData = {
      to: entry.recipientEmail,
      subject: template.subject,
      body: template.body,
      senderEmail: entry.senderEmail,
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
  // This is a placeholder implementation
  // In a real application, you would use a library like nodemailer
  console.log('Sending email:', {
    to: emailData.to,
    subject: emailData.subject,
    from: emailData.senderEmail
  });
  
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Here you would implement actual email sending logic
  // Example with nodemailer:
  /*
  const transporter = nodemailer.createTransporter(EMAIL_CONFIGS[emailData.senderEmail].smtp);
  await transporter.sendMail({
    from: emailData.senderEmail,
    to: emailData.to,
    subject: emailData.subject,
    html: emailData.body
  });
  */
}

/**
 * Schedule email for later sending
 */
async function scheduleEmail(entryId, emailData, scheduledDate) {
  // This is a placeholder implementation
  // In a real application, you would use a job queue like Bull or Agenda
  console.log('Scheduling email:', {
    entryId,
    scheduledDate,
    to: emailData.to,
    subject: emailData.subject
  });
  
  // Here you would implement actual scheduling logic
  // Example with a job queue:
  /*
  const job = await emailQueue.add('send-email', {
    entryId,
    emailData
  }, {
    delay: new Date(scheduledDate).getTime() - Date.now()
  });
  */
}

/**
 * Create draft in email client
 */
async function createDraft(emailData) {
  // This is a placeholder implementation
  // In a real application, you would use an email API like Gmail API
  console.log('Creating draft:', {
    to: emailData.to,
    subject: emailData.subject,
    from: emailData.senderEmail
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
    
  } catch (error) {
    console.error('Error updating queue entry status:', error);
    throw error;
  }
}

/**
 * Get current sender email configuration
 */
function getCurrentSenderEmail() {
  return SENDER_EMAIL;
}

/**
 * Set sender email configuration
 */
function setSenderEmail(email) {
  if (EMAIL_CONFIGS[email]) {
    SENDER_EMAIL = email;
    console.log(`Sender email changed to: ${email}`);
  } else {
    console.error(`Email ${email} not configured`);
  }
}

// Export functions for use in other files
module.exports = {
  processEmailQueue,
  getCurrentSenderEmail,
  setSenderEmail,
  EMAIL_CONFIGS
};