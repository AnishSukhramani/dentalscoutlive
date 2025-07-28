# Dental Scout Live

A comprehensive email automation platform designed for dental practices to streamline their outreach campaigns. Built with Next.js, this application provides a modern interface for managing email templates, processing email queues, and automating email communications.

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15.3.4 with React 19
- **Styling**: Tailwind CSS 4 with custom UI components
- **Email Processing**: Nodemailer with Gmail SMTP
- **Database**: JSON-based file storage (Supabase integration ready)
- **UI Components**: Radix UI primitives with custom styling

### Project Structure
```
dentalscoutlive/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── api/            # API routes
│   │   │   ├── emailQueue/ # Email queue management
│   │   │   ├── processEmailQueue/ # Email processing
│   │   │   └── templates/  # Template management
│   │   ├── layout.js       # Root layout
│   │   └── page.js         # Main dashboard
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components
│   │   ├── Outbound.jsx   # Email sending interface
│   │   ├── SupabaseTable.jsx # Data table component
│   │   ├── TemplatesAndIDs.jsx # Template management
│   │   └── UploadFile.jsx # File upload component
│   └── lib/               # Utility libraries
│       ├── emailProcessor.js # Email processing engine
│       ├── supabaseClient.js # Database client
│       └── utils.js       # Helper functions
├── data/                  # JSON data storage
│   ├── emailQueue.json    # Email queue data
│   ├── templates.json     # Email templates
│   └── user.json         # User data
├── public/               # Static assets
└── docs/                # Documentation
```

## 🚀 Features

### Core Functionality
- **Email Template Management**: Create, edit, and organize email templates
- **Email Queue Processing**: Batch process emails with status tracking
- **Gmail Integration**: Direct SMTP integration with Gmail accounts
- **File Upload**: CSV/Excel file processing for bulk operations
- **Real-time Status Tracking**: Monitor email processing status
- **Responsive Design**: Modern UI optimized for all devices

### Email Processing Modes
- **Immediate Send**: Send emails instantly
- **Scheduled Send**: Schedule emails for future delivery
- **Draft Creation**: Create drafts in Gmail for manual review

### Security Features
- **Environment Variable Protection**: Sensitive data stored in `.env`
- **App Password Authentication**: Secure Gmail integration
- **Input Validation**: Comprehensive data validation
- **Error Handling**: Robust error management and logging

## 📋 Prerequisites

Before setting up the application, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Gmail Account** with 2-factor authentication enabled
- **Git** for version control

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd dentalscoutlive
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

#### Create Environment File
```bash
# Copy the example environment file
cp env.example .env
```

#### Configure Gmail App Password
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Navigate to Security > 2-Step Verification
   - Scroll to "App passwords"
   - Generate new password for "Mail"
   - Copy the 16-character password

#### Update .env File
```env
# Gmail App Password for Email Sending
GMAIL_APP_PASSWORD=your_16_character_app_password

# Optional: Other environment variables
# DATABASE_URL=your_database_url
# API_KEY=your_api_key
```

### 4. Initialize Data Files
The application uses JSON files for data storage. Ensure these files exist:

```bash
# Create data directory if it doesn't exist
mkdir -p data

# Initialize email queue (if not exists)
echo '{"queue": []}' > data/emailQueue.json

# Initialize templates (if not exists)
echo '{"templates": []}' > data/templates.json

# Initialize user data (if not exists)
echo '{"users": []}' > data/user.json
```

### 5. Test Email Configuration
```bash
# Test the email setup
node test-email-setup.js
```

Expected output:
```
✅ GMAIL_APP_PASSWORD environment variable is set
✅ Email processor test completed successfully!
```

### 6. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📧 Email Configuration

### Gmail Setup Requirements
- **2-Factor Authentication**: Must be enabled
- **App Password**: Required for SMTP authentication
- **Less Secure Apps**: Not required (app password handles this)

### Email Processing Workflow
1. **Template Creation**: Create email templates in the UI
2. **Queue Population**: Add emails to the processing queue
3. **Batch Processing**: Process emails in batches
4. **Status Tracking**: Monitor processing status and results

### Supported Email Formats
- **HTML Content**: Rich text formatting
- **Plain Text**: Fallback for compatibility
- **Attachments**: File upload support (planned)
- **Personalization**: Template variable substitution

## 🎯 Usage Guide

### Creating Email Templates
1. Navigate to the Templates section
2. Click "Create New Template"
3. Fill in subject and body content
4. Save template for future use

### Processing Email Queue
1. **Add Emails to Queue**:
   - Use the Outbound interface
   - Upload CSV/Excel files
   - Manual entry

2. **Process Queue**:
   - Navigate to API endpoint: `/api/processEmailQueue`
   - Or use the email processor directly

3. **Monitor Status**:
   - Check queue status in real-time
   - Review processing logs
   - Handle failed emails

### API Endpoints

#### Email Queue Management
- `GET /api/emailQueue` - Retrieve email queue
- `POST /api/emailQueue` - Add email to queue
- `PUT /api/emailQueue/[id]` - Update queue entry

#### Email Processing
- `POST /api/processEmailQueue` - Process email queue
- `GET /api/processEmailQueue/status` - Get processing status

#### Template Management
- `GET /api/templates` - List all templates
- `POST /api/templates` - Create new template
- `PUT /api/templates/[id]` - Update template
- `DELETE /api/templates/[id]` - Delete template

## 🔍 Troubleshooting

### Common Issues

#### Email Authentication Errors
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```
**Solution**:
- Verify 2-factor authentication is enabled
- Regenerate app password
- Check environment variable is set correctly

#### Environment Variable Not Found
```
Error: GMAIL_APP_PASSWORD environment variable is not set!
```
**Solution**:
- Create `.env` file in project root
- Add `GMAIL_APP_PASSWORD=your_password`
- Restart development server

#### File System Errors
```
Error: ENOENT: no such file or directory
```
**Solution**:
- Ensure data directory exists
- Check file permissions
- Initialize JSON files if missing

### Debug Mode
Enable detailed logging:
```bash
DEBUG=* npm run dev
```

### Email Testing
Test email functionality:
```bash
node test-email-setup.js
```

## 🛠️ Development

### Code Structure
- **Components**: Modular React components with TypeScript support
- **API Routes**: RESTful endpoints with proper error handling
- **Utilities**: Reusable functions and helpers
- **Configuration**: Environment-based configuration

### Adding New Features
1. **Frontend**: Add components in `src/components/`
2. **API**: Create routes in `src/app/api/`
3. **Processing**: Extend `src/lib/emailProcessor.js`
4. **Data**: Update JSON schemas in `data/`

### Testing
```bash
# Run linting
npm run lint

# Test email setup
node test-email-setup.js

# Manual testing
npm run dev
```

## 📊 Data Models

### Email Queue Entry
```json
{
  "id": "unique-id",
  "recipientEmail": "recipient@example.com",
  "recipientName": "Recipient Name",
  "senderEmail": "sender@gmail.com",
  "templateId": "template-id",
  "sendMode": "send|draft|scheduled",
  "scheduledDate": "2025-01-27T10:00:00.000Z",
  "status": "pending|sent|failed|scheduled",
  "createdAt": "2025-01-27T10:00:00.000Z",
  "processedAt": "2025-01-27T10:00:00.000Z",
  "message": "Processing message"
}
```

### Email Template
```json
{
  "id": "template-id",
  "name": "Template Name",
  "subject": "Email Subject",
  "body": "Email body content",
  "createdAt": "2025-01-27T10:00:00.000Z"
}
```

## 🔐 Security Considerations

### Environment Variables
- **Never commit `.env` files** to version control
- **Use strong app passwords** for Gmail integration
- **Rotate credentials** regularly

### Data Protection
- **Validate all inputs** before processing
- **Sanitize email content** to prevent injection
- **Log security events** for monitoring

### Production Deployment
- **Use HTTPS** for all communications
- **Implement rate limiting** on API endpoints
- **Monitor email sending** to prevent abuse
- **Backup data regularly**

## 📈 Performance Optimization

### Email Processing
- **Batch processing** for large queues
- **Concurrent processing** with limits
- **Retry logic** for failed emails
- **Status caching** for real-time updates

### Frontend Optimization
- **Component lazy loading**
- **Image optimization**
- **Code splitting**
- **Caching strategies**

## 🤝 Contributing

### Development Workflow
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open pull request**

### Code Standards
- **ESLint configuration** for code quality
- **Prettier formatting** for consistency
- **TypeScript** for type safety
- **Component documentation** with JSDoc

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Documentation**: Check this README and `/docs` folder
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions

### Contact
- **Email**: [Your Email]
- **GitHub**: [Your GitHub Profile]
- **LinkedIn**: [Your LinkedIn Profile]

---

**Built with ❤️ for dental practices worldwide**

*Last updated: January 2025*
