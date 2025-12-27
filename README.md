# 🧠 problem-lab-bot

A gentle, automated Discord companion designed to help the engineering team build a consistent problem-solving habit.

Unlike typical competitive bots, **problem-lab** is not about speed, grinding, or leaderboards. It focuses on consistency, curiosity, and the simple act of thinking about a problem—even if you don't solve it entirely.

> **"فكرة واحدة كفاية"** (One idea is enough)

## ✨ Features

The bot runs on a specific schedule (Cairo Time `Africa/Cairo`) to keep the team engaged without overwhelming them:

### ☀️ Morning Motivation
*   **When:** Daily at **10:00 AM**
*   **What:** Sends a warm, supportive message to start the day on a positive note.
*   **Tone:** Calm, affirming, and patient.

### 🧠 New Problem
*   **When:** Every **3 Days** at **10:05 AM**
*   **What:** meaningful LeetCode problem (Easy/Medium) from our curated list.
*   **Details:**
    *   Problems are loaded from `problems.json`.
    *   Ensures valid non-repeating cycles (no problem is repeated until all are used).

### 🔔 Gentle Reminder
*   **When:** Daily at **3:00 PM**
*   **What:** A soft nudge giving a "ping" to the team.
*   **Goal:** Encourages you to just *read* the problem or think about it for 5 minutes during a break.

## 🛠️ Tech Stack

*   **Runtime:** Node.js
*   **Framework:** [discord.js](https://discord.js.org/) (v14)
*   **Scheduling:** [node-cron](https://www.npmjs.com/package/node-cron)
*   **Persistence:** Local JSON file (`problems.json`)

## 🚀 How to Run

### 1. Prerequisites
*   Node.js (v16.9.0 or higher)
*   npm or yarn

### 2. Installation
```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install
```

### 3. Configuration
Create a `.env` file in the root directory with the following variables:
```ini
DISCORD_TOKEN=your_discord_bot_token
CHANNEL_ID=your_discord_channel_id
ROLE_ID=your_discord_role_id_to_mention
```

### 4. usage
```bash
# Start the bot
npm start
```
*The bot will log in and register the cron schedules immediately.*

## 📂 Project Structure

*   `index.js`: The main logic for the bot, cron schedules, and event handling.
*   `problems.json`: A JSON "database" containing the list of problems and their usage state.
*   `morning_quotes.js`: Array of motivating morning messages.
*   `reminder_quotes.js`: Array of gentle reminders.
*   `new_problem_quotes.js`: Messages that accompany a new problem drop.

## 🤝 Contribution

Feel free to open a PR to add new problems to `problems.json` or new supportive quotes to the list!

1.  Add new problems to equality in `problems.json` (keep `used: false`).
2.  Add new colloquial quotes to the respective `.js` files.

---
*Built with 🤍 for the Team.*
