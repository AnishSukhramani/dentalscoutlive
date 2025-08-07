require('dotenv').config();

// ============================================================================
// EMAIL PROCESSOR CONFIGURATION
// ============================================================================

// Supabase table columns reference for placeholder replacement
const TABLE_COLUMNS = [
  { name: "id", description: "Unique identifier for each practice entry" },
  { name: "practice_name", description: "Name of the dental practice" },
  { name: "domain_url", description: "Website URL of the practice" },
  { name: "owner_name", description: "Name of the practice owner" },
  { name: "email", description: "Contact email address" },
  { name: "phone_number", description: "Contact phone number" },
  { name: "first_name", description: "First name of the contact person" }
];

// Email service configuration - now dynamically loaded from user.json
let EMAIL_CONFIGS = {};

// ============================================================================
// EMAIL PROCESSOR FUNCTIONS
// ============================================================================

/**
 * Replace placeholders in email content with actual column values
 * @param {string} content - The email content (subject or body)
 * @param {object} entryData - The entry data from Supabase table
 * @returns {string} - Content with placeholders replaced
 */
function replacePlaceholders(content, entryData) {
  if (!content || !entryData) return content;

  console.log('Entry data:', entryData);
  let replacedContent = content;

  console.log('Content:', content);
  console.log('\n🔄 PLACEHOLDER REPLACEMENT PROCESS');
  console.log('=====================================');
  console.log('Original content:', content.substring(0, 100) + '...');
  console.log('Entry data keys:', Object.keys(entryData));
  console.log('Full entry data:', JSON.stringify(entryData, null, 2));
  
  // First, handle any placeholders that might not be in our main mappings
  console.log('\n📋 Step 1: Finding all placeholders...');
  const allPlaceholders = replacedContent.match(/\[([^\]]+)\]/g);
  console.log('All placeholders:', allPlaceholders);
  if (allPlaceholders) {
    console.log('Found placeholders:', allPlaceholders);
    console.log('\n🔄 Step 2: Processing each placeholder...');
    allPlaceholders.forEach((placeholder, index) => {
      console.log(`\n  Processing placeholder ${index + 1}/${allPlaceholders.length}: ${placeholder}`);
      const fieldName = placeholder.slice(1, -1); // Remove [ and ]
      console.log('  Field name (without brackets):', fieldName);
      
      // Try to find the field by converting spaces to underscores
      const fieldKey = fieldName.replace(/ /g, '_');
      console.log('  Field key (spaces to underscores):', fieldKey);
      
      const value = entryData[fieldKey] || entryData[fieldName] || '';
      console.log('  Value found:', `"${value}"`);
      console.log('  Value source:', entryData[fieldKey] ? `entryData["${fieldKey}"]` : entryData[fieldName] ? `entryData["${fieldName}"]` : 'not found');
      
      console.log('  Replacing:', `${placeholder} → "${value}"`);
      replacedContent = replacedContent.split(placeholder).join(value);
      console.log('  Content after replacement:', replacedContent.substring(0, 100) + '...');
    });
  } else {
    console.log('No placeholders found in content');
  }
  
  // Then handle our specific field mappings for any remaining placeholders
  console.log('\n📋 Step 3: Processing specific field mappings...');
  const fieldMappings = {
    'first_name': ['[first_name]', '[first name]', '[firstname]'],
    'practice_name': ['[practice_name]', '[practice name]', '[practicename]'],
    'domain_url': ['[domain_url]', '[domain url]', '[domainurl]'],
    'owner_name': ['[owner_name]', '[owner name]', '[ownername]'],
    'email': ['[email]'],
    'phone_number': ['[phone_number]', '[phone number]', '[phonenumber]'],
    'id': ['[id]']
  };
  
  Object.entries(fieldMappings).forEach(([fieldName, placeholders]) => {
    const value = entryData[fieldName] || '';
    console.log(`\n  Processing field "${fieldName}" with value: "${value}"`);
    
    placeholders.forEach(placeholder => {
      if (replacedContent.includes(placeholder)) {
        console.log(`    Replacing ${placeholder} with "${value}"`);
        // Use simple string replacement to avoid regex issues
        replacedContent = replacedContent.split(placeholder).join(value);
        console.log(`    Content after replacement:`, replacedContent.substring(0, 100) + '...');
      } else {
        console.log(`    Placeholder ${placeholder} not found in content`);
      }
    });
  });
  
  console.log('\n✅ PLACEHOLDER REPLACEMENT COMPLETE');
  console.log('=====================================');
  console.log('Final result:', replacedContent.substring(0, 100) + '...');
  console.log('Full final result:', replacedContent);
  console.log('=====================================\n');
  
  return replacedContent;
}

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
    console.log('Timestamp:', new Date().toISOString());
    
    // Initialize email configurations
    console.log('Step 1: Initializing email configurations...');
    await initializeEmailConfigs();
    console.log('✓ Email configurations initialized successfully');
    
    // First, process any scheduled emails that are due
    console.log('Step 2: Processing scheduled emails...');
    await processScheduledEmails();
    console.log('✓ Scheduled emails processed');
    
    // Read the email queue and templates
    console.log('Step 3: Reading email queue and templates...');
    const emailQueue = await readEmailQueue();
    const templates = await readTemplates();
    console.log('✓ Email queue and templates read successfully');
    console.log('  - Email queue entries:', emailQueue?.queue?.length || 0);
    console.log('  - Available templates:', templates?.templates?.length || 0);
    
    if (!emailQueue || !emailQueue.queue || emailQueue.queue.length === 0) {
      console.log('⚠ No emails in queue to process');
      return;
    }
    
    console.log(`Step 4: Processing ${emailQueue.queue.length} emails in queue`);
    
    // Process each queue entry
    const processedEntryIds = [];
    
    for (let i = 0; i < emailQueue.queue.length; i++) {
      const entry = emailQueue.queue[i];
      console.log(`\n--- Processing Entry ${i + 1}/${emailQueue.queue.length} ---`);
      console.log('Entry ID:', entry.id);
      console.log('Recipient Email:', entry.recipientEmail);
      console.log('Template ID:', entry.templateId);
      console.log('Send Mode:', entry.sendMode);
      console.log('Sender Email:', entry.senderEmail);
      console.log('Entry Data Keys:', Object.keys(entry.entryData || {}));
      
      const wasProcessed = await processQueueEntry(entry, templates);
      if (wasProcessed) {
        processedEntryIds.push(entry.id);
        console.log('✓ Entry processed successfully');
      } else {
        console.log('✗ Entry processing failed');
      }
    }
    
    // Remove processed entries from the queue file
    if (processedEntryIds.length > 0) {
      console.log(`\nStep 5: Removing ${processedEntryIds.length} processed entries from queue file...`);
      await removeProcessedEntries(processedEntryIds);
      console.log('✓ Processed entries removed from queue');
    }
    
    // Update processing statistics
    console.log('Step 6: Updating processing statistics...');
    const failedCount = emailQueue.queue.filter(entry => entry.status === 'failed').length;
    await updateProcessingStats(processedEntryIds.length, failedCount);
    console.log('✓ Processing statistics updated');
    
    console.log('=== Email queue processing completed ===');
    console.log('Final Summary:');
    console.log('  - Total entries processed:', processedEntryIds.length);
    console.log('  - Failed entries:', failedCount);
    console.log('  - Timestamp:', new Date().toISOString());
    
  } catch (error) {
    console.error('❌ Error processing email queue:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

/**
 * Process a single queue entry
 */
async function processQueueEntry(entry, templates) {
  try {
    console.log(`\n🔍 Processing entry ${entry.id} for ${entry.recipientEmail}`);
    console.log('Entry details:');
    console.log('  - ID:', entry.id);
    console.log('  - Recipient:', entry.recipientEmail);
    console.log('  - Template ID:', entry.templateId);
    console.log('  - Send Mode:', entry.sendMode);
    console.log('  - Sender Email:', entry.senderEmail);
    console.log('  - Entry Data:', JSON.stringify(entry.entryData || {}, null, 2));
    
    // Find the template
    console.log('\n📋 Looking for template...');
    const template = templates.templates.find(t => t.id === entry.templateId);
    if (!template) {
      console.error(`❌ Template not found for entry ${entry.id}`);
      console.error('Available template IDs:', templates.templates.map(t => t.id));
      await updateQueueEntryStatus(entry.id, 'failed', 'Template not found');
      return false;
    }
    console.log('✓ Template found:', template.name);
    console.log('Template details:');
    console.log('  - Subject:', template.subject);
    console.log('  - Body preview:', template.body.substring(0, 100) + '...');
    
    // Check if sender email is configured
    console.log('\n📧 Checking sender email configuration...');
    if (!EMAIL_CONFIGS[entry.senderEmail]) {
      console.error(`❌ Sender email ${entry.senderEmail} not configured`);
      console.error('Available sender emails:', Object.keys(EMAIL_CONFIGS));
      await updateQueueEntryStatus(entry.id, 'failed', 'Sender email not configured');
      return false;
    }
    console.log('✓ Sender email configured');
    
    // Process based on send mode
    console.log(`\n🚀 Processing based on send mode: ${entry.sendMode}`);
    switch (entry.sendMode) {
      case 'send':
        console.log('📤 Sending email immediately...');
        await processSendEmail(entry, template);
        return true;
      case 'draft':
        console.log('📝 Creating draft...');
        await processCreateDraft(entry, template);
        return true;
      default:
        console.error(`❌ Invalid send mode: ${entry.sendMode}`);
        await updateQueueEntryStatus(entry.id, 'failed', 'Invalid send mode');
        return false;
    }
    
  } catch (error) {
    console.error(`❌ Error processing entry ${entry.id}:`, error);
    console.error('Error stack:', error.stack);
    await updateQueueEntryStatus(entry.id, 'failed', error.message);
    return false;
  }
}

/**
 * Process sending an email immediately or schedule it
 */
async function processSendEmail(entry, template) {
  try {
    console.log(`\n📤 Preparing to send email for entry ${entry.id}`);
    
    // Get the entry data from Supabase for placeholder replacement
    console.log('\n📊 Getting entry data for placeholder replacement...');
    const entryData = entry.entryData || entry || {};
    console.log('Entry data source:', entry.entryData ? 'entryData field' : 'entry itself');
    console.log('Entry data keys:', Object.keys(entryData));
    console.log('Full entry data:', JSON.stringify(entryData, null, 2));
    
    // Replace placeholders in subject and body
    console.log('\n🔄 Processing placeholders...');
    console.log('Original subject:', template.subject);
    console.log('Original body preview:', template.body.substring(0, 100) + '...');
    
    const processedSubject = replacePlaceholders(template.subject, entryData);
    const processedBody = replacePlaceholders(template.body, entryData);
    
    console.log('Processed subject:', processedSubject);
    console.log('Processed body preview:', processedBody.substring(0, 100) + '...');
    
    const emailData = {
      to: entry.recipientEmail,
      subject: processedSubject,
      body: processedBody,
      senderEmail: entry.senderEmail,
      senderName: entry.senderName,
      recipientName: entry.recipientName
    };
    
    console.log('\n📧 Email data prepared:');
    console.log('  - To:', emailData.to);
    console.log('  - Subject:', emailData.subject);
    console.log('  - From:', emailData.senderEmail);
    console.log('  - Sender Name:', emailData.senderName);
    
    if (entry.scheduledDate) {
      // Schedule the email
      console.log('\n⏰ Scheduling email...');
      await scheduleEmail(entry.id, emailData, entry.scheduledDate);
      await updateQueueEntryStatus(entry.id, 'scheduled', 'Email scheduled for sending');
      console.log(`✓ Email scheduled for ${entry.scheduledDate}`);
    } else {
      // Send immediately
      console.log('\n📤 Sending email immediately...');
      await sendEmail(emailData);
      await updateQueueEntryStatus(entry.id, 'sent', 'Email sent successfully');
      console.log(`✓ Email sent to ${entry.recipientEmail}`);
    }
    
  } catch (error) {
    console.error(`❌ Error sending email for entry ${entry.id}:`, error);
    console.error('Error stack:', error.stack);
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
    
    // Get the entry data from Supabase for placeholder replacement
    // Try to get entryData first, fallback to the entry itself
    const entryData = entry.entryData || entry || {};
    
    console.log('Processing entry with data keys:', Object.keys(entryData));
    
    // Replace placeholders in subject and body
    const processedSubject = replacePlaceholders(template.subject, entryData);
    const processedBody = replacePlaceholders(template.body, entryData);
    
    const emailData = {
      to: entry.recipientEmail,
      subject: processedSubject,
      body: processedBody,
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
    console.log(`\n📧 Sending email to ${emailData.to} from ${emailData.senderEmail}`);
    console.log('SMTP Configuration:', {
      host: EMAIL_CONFIGS[emailData.senderEmail].smtp.host,
      port: EMAIL_CONFIGS[emailData.senderEmail].smtp.port,
      secure: EMAIL_CONFIGS[emailData.senderEmail].smtp.secure,
      user: EMAIL_CONFIGS[emailData.senderEmail].smtp.auth.user
    });
    
    const transporter = require('nodemailer').createTransport(EMAIL_CONFIGS[emailData.senderEmail].smtp);
    console.log('✓ Transporter created successfully');
    
    const mailOptions = {
      from: `"${emailData.senderName}" <${emailData.senderEmail}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.body
    };
    
    console.log('Mail options prepared:');
    console.log('  - From:', mailOptions.from);
    console.log('  - To:', mailOptions.to);
    console.log('  - Subject:', mailOptions.subject);
    console.log('  - Body length:', emailData.body.length, 'characters');
    
    console.log('\n🚀 Attempting to send email...');
    const result = await transporter.sendMail(mailOptions);
    console.log(`✓ Email sent successfully to ${emailData.to}`);
    console.log('Message ID:', result.messageId);
    console.log('Response:', result.response);
    
  } catch (error) {
    console.error(`❌ Error sending email to ${emailData.to}:`, error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
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
  initializeEmailConfigs,
  replacePlaceholders,
  TABLE_COLUMNS
}; 