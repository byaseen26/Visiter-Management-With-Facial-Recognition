const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const serviceAccount = require("./serviceKey.json"); // download this from firebase settings

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '22251A0557@gnits.ac.in',      // sender email
    pass: 'xoto qplq migr krdd'               // use App Password, not your Gmail login
  }
});

function sendAlertEmail(email, reason) {
  const mailOptions = {
    from: '22251A0557@gnits.ac.in',
    to: '22251A0557@gnits.ac.in',         // admin who will receive the alert
    subject: '🚨 ALERT: Blacklisted Visitor Attempted Check-in',
    text: `⚠️ A blacklisted visitor (${email}) attempted to check-in.\n\nReason: ${reason}`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("❌ Failed to send email:", err);
    } else {
      console.log("✅ Email sent:", info.response);
    }
  });
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Register Visitor
app.post("/register", async (req, res) => {
  const { name, email, purpose, embedding } = req.body;

  // Check if already registered
  const snapshot = await db.collection("visitors")
    .where("email", "==", email)
    .get();

  if (!snapshot.empty) {
    return res.send({ status: "exists", message: "Already registered" });
  }

  await db.collection("visitors").add({
    name, email, purpose, embedding, createdAt: new Date()
  });

  res.send({ status: "registered" });
});


// Check-in
app.post("/checkin", async (req, res) => {
  const { visitorId } = req.body;
  await db.collection("logs").add({
    visitorId,
    type: "checkin",
    time: new Date()
  });
  res.send({ status: "checked-in" });
});

// Check-out
app.post("/checkout", async (req, res) => {
  const { visitorId } = req.body;
  await db.collection("logs").add({
    visitorId,
    type: "checkout",
    time: new Date()
  });
  res.send({ status: "checked-out" });
});

// Feedback
app.post('/feedback', async (req, res) => {
  const { visitorId, feedback } = req.body;

  if (!visitorId || !feedback) {
    return res.status(400).json({ message: 'Missing data' });
  }

  // ✨ Analyze sentiment
  const result = sentiment.analyze(feedback);
  const sentimentType = result.score >= 0 ? "positive" : "negative";

  // ✅ Save to Firestore with sentiment
  await db.collection('feedbacks').add({
    visitorId,
    feedback,
    time: new Date(),
    sentiment: sentimentType
  });

  res.json({ status: 'submitted', sentiment: sentimentType });
});

const Sentiment = require('sentiment');
const sentiment = new Sentiment();

app.get('/sentiment-stats', async (req, res) => {
  const snapshot = await db.collection('feedbacks').get();
  let positive = 0, negative = 0;

  snapshot.forEach(doc => {
    const feedback = doc.data().feedback;
    if (!feedback) return;

    const result = sentiment.analyze(feedback);
    if (result.score > 0) positive++;
    else if (result.score < 0) negative++;
  });

  res.json({ positive, negative });
});


// Admin Dashboard Data
app.get("/dashboard", async (req, res) => {
  try {
    const logsSnapshot = await db.collection("logs").orderBy("time", "desc").get();

    const logsWithVisitor = [];

    for (const doc of logsSnapshot.docs) {
      const log = doc.data();
      let visitorInfo = {};

      if (log.visitorId) {
        const visitorDoc = await db.collection("visitors").doc(log.visitorId).get();
        if (visitorDoc.exists) {
          visitorInfo = visitorDoc.data();
        }
      }

      logsWithVisitor.push({
        ...log,
        visitorName: visitorInfo.name || "Unknown Visitor",
        visitorEmail: visitorInfo.email || "No Email",
      });
    }

    res.send(logsWithVisitor);
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).send({ error: "Something went wrong" });
  }
});


// Face Matching
// Face Matching with Blacklist Check
app.post("/match-face", async (req, res) => {
  const { embedding } = req.body;

  const visitorsSnapshot = await db.collection("visitors").get();
  let bestMatch = null;
  let lowestDistance = Infinity;

  visitorsSnapshot.forEach(doc => {
    const data = doc.data();
    const savedEmbedding = data.embedding;

    if (!savedEmbedding) return;

    let distance = 0;
    for (let i = 0; i < embedding.length; i++) {
      distance += Math.pow(embedding[i] - savedEmbedding[i], 2);
    }
    distance = Math.sqrt(distance);

    if (distance < lowestDistance) {
      lowestDistance = distance;
      bestMatch = { id: doc.id, ...data };
    }
  });

  const THRESHOLD = 0.6;

  if (lowestDistance < THRESHOLD) {
    // Check if matched visitor is blacklisted
    const blacklistSnapshot = await db.collection("blacklist")
      .where("email", "==", bestMatch.email)
      .get();

    if (!blacklistSnapshot.empty) {
      const reason = blacklistSnapshot.docs[0].data().reason;
      sendAlertEmail(bestMatch.email, reason);
      return res.send({
        match: true,
        blacklisted: true,
        reason: reason,
        visitor: bestMatch
      });
    }
    res.send({ match: true, visitor: bestMatch });
  } else {
    res.send({ match: false });
  }
});


// Add to Blacklist
app.post("/blacklist", async (req, res) => {
  const { email, reason } = req.body;

  if (!email || !reason) {
    return res.status(400).send({ status: "error", message: "Email and reason required" });
  }

  await db.collection("blacklist").add({
    email,
    reason,
    createdAt: new Date()
  });

  res.send({ status: "blacklisted" });
});

app.get("/get-blacklist", async (req, res) => {
  try {
    const snapshot = await db.collection("blacklist").get();
    const data = snapshot.docs.map(doc => doc.data());
    res.json(data);
  } catch (err) {
    console.error("Error fetching blacklist:", err);
    res.status(500).json({ error: "Failed to fetch blacklist" });
  }
});


// DELETE from blacklist
app.delete('/remove-blacklist', async (req, res) => {
  const { email } = req.body;
  try {
    const blacklistRef = db.collection('blacklist');
    const snapshot = await blacklistRef.where('email', '==', email).get();

    if (snapshot.empty) {
      return res.json({ status: "not_found" });
    }

    snapshot.forEach(doc => doc.ref.delete());
    res.json({ status: "removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const otpStore = new Map(); // temp memory store for OTPs

app.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, otp);

  setTimeout(() => otpStore.delete(email), 180000); // OTP expires in 3 mins

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: '22251A0557@gnits.ac.in',
      pass: 'xoto qplq migr krdd' // use app password, not real pass
    }
  });

  const mailOptions = {
    from: '22251A0557@gnits.ac.in',
    to: email,
    subject: 'Your OTP for Visitor Registration',
    text: `Hey! Your OTP for registration is: ${otp}`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ status: "sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "OTP send failed" });
  }
});

app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const valid = otpStore.get(email);

  if (valid === otp) {
    otpStore.delete(email);
    res.json({ verified: true });
  } else {
    res.json({ verified: false });
  }
});


app.listen(3000, () => console.log("Server running on port 3000"));