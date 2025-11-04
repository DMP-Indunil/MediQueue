# 🏥 MediQueue - Healthcare Virtual Queue & Check-in System

A modern, contactless healthcare queue management system built with Node.js, Express, MongoDB, and Socket.io. MediQueue helps clinics manage patient flow efficiently while providing patients with a safer, more convenient check-in experience.

## ✨ Features

### For Patients
- **📱 Mobile Check-in**: Check-in from anywhere using QR codes or links
- **⏰ Real-time Queue Tracking**: Monitor your position in the queue live
- **📍 GPS Verification**: Location-based check-in for enhanced security
- **🔔 Smart Notifications**: Get notified when it's your turn
- **⏱️ Wait Time Estimates**: Know approximately how long you'll wait

### For Clinics
- **📊 Real-time Dashboard**: Monitor current queue status
- **📈 Advanced Analytics**: Understand patient flow and optimize operations
- **👥 Patient Management**: Comprehensive patient records and history
- **🔗 QR Code Generation**: Easy check-in for patients
- **⚙️ Customizable Settings**: Configure queue limits, wait times, and more
- **🏢 Multi-Clinic Support**: Perfect for healthcare chains

### Technical Features
- **🚀 Real-time Updates**: Socket.io for instant queue updates
- **🗺️ Location Services**: GPS-based patient verification
- **📱 Responsive Design**: Works on all devices
- **☁️ Cloud Database**: MongoDB Atlas for reliable data storage
- **🔒 Secure**: Patient data protection and privacy
- **📉 Contact Tracing**: Built-in for health safety compliance

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js v4.18.2
- **Database**: MongoDB with Mongoose ODM v8.0.0
- **Real-time**: Socket.io v4.6.1 for live queue updates
- **Frontend**: Vanilla HTML/CSS/JavaScript (no build tools)
- **Charts**: Chart.js
- **QR Codes**: QRCode.js
- **Deployment**: Vercel / Any Node.js hosting

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (free tier works)
- npm or yarn

### Setup Steps

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd mediqueue
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` file and add your MongoDB connection string:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/mediqueue?retryWrites=true&w=majority
PORT=3000
NODE_ENV=development
```

4. **Start the server**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

5. **Access the application**
- Home: http://localhost:3000
- Check-in: http://localhost:3000/check-in
- Dashboard: http://localhost:3000/dashboard
- Analytics: http://localhost:3000/analytics

## 📚 API Documentation

### Clinics
- `GET /api/clinics` - Get all clinics
- `GET /api/clinics/:clinicId` - Get clinic by ID
- `POST /api/clinics` - Create new clinic
- `PUT /api/clinics/:clinicId` - Update clinic
- `DELETE /api/clinics/:clinicId` - Delete clinic
- `GET /api/clinics/:clinicId/qr-code` - Get QR code

### Patients
- `GET /api/patients` - Get all patients (paginated)
- `GET /api/patients/:patientId` - Get patient by ID
- `GET /api/patients/search/:query` - Search patients
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:patientId` - Update patient
- `DELETE /api/patients/:patientId` - Delete patient

### Check-ins
- `POST /api/check-ins` - Create check-in
- `GET /api/check-ins/:checkInId` - Get check-in details
- `PUT /api/check-ins/:checkInId/status` - Update status
- `DELETE /api/check-ins/:checkInId` - Cancel check-in

### Queue Management
- `GET /api/queues/:clinicId/current` - Get current queue
- `GET /api/queues/position/:checkInId` - Get position
- `POST /api/queues/:clinicId/call-next` - Call next patient

### Analytics
- `GET /api/analytics/overview` - Overall statistics
- `GET /api/analytics/clinic/:clinicId` - Clinic analytics
- `GET /api/analytics/patient/:patientId/history` - Patient history
- `GET /api/analytics/realtime/:clinicId` - Real-time stats

## 🚀 Deployment

### Vercel Deployment

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
vercel
```

3. **Set environment variables in Vercel**
- Go to your project settings
- Add `MONGO_URI` environment variable
- Redeploy

### Manual Deployment (Any Node.js Host)

1. **Build and upload files**
2. **Set environment variables**
3. **Run**: `npm start`

## 📂 Project Structure

```
mediqueue/
├── models/
│   ├── Clinic.js          # Clinic schema
│   ├── Patient.js         # Patient schema
│   ├── CheckIn.js         # Check-in schema
│   └── Queue.js           # Queue schema
├── routes/
│   ├── clinics.js         # Clinic routes
│   ├── patients.js        # Patient routes
│   ├── checkIns.js        # Check-in routes
│   ├── queues.js          # Queue routes
│   └── analytics.js       # Analytics routes
├── public/
│   ├── index.html         # Home page
│   ├── check-in.html      # Check-in page
│   ├── dashboard.html     # Clinic dashboard
│   ├── analytics.html     # Analytics page
│   ├── queue-display.html # Queue display
│   └── css/
│       └── style.css      # Styles
├── server.js              # Main server file
├── package.json
├── .env.example
└── README.md
```

## 🎯 Use Cases

### 1. Small Clinics
- Reduce waiting room crowding
- Improve patient satisfaction
- Better staff scheduling

### 2. Hospitals
- Emergency room queue management
- Outpatient department optimization
- Multi-department coordination

### 3. Vaccination Centers
- Mass vaccination queue management
- Social distancing compliance
- Efficient patient flow

### 4. Dental Practices
- Appointment and walk-in management
- Treatment room utilization
- Patient communication

### 5. Healthcare Chains
- Centralized patient management
- Cross-location analytics
- Standardized operations

## 🔒 Security & Privacy

- Patient data encrypted in transit
- Secure MongoDB connection
- No sensitive data in QR codes
- GDPR/HIPAA-friendly architecture
- Session-based authentication ready

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for commercial purposes.

## 📧 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@mediqueue.example

## 🙏 Acknowledgments

- Built with ❤️ for better healthcare access
- Inspired by the need for contactless solutions post-COVID
- Thanks to all healthcare workers who inspired this project

## 🔮 Future Enhancements

- [ ] SMS/Email notifications
- [ ] Appointment scheduling
- [ ] Insurance verification
- [ ] Telemedicine integration
- [ ] Multi-language support
- [ ] Patient mobile app
- [ ] Advanced analytics with ML
- [ ] Payment integration
- [ ] EHR/EMR system integration

---

**Made with 💚 by the MediQueue Team**

*Making healthcare more accessible, one queue at a time.*
