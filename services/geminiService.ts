// FIX: Import the 'Chat' type from '@google/genai' to resolve the type error.
import { GoogleGenAI, GenerateContentResponse, Type, Chat } from "@google/genai";
import { AttritionRiskResult, ChatMessage, LeaveRequest, Question, User } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Centralized chat instances
let generalChat: Chat | null = null;
let onboardingChat: Chat | null = null;


const getGeneralChat = (user: User) => {
    if (!generalChat) {
         let systemInstruction = `You are TRUBank's premier AI HR Assistant, designed to provide expert-level support.

**Your Persona:**
- **Professional & Friendly:** Maintain a helpful, polite, and professional tone at all times.
- **Data-Driven:** Base your answers on the context provided. If no context is given for a data-heavy question, state that you need the relevant data to answer accurately.
- **Concise & Clear:** Provide answers that are easy to understand. Use markdown like lists and bold text to improve readability.
- **Secure & Confidential:** Never invent personal employee data or sensitive information. Do not provide financial advice or personal opinions.

**Core Capabilities:**
1.  **General HR Queries:** Answer questions about standard company policies (e.g., "What is the vacation policy?", "Explain the dress code.").
2.  **Contextual Data Analysis:** When you receive a user prompt that includes a '[CONTEXT BLOCK]', you MUST use that data to perform advanced analysis. Always preface your analysis with a phrase like "Based on the provided data...".

**Your Analytical Functions (Activated by a [CONTEXT BLOCK]):**
- **Leave Analysis & Forecasting:** Analyze leave request data to identify scheduling conflicts, periods of high team absence, and departmental trends. Provide actionable insights for planning.
- **Sentiment Analysis:** Analyze anonymous employee feedback to determine overall sentiment (Positive, Negative, Neutral) and summarize key themes, concerns, or praises.
- **Exam Performance Analysis:** Analyze exam result summaries to identify overall pass rates, average scores, and exams with low performance.
- **Attrition Risk Analysis:** Analyze employee data points like recent sick leave, failed exams, and login activity to identify potential attrition risks. Provide a summary of employees who show risk factors and explain the reasoning based on the provided data.
- **Personal Data Queries:** Answer questions about a user's own data, such as their leave balance or exam history.`;

        if (user.role === 'Admin') {
            systemInstruction += `

**Admin Role Directives:**
- **Access Level:** You are assisting an Admin user, ${user.name}. They have full access to all HR data.
- **Scope:** Provide company-wide insights by default. If the admin asks about a specific department, narrow your focus accordingly.
- **Example Tasks:** You can answer "Forecast leave conflicts for the Engineering department next month", "Summarize the sentiment from the latest company feedback", "Analyze our overall exam pass rates", or "Identify employees at high risk of attrition".`;
        } else if (user.role === 'Employee') {
            systemInstruction += `

**Employee Role Directives:**
- **Access Level:** You are assisting an Employee, ${user.name}, from the '${user.department}' department.
- **Scope:** Your access is limited. You MUST scope your answers to the user's personal data or their department's data. Do not reveal information about other departments or employees.
- **Example Tasks:** You can answer "Are there any conflicts with my upcoming leave request?", "What's the general leave situation in the ${user.department} department for the next quarter?", "How many vacation days do I have left?", or "Did I pass my last exam?".`;
        }
        
        generalChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction,
            },
        });
    }
    return generalChat;
};

export const clearChatHistory = () => {
    generalChat = null;
};


export const streamChat = (message: string, user: User) => {
    const chat = getGeneralChat(user);
    return chat.sendMessageStream({ message });
};

export const getLeaveAnalysis = async (requests: LeaveRequest[], userName: string): Promise<string> => {
    const systemInstruction = `You are an AI HR analyst. Your task is to analyze a list of employee leave requests and provide a concise summary of potential scheduling conflicts or periods of high team absence.
    The user asking for the analysis is '${userName}'.
    Focus on providing helpful insights for planning future leave.
    Keep the response brief, friendly, and use markdown bullet points for key observations. Do not include a greeting like "Hello" or a sign-off.
    Analyze the data for the next 6 months from today's date, which is ${new Date().toLocaleDateString()}.
    Highlight periods where more than two team members are on overlapping leave.`;

    // We only need some fields to not exceed token limits and for privacy
    const simplifiedRequests = requests.map(({ userName, leaveType, startDate, endDate }) => ({ userName, leaveType, startDate, endDate }));

    const prompt = `Here is the list of approved and pending leave requests in JSON format: ${JSON.stringify(simplifiedRequests)}. Please analyze this data and identify any potential leave conflicts or busy periods for me, ${userName}.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating leave analysis:", error);
        throw new Error("Failed to generate leave forecast from AI.");
    }
};

export const getLeaveTrendAnalysis = async (data: { month: string; vacationDays: number; sickDays: number; }[]): Promise<string> => {
    const systemInstruction = `You are an expert AI HR analyst. Your task is to analyze monthly leave data for an HR manager.
    The data shows the total number of approved 'vacationDays' and 'sickDays' for each month.
    Your analysis should be concise, insightful, and presented in markdown bullet points.
    - Identify any notable trends (e.g., increasing sick leave).
    - Point out seasonal peaks for vacation requests.
    - Highlight months with unusually high leave that might impact productivity.
    - If sick leave is high, suggest potential concerns like burnout without being alarmist.
    - Keep the tone professional and data-driven.
    - Do not include a greeting or sign-off.
    Today's date is ${new Date().toLocaleDateString()}.`;

    const prompt = `Please analyze the following leave trend data and provide a summary of your findings:\n\n${JSON.stringify(data)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating leave trend analysis:", error);
        throw new Error("Failed to generate leave trend analysis from AI.");
    }
};


const getOnboardingChat = () => {
    if (!onboardingChat) {
        const onboardingSystemInstruction = `You are TRUBank's friendly and helpful AI Onboarding Assistant. 
        Your role is to assist newly approved applicants with their questions about the onboarding process.
        Common topics include required documentation (like I-9 forms, direct deposit forms), company culture, dress code, what to expect on the first day, and who their point of contact is.
        Provide encouraging, clear, and concise answers. Maintain a positive and welcoming tone.
        Do not answer questions outside the scope of onboarding. If asked an unrelated question, politely steer the conversation back to onboarding topics.
        Start the conversation by congratulating the user on their successful application and offering to help with any onboarding questions.
        `;

        onboardingChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: onboardingSystemInstruction,
            },
        });
    }
    return onboardingChat;
};


export const streamOnboardingChat = (message: string) => {
    const chat = getOnboardingChat();
    return chat.sendMessageStream({ message });
};

export const generateExamQuestions = async (topic: string, numberOfQuestions: number): Promise<Omit<Question, 'id'>[]> => {
    const systemInstruction = `You are an AI assistant specialized in creating educational content. Your task is to generate a series of multiple-choice questions based on a given topic.
    - Each question must have exactly 4 options.
    - One of these options must be the correct answer.
    - The questions should be clear, concise, and relevant to the topic.
    - The output must be a valid JSON array of objects, conforming to the provided schema.`;

    const prompt = `Please generate ${numberOfQuestions} multiple-choice questions about the following topic: "${topic}".`;

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                text: { type: Type.STRING },
                options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                },
                correctAnswerIndex: { type: Type.INTEGER },
            },
            required: ["text", "options", "correctAnswerIndex"],
        },
    };
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema,
            },
        });

        const jsonText = response.text.trim();
        const generatedQuestions = JSON.parse(jsonText);

        // Basic validation
        if (!Array.isArray(generatedQuestions)) {
            throw new Error("AI response is not an array.");
        }

        return generatedQuestions.map((q: any) => ({
            text: q.text || "",
            options: q.options || [],
            correctAnswerIndex: q.correctAnswerIndex ?? 0,
        }));

    } catch (error) {
        console.error("Error generating exam questions:", error);
        throw new Error("Failed to generate exam questions from AI.");
    }
};

export const extractQuestionsFromPdf = async (pdfBase64: string): Promise<Omit<Question, 'id'>[]> => {
    const systemInstruction = `You are an AI assistant specialized in extracting educational content from documents. 
    Your task is to analyze the provided PDF file and extract all multiple-choice questions.
    - Each question must have a question text, a set of options, and a clear indication of the correct answer.
    - If the PDF contains questions with varying numbers of options, try to find the correct number of options for each question.
    - The output must be a valid JSON array of objects, conforming to the provided schema.
    - If no questions are found, return an empty array.`;

    const prompt = "Please extract the multiple-choice questions from this PDF.";

    const pdfPart = {
        inlineData: {
            mimeType: 'application/pdf',
            data: pdfBase64,
        },
    };

    const textPart = {
        text: prompt
    };

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                text: { type: Type.STRING },
                options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                },
                correctAnswerIndex: { type: Type.INTEGER },
            },
            required: ["text", "options", "correctAnswerIndex"],
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [pdfPart, textPart] },
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema,
            },
        });

        const jsonText = response.text.trim();
        const generatedQuestions = JSON.parse(jsonText);

        if (!Array.isArray(generatedQuestions)) {
            throw new Error("AI response is not an array.");
        }
        
        return generatedQuestions.map((q: any) => ({
            text: q.text || "",
            options: Array.isArray(q.options) ? q.options : [],
            correctAnswerIndex: q.correctAnswerIndex ?? 0,
        }));

    } catch (error) {
        console.error("Error extracting questions from PDF:", error);
        throw new Error("Failed to extract questions from PDF using AI.");
    }
};

export const analyzeWebcamFrame = async (base64ImageData: string): Promise<{ isViolation: boolean; reason: string }> => {
    const systemInstruction = `You are an AI proctor for an online exam. Analyze the user's webcam image for potential cheating.
    Your response must be in JSON format and conform to the provided schema.
    
    Rules to check for:
    1.  **Multiple People**: Is there more than one person clearly visible?
    2.  **User Absent**: Is the primary user not in the frame or completely obscured?
    3.  **Looking Away**: Is the user clearly looking away from the screen (e.g., to the side or down at a lap) for an extended period? A quick glance is not a violation.
    4.  **Prohibited Items**: Is the user holding or looking at a phone, book, or other unauthorized materials?
    
    If any rule is broken, set 'isViolation' to true and provide a concise 'reason'.
    If all rules are followed, set 'isViolation' to false and 'reason' to 'Secure'. Be strict but fair.`;

    const prompt = "Analyze this webcam frame from an online exam for violations.";
    
    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64ImageData,
        },
    };
    
    const textPart = { text: prompt };

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            isViolation: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
        },
        required: ["isViolation", "reason"],
    };
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, textPart] },
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema,
            },
        });

        const jsonText = response.text.trim();
        const analysisResult = JSON.parse(jsonText);
        
        return {
            isViolation: analysisResult.isViolation || false,
            reason: analysisResult.reason || 'No specific reason provided.',
        };

    } catch (error) {
        console.error("Error analyzing webcam frame:", error);
        // Default to a non-violating state if the AI fails, to avoid penalizing users for technical issues.
        return { isViolation: false, reason: "Analysis failed." };
    }
};

export const getAttritionRiskAnalysis = async (users: User[], allLeaveRequests: LeaveRequest[]): Promise<AttritionRiskResult[]> => {
    const systemInstruction = `You are an expert AI HR analyst specializing in predictive analytics. Your task is to identify employees who may be at risk of attrition (leaving the company). 
    Analyze the provided JSON data, which contains employee profiles, their leave history, and exam results.
    
    Look for patterns that could indicate dissatisfaction or disengagement, such as:
    - A recent increase in sick leave compared to their historical average.
    - Recently failed exams, especially if they previously had a good record.
    - Long periods since their last login, indicating low engagement.
    - A combination of the above factors.
    
    Your response must be a valid JSON array of objects, conforming to the provided schema. For each identified employee at risk, provide their userId, a riskLevel ('High', 'Medium', 'or 'Low'), a quantitative riskScore (0.0 to 1.0), and a concise reason for the flag.
    
    Focus only on employees with a status of 'Active'. Do not flag employees for taking normal vacation leave. Be objective and base your analysis strictly on the data provided. If no employees show significant risk factors, return an empty array.
    `;

    // Create a simplified data structure for the model
    const analysisData = users
        .filter(u => u.role === 'Employee' && u.status === 'Active')
        .map(user => {
            const userLeave = allLeaveRequests.filter(r => r.userId === user.id);
            const recentSickLeave = userLeave.filter(r => r.leaveType === 'Sick Leave' && new Date(r.startDate) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)).length; // Sick leaves in last 90 days
            const recentFailedExams = user.examHistory.filter(e => e.status === 'Failed' && new Date(e.date) > new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)).length; // Failed exams in last 180 days

            return {
                userId: user.id,
                department: user.department,
                lastLogin: user.lastLogin,
                totalSickDays: user.leaveBalances.sick,
                recentSickLeaveCountLast90Days: recentSickLeave,
                recentFailedExamCountLast180Days: recentFailedExams,
            };
    });

    const prompt = `Please analyze the following employee data and identify potential attrition risks. Today's date is ${new Date().toISOString()}:\n\n${JSON.stringify(analysisData, null, 2)}`;

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                userId: { type: Type.INTEGER },
                riskLevel: { type: Type.STRING },
                reason: { type: Type.STRING },
                riskScore: { type: Type.NUMBER },
            },
            required: ["userId", "riskLevel", "reason", "riskScore"],
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const results = JSON.parse(jsonText) as AttritionRiskResult[];
        
        // Sort by risk score descending
        return results.sort((a, b) => b.riskScore - a.riskScore);

    } catch (error) {
        console.error("Error generating attrition risk analysis:", error);
        throw new Error("Failed to generate attrition risk analysis from AI.");
    }
};