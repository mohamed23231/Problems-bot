require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");
const cron = require("node-cron");
const fs = require("fs");

// Quotes Imports
const morningQuotes = require("./morning_quotes");
const reminderQuotes = require("./reminder_quotes");
const newProblemQuotes = require("./new_problem_quotes");

// Constants
const PAD = "\u200B";
const TIMEZONE = "Africa/Cairo";

// Client Setup
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ---------- Utilities ----------

/**
 * Picks a random element from an array.
 */
function pickRandom(arr) {
  if (!arr || arr.length === 0) return "";
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Selects a problem based on automatic phase rules, strict alternation, and burnout protection.
 */
function selectProblem(data) {
  // 1️⃣ Initialize / Auto-fix meta if missing
  if (!data.meta.startedAt) {
    data.meta.startedAt = new Date().toISOString();
  }
  if (!data.meta.history) {
    data.meta.history = [];
  }

  // 2️⃣ Check for Auto Phase Switch
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - new Date(data.meta.startedAt).getTime();

  if (elapsed >= ONE_WEEK_MS && data.meta.phase !== "mixed") {
    data.meta.phase = "mixed";
    console.log("🚀 Auto-switching phase to 'mixed' (7 days passed).");
  }

  const { phase, history } = data.meta;
  const available = data.problems.filter(p => !p.used);

  if (available.length === 0) return null;

  let candidates = [];

  // 3️⃣ Phase Logic
  if (phase === "easy") {
    // 🟢 Phase 1: "easy" (Warmup)
    // Only pick "Easy". Fallback to any.
    candidates = available.filter(p => p.difficulty === "Easy");
    if (candidates.length === 0) candidates = available;
  } else {
    // 🔁 Phase 2: "mixed" (Strict Alternation + Burnout Protection)
    
    // 🛡️ Burnout Protection
    // If in the last 5 problems, Medium appeared 3 times or more => Force "Easy"
    const lastFive = history.slice(-5);
    const mediumCount = lastFive.filter(d => d === "Medium").length;
    
    let forceEasy = false;
    if (mediumCount >= 3) {
      forceEasy = true;
      console.log("🛡️ Burnout protection active: Forcing Easy.");
    }

    const lastDifficulty = history.length > 0 ? history[history.length - 1] : null;

    if (forceEasy) {
      candidates = available.filter(p => p.difficulty === "Easy");
    } else {
      // 🚨 Golden Rules: Strict Alternation
      if (lastDifficulty === "Easy") {
        // Last was Easy → Next MUST be "Medium"
        candidates = available.filter(p => p.difficulty === "Medium");
      } else if (lastDifficulty === "Medium") {
        // Last was Medium → Next MUST be "Easy"
        candidates = available.filter(p => p.difficulty === "Easy");
      } else {
        // History empty: Start with "Easy" (Calm start)
        candidates = available.filter(p => p.difficulty === "Easy");
      }
    }

    // Fallback if the forced bucket is empty
    if (candidates.length === 0) {
      // Try the other difficulty if the forced one is empty
      if (forceEasy || lastDifficulty === "Medium") { 
         // We wanted Easy but none left? Try Medium (rare edge case, better than nothing)
         candidates = available.filter(p => p.difficulty === "Medium");
      } else if (lastDifficulty === "Easy") {
         // We wanted Medium but none left? Try Easy
         candidates = available.filter(p => p.difficulty === "Easy");
      }
      
      // If still empty, absolute fallback
      if (candidates.length === 0) {
        candidates = available;
      }
    }
  }

  return pickRandom(candidates);
}

/**
 * Reads problems.json, selects a problem using the new automated policy,
 * marks it as used, updates history, and persists changes.
 */
function getRandomProblem() {
  try {
    const filePath = "problems.json";
    const fileContent = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContent);

    // Initial check for used problems to handle cycle reset
    const allUsed = data.problems.every(p => p.used);

    if (allUsed) {
      if (!data.meta) data.meta = {};
      
      if (typeof data.meta.cycle === "number") {
        data.meta.cycle++;
      } else {
        data.meta.cycle = 1;
      }

      data.problems.forEach(p => (p.used = false));
      console.log(`♻️ Cycle reset. Starting cycle ${data.meta.cycle}`);
    }

    // Ensure meta exists
    if (!data.meta) data.meta = {};

    // Select problem based on policy
    const selected = selectProblem(data);

    if (selected) {
      const index = data.problems.findIndex(p => p.id === selected.id);
      if (index !== -1) {
        // Mark as used
        data.problems[index].used = true;

        // 🧾 History Tracking
        if (!data.meta.history) data.meta.history = [];
        data.meta.history.push(selected.difficulty);
        
        // Keep only last 5 entries
        if (data.meta.history.length > 5) {
          data.meta.history.shift();
        }

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      }
    }

    return selected;
  } catch (err) {
    console.error("❌ Error managing problems.json:", err.message);
    return null;
  }
}

/**
 * Async sleep function.
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------- Bot Logic ----------

client.once(Events.ClientReady, () => {
  console.log(`🤖 Bot logged in as ${client.user.tag}`);
  console.log(`🌍 Timezone set to: ${TIMEZONE}`);

  // 1️⃣ Morning Motivation
  // Time: 10:00 AM every day
  cron.schedule("0 10 * * *", async () => {
    try {
      const channel = await client.channels.fetch(process.env.CHANNEL_ID);
      const quote = pickRandom(morningQuotes);

      await channel.send(
`${PAD}
☀️ صباح الخير يا جماعة 👋

${quote}`
      );
      console.log("✅ Sent morning motivation.");
    } catch (err) {
      console.error("❌ Morning message error:", err.message);
    }
  }, { timezone: TIMEZONE });

  // 2️⃣ Daily Reminder
  // Time: 3:00 PM every day
  cron.schedule("0 15 * * *", async () => {
    try {
      const channel = await client.channels.fetch(process.env.CHANNEL_ID);
      const quote = pickRandom(reminderQuotes);

      await channel.send(
`${PAD}
🔔 فَكِّر نفسك بس 🧠
<@&${process.env.ROLE_ID}>

${quote}`
      );
      console.log("✅ Sent daily reminder.");
    } catch (err) {
      console.error("❌ Reminder error:", err.message);
    }
  }, { timezone: TIMEZONE });

  // 3️⃣ New Problem Flow
  // Time: 10:05 AM every 3 days
  cron.schedule("5 10 */3 * *", async () => {
    try {
      const channel = await client.channels.fetch(process.env.CHANNEL_ID);
      
      const motivation = pickRandom(newProblemQuotes);
      const problem = getRandomProblem();

      if (!problem) {
        console.error("❌ Failed to retrieve a problem.");
        return;
      }

      // Message 1 – Motivation
      await channel.send(
`${PAD}
🧠 problem-lab

${motivation}`
      );

      // Delay to avoid visual sticking
      await sleep(800);

      // Message 2 – Problem
      await channel.send(
`${PAD}
📌 New problem

${problem.title}
${problem.url}

⏱️ 20–25 min max
💬 فكرة واحدة كفاية`
      );

      console.log(`✅ Sent new problem: ${problem.title}`);
    } catch (err) {
      console.error("❌ New problem error:", err.message);
    }
  }, { timezone: TIMEZONE });

  console.log("📅 All production schedules registered.");
});

// Start the bot
client.login(process.env.DISCORD_TOKEN);
