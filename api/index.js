const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const mqtt = require("mqtt");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Koneksi ke Supabase
const SUPABASE_URL = "https://yjvyjsemucsmtavoqxni.supabase.co";  // Ganti dengan URL Supabase kamu
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlqdnlqc2VtdWNzbXRhdm9xeG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwNzM1NzIsImV4cCI6MjA1NDY0OTU3Mn0.IVAmki4qxAfFfoDbS15aBceheDZ_mikXf3vJM9zKFvI";  // Ganti dengan anon key dari Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Koneksi ke MQTT Broker
const mqttClient = mqtt.connect("mqtt://broker.hivemq.com");  // Gunakan broker yang sama dengan ESP8266
const mqtt_topic = "sensor/dht22";

mqttClient.on("connect", () => {
  console.log("Connected to MQTT Broker");
  mqttClient.subscribe(mqtt_topic);
});

mqttClient.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log("Received Data:", data);

    // Simpan ke Supabase
    const { error } = await supabase
      .from("sensor_data")
      .insert([{ temperature: data.temperature, humidity: data.humidity }]);

    if (error) console.error("Error inserting data:", error);
    else console.log("Data saved to Supabase");

  } catch (error) {
    console.log("Error parsing MQTT message:", error);
  }
});

// **API Endpoint untuk Mendapatkan Data Sensor**
app.get("/api/sensor", async (req, res) => {
  const { data, error } = await supabase
    .from("sensor_data")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(10);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// **Export handler untuk Vercel**
module.exports = app;
