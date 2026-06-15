require('dotenv').config();
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY.replace(/\n/g, '').trim();
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${API_KEY}`;

const STEPS = [
  { id: 1, english: "Welcome to your command center. All ideas requiring your administrative attention are organized here.", hindi: "आपके कमांड सेंटर में आपका स्वागत है। यहाँ वो सभी आइडियाज़ मिलेंगे जिन पर आपको काम करना है।" },
  { id: 2, english: "This filter shows new submissions waiting for your initial review or final sign-off.", hindi: "यह फ़िल्टर उन नए आइडियाज़ को दिखाता है जो आपके रिव्यू या फाइनल अप्रूवल का इंतज़ार कर रहे हैं।" },
  { id: 3, english: "Track ideas that you have personally moved from the submitted stage into the active review phase.", hindi: "यहाँ उन आइडियाज़ को ट्रैक करें जिन्हें आपने खुद सबमिट सेक्शन से रिव्यू में मूव किया है।" },
  { id: 4, english: "Access the archive of all innovations you have successfully cleared for implementation.", hindi: "यहाँ उन सभी आइडियाज़ की लिस्ट है जिन्हें आपने आगे बढ़ने के लिए हरी झंडी दे दी है।" },
  { id: 5, english: "Review submissions that did not meet the strategic criteria or were deemed unfeasible.", hindi: "यहाँ वो सबमिशन दिखेंगे जो कंपनी की ज़रूरतों या प्लानिंग के हिसाब से फिट नहीं बैठे।" },
  { id: 6, english: "Here you can monitor all ideas submitted by employees within your own company or team. It helps you ensure that everyone is aligned with your internal goals.", hindi: "यहाँ आप अपनी कंपनी या टीम के सभी कर्मचारियों द्वारा भेजे गए आइडियाज़ देख सकते हैं। इससे आप यह पक्का कर सकते हैं कि सब एक ही दिशा में काम कर रहे हैं।" },
  { id: 7, english: "Track the real-world execution and impact of your approved innovations here.", hindi: "अप्रूव हुए आइडियाज़ को असलियत में बदलते हुए यहाँ देखें। प्रोजेक्ट्स की प्रोग्रेस यहाँ ट्रैक करें।" },
  { id: 8, english: "Recognize and reward the individuals driving change in your organization.", hindi: "उन लोगों को पहचानें और बढ़ावा दें जो कंपनी में बड़े बदलाव ला रहे हैं।" },
  { id: 'welcome', english: "Greetings, Admin! Ready to manage the innovation pipeline? Select your language and let's explore every filter in your dashboard.", hindi: "नमस्ते एडमिन! क्या आप Zuari के नए आइडियाज़ को मैनेज करने के लिए तैयार हैं? अपनी भाषा चुनें और चलिए डैशबोर्ड का छोटा सा टूर करते हैं।" },
  { id: 'celebration', english: "Admin guide complete! You now have a full overview of the review states and organizational tools.", hindi: "बधाई हो! एडमिन टूर पूरा हुआ। अब आप डैशबोर्ड को अच्छी तरह से इस्तेमाल करने के लिए तैयार हैं।" }
];

const OUT_DIR = path.join(__dirname, '../../frontend/public/tour-audio');

function getWavHeader(dataLength, sampleRate = 24000) {
  const buffer = Buffer.alloc(44);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // PCM
  buffer.writeUInt16LE(1, 20); // 1 = PCM
  buffer.writeUInt16LE(1, 22); // 1 channel
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byteRate
  buffer.writeUInt16LE(2, 32); // blockAlign
  buffer.writeUInt16LE(16, 34); // bitsPerSample
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
      console.error(`Error for ${filename}: ${res.status} ${res.statusText}`);
      return;
    }

    const data = await res.json();
    const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part && part.inlineData) {
      const pcmBuffer = Buffer.from(part.inlineData.data, 'base64');
      const headerBuffer = getWavHeader(pcmBuffer.length, 24000);
      const finalWavBuffer = Buffer.concat([headerBuffer, pcmBuffer]);
      fs.writeFileSync(path.join(OUT_DIR, filename), finalWavBuffer);
      console.log(`Saved ${filename}`);
    }
  } catch (err) {
    console.error(`Network error for ${filename}:`, err);
  }
}

async function run() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const step of STEPS) {
    const idStr = typeof step.id === 'number' ? `step_${step.id}` : step.id;
    // Prefix admin files with "admin_"
    await generateAudio(step.english, `admin_${idStr}_en.wav`);
    await new Promise(r => setTimeout(r, 1000));
    await generateAudio(step.hindi, `admin_${idStr}_hi.wav`);
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log("All admin audio files generated successfully.");
}

run();
