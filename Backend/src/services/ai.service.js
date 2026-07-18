import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage, tool, createAgent } from "langchain"; 
import { ChatMistralAI } from "@langchain/mistralai";
import * as z from "zod";
import { searchInternet } from "./internet.service.js";

import { ChatGroq } from "@langchain/groq";
import { config } from "../config/config.js";

let currentKeyIndex = 0;
const getNextGeminiApiKey = () => {
    const keys = config.GEMINI_API_KEYS || [];
    if (keys.length === 0) return config.GEMINI_API_KEY || "";
    const key = keys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    return key;
};

const getModel = (modelType) => {
    if (modelType === "gemini") {
        return new ChatGoogleGenerativeAI({
            model: "gemini-3.1-flash-lite",
            apiKey: getNextGeminiApiKey()
        });
    } else if (modelType === "mistral") {
        return new ChatMistralAI({
            model: "mistral-small-latest",
            apiKey: config.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY
        });
    } else if (modelType === "llama") {
        if (!config.GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY is not configured for Llama 3 fallback");
        }
        return new ChatGroq({
            model: "llama-3.1-8b-instant",
            apiKey: config.GROQ_API_KEY
        });
    }
    throw new Error(`Unsupported model type: ${modelType}`);
};

const searchInternetTool = tool(
  searchInternet,
  {
    name: "searchInternet",
    description: "Use this tool to get the latest information from the internet.",
    schema: z.object({
      query: z.string().describe("The search query to look up on the internet.")
    })
  }
);

export async function generateResponse(messages, ragContext = "", chatSummary = "", modelType = "gemini") {
  // Limit context history to the last 10 messages (5 turns of conversation) to save tokens and prevent rate limit exhaustion
  const maxHistory = 10;
  const historyToUse = messages.slice(-maxHistory);

  const activeModel = getModel(modelType);

  const agent = createAgent({
      model: activeModel,
      tools: [searchInternetTool],
  });

  const response = await agent.invoke({
        messages: [
            new SystemMessage(`
                You are a helpful and precise assistant for answering questions.
                If you don't know the answer, say you don't know.
                If the question requires up-to-date information, use the "searchInternet" tool to get the latest information from the internet and then answer based on the search results.
                
                ${chatSummary ? `
                Here is a summary of the older messages in this conversation:
                ${chatSummary}
                ` : ""}
                
                ${ragContext ? `
                The user has uploaded documents. The following excerpts from those documents are the most relevant to the current question. Prefer this context when answering, and mention the source filename when you use it:
                ${ragContext}` : ""}
            `),
            ...(historyToUse.map(msg => {
                if (msg.role == "user") {
                    return new HumanMessage(msg.content)
                } else if (msg.role == "ai") {
                    return new AIMessage(msg.content)
                }
            })) ]
    });

  return response.messages[response.messages.length-1].text;  
}

export async function generateSummary(existingSummary = "", messages = []) {
  const activeModel = getModel("gemini");

  const historyText = messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

  const prompt = `
      You are an expert secretary. Summarize the core topics and decisions of the conversation below in 3 to 5 paragraphs.
      
      ${existingSummary ? `Here is the summary of the conversation so far:
      ${existingSummary}
      
      Please incorporate the new messages into this summary.` : "This is the start of the conversation. Create a new summary."}
      
      New conversation history to incorporate:
      ${historyText}
      
      Return only the summary text. Do not include any introductory or concluding remarks.
  `;

  try {
      const response = await activeModel.invoke([
          new SystemMessage("You generate clear, concise, and structured summaries of chat histories."),
          new HumanMessage(prompt)
      ]);
      return response.text;
  } catch (err) {
      console.error("Failed to generate summary with Gemini, trying Mistral:", err.message);
      try {
          const mistral = getModel("mistral");
          const response = await mistral.invoke([
              new SystemMessage("You generate clear, concise, and structured summaries of chat histories."),
              new HumanMessage(prompt)
          ]);
          return response.text;
      } catch (mErr) {
          console.error("Failed to generate summary with Mistral:", mErr.message);
          return existingSummary; // Return existing if everything fails
      }
  }
}

export async function generateChatTitle(message) {
  const geminiModel = getModel("gemini");

  const response = await geminiModel.invoke([
    new SystemMessage(`You are a helpful assistant that generates a concise and descriptive title for chat conversations. 
        User will provide you with the first message of the conversation, and you will generate a title that captures the essence of the conversation in 2-5 words.
        The title should be clear,relevant and engaging, giving user a quick understanding of the chat's topic.`),
    new HumanMessage(`Generate a title for a chat conversation based on the following first message: "${message}"`)
  ]);

  return response.text;
}