import { GoogleGenAI, Content } from "@google/genai";
import { UploadedFile, Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Sends a message to Gemini, including the conversation history and the
 * content of uploaded files as System Instructions (Context Stuffing RAG).
 */
export const sendMessageToGemini = async (
  currentMessage: string,
  history: Message[],
  files: UploadedFile[]
): Promise<string> => {
  try {
    let contextPrompt = "";
    if (files.length > 0) {
      contextPrompt = files.map(f => `--- DOCUMENT: ${f.name} ---\n${f.content}\n--- END DOCUMENT ---\n`).join("\n");
    } else {
      contextPrompt = "Нет загруженных документов.";
    }

    const systemInstruction = `
Вы — интеллектуальный RAG-ассистент (Retrieval-Augmented Generation).
Ваша задача — отвечать на вопросы пользователя, основываясь ИСКЛЮЧИТЕЛЬНО на предоставленных ниже документах.

ПРАВИЛА:
1. Используйте ТОЛЬКО информацию из раздела "КОНТЕКСТ ДОКУМЕНТОВ" для ответа.
2. Если ответ не содержится в документах, вежливо ответьте: "К сожалению, в предоставленных документах нет информации для ответа на этот вопрос."
3. Не выдумывайте факты. Не используйте внешние знания, если они не подтверждены документами.
4. Отвечайте на языке пользователя (преимущественно на русском).
5. При цитировании, ссылайтесь на название документа, если это уместно.

КОНТЕКСТ ДОКУМЕНТОВ:
${contextPrompt}
`;

    const contents: Content[] = history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    contents.push({
      role: 'user',
      parts: [{ text: currentMessage }],
    });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3, 
      },
    });

    return response.text || "Нет ответа от модели.";

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Ошибка при обращении к Gemini API");
  }
};

/**
 * Generates a quiz based on the provided files.
 * Returns a JSON string representing the quiz.
 */
export const generateQuiz = async (
  files: UploadedFile[],
  topic: string,
  difficulty: string,
  questionCount: number
): Promise<any[]> => {
  try {
     let contextPrompt = "";
    if (files.length > 0) {
      contextPrompt = files.map(f => `--- DOCUMENT: ${f.name} ---\n${f.content}\n--- END DOCUMENT ---\n`).join("\n");
    } else {
      throw new Error("Нет документов для создания теста.");
    }

    const prompt = `
Создай тест (quiz) на основе предоставленных документов.
Тема: ${topic || 'Общая по документам'}
Сложность: ${difficulty}
Количество вопросов: ${questionCount}

Требования к формату:
Верни ТОЛЬКО валидный JSON массив объектов. Без markdown форматирования (без \`\`\`json).
Каждый объект должен иметь структуру:
{
  "question": "Текст вопроса",
  "options": ["Вариант А", "Вариант Б", "Вариант В", "Вариант Г"],
  "correctIndex": 0 // Индекс правильного ответа (0-3)
}

КОНТЕКСТ ДОКУМЕНТОВ:
${contextPrompt}
`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.5,
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty response");

    // Clean up if model adds markdown despite instructions (redundancy check)
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);

  } catch (error: any) {
    console.error("Quiz Generation Error:", error);
    throw new Error("Не удалось создать тест: " + error.message);
  }
};
