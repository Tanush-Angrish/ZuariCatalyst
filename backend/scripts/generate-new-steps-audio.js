/**
 * generate-new-steps-audio.js
 * Regenerates ONLY the changed/new audio files:
 *   - step_7 (removed "Finally")
 *   - step_8 (new — profile page intro)
 *   - step_9 (new — add profile photo)
 *   - done   (updated — 9 steps + profile photo mention)
 * Uses Gemini 2.5 Flash TTS with Aoede voice — same as all other tour audio.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY.replace(/\n/g, '').trim();
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${API_KEY}`;

const STEPS = [
  {
    id: 'step_7',
    english: "Check the Leaderboard. Every successful contribution earns you points and company-wide recognition.",
    hindi: "लीडरबोर्ड देखें! पॉइंट्स कमाएं और कंपनी के टॉप इनोवेटर्स की लिस्ट में अपनी जगह बनाएं।",
  },
  {
    id: 'step_8',
    english: "This is your personal profile page. Keep your details up to date so your team can recognise you across the platform.",
    hindi: "यह आपका प्रोफ़ाइल पेज है। अपनी जानकारी अप-टू-डेट रखें ताकि आपकी टीम आपको पहचान सके।",
  },
  {
    id: 'step_9',
    english: "Hover over the circle and click to upload your profile photo. A face to a name builds trust and makes collaboration easier!",
    hindi: "सर्कल पर माउस ले जाएं और क्लिक करके अपनी प्रोफ़ाइल फ़ोटो अपलोड करें। चेहरा देखने से टीम में भरोसा और पहचान बढ़ती है!",
  },
  {
    id: 'done',
    english: "Mission complete! You've mastered all 9 steps. Don't forget to upload your profile photo so your teammates can put a face to your brilliant ideas!",
    hindi: "बधाई हो! आपने सभी 9 स्टेप्स पूरे कर लिए हैं। अपनी प्रोफ़ाइल फोटो ज़रूर अपलोड करें ताकि आपकी टीम आपको पहचान सके!",
  }
];

const OUT_DIR = path.join(__dirname, '../../frontend/public/tour-audio');

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

async function generateAudio(text, filename) {
  try {
    const payload = {
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } }
      }
    };

    console.log(`Generating ${filename}...`);
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Error for ${filename}: ${res.status} ${res.statusText}`);
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
      fs.writeFileSync(path.join(OUT_DIR, filename), finalWavBuffer);
      console.log(`✅ Saved ${filename} (${finalWavBuffer.length} bytes)`);
    } else {
      console.error(`❌ No inlineData found for ${filename}`);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error(`❌ Network error for ${filename}:`, err);
  }
}

async function run() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const step of STEPS) {
    await generateAudio(step.english, `${step.id}_en.wav`);
    await new Promise(r => setTimeout(r, 1200)); // rate-limit buffer
    await generateAudio(step.hindi, `${step.id}_hi.wav`);
    await new Promise(r => setTimeout(r, 1200));
  }
  console.log('\n🎉 All new audio files generated successfully.');
  console.log('Files saved to:', OUT_DIR);
}

run();
