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
 * Reads problems.json, selects an unused problem, marks it as used,
 * and persists the changes. Resets cycle if all problems are used.
 */
function getRandomProblem() {
  try {
    const filePath = "problems.json";
    const fileContent = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContent);

    let available = data.problems.filter(p => !p.used);

    // If all problems are used, reset for a new cycle
    if (available.length === 0) {
      if (data.meta && typeof data.meta.cycle === "number") {
        data.meta.cycle++;
      }
      data.problems.forEach(p => (p.used = false));
      available = data.problems;
      console.log(`♻️ Cycle reset. Starting cycle ${data.meta?.cycle || "?"}`);
    }

    const selected = pickRandom(available);
    const index = data.problems.findIndex(p => p.id === selected.id);

    if (index !== -1) {
      data.problems[index].used = true;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
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
