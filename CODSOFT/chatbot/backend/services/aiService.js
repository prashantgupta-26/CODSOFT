import axios from "axios";

/**
 * Generates an AI response using the Gemini API.
 * Tries multiple models sequentially in case of rate limits / quota blocks,
 * and falls back to a precise simulated response if all models fail.
 * 
 * @param {Array} history - Array of previous messages in the conversation
 * @param {string} prompt - The new user prompt
 * @returns {Promise<string>} The generated AI text response
 */
export const generateAIResponse = async (history, prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback if no API key is provided
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    console.warn("GEMINI_API_KEY not configured. Using fallback local response.");
    return `[Mock NeuroChat Response] Gemini API Key is not set in backend .env. You asked: "${prompt}". Please add your GEMINI_API_KEY to test real-time AI replies!`;
  }

  // Models to try in sequence
  const modelsToTry = [
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro"
  ];

  // Format previous messages for Gemini contents
  const contents = history.map((msg) => ({
    role: msg.sender === "user" ? "user" : "model",
    parts: [{ text: msg.text }],
  }));

  // Add current user prompt
  contents.push({
    role: "user",
    parts: [{ text: prompt }],
  });

  const payload = {
    contents,
    systemInstruction: {
      parts: [
        {
          text: "You are NeuroChat AI, a thoughtful, calm, and intelligent conversation system. The experience is responsive, warm, and quiet — designed to feel as natural as a good chat over coffee. Keep responses clean, helpful, concise, and beautifully structured. Use formatting where appropriate but avoid overly verbose output.",
        },
      ],
    },
  };

  // Try each model sequentially
  for (const modelName of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      console.log(`Attempting AI generation with model: ${modelName}...`);

      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 seconds timeout
      });

      if (
        response.data &&
        response.data.candidates &&
        response.data.candidates[0] &&
        response.data.candidates[0].content &&
        response.data.candidates[0].content.parts &&
        response.data.candidates[0].content.parts[0]
      ) {
        console.log(`Success generating content using model: ${modelName}`);
        return response.data.candidates[0].content.parts[0].text;
      }
    } catch (error) {
      console.warn(`Model ${modelName} failed:`, error.response?.data?.error?.message || error.message);
      
      // If the API key is completely invalid, abort early since no model will work
      const errMessage = error.response?.data?.error?.message || "";
      if (error.response?.status === 400 && errMessage.includes("API key not valid")) {
        console.error("API key is invalid. Aborting model retries.");
        break;
      }
    }
  }

  // All model requests failed (quota exhausted/no billing linked). Serve high-quality offline fallbacks.
  console.warn("All Gemini models failed. Serving offline fallback response.");
  const lowerPrompt = prompt.toLowerCase();

  // Greets (using word boundary regex)
  if (/\b(hi|hello|hey|greetings|yo)\b/i.test(prompt)) {
    return "Hello! I am NeuroChat AI. How can I assist you on this fine day? (Note: Your Google Gemini API key has quota limits active, so I'm replying using this offline fallback!)";
  }

  // Artificial Intelligence
  if (lowerPrompt.includes("artificial intelligence") || lowerPrompt.includes("what is ai")) {
    return "Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think like humans and mimic their actions. These processes include learning, reasoning, and self-correction. (Note: Answering via offline fallback due to Gemini key quota limits!)";
  }

  // Machine Learning
  if (lowerPrompt.includes("machine learning") || lowerPrompt.includes("what is ml")) {
    return "Machine Learning (ML) is a branch of artificial intelligence (AI) focused on building applications that learn from data and improve their accuracy over time without being explicitly programmed. (Note: Answering via offline fallback due to Gemini key quota limits!)";
  }

  // Deep Learning
  if (lowerPrompt.includes("deep learning")) {
    return "Deep Learning is a subset of machine learning based on artificial neural networks with multiple layers. It mimics the human brain's capability to process data and create patterns for use in decision making. (Note: Answering via offline fallback due to Gemini key quota limits!)";
  }

  // Default fallback explanation
  return `I received your query: "${prompt}".

It looks like your Google Gemini API key has exceeded its free tier rate limits (or does not have a Google Cloud Billing account linked). To get real-time AI responses, please verify that your key is active and has billing enabled in the Google Cloud Console.

(For now, you can keep testing. I will continue saving your chats securely to MongoDB!)`;
};
