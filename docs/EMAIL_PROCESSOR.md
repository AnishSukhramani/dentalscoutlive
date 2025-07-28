# Email Processor Documentation

## Overview

The email processor is a separate function that handles sending emails and creating drafts based on entries in `emailQueue.json`. It's designed to be easily debuggable and configurable.

## Configuration

### Sender Email Configuration

The sender email is configured at the top of `src/lib/emailProcessor.js`:

```javascript
const SENDER_EMAIL = "user1@example.com"; // Change this to switch senders
```

### Email Service Configuration

Email service configurations are defined in the `EMAIL_CONFIGS` object:

```javascript
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
  // ... more configurations
};
```

## How It Works

### 1. Queue Entry Structure

Each entry in `emailQueue.json` contains:
- `id`: Unique identifier
- `recipientEmail`: Target email address
- `recipientName`: Recipient's name
- `templateId`: ID of the template to use
- `senderEmail`: Sender's email address
- `sendMode`: Either "send" or "draft"
- `scheduledDate`: Optional scheduled date (for "send" mode)
- `status`: Current status (pending, sent, failed, etc.)

### 2. Template Lookup

The processor reads `templates.json` to find the template by `templateId` and extracts:
- `subject`: Email subject line
- `body`: Email body content

### 3. Processing Logic

#### For "send" mode:
- If `scheduledDate` is provided: Schedule email for that time
- If no `scheduledDate`: Send email immediately

#### For "draft" mode:
- Create a draft in the email client's draft folder

## Usage

### Automatic Processing

The email processor is automatically called when:
1. "Send Now" button is clicked in Outbound.jsx
2. "Create Draft" button is clicked in Outbound.jsx

### Manual Processing

You can manually process the email queue by:

1. **Using the UI button**: Click "Process Email Queue" button in the Outbound component
2. **Using the API**: Make a POST request to `/api/processEmailQueue`
3. **Using the test script**: Run `node test-email-processor.js`

### API Endpoints

- `POST /api/processEmailQueue`: Process the email queue
- `GET /api/processEmailQueue`: Get processor status and configuration

## Debugging

### 1. Check Queue Status

The processor updates each queue entry with:
- `status`: Current status (pending, sent, failed, scheduled, draft_created)
- `processedAt`: Timestamp when processed
- `message`: Additional information about the processing

### 2. Console Logs

The processor provides detailed console logs:
- Queue processing start/completion
- Individual entry processing
- Template lookup results
- Email sending/draft creation attempts
- Error messages

### 3. Test Script

Run the test script to verify functionality:
```bash
node test-email-processor.js
```

## Implementation Notes

### Current Implementation

The current implementation includes placeholder functions for:
- `sendEmail()`: Email sending logic
- `scheduleEmail()`: Email scheduling logic  
- `createDraft()`: Draft creation logic

### Real Implementation

To implement actual email functionality, you would need to:

1. **For email sending**: Use a library like `nodemailer`
2. **For email scheduling**: Use a job queue like `Bull` or `Agenda`
3. **For draft creation**: Use email APIs like Gmail API

### Example Nodemailer Implementation

```javascript
const nodemailer = require('nodemailer');

async function sendEmail(emailData) {
  const transporter = nodemailer.createTransporter(EMAIL_CONFIGS[emailData.senderEmail].smtp);
  await transporter.sendMail({
    from: emailData.senderEmail,
    to: emailData.to,
    subject: emailData.subject,
    html: emailData.body
  });
}
```

## File Structure

```
src/
├── lib/
│   └── emailProcessor.js    # Main email processor
├── app/
│   └── api/
│       └── processEmailQueue/
│           └── route.js     # API endpoint
└── components/
    └── Outbound.jsx        # Updated to call processor

data/
├── emailQueue.json         # Queue entries
└── templates.json          # Email templates

test-email-processor.js     # Test script
```

## Troubleshooting

### Common Issues

1. **Template not found**: Check that `templateId` exists in `templates.json`
2. **Sender not configured**: Verify sender email is in `EMAIL_CONFIGS`
3. **File read errors**: Ensure `data/` directory exists and files are readable
4. **Permission errors**: Check file write permissions for status updates

### Debug Steps

1. Check console logs for detailed error messages
2. Verify queue entry structure in `emailQueue.json`
3. Confirm template exists in `templates.json`
4. Test with the manual processing button
5. Run the test script for isolated testing 