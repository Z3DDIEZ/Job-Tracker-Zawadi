# Job Application Tracker

A modern, full-stack web application for managing job applications and interview processes. Built with vanilla JavaScript and Firebase Realtime Database.

## 🚀 Live Demo

**[View Live Application](https://z3ddiez.github.io/Job-Tracker-Zawadi/)**

## 📸 Screenshots

### Dashboard
![Dashboard View](screenshots/dashboard.png)

### Application Management
![Application Card](screenshots/card-detail.png)

### Mobile Responsive
![Mobile View](screenshots/mobile.png)

## ✨ Features

### Core Functionality
- **Full CRUD Operations** - Create, read, update, and delete job applications
- **Real-Time Syncronisation** - Instant updates across all devices using Firebase Realtime Database
- **Advanced Search & Filter** - Find applications quickly by company name or status
- **Status Tracking** - Monitor progress in 6 stages: Applied → Phone Screen → Technical Interview → Final Round → Offer/Rejected
- **Visa Sponsorship Flag** - Track which companies offer visa sponsorship

### User Experience
- **Clean UI/UX** - Professional, minimal design with earthy color palette
- **Responsive Design** - Optimized for desktop (1920px), tablet (768px), and mobile (375px)
- **Smooth Animations** - Subtle transitions and feedback for all interactions
- **Persistent Storage** - Data saved securely in Firebase Realtime Database

## 🛠️ Tech Stack

**Frontend:**
- HTML5 - Semantic Markup
- CSS3 (Custom properties, Grid, Flexbox, animations)
- Vanilla JavaScript (ES6+, asyn/await, Promises)

**Backend:**
- Firebase Realtime Database (NoSQL, real-time sync)
- Firebase Hosting (Path-based access control)

**Development:**
- Git & GitHub
- GitHub Pages (deployment)

**Design System:**
- CSS Custom Properties
- Mobile-first responsive design
- Monochrome colour palette with terra cotta accents

## 🎯 Why I Built This

As a CS student applying to 80+ companies for graduate roles, I needed a centralized system to:
- Track all applications in one place
- Monitor interview stages across multiple companies
- Identify which companies offer visa sponsorship
- Analyze my application success rate

This project solved my own problem while demonstrating full-stack development skills.

## 💡 What I Learned

### Technical Skills
- Building responsive UIs without frameworks
- Working with Firebase Realtime Database
- Implementing CRUD operations with real-time sync
- Creating reusable JavaScript functions
- Managing application state

### Soft Skills
- Breaking down complex problems into smaller tasks
- Designing user-centric interfaces
- Writing clean, maintainable code
- Deploying production-ready applications

## 🚦 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Firebase account (for your own deployment)

### Local Development

1. **Clone the repository**
```bash
   git clone https://github.com/Z3DDIEZ/Job-Tracker-Zawadi.git
   cd Job-Tracker-Zawadi
```

2. **Set up Firebase**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Realtime Database
   - Copy your Firebase config
   - Replace the config in `index.html` (lines 110-118)

3. **Open in browser**
   - Simply open `index.html` in your browser
   - No build process required (vanilla JavaScript)

4. **Start adding applications**
   - Fill out the form
   - Watch real-time updates
   - Test all CRUD operations

## 📁 Project Structure
Job-Tracker-Zawadi/
├── index.html              # Main HTML structure
├── style.css               # Complete styling with CSS variables
├── script.js               # Application logic and Firebase integration
├── screenshots/            # Application screenshots
│   ├── dashboard.png
│   ├── card-detail.png
│   └── mobile.png
├── README.md              # This file
└── .gitignore             # Git ignore rules


## 🔐 Security Notes

- Firebase API keys are public by design (frontend apps)
- Security enforced through Firebase Security Rules
- Only allows read/write to "applications" path
- No authentication required for personal use
- For production with multiple users, add Firebase Authentication

## 🎨 Design Philosophy

**Earthy Monochrome Palette:**
- Primary: Slate grays (#0f172a to #f8fafc)
- Accent: Warm terra cotta (#d97706)
- Semantic: Subtle pastels for status indicators

**Modern CSS Techniques:**
- CSS Custom Properties (variables)
- CSS Grid for layout
- Flexbox for components
- Smooth transitions and animations
- Mobile-first responsive design

## 🚀 Future Improvements

If I continue building this, I would add:
- [ ] User authentication (multi-user support)
- [ ] Email reminders for follow-ups
- [ ] Calendar integration for interview scheduling
- [ ] Export data to CSV
- [ ] Interview notes and feedback tracking
- [ ] Company research links and notes
- [ ] Application statistics and analytics

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Zawadi MC Nyachiya**
- GitHub: [@Z3DDIEZ](https://github.com/Z3DDIEZ)
- LinkedIn: [Zawadi MC Nyachiya](#) *(need to add my LinkedIn URL)*
- Email: nyachiya.zawadi@gmail.com

## 🙏 Acknowledgments

- Firebase for excellent real-time database
- GitHub Pages for free hosting
- The tech community for inspiration and resources

## Project Status
Current Version: 1.0.0 (Production-Ready MVP)
Active Development: Yes


**Built with ❤️ by Zawadi |Johannesburg, South Africa**