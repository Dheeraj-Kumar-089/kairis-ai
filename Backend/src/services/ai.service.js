import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage, tool, createAgent } from "langchain"; 
import { ChatMistralAI } from "@langchain/mistralai";
import * as z from "zod";
import { searchInternet } from "./internet.service.js";

import { config } from "../config/config.js";

let currentKeyIndex = 0;
const getNextGeminiApiKey = () => {
    const keys = config.GEMINI_API_KEYS || [];
    if (keys.length === 0) return config.GEMINI_API_KEY || "";
    const key = keys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    return key;
};

const mistralModel = new ChatMistralAI({
  model: "mistral-small-latest",
  apiKey: config.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY
});


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

export async function generateResponse(messages, ragContext = "") {
  // Limit context history to the last 10 messages (5 turns of conversation) to save tokens and prevent rate limit exhaustion
  const maxHistory = 10;
  const historyToUse = messages.slice(-maxHistory);

  const activeApiKey = getNextGeminiApiKey();
  const geminiModel = new ChatGoogleGenerativeAI({
      model: "gemini-3.1-flash-lite",
      apiKey: activeApiKey
  });

  const agent = createAgent({
      model: geminiModel,
      tools: [searchInternetTool],
  });

  const response = await agent.invoke({
        messages: [
            new SystemMessage(`
                You are a helpful and precise assistant for answering questions.
                If you don't know the answer, say you don't know.
                If the question requires up-to-date information, use the "searchInternet" tool to get the latest information from the internet and then answer based on the search results.
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

export async function generateChatTitle(message) {
  const activeApiKey = getNextGeminiApiKey();
  const geminiModel = new ChatGoogleGenerativeAI({
      model: "gemini-3.1-flash-lite",
      apiKey: activeApiKey
  });

  const response = await geminiModel.invoke([
    new SystemMessage(`You are a helpful assistant that generates a concise and descriptive title for chat conversations. 
        User will provide you with the first message of the conversation, and you will generate a title that captures the essence of the conversation in 2-5 words.
        The title should be clear,relevant and engaging, giving user a quick understanding of the chat's topic.`),
    new HumanMessage(`Generate a title for a chat conversation based on the following first message: "${message}"`)
  ]);

  return response.text;
}