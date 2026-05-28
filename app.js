/**
 * 42 Logtime → MQTT Publisher
 *
 * Ce script récupère le logtime journalier d'un utilisateur de l'école 42
 * via l'API officielle et publie les informations sur un broker MQTT pour
 * Home Assistant.
 *
 * Variables d'environnement :
 * - FT_CLIENT_ID
 * - FT_CLIENT_SECRET
 * - FT_LOGIN
 * - MQTT_HOST
 * - MQTT_PORT=1883
 * - MQTT_USERNAME
 * - MQTT_PASSWORD
 * - MQTT_TOPIC=42/logtime
 * - UPDATE_INTERVAL=300000   (5 min)
 */

const mqtt = require("mqtt");

// ===========================
// Configuration
// ===========================
const CONFIG = {
  ft: {
    clientId: process.env.FT_CLIENT_ID,
    clientSecret: process.env.FT_CLIENT_SECRET,
    login: process.env.FT_LOGIN,
  },

  mqtt: {
    host: process.env.MQTT_HOST,
    port: parseInt(process.env.MQTT_PORT || "1883", 10),
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    topic: process.env.MQTT_TOPIC || "42/logtime",
  },

  updateInterval: parseInt(process.env.UPDATE_INTERVAL || "300000", 10),
};

// ===========================
// Validation
// ===========================
for (const [key, value] of Object.entries({
  FT_CLIENT_ID: CONFIG.ft.clientId,
  FT_CLIENT_SECRET: CONFIG.ft.clientSecret,
  FT_LOGIN: CONFIG.ft.login,
  MQTT_HOST: CONFIG.mqtt.host,
})) {
  if (!value) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
}

// ===========================
// MQTT
// ===========================
const mqttClient = mqtt.connect({
  host: CONFIG.mqtt.host,
  port: CONFIG.mqtt.port,
  username: CONFIG.mqtt.username,
  password: CONFIG.mqtt.password,
});

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
});

mqttClient.on("error", (err) => {
  console.error("MQTT error:", err.message);
});

// ===========================
// Helpers
// ===========================
function msToHours(ms) {
  return ms / 1000 / 60 / 60;
}

function formatHours(hours) {
  return Math.round(hours * 100) / 100;
}

function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

// ===========================
// API 42
// ===========================
let accessToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  const now = Date.now();

  if (accessToken && now < tokenExpiresAt - 60000) {
    return accessToken;
  }

  console.log("Requesting new 42 API token...");

  const response = await fetch("https://api.intra.42.fr/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: CONFIG.ft.clientId,
      client_secret: CONFIG.ft.clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status}`);
  }

  const data = await response.json();

  accessToken = data.access_token;
  tokenExpiresAt = now + data.expires_in * 1000;

  return accessToken;
}

async function getUserData() {
  const token = await getAccessToken();

  const response = await fetch(
    `https://api.intra.42.fr/v2/users/${CONFIG.ft.login}/locations?per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`User request failed: ${response.status}`);
  }

  return response.json();
}

// ===========================
// Calcul du logtime (journalier et mensuel)
// ===========================
function computeLogtimes(locations) {
  const today = getTodayDateString();
  const currentMonth = today.substring(0, 7); // Format: YYYY-MM

  let dailyTotalMs = 0;
  let dailySessions = 0;
  let monthlyTotalMs = 0;
  let monthlySessions = 0;
  let active = false;
  const now = Date.now();

  for (const location of locations) {
    if (!location.begin_at) continue;

    const begin = new Date(location.begin_at);
    const beginDate = begin.toISOString().split("T")[0];
    const beginMonth = beginDate.substring(0, 7);

    if (beginMonth !== currentMonth) continue;

    let end;

    if (location.end_at) {
      end = new Date(location.end_at);
    } else {
      end = new Date(now);
      if (beginDate === today) {
        active = true;
      }
    }

    const duration = end - begin;

    if (duration > 0) {
      monthlyTotalMs += duration;
      monthlySessions++;

      if (beginDate === today) {
        dailyTotalMs += duration;
        dailySessions++;
      }
    }
  }

  const seconds = Math.floor(dailyTotalMs / 1000);
  const hours = Math.round((seconds / 3600) * 100) / 100;

  const monthly_seconds = Math.floor(monthlyTotalMs / 1000);
  const monthly_hours = Math.round((monthly_seconds / 3600) * 100) / 100;

  return {
    date: today,
    month: currentMonth,
    seconds,
    hours,
    sessions: dailySessions,
    monthly_seconds,
    monthly_hours,
    monthly_sessions: monthlySessions,
    active,
  };
}

// ===========================
// Publication MQTT
// ===========================
function publishLogtime(data) {
  const payload = JSON.stringify({
    login: CONFIG.ft.login,
    ...data,
    updated_at: new Date().toISOString(),
  });

  mqttClient.publish(CONFIG.mqtt.topic, payload, {
    retain: true,
    qos: 1,
  });

  console.log("Published:", payload);
}

// ===========================
// Main Loop
// ===========================
async function update() {
  try {
    const userData = await getUserData();
    const logtime = computeLogtimes(userData);
    console.log(`Fetched ${userData.length} locations`);
    publishLogtime(logtime);
  } catch (err) {
    console.error("Update failed:", err.message);
  }
}

async function main() {
  await update();
  setInterval(update, CONFIG.updateInterval);
}

main();
