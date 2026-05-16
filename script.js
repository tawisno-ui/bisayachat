import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  deleteField,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// ================= FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyDZ2Y_6unbKlKZ-JPqGMYUIBwCPbzEvH6Y",
  authDomain: "chichat-edc18.firebaseapp.com",
  projectId: "chichat-edc18",
  storageBucket: "chichat-edc18.firebasestorage.app",
  messagingSenderId: "416211065980",
  appId: "1:416211065980:web:25ae99a3f72fcb2d137df9",
  measurementId: "G-LL4W6T5Y62",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ================= STARFIELD =================
(function initStarfield() {
  const canvas = document.createElement("canvas");
  canvas.id = "starfield";
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext("2d");
  let W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", () => {
    resize();
    createStars();
  });

  // ---- Stars ----
  const STAR_COUNT = 320;
  const stars = [];

  const STAR_COLORS = [
    "255,255,255", // white
    "200,220,255", // cool blue-white
    "255,240,210", // warm yellow-white
    "180,210,255", // pale blue
    "255,200,200", // pale red
  ];

  function createStars() {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
      const size = Math.random();
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r:
          size < 0.7
            ? Math.random() * 0.7 + 0.2 // small
            : size < 0.92
              ? Math.random() * 0.8 + 0.8 // medium
              : Math.random() * 0.8 + 1.4, // large bright
        alpha: Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 0.008 + 0.003,
        twinkleDir: Math.random() > 0.5 ? 1 : -1,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      });
    }
  }
  createStars();

  // ---- Shooting Stars ----
  const shooters = [];

  function spawnShooter() {
    shooters.push({
      x: Math.random() * W * 0.8,
      y: Math.random() * H * 0.45,
      vx: Math.random() * 5 + 5,
      vy: Math.random() * 3 + 2,
      len: Math.random() * 140 + 80,
      alpha: 0,
      phase: "in", // "in" → "hold" → "out"
      life: 0,
    });
  }

  // Random interval between shooting stars
  function scheduleShooter() {
    setTimeout(
      () => {
        spawnShooter();
        scheduleShooter();
      },
      Math.random() * 5000 + 2500,
    );
  }
  scheduleShooter();

  // ---- Constellation dots (static) ----
  // A few clusters of stars connected with faint lines
  const constellations = [];
  function buildConstellations() {
    constellations.length = 0;
    // Pick ~3 random groups of 4-6 nearby stars to "connect"
    for (let g = 0; g < 3; g++) {
      const cx = Math.random() * W * 0.8 + W * 0.1;
      const cy = Math.random() * H * 0.5 + H * 0.05;
      const pts = [];
      const n = Math.floor(Math.random() * 3) + 4;
      for (let i = 0; i < n; i++) {
        pts.push({
          x: cx + (Math.random() - 0.5) * 160,
          y: cy + (Math.random() - 0.5) * 100,
        });
      }
      constellations.push(pts);
    }
  }
  buildConstellations();

  // ---- Draw ----
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Constellation lines
    constellations.forEach((pts) => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.strokeStyle = "rgba(150,180,255,0.06)";
      ctx.lineWidth = 0.6;
      ctx.stroke();
    });

    // Stars
    stars.forEach((s) => {
      // Twinkle
      s.alpha += s.twinkleSpeed * s.twinkleDir;
      if (s.alpha >= 0.95) {
        s.alpha = 0.95;
        s.twinkleDir = -1;
      }
      if (s.alpha <= 0.08) {
        s.alpha = 0.08;
        s.twinkleDir = 1;
      }

      // Glow for bright stars
      if (s.r > 1.3) {
        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
        glow.addColorStop(0, `rgba(${s.color},${s.alpha * 0.4})`);
        glow.addColorStop(1, `rgba(${s.color},0)`);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // Star dot
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${s.color},${s.alpha})`;
      ctx.fill();
    });

    // Shooting stars
    for (let i = shooters.length - 1; i >= 0; i--) {
      const s = shooters[i];
      s.life++;

      if (s.phase === "in") {
        s.alpha = Math.min(s.alpha + 0.08, 1);
        if (s.alpha >= 1) s.phase = "hold";
      } else if (s.phase === "hold") {
        if (s.life > 18) s.phase = "out";
      } else {
        s.alpha = Math.max(s.alpha - 0.05, 0);
        if (s.alpha <= 0) {
          shooters.splice(i, 1);
          continue;
        }
      }

      s.x += s.vx;
      s.y += s.vy;

      const tailX = s.x - s.vx * (s.len / Math.sqrt(s.vx ** 2 + s.vy ** 2));
      const tailY = s.y - s.vy * (s.len / Math.sqrt(s.vx ** 2 + s.vy ** 2));

      const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      grad.addColorStop(0, `rgba(255,255,255,0)`);
      grad.addColorStop(0.6, `rgba(200,220,255,${s.alpha * 0.4})`);
      grad.addColorStop(1, `rgba(255,255,255,${s.alpha})`);

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      ctx.stroke();

      // Tip glow
      const tipGlow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 6);
      tipGlow.addColorStop(0, `rgba(255,255,255,${s.alpha * 0.8})`);
      tipGlow.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = tipGlow;
      ctx.fill();

      if (s.x > W + 50 || s.y > H + 50) shooters.splice(i, 1);
    }

    requestAnimationFrame(draw);
  }

  draw();
})();

// ================= DOM =================
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const onlineCountEl = document.getElementById("onlineCount");
const onlineBox = document.getElementById("onlineUsers");

// ================= USER =================
function generateUsername() {
  const adj = ["Cool", "Dark", "Fast", "Lucky", "Neo", "Cyber"];
  const animal = ["Fox", "Wolf", "Tiger", "Eagle", "Shark"];
  return (
    adj[Math.floor(Math.random() * adj.length)] +
    animal[Math.floor(Math.random() * animal.length)] +
    Math.floor(Math.random() * 999)
  );
}

let userId = localStorage.getItem("chichat_userId");
if (!userId) {
  userId = crypto.randomUUID();
  localStorage.setItem("chichat_userId", userId);
}

let username = localStorage.getItem("chichat_username");
if (!username) {
  username = generateUsername();
  localStorage.setItem("chichat_username", username);
}

// ================= ENTER KEY =================
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

// ================= SEND MESSAGE =================
window.sendMessage = async function () {
  const text = input.value.trim();
  if (!text) return;

  input.value = "";

  // ================= SECRET DELETE ALL COMMAND =================
  if (text === ":12345Delete") {
    const confirmed = confirm(
      "⚠️ This will permanently delete ALL messages. Are you sure?",
    );
    if (!confirmed) return;
    try {
      const snapshot = await getDocs(collection(db, "messages"));
      const deletions = snapshot.docs.map((d) =>
        deleteDoc(doc(db, "messages", d.id)),
      );
      await Promise.all(deletions);
      showInfo(`🗑️ All ${snapshot.size} messages deleted.`);
    } catch (err) {
      showWarning("Failed to delete messages. Check your permissions.");
    }
    return;
  }

  if (text.startsWith("::")) {
    const newName = text.slice(2).trim();
    if (newName.length === 0) {
      showWarning("Please provide a username after ::  e.g. ::CoolDude");
      return;
    }
    if (newName.length > 20) {
      showWarning("Username must be 20 characters or less.");
      return;
    }
    username = newName;
    localStorage.setItem("chichat_username", username);
    showInfo(`Your username has been changed to: ${username}`);
    return;
  }

  await sendToFirebase(text);
};

async function sendToFirebase(text) {
  await addDoc(collection(db, "messages"), {
    username,
    text,
    time: Date.now(),
    userId,
    reactions: {},
  });
}

// ================= EMOJI REACTION =================
const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

async function handleReaction(messageId, emoji, currentReactions) {
  let userCurrentEmoji = null;
  for (const [e, users] of Object.entries(currentReactions)) {
    if (users && users[userId]) {
      userCurrentEmoji = e;
      break;
    }
  }

  const ref = doc(db, "messages", messageId);

  if (userCurrentEmoji) {
    await updateDoc(ref, {
      [`reactions.${userCurrentEmoji}.${userId}`]: deleteField(),
    });
  }
  if (userCurrentEmoji !== emoji) {
    await updateDoc(ref, { [`reactions.${emoji}.${userId}`]: true });
  }
}

// ================= REALTIME CHAT =================
const q = query(collection(db, "messages"), orderBy("time"));

onSnapshot(q, (snapshot) => {
  messages.innerHTML = "";

  snapshot.forEach((documentSnapshot) => {
    const data = documentSnapshot.data();
    const messageId = documentSnapshot.id;
    const reactions = data.reactions || {};

    const wrapper = document.createElement("div");
    wrapper.classList.add("message-wrapper");

    const name = document.createElement("div");
    name.classList.add("username");
    name.textContent = data.username;

    const row = document.createElement("div");
    row.classList.add("message-row");

    const msg = document.createElement("div");
    msg.classList.add("message");
    msg.textContent = data.text;

    if (data.userId === userId) {
      msg.addEventListener("dblclick", async () => {
        if (confirm("Delete your message?")) {
          await deleteDoc(doc(db, "messages", messageId));
        }
      });
    }

    const reactBtn = document.createElement("button");
    reactBtn.classList.add("react-btn");
    reactBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 13s1.5 2 4 2 4-2 4-2"/>
      <line x1="9" y1="9" x2="9.01" y2="9" stroke-linecap="round" stroke-width="3"/>
      <line x1="15" y1="9" x2="15.01" y2="9" stroke-linecap="round" stroke-width="3"/>
    </svg>`;
    reactBtn.title = "Add reaction";

    const picker = document.createElement("div");
    picker.classList.add("emoji-picker");
    EMOJI_OPTIONS.forEach((emoji) => {
      const opt = document.createElement("span");
      opt.classList.add("emoji-opt");
      opt.textContent = emoji;
      opt.addEventListener("click", async (e) => {
        e.stopPropagation();
        picker.classList.remove("open");
        await handleReaction(messageId, emoji, reactions);
      });
      picker.appendChild(opt);
    });

    reactBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".emoji-picker.open").forEach((p) => {
        if (p !== picker) p.classList.remove("open");
      });
      picker.classList.toggle("open");
    });

    row.appendChild(msg);
    row.appendChild(reactBtn);
    row.appendChild(picker);

    const reactionsBar = document.createElement("div");
    reactionsBar.classList.add("reactions-bar");

    for (const [emoji, users] of Object.entries(reactions)) {
      const count = Object.keys(users).length;
      if (count === 0) continue;

      const chip = document.createElement("button");
      chip.classList.add("reaction-chip");
      if (users[userId]) chip.classList.add("mine");
      chip.textContent = `${emoji} ${count}`;
      chip.title = users[userId]
        ? "Click to remove reaction"
        : "Click to react";
      chip.addEventListener("click", async () => {
        await handleReaction(messageId, emoji, reactions);
      });
      reactionsBar.appendChild(chip);
    }

    wrapper.appendChild(name);
    wrapper.appendChild(row);
    wrapper.appendChild(reactionsBar);
    messages.appendChild(wrapper);
  });

  messages.scrollTop = messages.scrollHeight;
});

document.addEventListener("click", () => {
  document
    .querySelectorAll(".emoji-picker.open")
    .forEach((p) => p.classList.remove("open"));
});

// ================= ONLINE SYSTEM =================
const onlineRef = doc(db, "onlineUsers", userId);
async function goOnline() {
  await setDoc(onlineRef, { username, lastSeen: Date.now() });
}
goOnline();
setInterval(() => setDoc(onlineRef, { username, lastSeen: Date.now() }), 5000);

onSnapshot(collection(db, "onlineUsers"), (snapshot) => {
  const now = Date.now();
  let count = 0;
  if (onlineBox) onlineBox.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (now - data.lastSeen < 10000) {
      count++;
      if (onlineBox) {
        const div = document.createElement("div");
        div.textContent = "🟢 " + data.username;
        onlineBox.appendChild(div);
      }
    }
  });

  if (onlineCountEl) onlineCountEl.textContent = `🟢 Online: ${20 + count}`;
});

// ================= HELPERS =================
function showWarning(msg) {
  showToast(msg, "#e74c3c");
}
function showInfo(msg) {
  showToast(msg, "#2ecc71");
}

function showToast(msg, color = "#333") {
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: ${color};
    color: #fff;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    transition: opacity 0.5s;
    white-space: nowrap;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}
