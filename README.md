Of course, Bushra! 💜 Here’s a **clean, professional** version of your `README.md` — properly formatted, without emojis, and structured for clarity. This version is ideal for showcasing your project in a **professional environment** like GitHub or during evaluations:

---

````markdown
# Visitor Management System with Face Recognition

This project is an AI-powered Visitor Management Tool designed to streamline visitor handling through face recognition, sentiment analysis, and efficient administration. It aims to enhance both security and visitor experience with a modern, scalable approach.

---

## Features

- Face Recognition-based Check-In/Check-Out
- Feedback Submission with Sentiment Analysis
- Speech-to-Text Support for Feedback
- Admin Dashboard with Log Management and Data Visualization
- Blacklist Detection with Reason Display and Alerts
- Email Notifications for OTP Verification, Alerts, and Checkout Confirmation
- Chatbot Interface for Visitor Assistance
- Dark Mode Toggle for UI Accessibility
- Face Snapshot Preview During Registration
- QR Code for Instant Visitor Check-Out

---

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript, Chart.js
- **Backend**: Node.js, Express.js
- **Machine Learning**: face-api.js, basic sentiment NLP
- **Database**: Firebase Firestore
- **Authentication**: Admin login (localStorage-based access control)
- **Email Service**: Nodemailer with Gmail SMTP

---

## Admin Dashboard Capabilities

- View all check-in and check-out logs
- Filter logs by type (check-in/check-out)
- View sentiment distribution using pie charts
- Blacklist management (add, view, remove)
- Protected routes with login authentication

---

## Running the Project Locally

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/byaseen26/Visiter-Management-With-Facial-Recognition.git

# Navigate to backend folder
cd app-main/backend

# Install backend dependencies
npm install

# Start the backend server
node server.js
````

### Frontend Setup

No build tools are needed. Simply open the HTML files in a browser or use Live Server.

Recommended usage with **VSCode Live Server** for a smoother experience:

```
app-main/
├── frontend/
│   ├── index.html           ← Visitor registration
│   ├── checkout.html        ← Face-based checkout and feedback
│   ├── admin-login.html     ← Admin authentication
│   ├── dashboard.html       ← Admin dashboard
│   ├── blacklist.html       ← Add visitors to blacklist
│   ├── view-blacklist.html  ← View and remove blacklisted visitors
│   └── chatbot.html         ← Visitor chatbot
```

---

## Firebase & Email Setup

### Firebase (Firestore)

Create a Firebase project and configure Firestore with the following collections:

* `visitors`: Stores name, email, purpose, and face embeddings
* `logs`: Stores check-in/check-out records with timestamps
* `feedbacks`: Stores visitor feedback and sentiment
* `blacklist`: Stores blacklisted visitor emails and reasons

### Nodemailer Configuration

To enable OTP and email notifications:

1. Enable **2-Step Verification** for your Gmail account.
2. Generate an **App Password** via Google Account > Security > App Passwords.
3. Update the credentials in `server.js`:

```javascript
auth: {
  user: 'your-email@gmail.com',
  pass: 'your-app-password'
}
```

---

## Project Structure

```
app-main/
├── backend/
│   ├── server.js
│   ├── sentiment.js
│   ├── otp.js
│   └── ... (other route handlers)
├── frontend/
│   ├── *.html
│   ├── style.css
│   └── models/           ← Face recognition models
```

---

## License

This project is for academic and demonstration purposes. All rights reserved by the respective authors.

```