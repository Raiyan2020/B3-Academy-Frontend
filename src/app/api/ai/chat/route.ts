import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { message, history = [] } = (await request.json()) as {
    message?: string;
    history?: { role: 'user' | 'model'; text: string }[];
  };

  if (!message?.trim()) {
    return NextResponse.json({ text: '' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      text: "Sorry, I'm having trouble connecting to my brain right now. Please try again later.",
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const contents = [
      ...history.map((item) => ({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.text }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction:
          'You are the B3 Academy Assistant, a helpful and knowledgeable guide for students and visitors of B3 Academy.\n\n' +
          'Follow these rules strictly:\n' +
          '1. Text-only responses: Never output HTML, Markdown links, script blocks, or interactive tags.\n' +
          '2. Scope restriction: You specialize exclusively in information about B3 Academy platform sections, courses, books, botanical sciences, natural therapy, academic research in plants/fungi, and holistic wellness. Politely decline to answer unrelated external subjects.\n' +
          '3. Action blocking: You cannot perform active commands like checkouts, booking appointments, or changing account passwords. Always direct the user to visit the respective pages in the dashboard for these actions.\n' +
          '4. Safety disclaimer: For any query about health symptoms, medical advice, or constitutional assessments, you must include a warning: "This information is educational and constitutional only. It is not a medical diagnosis, description, or treatment plan. Please consult a qualified practitioner."\n' +
          '5. Tone: Be concise, professional, friendly, and answer in the same language as the user.',
        temperature: 0.7,
      },
    });

    return NextResponse.json({
      text: response.text || "I'm sorry, I couldn't process that request.",
    });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({
      text: "Sorry, I'm having trouble connecting to my brain right now. Please try again later.",
    });
  }
}
