import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are a helpful, accurate, and versatile AI assistant.
- Answer questions clearly across programming, science, writing, general knowledge, and everyday problem-solving.
- Format your responses using clean Markdown (use headings, bullet points, bold text, and fenced code blocks with language tags when appropriate).
- Be concise for simple questions and thorough for complex ones.`;

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Server configuration error: GEMINI_API_KEY is missing." },
        { status: 500 }
      );
    }

    const { messages } = (await req.json()) as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Message history cannot be empty." },
        { status: 400 }
      );
    }

    // Separate prior conversation history from the latest user prompt
    const latestMessage = messages[messages.length - 1];
    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    const chat = ai.chats.create({
      model: "gemini-3.5-flash-lite",
      history,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });

    const response = await chat.sendMessage({
      message: latestMessage.text,
    });

    return NextResponse.json({
      reply: response.text ?? "No response generated.",
    });
  } catch (error: unknown) {
    console.error("Chat API Error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to communicate with the AI provider.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}