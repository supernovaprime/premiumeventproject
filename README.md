# Premium Event Platform

A professional event hosting and voting platform with integrated e-commerce and affiliate system. Built with React, Node.js, Express, and MongoDB.

## 🚀 Features

### Core Functionality
- **Event Management**: Create, manage, and host professional award events
- **Voting System**: Secure online voting with fraud prevention
- **Ticketing System**: Generate and validate QR code tickets
- **E-commerce**: Award materials shop (plaques, trophies, certificates, etc.)
- **Affiliate Program**: Commission-based referral system
- **Payment Integration**: Hubtel, Stripe, and Paystack support
- **Real-time Analytics**: Comprehensive event and financial analytics
- **Multi-role System**: Admin, Organizer, User, and Affiliate roles

### User Roles

#### 1. Admin
- Approve/reject organizer applications
- Manage all users, events, and finances
- Set commission rates
- Monitor transactions
- Manage shop inventory
- Control platform settings

####2. Event Organizers
- Create and manage events (after approval)
- Add categories and nominees
- Generate event links
- Sell tickets
- View analytics and finances
- Download reports

#### 3. General Users/Voters
- Browse and discover events
- Purchase tickets
- Vote in events
- Buy award materials
- Track orders and voting history

#### 4. Affiliates
- Get unique referral links
- Earn commissions on referrals
- Track performance metrics
- Request payouts

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand + React Query
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Charts**: Chart.js + React Chartjs 2
- **Notifications**: React Hot Toast

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer + Cloudinary
- **Email**: Nodemailer
- **SMS**: Twilio
- **Payment**: Stripe, Paystack, Hubtel
- **PDF Generation**: PDFKit
- **QR Codes**: qrcode
- **Logging**: Winston
- **Security**: Helmet, express-rate-limit, xss-clean

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn
- Cloudinary account (for file uploads)
- SMTP credentials (for emails)
- Twilio account (for SMS, optional)
- Payment gateway credentials (Stripe/Paystack/Hubtel)

## 🔧 Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/premium-event-platform.git
cd premium-event-platform
```

### 2. Install dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration

#### Backend (.env)
Create a `.env` file in the `backend` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/premium-event-platform

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRE=30d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@premiumeventplatform.com
FROM_NAME=Premium Event Platform

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Payment Gateways
PAYSTACK_SECRET_KEY=sk_test_your-paystack-secret-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
HUBTEL_CLIENT_ID=your-hubtel-client-id
HUBTEL_CLIENT_SECRET=your-hubtel-client-secret

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Commission Rates (%)
DEFAULT_EVENT_COMMISSION=5
DEFAULT_AFFILIATE_COMMISSION=3
MINIMUM_WITHDRAWAL_AMOUNT=50

# Feature Flags
ENABLE_AFFILIATE_SYSTEM=true
ENABLE_SHOP_MODULE=true
ENABLE_SMS_NOTIFICATIONS=true
ENABLE_EMAIL_NOTIFICATIONS=true
```

### 4. Run the Application

#### Development Mode
```bash
# From root directory - runs both frontend and backend
npm run dev

# Or run separately:
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

#### Production Mode
```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd backend
npm start
```

## 📁 Project Structure

```
premium-event-platform/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Utility functions
│   ├── config/          # Configuration files
│   ├── uploads/         # File uploads (local)
│   ├── logs/            # Application logs
│   └── server.js        # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── layouts/     # Layout components
│   │   ├── contexts/    # React contexts
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API services
│   │   ├── utils/       # Utility functions
│   │   ├── assets/      # Static assets
│   │   ├── App.jsx      # Main app component
│   │   └── main.jsx     # Entry point
│   │
│   ├── public/          # Public assets
│   └── index.html       # HTML template
│
└── package.json         # Root package.json
```

## 🔐 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password
- `POST /api/auth/verify-email/:token` - Verify email
- `GET /api/auth/me` - Get current user

### Event Endpoints
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create event (Organizer)
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Voting Endpoints
- `POST /api/votes` - Cast vote
- `GET /api/votes/event/:eventId` - Get event votes
- `GET /api/votes/user/:userId` - Get user votes

### Ticket Endpoints
- `POST /api/tickets/purchase` - Purchase ticket
- `GET /api/tickets/:id` - Get ticket details
- `POST /api/tickets/:id/validate` - Validate ticket

### Shop Endpoints
- `GET /api/shop/products` - Get all products
- `GET /api/shop/products/:id` - Get product by ID
- `POST /api/shop/orders` - Create order
- `GET /api/shop/orders/:id` - Get order details

### Affiliate Endpoints
- `POST /api/affiliates/register` - Register as affiliate
- `GET /api/affiliates/stats` - Get affiliate stats
- `POST /api/affiliates/payout` - Request payout

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Backend Deployment (Heroku)
```bash
heroku create your-app-name
heroku addons:create mongolab
git push heroku main
```

### Frontend Deployment (Vercel/Netlify)
```bash
# Build the frontend
cd frontend
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- XSS protection
- CORS configuration
- Input validation and sanitization
- SQL injection prevention (MongoDB)
- Secure headers with Helmet
- HTTPS enforcement in production

## 📊 Performance Optimization

- Code splitting with React.lazy
- Image optimization with Cloudinary
- Database indexing
- Response caching
- Gzip compression
- CDN integration
- Lazy loading components

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Development Team**: Premium Event Platform Team
- **Contact**: support@premiumeventplatform.com

## 📧 Support

For support, email support@premiumeventplatform.com or join our Slack channel.

## 🙏 Acknowledgments

- React Team for the amazing framework
- MongoDB team for the excellent database
- All open-source contributors

---

Made with ❤️ by the Premium Event Platform Team
