# SummariseMe

## Overview
SummariseMe is an automated, modular pipeline for news aggregation, summarization, and image enrichment. It fetches news from multiple sources, summarizes and categorizes content using advanced AI models (Google Gemini, OpenAI, DistilBert AI Model), and enriches news items with relevant images via web scraping and cloud APIs. The system is designed for robust, scheduled operation, storing results in MongoDB and Google Cloud Storage, and is extensible for future enhancements.

## Architecture

### Backend Architecture
The backend is built using:
- **Node.js** with **Express.js** framework
- **MongoDB** as the primary database
- **Mongoose** for MongoDB object modeling
- **RESTful API** architecture

#### Key Components:
1. **Server Setup**
   - Express server with CORS support
   - Environment configuration using dotenv
   - MongoDB connection management
   - Error handling middleware

2. **Database Models**
   - User Management
   - Article Management
   - User Statistics
   - User-Article Interactions
   - Newsletter Subscriptions

3. **Authentication**
   - Multiple auth providers (Email, Google, GitHub)
   - Password hashing with bcrypt
   - Session management

### Frontend Architecture
- Component-based architecture
- Responsive design
- Progressive enhancement
- Accessibility features
- Performance optimization

## API Documentation

### User Management APIs
```
POST /api/users                 - Create new user
GET  /api/users                 - Get all users (paginated)
GET  /api/users/:id             - Get single user
PUT  /api/users/:id             - Update user
DELETE /api/users/:id           - Delete user
```

### Article & News APIs
```
GET  /api/news                  - Get news with category filter
GET  /api/envisage_web          - Fetch news data
POST /api/envisage_web/view     - Increment article views
GET  /api/envisage_web/all      - Get all news documents
```

### User Statistics APIs
```
GET  /api/users/:id/stats       - Get user statistics
PUT  /api/users/:id/stats       - Update user stats
POST /api/users/:id/daily-stats - Add daily statistics
```

### Newsletter APIs
```
GET  /api/newsletter/subscriber-count  - Get subscriber count
POST /api/newsletter/subscribe         - Subscribe to newsletter
GET  /api/newsletter/popup-state/:userId - Get popup state
POST /api/newsletter/popup-interaction   - Record popup interaction
```

### Blog APIs
```
GET  /api/blogs                 - Get all blogs
GET  /api/hero_blogs            - Get hero section blogs
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Git

### Environment Setup
1. Create a `.env.local` file in the backend directory with:
```
PORT=3001
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=your_database_name
NODE_ENV=development
```

### Installation Steps

1. Clone the repository:
```bash
git clone [repository-url]
cd "V0 - 1 - SummariseMe"
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Start the development servers:

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Production Deployment
1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Start the production server:
```bash
cd backend
NODE_ENV=production npm start
```

## Project Structure
```
V0 - 1 - SummariseMe/
│
├── backend/           # Backend server code
│   ├── lib/          # Utility functions
│   ├── models/       # Database models
│   └── server.js     # Main server file
│
├── frontend/         # Frontend application
│   ├── assets/       # Static assets
│   ├── components/   # React components
│   ├── pages/        # Page templates
│   └── utils/        # Utility functions
│
├── .env.local        # Environment variables
└── README.md         # Documentation
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request


## Contact
For questions or feedback, please contact Harshat Dy at [dhanayat.harshat@gmail.com].

## Check my other works at harshatdy.in
