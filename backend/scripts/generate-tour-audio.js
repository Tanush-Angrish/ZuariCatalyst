require('dotenv').config();
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY.replace(/\n/g, '').trim();
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${API_KEY}`;

const STEPS = [
  {
    id: 'step_1',
    english: "Welcome! This is your Innovation Hub. You can submit 5 ideas per month. Let's learn how to make an impact.",
    hindi: "नमस्ते! ये आपका आईडिया हब है। यहाँ आप हर महीने 5 आईडिया भेज सकते हैं। चलिए देखते हैं ये कैसे काम करता है।",
  },
  {
    id: 'step_2',
    english: "Pick a template to start. We have specialized presets for everything from cost saving to manufacturing.",
    hindi: "शुरू करने के लिए एक टेम्पलेट चुन लें। हमारे पास आपके आईडिया को बेहतर बनाने के लिए कई ऑप्शंस मौजूद हैं।",
  },
  {
    id: 'step_3',
    english: "Our AI assistant is here to help. Just speak your idea and the AI will fill the entire form automatically.",
    hindi: "हमारा AI असिस्टेंट आपकी मदद के लिए यहाँ है। बस अपनी बात बताएं। AI पूरा फॉर्म अपने आप भर देगा।",
  },
  {
    id: 'step_4',
    english: "Track your progress here. You'll see when your ideas are moved to review or approved by management.",
    hindi: "अपने आईडिया का स्टेटस यहाँ चेक करें। देखें कि वो कब रिव्यु के लिए गया या कब अप्रूव हुआ।",
  },
  {
    id: 'step_5',
    english: "Explore the Community Hub to see what others are working on. Collaboration starts with inspiration.",
    hindi: "कम्युनिटी हब में आप दूसरों के बढ़िया आइडियाज देख सकते हैं और उनसे प्रेरणा ले सकते हैं।",
  },
  {
    id: 'step_6',
    english: "Once your ideas are approved, you can manage the whole project lifecycle and track implementation here.",
    hindi: "एक बार आपके आईडिया अप्रूव हो जाने के बाद, आप यहाँ प्रोजेक्ट्स को मैनेज कर सकते हैं।",
  },
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
    id: 'welcome',
    english: "Ready to turn your ideas into organizational impact? Select your voice language and let's take a quick tour.",
    hindi: "क्या आप अपने आईडिया से कंपनी में बदलाव लाना चाहते हैं? अपनी आवाज की भाषा चुनें और डेमो देखें।",
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
      const errorText = await res.text();
      console.error(`Error for ${filename}: ${res.status} ${res.statusText}`);
      console.error(errorText);
      return;
    }

    const data = await res.json();
    
    // Gemini 2.5 Flash TTS typically returns the audio in the first candidate's parts
    const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part && part.inlineData) {
      const base64Audio = part.inlineData.data;
      const pcmBuffer = Buffer.from(base64Audio, 'base64');
      const headerBuffer = getWavHeader(pcmBuffer.length, 24000);
      const finalWavBuffer = Buffer.concat([headerBuffer, pcmBuffer]);
      
      fs.writeFileSync(path.join(OUT_DIR, filename), finalWavBuffer);
      console.log(`Saved ${filename} (Size: ${finalWavBuffer.length} bytes)`);
    } else {
      console.error(`No inlineData found for ${filename}`);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error(`Network error for ${filename}:`, err);
  }
}

async function run() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  for (const step of STEPS) {
    await generateAudio(step.english, `${step.id}_en.wav`);
    // Wait slightly to avoid API rate limits
    await new Promise(r => setTimeout(r, 1000));
    await generateAudio(step.hindi, `${step.id}_hi.wav`);
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log("All audio files generated successfully.");
}

run();
