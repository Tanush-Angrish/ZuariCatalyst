/**
 * generate-motivational-audio.js
 * Generates the motivational audio file for the worker quote in Hindi using Gemini 2.5 Flash TTS with Aoede voice.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY.replace(/\n/g, '').trim();
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${API_KEY}`;

const TEXT = "छोटा आइडिया हो या बड़ा — हर सजेशन है वैल्युएबल।";
const OUT_DIR = path.join(__dirname, '../../frontend/public/tour-audio');
const FILENAME = 'motivational_worker_hi.wav';

function getWavHeader(dataLength, sampleRate = 24000) {
  const buffer = Buffer.alloc(44);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
  return buffer;
}

async function run() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  try {
    const payload = {
      contents: [{ parts: [{ text: TEXT }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } }
      }
    };

    console.log(`Generating motivational audio using Gemini TTS (Aoede voice)...`);
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Error generating audio: ${res.status} ${res.statusText}`);
      console.error(errorText);
      return;
    }

    const data = await res.json();
    const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part && part.inlineData) {
      const base64Audio = part.inlineData.data;
      const pcmBuffer = Buffer.from(base64Audio, 'base64');
      const headerBuffer = getWavHeader(pcmBuffer.length, 24000);
      const finalWavBuffer = Buffer.concat([headerBuffer, pcmBuffer]);
      
      const targetPath = path.join(OUT_DIR, FILENAME);
      fs.writeFileSync(targetPath, finalWavBuffer);
      console.log(`\n🎉 Motivational audio generated successfully!`);
      console.log(`Saved to: ${targetPath} (${finalWavBuffer.length} bytes)`);
    } else {
      console.error(`❌ No inlineData found in response`);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error(`❌ Network error while generating audio:`, err);
  }
}

run();
