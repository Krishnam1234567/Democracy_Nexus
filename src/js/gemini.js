/**
 * @fileoverview Google Gemini AI integration for the election chatbot.
 * Handles API communication with election-focused system prompts.
 * @module gemini
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { sanitizeInput, createRateLimiter } from './security.js';

/** @type {import('@google/generative-ai').GenerativeModel|null} */
let model = null;

/** @type {import('@google/generative-ai').ChatSession|null} */
let chatSession = null;

/** @type {boolean} */
let initialized = false;

/** Rate limiter: 10 messages per minute */
const rateLimiter = createRateLimiter(10, 60000);

/**
 * System instruction for the Gemini model.
 * Focuses the AI on election education topics.
 * @type {string}
 */
const SYSTEM_INSTRUCTION = `You are an expert Election Education Assistant specializing in Indian democracy and electoral processes. Your role is to educate users about:

1. **Indian Election Process**: Lok Sabha, Vidhan Sabha, Rajya Sabha, Local Body elections, Presidential elections
2. **Election Commission of India (ECI)**: Structure, powers, functions, independence
3. **Voting Process**: EVMs, VVPAT, NOTA, postal ballots, indelible ink, polling procedures
4. **Voter Registration**: EPIC/Voter ID, NVSP portal, Form 6, eligibility criteria
5. **Constitutional Framework**: Articles 324-329, Representation of People Act 1950/1951, Anti-Defection Law
6. **Electoral Reforms**: Campaign finance, MCC, delimitation, one nation one election debate
7. **Election History**: Key elections, landmark judgments, evolution of democracy in India
8. **Comparative Democracy**: How Indian elections compare to other democracies globally

Guidelines:
- Provide accurate, factual, and up-to-date information
- Use simple, easy-to-understand language
- Include relevant statistics, dates, and article references when helpful
- Be politically neutral and non-partisan — never promote any party or candidate
- If asked about topics outside elections/democracy, politely redirect to election topics
- Use examples and analogies to explain complex concepts
- Format responses with bullet points and clear structure when appropriate
- Encourage civic participation and voter awareness
- Mention official sources (ECI website, NVSP portal) when relevant

Respond in a friendly, educational tone. Use simple English. If the user asks in Hindi or another Indian language, try to respond in that language.`;

/**
 * Initializes the Gemini AI model.
 *
 * @returns {boolean} True if initialization was successful.
 */
export function initGemini() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('[Gemini] API key not configured. Chatbot will use fallback responses.');
    return false;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_INSTRUCTION
    });

    // Start a chat session with history
    chatSession = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
        topP: 0.9,
        topK: 40
      }
    });

    initialized = true;
    console.info('[Gemini] AI model initialized successfully.');
    return true;
  } catch (error) {
    console.error('[Gemini] Initialization failed:', error.message);
    return false;
  }
}

/**
 * Sends a message to the Gemini AI and returns the response.
 *
 * @param {string} userMessage - The user's question or message.
 * @returns {Promise<string>} The AI response text.
 * @throws {Error} If rate limited or API fails.
 */
export async function sendMessage(userMessage) {
  // Sanitize input
  const cleanMessage = sanitizeInput(userMessage);

  if (!cleanMessage) {
    return 'Please enter a valid question about elections.';
  }

  // Check rate limit
  if (!rateLimiter.tryCall()) {
    return 'You\'re sending messages too quickly. Please wait a moment and try again.';
  }

  // If Gemini is not initialized, use fallback
  if (!initialized || !chatSession) {
    return getFallbackResponse(cleanMessage);
  }

  try {
    const result = await chatSession.sendMessage(cleanMessage);
    const response = result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      return 'I couldn\'t generate a response. Please try rephrasing your question.';
    }

    return text;
  } catch (error) {
    console.error('[Gemini] API error:', error.message);

    if (error.message.includes('SAFETY')) {
      return 'I can\'t respond to that query. Please ask an election-related question.';
    }

    if (error.message.includes('quota') || error.message.includes('429')) {
      return 'The AI service is currently busy. Please try again in a few moments.';
    }

    return getFallbackResponse(cleanMessage);
  }
}

/**
 * Resets the chat session, clearing conversation history.
 */
export function resetChat() {
  if (model) {
    chatSession = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
        topP: 0.9,
        topK: 40
      }
    });
  }
  rateLimiter.reset();
}

/**
 * Checks if Gemini AI is initialized and ready.
 * @returns {boolean}
 */
export function isGeminiReady() {
  return initialized;
}

/**
 * Provides fallback responses when Gemini API is unavailable.
 * Uses keyword matching to provide relevant election information.
 *
 * @param {string} message - The user's message.
 * @returns {string} A fallback response.
 * @private
 */
function getFallbackResponse(message) {
  const lower = message.toLowerCase();

  const responses = [
    {
      keywords: ['evm', 'electronic voting', 'voting machine'],
      response: '**Electronic Voting Machine (EVM)**\n\nAn EVM is a portable device used in Indian elections since 1982. Key facts:\n\n• Consists of Control Unit + Balloting Unit\n• Runs on a 7.5V battery (no external power needed)\n• Can record up to 2,000 votes\n• Cannot be connected to any network\n• Paired with VVPAT since 2019 for paper verification\n\nEVMs have significantly reduced election fraud, booth capturing, and counting time.'
    },
    {
      keywords: ['nota', 'none of the above', 'reject'],
      response: '**NOTA (None of the Above)**\n\nNOTA was introduced by a Supreme Court order in September 2013. Key points:\n\n• Allows voters to officially reject all candidates\n• Maintains voter secrecy\n• Even if NOTA gets more votes than any candidate, the candidate with most votes still wins\n• Represented by a ballot paper with a cross mark symbol\n• Available in all Lok Sabha and Vidhan Sabha elections'
    },
    {
      keywords: ['register', 'voter id', 'epic', 'enrollment', 'voter registration'],
      response: '**Voter Registration Process**\n\nTo register as a voter in India:\n\n1. Visit https://voters.eci.gov.in/ (NVSP Portal)\n2. Fill Form 6 online or offline\n3. Submit identity & address proof\n4. Provide passport-sized photograph\n5. Your application will be verified by BLO\n6. Once approved, EPIC (Voter ID) will be issued\n\n**Eligibility:** Indian citizen, 18+ years on qualifying date (Jan 1)\n\nYou can also use the Voter Helpline App (VHA) for registration.'
    },
    {
      keywords: ['election process', 'how election', 'steps', 'process work'],
      response: '**Indian Election Process (Lok Sabha)**\n\nThe election follows these key steps:\n\n1. 📢 ECI announces election schedule (MCC kicks in)\n2. 📋 Notification issued for each constituency\n3. ✍️ Candidates file nominations\n4. 🔍 Scrutiny of nominations by Returning Officer\n5. ❌ Withdrawal period for candidates\n6. 📣 Election campaigning (ends 48h before polling)\n7. 🗳️ Polling Day — voting via EVMs\n8. 🔢 Counting of votes\n9. 📊 Results declared\n10. 🏛️ Government formation\n\nExplore our Timeline section for detailed information on each step!'
    },
    {
      keywords: ['vvpat', 'paper trail', 'paper audit'],
      response: '**VVPAT (Voter Verifiable Paper Audit Trail)**\n\nVVPAT is a transparency device attached to EVMs:\n\n• Prints a paper slip showing candidate name & symbol\n• Slip visible through glass window for 7 seconds\n• Falls into sealed box after viewing\n• 5 random VVPAT slips verified per constituency\n• Made mandatory by Supreme Court for all elections\n• Manufactured by ECIL and BEL\n\nVVPAT adds an extra layer of verification to the EVM voting process.'
    },
    {
      keywords: ['model code', 'mcc', 'code of conduct'],
      response: '**Model Code of Conduct (MCC)**\n\nThe MCC is a set of guidelines for elections:\n\n• Comes into effect from announcement of election schedule\n• No new government schemes/policies can be announced\n• No use of government machinery for campaigning\n• No appeals to religion, caste, or community\n• Campaign silence period: 48 hours before polling\n• All campaign expenditure must be tracked\n• Government transfers done to ensure neutrality\n\nWhile not a law, the ECI enforces it using powers under Article 324.'
    },
    {
      keywords: ['constituency', 'lok sabha', 'seats'],
      response: '**Lok Sabha Constituencies**\n\n• Total seats: 543 (directly elected)\n• Distributed among states based on population\n• Uttar Pradesh has the most: 80 seats\n• Each constituency elects ONE representative (single-member)\n• Uses First-Past-The-Post (FPTP) system\n• Boundaries redrawn through delimitation\n\nA candidate just needs the MOST votes (simple plurality) to win — no minimum vote share required.'
    }
  ];

  for (const item of responses) {
    if (item.keywords.some((kw) => lower.includes(kw))) {
      return item.response;
    }
  }

  return '🙏 Thank you for your question!\n\nI\'m currently running in offline mode without AI capabilities. To get the best experience:\n\n1. Configure your Gemini API key in the `.env` file\n2. Explore our **Timeline** section for the election process\n3. Try the **Quiz** to test your knowledge\n4. Check the **Glossary** for election terms\n\nFor official information, visit [Election Commission of India](https://www.eci.gov.in/).';
}
