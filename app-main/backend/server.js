const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const serviceAccount = require("./serviceKey.json"); // download this from firebase settings

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Register Visitor
app.post("/register", async (req, res) => {
  const { name, email, purpose, embedding } = req.body;
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
app.post("/feedback", async (req, res) => {
  const { visitorId, feedback } = req.body;
  await db.collection("feedbacks").add({
    visitorId,
    feedback,
    time: new Date()
  });
  res.send({ status: "feedback saved" });
});

// Admin Dashboard Data
app.get("/dashboard", async (req, res) => {
  const snapshot = await db.collection("logs").get();
  const logs = snapshot.docs.map(doc => doc.data());
  res.send(logs);
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

app.listen(3000, () => console.log("Server running on port 3000"));