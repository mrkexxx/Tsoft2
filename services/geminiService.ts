import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedPrompt, ImageStyle, YouTubeSeoResult } from '../types';

const getAiClient = () => {
    const apiKey = localStorage.getItem('gemini-api-key');
    if (!apiKey) {
        throw new Error("API Key không được tìm thấy. Vui lòng thiết lập API Key để sử dụng công cụ.");
    }
    return new GoogleGenAI({ apiKey });
};

const getStyleInstruction = (style: ImageStyle): string => {
  switch (style) {
    case ImageStyle.CINEMATIC:
      return 'cinematic style, dramatic lighting, hyperrealistic, 8k, movie still, 16:9 aspect ratio';
    case ImageStyle.ANIMATION:
      return 'vibrant 3D animation style, Pixar inspired, detailed characters, colorful, 16:9 aspect ratio';
    case ImageStyle.INK_WASH:
      return 'Chinese ink wash painting style, minimalist, elegant brushstrokes, traditional art, high contrast, 16:9 aspect ratio';
    case ImageStyle.VIETNAMESE_ANTIQUE:
      return 'Vietnamese antique art style, reminiscent of Nguyen dynasty woodblock prints and lacquer paintings (sơn mài), traditional color palette, detailed cultural attire (like áo dài) and architecture, 16:9 aspect ratio';
    case ImageStyle.STICK_FIGURE:
        return 'simple stick figure drawing style, minimalist, black and white, clean lines, expressive poses, on a plain white background, 16:9 aspect ratio';
    default:
      return '';
  }
};

export const generatePromptsFromScript = async (
  script: string,
  numberOfPrompts: number,
  style: ImageStyle,
  duration: number,
): Promise<GeneratedPrompt[]> => {
  const ai = getAiClient();
  try {
    const styleInstruction = getStyleInstruction(style);
    
    const systemInstruction = `You are an expert prompt engineer for AI multimedia generation. Your task is to analyze a VIETNAMESE script and break it down into timed segments, then generate detailed prompts in ENGLISH for both image and video generation. The total script duration is approximately ${duration} minutes.

    **CRITICAL Instructions:**
    1.  **Analyze Characters & Context FIRST:** Before generating any prompts, you MUST read the entire script to identify:
        a.  All distinct characters. For each character, create a detailed and consistent physical description (e.g., "Linh, a 25-year-old woman with shoulder-length black hair, often seen in a simple white t-shirt and jeans, carrying a leather backpack").
        b.  The overall time period and setting (e.g., "1990s Hanoi," "futuristic Ho Chi Minh City," "rural Vietnamese village").
    2.  **Ensure Consistency:** You MUST reuse the exact same character descriptions and adhere to the identified setting in ALL relevant prompts to maintain visual continuity.
    3.  **Time Segmentation:** Divide the script into exactly ${numberOfPrompts} sequential segments.
    4.  **Output per Segment:** For each segment, generate FOUR pieces of information:
        a.  **sceneName:** "Phân cảnh [Number] ([Start Time]s - [End Time]s)".
        b.  **sceneDescription:** A concise summary in VIETNAMESE.
        c.  **imagePrompt:** A highly detailed description in ENGLISH for a STATIC image. Incorporate the character descriptions and setting details you identified.
        d.  **videoPrompt:** A description in ENGLISH of the ACTION and MOVEMENT.
    5.  **Integrate Style:** Both prompts MUST seamlessly incorporate: "${styleInstruction}".
    6.  **Language:** sceneName/sceneDescription = VIETNAMESE. imagePrompt/videoPrompt = ENGLISH.
    7.  **Numbering:** Both the 'imagePrompt' and 'videoPrompt' fields MUST start with their corresponding segment number, followed by a period and a space (e.g., "1. ...", "2. ...", etc.).

    Analyze the user's script and provide the JSON output.`;

    const userContent = `
    Please generate the image and video prompts based on this script:
    ---
    ${script}
    ---
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userContent,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sceneName: {
                type: Type.STRING,
                description: 'The name for the scene, including time code, in Vietnamese. Format: "Phân cảnh [Number] ([Start Time]s - [End Time]s)".',
              },
              sceneDescription: {
                type: Type.STRING,
                description: 'A concise summary in VIETNAMESE of what happens in this scene.',
              },
              imagePrompt: {
                type: Type.STRING,
                description: 'The final, complete, detailed visual prompt for a STATIC IMAGE in ENGLISH, MUST be prefixed with its sequential number (e.g., "1. [prompt text]"). It includes character descriptions and style elements.',
              },
              videoPrompt: {
                type: Type.STRING,
                description: 'The final, complete, detailed prompt for a VIDEO, describing MOTION and CAMERA MOVEMENT in ENGLISH, MUST be prefixed with its sequential number (e.g., "1. [prompt text]"). It includes character descriptions and style elements.'
              }
            },
            required: ['sceneName', 'sceneDescription', 'imagePrompt', 'videoPrompt']
          },
        },
      },
    });

    const parsedResponse: GeneratedPrompt[] = JSON.parse(response.text);

    if (!parsedResponse || parsedResponse.length === 0) {
      throw new Error("Không thể tạo lời nhắc từ kịch bản.");
    }
    
    return parsedResponse;
    
  } catch (error) {
    console.error("Lỗi khi tạo prompts:", error);
    if (error instanceof Error) {
        throw new Error(`Đã xảy ra lỗi: ${error.message}`);
    }
    throw new Error("Đã xảy ra lỗi không xác định trong quá trình tạo prompt.");
  }
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
  const ai = getAiClient();
  try {
    const enhancedPrompt = `4K, ultra high definition, cinematic quality, ${prompt}, no text, no words, no letters, textless`;
    
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: enhancedPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '16:9',
      },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("AI không thể tạo ảnh từ prompt được cung cấp.");
    }

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error("Lỗi khi tạo ảnh:", error);
    if (error instanceof Error) {
        throw new Error(`Không thể tạo ảnh: ${error.message}`);
    }
    throw new Error("Đã xảy ra lỗi không xác định trong quá trình tạo ảnh.");
  }
};

export const generateThumbnailPromptFromImage = async (
  imageBase64: string,
  mimeType: string,
  removeText: boolean
): Promise<string> => {
  const ai = getAiClient();
  try {
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };

    const textInstruction = `
      Analyze the provided image in extreme detail. Deconstruct its style, subject matter, composition, color palette, lighting, and overall mood. 
      Your task is to create a highly descriptive and effective prompt in ENGLISH for an image generation AI like Imagen to replicate a similar image for a YouTube thumbnail.
      
      **CRITICAL INSTRUCTIONS:**
      1.  **Be Specific:** Instead of "a man", describe "a young man in his late 20s with short-cropped brown hair, wearing a navy blue hoodie".
      2.  **Describe Style:** Is it a photograph, digital art, a vector illustration, a cartoon? Is the style photorealistic, hyperrealistic, cinematic, flat design, etc.?
      3.  **Describe Composition:** Where are the main subjects located? Is it a close-up, a wide shot, a medium shot? What is the camera angle? (e.g., "eye-level shot", "low-angle shot").
      4.  **Describe Lighting:** Is the lighting soft, harsh, dramatic, cinematic, coming from a specific direction?
      5.  **Describe Color:** What are the dominant colors? Is the color palette vibrant, muted, monochromatic, pastel?
      ${removeText 
        ? "6.  **TEXT EXCLUSION (MANDATORY):** The user wants to EXCLUDE any text, words, or letters from the generated image. Your prompt MUST include the phrase: ', no text, textless, no words, no letters' at the end."
        : "6.  **TEXT INCLUSION (If applicable):** If the original image has prominent text, describe its style (e.g., 'bold, white, sans-serif font'), its content (if it seems generic like 'NEWS' or 'UPDATE'), and its placement. If the text is not a key element, you can ignore it."
      }
      7. **Final Prompt:** Combine all these elements into a single, cohesive paragraph in English. This is the only thing you should output. Do not add any preamble like "Here is your prompt:". The prompt must be optimized for generating a 16:9 aspect ratio image.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, { text: textInstruction }] },
    });

    return response.text.trim();
  } catch (error) {
    console.error("Lỗi khi tạo prompt từ ảnh:", error);
    if (error instanceof Error) {
        throw new Error(`Không thể tạo prompt từ ảnh: ${error.message}`);
    }
    throw new Error("Đã xảy ra lỗi không xác định trong quá trình phân tích ảnh.");
  }
};

export const refineThumbnailPrompt = async (
  originalPrompt: string,
  instruction: string
): Promise<string> => {
  const ai = getAiClient();
  try {
    const systemInstruction = `You are an expert prompt engineer for an image generation AI. Your task is to refine the user's existing prompt based on their specific instructions.
    
    **CRITICAL INSTRUCTIONS:**
    1.  Analyze the 'ORIGINAL PROMPT'.
    2.  Analyze the 'REFINEMENT INSTRUCTION'.
    3.  Integrate the instruction into the original prompt to create a new, improved prompt.
    4.  The new prompt should be a single, cohesive paragraph in ENGLISH.
    5.  Output ONLY the final refined prompt. Do not add any preamble like "Here is the refined prompt:".`;

    const userContent = `
    **ORIGINAL PROMPT:**
    ---
    ${originalPrompt}
    ---

    **REFINEMENT INSTRUCTION:**
    ---
    ${instruction}
    ---

    Please provide the refined prompt based on the instructions.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userContent,
      config: {
        systemInstruction,
      },
    });

    return response.text.trim();

  } catch (error) {
    console.error("Lỗi khi chỉnh sửa prompt:", error);
    if (error instanceof Error) {
        throw new Error(`Không thể chỉnh sửa prompt: ${error.message}`);
    }
    throw new Error("Đã xảy ra lỗi không xác định trong quá trình chỉnh sửa prompt.");
  }
};

export const identifyCharactersFromScript = async (script: string): Promise<{ name: string; prompt: string }[]> => {
  const ai = getAiClient();
  try {
    const systemInstruction = `You are an expert character designer and cultural anthropologist for generative AI. Your task is to analyze a VIETNAMESE script and create a definitive, detailed, and culturally accurate "character sheet" prompt in ENGLISH for each character. This description will be FIXED and used for all subsequent media generation.

    **CRITICAL INSTRUCTIONS & ANALYSIS PROCESS:**

    1.  **Deep Contextual Analysis (Mandatory First Step):** Before describing any character, you MUST analyze the entire script. Look for clues like:
        *   **Names:** (e.g., 'Nguyễn' suggests Vietnamese, 'John' suggests Western, 'Kenji' suggests Japanese).
        *   **Locations:** (e.g., mentions of Hanoi, Paris, Tokyo).
        *   **Cultural References:** (e.g., Tết holiday, Thanksgiving, specific foods or traditions).
    2.  **Infer Nationality/Ethnicity:** Based on your analysis, you MUST infer the character's most likely nationality or ethnicity. This inference is the foundation for their entire description.
    3.  **Construct the Character Prompt:** For each character identified, construct a single, comprehensive paragraph in ENGLISH. This prompt MUST be directly informed by the inferred nationality and include the following, ensuring cultural accuracy:
        a.  **Age & Inferred Nationality:** Specify their age and the nationality you deduced.
        b.  **Culturally-Appropriate Features:** Describe their face shape, eyes, hair, and typical skin tone. **This is crucial.** The features must be consistent with their inferred ethnicity. For example, a character inferred to be Vietnamese should be described with features common to that ethnicity, unless the script explicitly states otherwise.
        c.  **Outfit:** Describe their typical clothing. If the context suggests it, include culturally specific attire (e.g., áo dài for a Vietnamese character in a formal setting).
        d.  **Personality:** Briefly describe their core personality.
        e.  **Accessories:** Detail any signature accessories they carry or wear.

    **FINAL OUTPUT FORMAT:**
    Your final output MUST be a JSON array of objects. Each object must contain two fields: "name" (the character's name in Vietnamese) and "prompt" (the final, combined, culturally-accurate description in English).

    **Example Output:**
    [
      {
        "name": "Hùng",
        "prompt": "Hùng, a 35-year-old Vietnamese man with a rugged face, sharp jawline, and short black hair. He typically wears a worn-out brown leather jacket, a simple grey t-shirt, and dark jeans, reflecting his serious and protective personality. He is never seen without his old silver locket."
      },
      {
        "name": "John",
        "prompt": "John, a 28-year-old American man with wavy brown hair, blue eyes, and a light complexion with a few freckles. He has a friendly and open personality, often seen in a casual plaid shirt and denim jeans. He always wears a silver watch on his left wrist."
      }
    ]`;
    
    const userContent = `
    Please analyze this script and generate the character descriptions in the specified JSON format:
    ---
    ${script}
    ---
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userContent,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: 'The name of the character as it appears in the script (Vietnamese).',
              },
              prompt: {
                type: Type.STRING,
                description: 'A detailed visual description of the character in English, following the 5-step process.',
              },
            },
            required: ['name', 'prompt'],
          },
        },
      },
    });

    const parsedResponse: { name: string; prompt: string }[] = JSON.parse(response.text);

    if (!parsedResponse) {
      return [];
    }
    
    return parsedResponse;

  } catch (error) {
    console.error("Lỗi khi xác định nhân vật:", error);
    if (error instanceof Error) {
        throw new Error(`Đã xảy ra lỗi: ${error.message}`);
    }
    throw new Error("Đã xảy ra lỗi không xác định trong quá trình xác định nhân vật.");
  }
};


export const generateAnimationScenes = async (
  script: string,
  characters: { name: string; prompt: string }[],
  durationMinutes: number,
  durationSeconds: number,
  style: 'Điện ảnh' | 'Hoạt hình 3D',
  language: 'Tiếng Việt' | 'Tiếng Anh'
): Promise<any[]> => {
  const ai = getAiClient();
  try {
    const characterDefinitions = characters.map(c => `- ${c.name}: ${c.prompt}`).join('\n');
    const totalSeconds = durationMinutes * 60 + durationSeconds;
    const numberOfScenes = Math.max(1, Math.round(totalSeconds / 8));
    const totalMinutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;

    const mainEventsLanguage = language === 'Tiếng Việt' ? 'VIETNAMESE' : 'ENGLISH';
    const sceneNameLanguage = language === 'Tiếng Việt' ? 'VIETNAMESE' : 'ENGLISH';
    const sceneNameFormat = language === 'Tiếng Việt' 
        ? '"Phân Cảnh [Number] ([Start Time]s - [End Time]s)"' 
        : '"Scene [Number] ([Start Time]s - [End Time]s)"';
    const mainEventsInstruction = language === 'Tiếng Việt'
        ? 'A concise summary of the key actions and events in the scene, written in VIETNAMESE.'
        : 'A concise summary of the key actions and events in the scene, written in ENGLISH.';

    const systemInstruction = `You are an expert animation film producer. Your task is to process a script, a list of predefined character descriptions, a style, and a total duration to create a detailed scene breakdown for a film. The script's dialogue language is ${mainEventsLanguage}.

    **CRITICAL Instructions:**
    1.  **Adhere to Character Prompts:** You are given a definitive list of characters and their detailed descriptions. These are FIXED.
    2.  **Time Segmentation:** The total video duration is ${totalMinutes} minutes and ${remainingSeconds} seconds. You must divide the script into exactly ${numberOfScenes} sequential scenes. Each scene represents an 8-second segment of the video.
    3.  **Visual Style:** All prompts MUST be tailored to a **${style}** style.
        - If 'Điện ảnh' (Cinematic), think cinematic lighting, realistic textures, shallow depth of field, and dramatic camera angles.
        - If 'Hoạt hình 3D' (3D Animation), think vibrant colors, stylized characters, fluid motion, and dynamic camera work inspired by modern animation studios like Pixar or Dreamworks.
    4.  **Output Format & Language:** For each scene, you must generate a JSON object with the following fields:
        a.  **sceneName (string):** A descriptive name for the scene in ${sceneNameLanguage}, including the time code. Format: ${sceneNameFormat}.
        b.  **mainEvents (string):** ${mainEventsInstruction}
        c.  **charactersPresent (array of strings):** A list of the names of the characters who appear in this scene.
        d.  **detailedVideoPrompt (string):** A comprehensive, detailed video prompt in ENGLISH. **This is the most important part:**
            - **Start with the Scene Number:** The prompt MUST begin with its sequential scene number, followed by a period and a space (e.g., "1. ...", "2. ...").
            - **Prepend Character Descriptions:** For EVERY character listed in 'charactersPresent', you MUST copy their ENTIRE, UNCHANGED, predefined character prompt and place it at the VERY BEGINNING of the \`detailedVideoPrompt\`, right after the scene number. If multiple characters are present, concatenate their full prompts together at the start.
            - **Describe the Action:** After the character descriptions, describe the setting, character actions, emotions, camera movements (e.g., "close-up shot", "pan left", "dynamic tracking shot"), and overall mood for the 8-second clip.
            - **Incorporate Style:** The entire prompt must adhere to the specified **${style}** visual style.

    Your final output must be a single JSON array containing all the scene objects.`;

    const userContent = `
    **Predefined Characters:**
    ---
    ${characterDefinitions}
    ---

    **Full Script:**
    ---
    ${script}
    ---

    Please generate the JSON scene breakdown based on the instructions.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userContent,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sceneName: { 
                type: Type.STRING,
                description: `The name for the scene, including time code, in ${sceneNameLanguage}. Format: ${sceneNameFormat}.`,
              },
              mainEvents: { 
                type: Type.STRING,
                description: `Summary of events in this scene, in ${mainEventsLanguage}.`
              },
              charactersPresent: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              detailedVideoPrompt: { 
                type: Type.STRING,
                description: 'The detailed video prompt in English, prefixed with its sequential number (e.g., "1. [prompt text]").' 
              }
            },
            required: ['sceneName', 'mainEvents', 'charactersPresent', 'detailedVideoPrompt']
          }
        }
      }
    });

    const parsedResponse = JSON.parse(response.text);

    if (!parsedResponse || parsedResponse.length === 0) {
      throw new Error("Không thể tạo phân cảnh từ kịch bản.");
    }
    
    return parsedResponse;

  } catch (error) {
    console.error("Lỗi khi tạo phân cảnh hoạt hình:", error);
    if (error instanceof Error) {
        throw new Error(`Đã xảy ra lỗi: ${error.message}`);
    }
    throw new Error("Đã xảy ra lỗi không xác định trong quá trình tạo phân cảnh.");
  }
};

export const translateText = async (text: string, targetLanguage: string = 'Vietnamese'): Promise<string> => {
    const ai = getAiClient();
    try {
        const systemInstruction = `You are a highly proficient translator. Your sole task is to translate the user-provided text into ${targetLanguage}. 
        - Output ONLY the translated text.
        - Do not add any extra explanations, greetings, or formatting.
        - Preserve the original meaning and tone as closely as possible.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: text,
            config: {
                systemInstruction,
                temperature: 0.2, // Lower temperature for more deterministic translation
            },
        });

        return response.text.trim();
    } catch (error) {
        console.error(`Lỗi khi dịch văn bản sang ${targetLanguage}:`, error);
        // Fallback to original text if translation fails
        return text;
    }
};

export const generateYouTubeSeo = async (
  channelName: string,
  videoContent: string,
): Promise<YouTubeSeoResult> => {
  const ai = getAiClient();
  try {
    const systemInstruction = `You are a world-class YouTube SEO expert and copywriter, specializing in the VidIQ methodology, writing in VIETNAMESE. Your task is to analyze the user's channel name and video content to generate highly optimized SEO metadata.

    **CRITICAL Instructions:**
    1.  **Language:** All output MUST be in VIETNAMESE.
    2.  **Titles (Tiêu đề):** Generate exactly 5 compelling, clickable, and SEO-optimized titles. The titles should be engaging and relevant to the video content.
    3.  **Description (Mô tả):** Write a detailed, engaging video description. It must include a strong hook at the beginning, a summary of the video content, and relevant calls-to-action (like subscribing or watching another video).
    4.  **Hashtags (Hashtag):** Provide a single block of relevant hashtags. Include a mix of broad and specific tags. Start each tag with '#'.
    5.  **Keywords (Từ khoá):** Provide a comma-separated list of keywords optimized for high search volume and low competition, as would be recommended by a tool like VidIQ. These keywords are for the YouTube tags section.

    Your final output must be in a JSON format.`;

    const userContent = `
    **Tên kênh:** ${channelName}
    **Nội dung video:**
    ---
    ${videoContent}
    ---

    Please generate the YouTube SEO metadata based on these details.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userContent,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'An array of 5 SEO-optimized video titles in Vietnamese.'
            },
            description: {
              type: Type.STRING,
              description: 'A detailed video description in Vietnamese.'
            },
            hashtags: {
              type: Type.STRING,
              description: 'A block of relevant hashtags in Vietnamese, each starting with #.'
            },
            keywords: {
              type: Type.STRING,
              description: 'A comma-separated list of VidIQ-optimized keywords in Vietnamese.'
            }
          },
          required: ['titles', 'description', 'hashtags', 'keywords']
        }
      }
    });

    const parsedResponse: YouTubeSeoResult = JSON.parse(response.text);

    if (!parsedResponse) {
      throw new Error("Không thể tạo dữ liệu SEO.");
    }

    return parsedResponse;

  } catch (error) {
    console.error("Lỗi khi tạo dữ liệu SEO Youtube:", error);
    if (error instanceof Error) {
        throw new Error(`Đã xảy ra lỗi: ${error.message}`);
    }
    throw new Error("Đã xảy ra lỗi không xác định trong quá trình tạo dữ liệu SEO.");
  }
};
