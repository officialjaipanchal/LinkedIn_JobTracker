# Job Alert System with Email Notifications

A full-stack web application that helps job seekers track and manage job applications, with automated job fetching from LinkedIn and email notifications for new opportunities.

![Dashboard Preview](docs/images/dashboard.png)
![Job List Preview](docs/images/job-list.png)

## Features

- 🔍 Automated job fetching from LinkedIn
  - Customizable search keywords and location
  - Real-time job updates
  - Smart job filtering and categorization
- 📧 Email notifications for new job opportunities
  - Configurable notification preferences
  - Daily/weekly job digests
  - Custom email templates
- 📊 Job application tracking and management
  - Application status tracking (Not Applied, Applied, Interview, Rejected)
  - Application history and timeline
  - Notes and reminders
- 📝 Resume parsing and analysis
  - PDF resume parsing
  - Skills extraction
  - Job matching suggestions
- 🔄 Real-time job status updates
  - Status change notifications
  - Application deadline reminders
  - Interview scheduling
- 📱 Responsive Material-UI interface
  - Mobile-friendly design
  - Dark/Light theme support
  - Customizable dashboard
- 📈 Application statistics and insights
  - Application success rate
  - Industry distribution
  - Company analysis

## Tech Stack

### Backend
- Node.js & Express.js
  - RESTful API architecture
  - Middleware for authentication and logging
  - Error handling and validation
- MongoDB with Mongoose
  - Schema validation
  - Indexing for performance
  - Data relationships
- Puppeteer for web scraping
  - Headless browser automation
  - Dynamic content handling
  - Rate limiting and retry logic
- Nodemailer for email notifications
  - HTML email templates
  - SMTP configuration
  - Email queue management
- Winston for logging
  - Log rotation
  - Error tracking
  - Performance monitoring
- PDF parsing capabilities
  - Text extraction
  - Metadata parsing
  - Format preservation
- Natural language processing for resume analysis
  - Skills extraction
  - Keyword matching
  - Relevance scoring

### Frontend
- React.js with React Admin
  - Custom data providers
  - Role-based access control
  - Real-time updates
- Material-UI components
  - Custom theme support
  - Responsive layouts
  - Accessibility features
- Recharts for data visualization
  - Interactive charts
  - Real-time data updates
  - Custom styling
- Responsive design
  - Mobile-first approach
  - Cross-browser compatibility
  - Progressive enhancement

## Prerequisites

- Node.js (v14 or higher)
  - npm (v6 or higher)
  - nvm (recommended for version management)
- MongoDB
  - MongoDB Community Edition
  - MongoDB Compass (recommended for database management)
- npm or yarn
  - npm v6+ or yarn v1.22+
- Modern web browser
  - Chrome 80+
  - Firefox 75+
  - Safari 13+
  - Edge 80+

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/job-alert-system.git
cd job-alert-system
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Create a `.env` file in the backend directory with the following variables:
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/job-alert
MONGODB_USER=your_username
MONGODB_PASS=your_password

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_FROM=Job Alert System <your_email@gmail.com>

# Server Configuration
PORT=5050
NODE_ENV=development
LOG_LEVEL=info

# LinkedIn Configuration
LINKEDIN_EMAIL=your_linkedin_email
LINKEDIN_PASSWORD=your_linkedin_password

# Security
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=24h
```

## Running the Application

1. Start MongoDB:
```bash
# Using MongoDB Community Edition
mongod --dbpath /path/to/data/directory

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

2. Start the backend server:
```bash
cd backend
npm run dev
```

3. Start the frontend development server:
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5050
- MongoDB: mongodb://localhost:27017

## Project Structure

```
job-alert-system/
├── backend/
│   ├── config/         # Configuration files
│   │   ├── database.js # MongoDB configuration
│   │   ├── email.js    # Email service configuration
│   │   └── logger.js   # Winston logger setup
│   ├── models/         # MongoDB models
│   │   ├── Job.js      # Job schema
│   │   ├── Resume.js   # Resume schema
│   │   └── User.js     # User schema
│   ├── routes/         # API routes
│   │   ├── jobRoutes.js    # Job-related endpoints
│   │   ├── resumeRoutes.js # Resume-related endpoints
│   │   └── userRoutes.js   # User-related endpoints
│   ├── services/       # Business logic
│   │   ├── jobFetcher.js   # LinkedIn job fetching
│   │   ├── emailService.js # Email notifications
│   │   └── resumeParser.js # Resume parsing
│   ├── logs/          # Application logs
│   │   ├── error.log  # Error logs
│   │   └── combined.log # All logs
│   └── server.js      # Main server file
├── frontend/
│   ├── public/        # Static files
│   │   ├── index.html
│   │   └── assets/
│   ├── src/           # React source code
│   │   ├── components/# React components
│   │   │   ├── jobs/  # Job-related components
│   │   │   ├── resumes/ # Resume components
│   │   │   └── common/  # Shared components
│   │   ├── pages/     # Page components
│   │   │   ├── Dashboard.js
│   │   │   ├── JobList.js
│   │   │   └── ResumeManager.js
│   │   ├── services/  # API services
│   │   ├── utils/     # Helper functions
│   │   └── App.js     # Main application file
│   └── package.json   # Frontend dependencies
├── docs/             # Documentation
│   ├── images/       # Screenshots and diagrams
│   └── api/          # API documentation
└── README.md
```

## API Endpoints

### Jobs
- `GET /api/jobs` - Get all jobs
  - Query Parameters:
    - `status`: Filter by status (not_applied, applied, interview, rejected)
    - `company`: Filter by company name
    - `datePosted`: Filter by posting date
    - `page`: Page number for pagination
    - `limit`: Number of items per page
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs/fetch` - Fetch new jobs from LinkedIn
  - Request Body:
    ```json
    {
      "keywords": ["software developer", "data engineer"],
      "location": "United States",
      "hours": 24
    }
    ```
- `PUT /api/jobs/:id` - Update job status
  - Request Body:
    ```json
    {
      "status": "applied",
      "notes": "Applied through company website"
    }
    ```
- `DELETE /api/jobs/:id` - Delete job

### Resumes
- `GET /api/resumes` - Get all resumes
  - Query Parameters:
    - `page`: Page number
    - `limit`: Items per page
- `POST /api/resumes` - Upload new resume
  - Content-Type: multipart/form-data
  - Body: resume file (PDF)
- `GET /api/resumes/:id` - Get resume by ID
- `DELETE /api/resumes/:id` - Delete resume

## Troubleshooting

### Common Issues

1. MongoDB Connection Issues
```bash
# Check MongoDB service status
sudo systemctl status mongodb

# Check MongoDB logs
tail -f /var/log/mongodb/mongodb.log

# Verify MongoDB connection string
mongosh "mongodb://localhost:27017/job-alert"
```

2. Email Configuration Issues
```bash
# Test email configuration
cd backend
node scripts/test-email.js

# Check email logs
tail -f logs/email.log
```

3. LinkedIn Scraping Issues
```bash
# Check Puppeteer logs
tail -f logs/puppeteer.log

# Verify LinkedIn credentials
node scripts/verify-linkedin.js
```

4. Frontend Build Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install

# Check for dependency conflicts
npm ls
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation
- Keep dependencies up to date

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- LinkedIn for job data
- Material-UI for the frontend components
- React Admin for the admin interface
- All other open-source libraries used in this project

## Support

For support, please:
1. Check the [troubleshooting guide](#troubleshooting)
2. Search [existing issues](https://github.com/yourusername/job-alert-system/issues)
3. Create a new issue if needed

## Roadmap

- [ ] Add support for multiple job boards
- [ ] Implement AI-powered job matching
- [ ] Add interview scheduling features
- [ ] Enhance resume analysis capabilities
- [ ] Add mobile app version 