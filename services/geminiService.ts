import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedPrompt, YouTubeSeoResult, VideoAnalysisResult, ScriptAnalysisResult, SunoPrompt } from '../types';

const getAiClient = () => {
    const apiKey = localStorage.getItem('gemini-api-key');
    if (!apiKey) {
        throw new Error("API Key không được tìm thấy. Vui lòng thiết lập API Key để sử dụng công cụ.");
    }
    return new GoogleGenAI({ apiKey });
};

const getStyleInstruction = (style: string): string => {
  const styleMap: { [key: string]: string } = {
    'Điện ảnh (Cinematic)': 'cinematic style, dramatic lighting, hyperrealistic, 8k, movie still, 16:9 aspect ratio',
    'Điện ảnh': 'cinematic style, dramatic lighting, hyperrealistic, 8k, movie still, 16:9 aspect ratio',
    'Hoạt hình (Animation)': 'vibrant 3D animation style, Pixar inspired, detailed characters, colorful, 16:9 aspect ratio',
    'Hoạt hình 3D': 'vibrant 3D animation style, Pixar inspired, detailed characters, colorful, 16:9 aspect ratio',
    'Tranh vẽ thuỷ mặc': 'Chinese ink wash painting style, minimalist, elegant brushstrokes, traditional art, high contrast, 16:9 aspect ratio',
    'Vibe cổ họa Việt Nam': 'Vietnamese antique art style, reminiscent of Nguyen dynasty woodblock prints and lacquer paintings (sơn mài), traditional color palette, detailed cultural attire (like áo dài) and architecture, 16:9 aspect ratio',
    'Người que (Stick Figure)': 'simple stick figure drawing style, minimalist, black and white, clean lines, expressive poses, on a plain white background, 16:9 aspect ratio',
    'Hand-drawn': 'hand-drawn animation style, sketchy, textured, organic feel, 16:9 aspect ratio',
  };

  if (styleMap[style]) {
    return styleMap[style];
  }
  
  if (style === 'Default') {
      return '';
  }

  return `${style} style, 16:9 aspect ratio`;
};

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const generatePromptsFromScript = async (
  script: string,
  numberOfPrompts: number,
  style: string,
  duration: number,
  characters: { name: string; prompt: string }[]
): Promise<GeneratedPrompt[]> => {
  const ai = getAiClient();
  try {
    const styleInstruction = getStyleInstruction(style);
    
    const characterDefinitions = characters.length > 0
      ? characters.map(c => `- ${c.name}: ${c.prompt}`).join('\n')
      : "No characters defined for this script.";

    const systemInstruction = `You are an expert prompt engineer for AI multimedia generation. Your task is to analyze a VIETNAMESE script and generate detailed prompts using the FIXED character descriptions provided below.

    **FIXED Character Descriptions (You MUST use these EXACTLY as written, or assume no characters if the list is empty):**
    ---
    ${characterDefinitions}
    ---

    **CRITICAL Instructions:**
    1.  **Adhere to Character Prompts:** The character list above is definitive. You MUST use the descriptions verbatim for any character that appears. If the list is empty, assume there are no recurring characters to track. Do NOT invent your own character descriptions.
    2.  **Analyze Context:** Read the entire script to understand the overall time period and setting (e.g., "1990s Hanoi," "futuristic Ho Chi Minh City"). Adhere to this setting in all prompts for consistency.
    3.  **Time Segmentation:** Divide the script into exactly ${numberOfPrompts} sequential segments.
    4.  **Output per Segment:** For each segment, generate FOUR pieces of information:
        a.  **sceneName:** "Phân cảnh [Number] ([Start Time]s - [End Time]s)".
        b.  **sceneDescription:** A concise summary in VIETNAMESE.
        c.  **imagePrompt:** A highly detailed description in ENGLISH for a STATIC image. If characters from the list are present, you MUST prepend their FULL, FIXED descriptions to the start of the prompt. Incorporate the setting details. The prompt MUST end with the phrase ", no text, textless, no words, no letters".
        d.  **videoPrompt:** A description in ENGLISH of the ACTION and MOVEMENT. If characters from the list are present, you MUST prepend their FULL, FIXED descriptions to the start of the prompt. Incorporate setting details. The prompt MUST end with the phrase ", no text, textless, no words, no letters".
    5.  **Integrate Style:** Both prompts MUST seamlessly incorporate: "${styleInstruction}".
    6.  **Language:** sceneName/sceneDescription = VIETNAMESE. imagePrompt/videoPrompt = ENGLISH.
    7.  **Numbering:** Both 'imagePrompt' and 'videoPrompt' MUST start with their corresponding segment number, followed by a period and a space (e.g., "1. ...").

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
                description: 'The final, complete, detailed visual prompt for a STATIC IMAGE in ENGLISH, MUST be prefixed with its sequential number (e.g., "1. [prompt text]"). It includes character descriptions, style elements, and text removal instructions.',
              },
              videoPrompt: {
                type: Type.STRING,
                description: 'The final, complete, detailed prompt for a VIDEO, describing MOTION and CAMERA MOVEMENT in ENGLISH, MUST be prefixed with its sequential number (e.g., "1. [prompt text]"). It includes character descriptions, style elements, and text removal instructions.'
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

export const generateMotionPromptForImage = async (imageFile: File): Promise<string> => {
    const ai = getAiClient();
    try {
        const imagePart = await fileToGenerativePart(imageFile);

        const systemInstruction = `You are an expert cinematic video director. Your task is to analyze a static image and create a compelling, high-quality **video generation prompt** (motion prompt) that brings the image to life.

        **Instructions:**
        1.  **Analyze the Image:** Identify the subject, setting, mood, lighting, and style.
        2.  **Determine Motion:** Decided on the most appropriate and visually stunning movement for this scene. Examples:
            -   *Camera movement:* Slow pan, zoom in, dolly out, tracking shot, aerial view.
            -   *Subject movement:* Walking, smiling, wind blowing hair, leaves rustling, water flowing, lights flickering, clouds moving.
        3.  **Write the Prompt:** Create a concise but descriptive prompt in **ENGLISH** suitable for AI video generators like Gen-2, Pika, or Veo.
        4.  **Format:** The prompt should describe the visual content briefly and then focus heavily on the **action and camera movement**.
        5.  **Output:** Return ONLY the prompt text. Do not include preambles like "Here is the prompt".

        **Example Output:**
        "Cinematic close-up of an elderly man, detailed wrinkles, soft lighting. The camera slowly zooms in on his eyes as he blinks. Dust motes dance in the light rays. High resolution, 4k."
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: "Create a motion prompt for this image." }] },
            config: {
                systemInstruction,
            },
        });

        return response.text.trim();

    } catch (error) {
        console.error("Lỗi khi tạo prompt chuyển động:", error);
        if (error instanceof Error) {
            throw new Error(`Không thể tạo prompt: ${error.message}`);
        }
        throw new Error("Đã xảy ra lỗi không xác định.");
    }
};

export const identifyCharactersFromScript = async (script: string, characterNationality: string): Promise<{ name: string; prompt: string }[]> => {
  const ai = getAiClient();
  try {
    const nationalityMap: { [key: string]: string } = {
        'Châu Âu': 'European',
        'Châu Á': 'Asian',
        'Châu Phi': 'African',
        'Nam Mỹ': 'South American',
    };
    const englishNationality = nationalityMap[characterNationality];

    let mainInstruction;

    if (englishNationality) {
        mainInstruction = `The user has specified a fixed nationality. Your task is to:
    1.  Read the script to identify all distinct characters, including humans and animals.
    2.  For EACH character:
        a.  Determine if it is a HUMAN or an ANIMAL.
        b.  **For Humans:** You MUST assign them the nationality of **${englishNationality}**. IGNORE any clues in the script that contradict this. Create a detailed prompt based on this assigned nationality, describing their culturally-appropriate physical features, age, clothing, and personality.
        c.  **For Animals:** Identify the species. Create a detailed prompt describing its appearance (breed, color, size), personality, and any distinctive features. The fixed nationality does NOT apply to animals.
    3.  The final prompt for each character must be a comprehensive visual description in ENGLISH.`;
    } else { // 'Default' case
        mainInstruction = `Your task is to perform a deep contextual analysis:
    1.  Read the entire script to identify all distinct characters, including humans and animals.
    2.  For EACH character:
        a.  Determine if it is a HUMAN or an ANIMAL.
        b.  **For Humans:** Infer their most likely nationality or ethnicity based on clues in the script (names, locations, cultural references). Create a detailed prompt describing their culturally-appropriate physical features (face, hair, eyes), age (inferred from script), clothing, and personality.
        c.  **For Animals:** Identify the species. Create a detailed prompt describing its appearance (breed, color, size), personality (e.g., playful, grumpy), and any distinctive features (e.g., a collar, a scar). Do NOT assign human nationalities to animals.
    3.  The final prompt for each character must be a comprehensive visual description in ENGLISH.`;
    }

    const systemInstruction = `You are an expert character designer and cultural anthropologist for generative AI. Your task is to analyze a VIETNAMESE script and create a definitive, detailed, and culturally accurate "character sheet" prompt in ENGLISH for each character. This description will be FIXED and used for all subsequent media generation.

    **CRITICAL INSTRUCTIONS:**
    ${mainInstruction}

    **PROMPT CONSTRUCTION RULES FOR EACH CHARACTER:**
    - The final prompt must be a single, comprehensive paragraph in ENGLISH.
    - **For Humans:** It must include: Age & Nationality, Culturally-Appropriate Features, Outfit, Personality, and any signature Accessories.
    - **For Animals:** It must include: Species, Breed/Appearance details, Personality, and any signature features (like a collar).

    **FINAL OUTPUT FORMAT:**
    Your final output MUST be a JSON array of objects. Each object must contain two fields: "name" (the character's name in Vietnamese) and "prompt" (the final, combined, culturally-accurate description in English).

    **Example Output:**
    [
      {
        "name": "Hùng",
        "prompt": "Hùng, a 35-year-old Vietnamese man with a rugged face, sharp jawline, and short black hair. He typically wears a worn-out brown leather jacket, a simple grey t-shirt, and dark jeans, reflecting his serious and protective personality. He is never seen without his old silver locket."
      },
      {
        "name": "Vàng",
        "prompt": "Vàng, a playful Vietnamese Phu Quoc Ridgeback dog with golden-brown fur, a distinctive ridge of hair along its back, and intelligent, curious eyes. He is energetic and loyal, often seen wagging his tail and carrying a small rubber ball."
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
                description: 'A detailed visual description of the character in English, following the specified instructions.',
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
  style: string,
  language: 'Tiếng Việt' | 'Tiếng Anh' | 'Không có thoại'
): Promise<any[]> => {
  const ai = getAiClient();
  try {
    const styleInstruction = getStyleInstruction(style);
    const characterDefinitions = characters.map(c => `- ${c.name}: ${c.prompt}`).join('\n');
    const totalSeconds = durationMinutes * 60 + durationSeconds;
    const numberOfScenes = Math.max(1, Math.round(totalSeconds / 8));
    const totalMinutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;

    let systemInstruction: string;
    let responseSchemaDescription: { sceneName: string; mainEvents: string; detailedVideoPrompt: string; };

    if (language === 'Không có thoại') {
        systemInstruction = `You are an expert animation film producer. Your task is to process a script, character descriptions, style, and duration to create a detailed scene breakdown. The script describes ACTIONS ONLY and has NO dialogue.

**CRITICAL Instructions:**

1.  **Adhere to Character Prompts:** The provided character descriptions are FIXED and must be used as-is.

2.  **Time Segmentation & NO DIALOGUE:**
    a.  The total video duration is ${totalMinutes} minutes and ${remainingSeconds} seconds.
    b.  Divide the script into logical scenes based on actions and setting changes. Assume there is NO spoken dialogue.
    c.  Each scene should be approximately 8 seconds long. The final number of scenes should approximate the target of ${numberOfScenes}.

3.  **Visual Style:** All prompts MUST be tailored to the following visual style: **${styleInstruction}**.

4.  **Output Format & Language (for each scene):**
    You must generate a JSON object with the following fields:
    a.  **sceneName (string):** A descriptive name in VIETNAMESE. Format: "Phân Cảnh [Number] ([Start Time]s - [End Time]s)". Adjust timecodes based on the 8s/scene rule.
    b.  **mainEvents (string):** A summary of key actions in VIETNAMESE.
    c.  **charactersPresent (array of strings):** Names of characters in this scene.
    d.  **detailedVideoPrompt (string):** A comprehensive video prompt in ENGLISH.
        - **Start with Scene Number:** Must begin with its sequential number (e.g., "1. ...").
        - **Prepend Character Descriptions:** At the VERY BEGINNING, for EACH character present, copy their ENTIRE, UNCHANGED, predefined character prompt.
        - **Describe Action:** After character descriptions, describe the setting, actions, emotions, and camera movements in ENGLISH.
        - **Incorporate Style:** The entire prompt must adhere to the **${styleInstruction}** visual style.
        - **MANDATORY SILENCE:** The prompt MUST end with the phrase ", no dialogue, silent film style". This is critical.

Your final output must be a single JSON array containing all the scene objects.`;
        
        responseSchemaDescription = {
            sceneName: `The name for the scene, including time code, in VIETNAMESE. Format: "Phân Cảnh [Number] ([Start Time]s - [End Time]s)".`,
            mainEvents: `Summary of events in this scene, in VIETNAMESE.`,
            detailedVideoPrompt: 'The detailed video prompt in English (with NO dialogue), prefixed with its sequential number (e.g., "1. [prompt text]").'
        };

    } else {
        const mainEventsLanguage = language === 'Tiếng Việt' ? 'VIETNAMESE' : 'ENGLISH';
        const sceneNameLanguage = language === 'Tiếng Việt' ? 'VIETNAMESE' : 'ENGLISH';
        const sceneNameFormat = language === 'Tiếng Việt' 
            ? '"Phân Cảnh [Number] ([Start Time]s - [End Time]s)"' 
            : '"Scene [Number] ([Start Time]s - [End Time]s)"';
        
        systemInstruction = `You are an expert animation film producer. Your task is to process a script, character descriptions, style, and duration to create a detailed scene breakdown. The script's dialogue language is ${mainEventsLanguage}.

**CRITICAL Instructions:**

1.  **Adhere to Character Prompts:** The provided character descriptions are FIXED and must be used as-is.

2.  **Time Segmentation & Dialogue Handling:**
    a.  The total video duration is ${totalMinutes} minutes and ${remainingSeconds} seconds.
    b.  Divide the script into logical scenes. For each logical scene, analyze its dialogue.
    c.  **PRESERVE DIALOGUE:** Dialogue from the script MUST be included in the video prompt in its ORIGINAL language (${mainEventsLanguage}). DO NOT summarize or translate the dialogue.
    d.  **SPLIT LONG DIALOGUE:** If a character's single line of dialogue is longer than 80 characters, you MUST split that action into multiple, sequential 8-second video scenes.
    e.  Each new sub-scene will contain a chunk of the dialogue (max 80 characters).
    f.  **MAINTAIN CONTEXT:** When splitting, all resulting sub-scenes must maintain the same setting, characters, and overarching action to ensure continuity.
    g.  The final number of scenes should approximate the target of ${numberOfScenes}, but can be more if splitting is necessary.

3.  **Visual Style:** All prompts MUST be tailored to the following visual style: **${styleInstruction}**.

4.  **Output Format & Language (for each scene or sub-scene):**
    You must generate a JSON object with the following fields:
    a.  **sceneName (string):** A descriptive name in ${sceneNameLanguage}. Format: ${sceneNameFormat}. Adjust timecodes based on the 8s/scene rule.
    b.  **mainEvents (string):** A summary of key actions in ${mainEventsLanguage}, including the specific dialogue chunk for this scene.
    c.  **charactersPresent (array of strings):** Names of characters in this scene.
    d.  **detailedVideoPrompt (string):** A comprehensive video prompt in ENGLISH, except for the dialogue.
        - **Start with Scene Number:** Must begin with its sequential number (e.g., "1. ...").
        - **Prepend Character Descriptions:** At the VERY BEGINNING, for EACH character present, copy their ENTIRE, UNCHANGED, predefined character prompt.
        - **Describe Action & Dialogue:** After character descriptions, describe the setting, actions, emotions, and camera movements in ENGLISH. Then, embed the UNTRANSLATED dialogue chunk from the script.
        - **Incorporate Style:** The entire prompt must adhere to the **${styleInstruction}** visual style.

Your final output must be a single JSON array containing all the scene objects.`;
        
        responseSchemaDescription = {
            sceneName: `The name for the scene, including time code, in ${sceneNameLanguage}. Format: ${sceneNameFormat}.`,
            mainEvents: `Summary of events in this scene, in ${mainEventsLanguage}.`,
            detailedVideoPrompt: 'The detailed video prompt in English (with original dialogue), prefixed with its sequential number (e.g., "1. [prompt text]").'
        };
    }

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
      model: 'gemini-2.5-pro',
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
                description: responseSchemaDescription.sceneName,
              },
              mainEvents: { 
                type: Type.STRING,
                description: responseSchemaDescription.mainEvents
              },
              charactersPresent: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              detailedVideoPrompt: { 
                type: Type.STRING,
                description: responseSchemaDescription.detailedVideoPrompt
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
  language: 'Tiếng Việt' | 'Tiếng Anh'
): Promise<YouTubeSeoResult> => {
  const ai = getAiClient();
  try {
    const outputLanguage = language === 'Tiếng Việt' ? 'VIETNAMESE' : 'ENGLISH';
    
    const systemInstruction = `You are a world-class YouTube SEO expert and copywriter, specializing in the VidIQ methodology, writing in ${outputLanguage}. Your task is to analyze the user's channel name and video content to generate highly optimized SEO metadata based on the provided VidIQ guidelines.

    **VidIQ SEO Guidelines (Aim for a score of 45-50/50):**
    1.  **Main Keyword:** Identify a main keyword from the video content.
    2.  **Keyword Placement:** The main keyword MUST appear in the Title, appear naturally 2-3 times in the Description, and be included in the Keywords/Tags.
    3.  **Title:** Must contain the main keyword.
    4.  **Description:** Must be over 250 characters. It should repeat the main keyword naturally.
    5.  **Keywords/Tags:** The list should contain 10-15 relevant tags, including the main keyword and related long-tail keywords.

    **CRITICAL Instructions:**
    1.  **Language:** All output (titles, description, keywords) MUST be in ${outputLanguage}.
    2.  **Titles (Tiêu đề):** Generate exactly 5 compelling, clickable, and SEO-optimized titles that follow the guidelines.
    3.  **Description (Mô tả):** Write a detailed, engaging, and professionally formatted video description in ${outputLanguage} (over 250 characters). It must be visually appealing and easy to read. Structure it with the following elements, using emojis to enhance readability:
        - **Strong Hook (Câu Mở Đầu Hấp Dẫn):** Start with 1-2 compelling sentences that grab the viewer's attention and contain the main keyword.
        - **Detailed Summary (Tóm Tắt Chi Tiết):** Provide a clear summary of the video's content. Use bullet points (e.g., with ✅, 💡, 🚀) to list key topics or benefits covered in the video.
        - **Keyword Integration:** Naturally integrate the main keyword 2-3 times throughout the hook and summary.
        - **Calls to Action (Kêu Gọi Hành Động):** Encourage viewers to LIKE, SUBSCRIBE, and COMMENT. Phrase this engagingly.
        - **Social/Contact Links (Liên Kết):** Include a section with placeholders for social media and contact info, like "► Kết nối với ${channelName}:\\n- Facebook: [Link Facebook của bạn]\\n- Zalo: [Số Zalo của bạn]".
        - **Clarity & Spacing:** Use ample white space and clear headings to separate sections.
        - **Hashtags:** At the very end of the description, add a block of relevant hashtags. The first 3 hashtags MUST be based on the main keyword. The remaining hashtags should be related secondary keywords.
    4.  **Keywords (Từ khoá):** Provide a comma-separated list of 10-15 keywords optimized for high search volume and low competition, as recommended by VidIQ.
    5.  **Output Format:** Your final output must be in a JSON format.`;

    const responseSchema: any = {
      type: Type.OBJECT,
      properties: {
        titles: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: `An array of 5 SEO-optimized video titles in ${outputLanguage}.`
        },
        description: {
          type: Type.STRING,
          description: `A detailed video description in ${outputLanguage}, over 250 characters, including a hashtag block at the end, following VidIQ guidelines.`
        },
        keywords: {
          type: Type.STRING,
          description: `A comma-separated list of 10-15 VidIQ-optimized keywords in ${outputLanguage}.`
        }
      },
      required: ['titles', 'description', 'keywords']
    };
    
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
        responseSchema,
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

export const analyzeVideoFromFile = async (videoFile: File): Promise<VideoAnalysisResult> => {
    const ai = getAiClient();
    try {
        const videoPart = await fileToGenerativePart(videoFile);
        
        const systemInstruction = `You are a professional film director AI. Your task is to analyze a video and provide a structured breakdown for pre-production.
        
        **CRITICAL INSTRUCTIONS:**
        1.  **Summarize:** First, provide a concise overall summary of the video's content in VIETNAMESE.
        2.  **Identify Main Characters:** Watch the entire video and identify all main characters. For each character, create a unique name and a detailed visual description (appearance, clothing, key features) in ENGLISH. This description must be consistent and detailed enough for an image generation AI.
        3.  **Identify Scenes:** Break the video down into distinct scenes. A scene change is marked by a significant shift in location, time, or subject matter.
        4.  **Describe Scenes:** For each scene, write a detailed description of the events and actions in VIETNAMESE. **IMPORTANT:** If the scene contains dialogue, you MUST transcribe the dialogue verbatim in its original language (e.g., keep Vietnamese dialogue in Vietnamese, keep English dialogue in English) within the scene description.
        5.  **Output Format:** Your final output MUST be a JSON object with three fields: "summary" (string), "characters" (an array of objects, each with "name" and "description" strings), and "scenes" (an array of strings, where each string is a detailed description of one scene).
        `;
        
        const userContent = {
            parts: [
                videoPart,
                { text: "Please analyze this video according to the system instructions." }
            ]
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: userContent,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: {
                            type: Type.STRING,
                            description: 'A concise summary of the video in VIETNAMESE.',
                        },
                        characters: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: {
                                        type: Type.STRING,
                                        description: 'The name of a main character identified in the video.'
                                    },
                                    description: {
                                        type: Type.STRING,
                                        description: 'A detailed visual description of the character in ENGLISH.'
                                    }
                                },
                                required: ['name', 'description']
                            }
                        },
                        scenes: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                description: 'A detailed description of a single scene in VIETNAMESE. Dialogue should be transcribed in its original language.'
                            }
                        }
                    },
                    required: ['summary', 'characters', 'scenes']
                }
            }
        });

        const parsedResponse: VideoAnalysisResult = JSON.parse(response.text);

        if (!parsedResponse || !parsedResponse.scenes || parsedResponse.scenes.length === 0) {
            throw new Error("Không thể phân tích video hoặc không tìm thấy phân cảnh nào.");
        }
        
        return parsedResponse;

    } catch (error) {
        console.error("Lỗi khi phân tích video:", error);
        if (error instanceof Error) {
            throw new Error(`Đã xảy ra lỗi: ${error.message}`);
        }
        throw new Error("Đã xảy ra lỗi không xác định trong quá trình phân tích video.");
    }
};

export const generateVeoPromptsFromScenes = async (analysisResult: VideoAnalysisResult): Promise<string[]> => {
    const ai = getAiClient();
    try {
        const characterDefinitions = analysisResult.characters.map(c => `- ${c.name}: ${c.description}`).join('\n');
        
        const systemInstruction = `You are an expert prompt engineer for the Veo3 text-to-video model. You will be given predefined character descriptions (in ENGLISH) and a list of scene descriptions. The scene descriptions are primarily in VIETNAMESE but may contain dialogue in other languages.

        **CRITICAL INSTRUCTIONS:**

        1.  **Process Each Scene:** For each scene description provided, perform the following steps.

        2.  **Dialogue Handling & Splitting:**
            a.  Identify any dialogue within the scene description. Dialogue is often in quotes or follows a character's name and a colon (e.g., "Hùng: ...").
            b.  **PRESERVE DIALOGUE LANGUAGE:** The dialogue MUST remain in its original language (Vietnamese or English). DO NOT TRANSLATE IT.
            c.  **SPLIT LONG DIALOGUE:** If the dialogue in a single scene is longer than 80 characters, you MUST split that scene into multiple, sequential sub-scenes.
            d.  Each sub-scene will contain a portion of the dialogue, with each portion being a maximum of 80 characters.
            e.  **MAINTAIN CONTEXT:** When splitting, ensure that all resulting sub-scenes carry over the original scene's context: the same characters, setting, and ongoing action. The only thing changing is the piece of dialogue being spoken.

        3.  **Prompt Construction (for each scene or sub-scene):**
            a.  **Translate Non-Dialogue:** Translate ONLY the non-dialogue parts of the scene description (actions, setting, mood) into highly descriptive, cinematic ENGLISH.
            b.  **Character Prepending:** Identify which predefined characters are present. Prepend their ENTIRE, UNCHANGED, predefined character description(s) to the very beginning of the prompt.
            c.  **Combine:** Create the final prompt by combining:
                - The prepended character description(s).
                - The translated cinematic description of the setting and action.
                - The original, untranslated dialogue chunk for that scene/sub-scene.
                - Add details about camera movement (e.g., "close-up shot", "pan left"), lighting, and mood.

        4.  **Final Output:**
            a.  Your final output MUST be a JSON array of strings.
            b.  Each string in the array is one complete, final Veo3 prompt for a single scene or sub-scene.
            c.  The number of prompts in the output array may be greater than the number of initial scenes if splitting occurred.
            d.  Each prompt MUST be a single, continuous line of text.
        `;
        
        const userContent = `
        **Predefined Characters:**
        ---
        ${characterDefinitions}
        ---

        **Scene Descriptions to Process:**
        ---
        ${JSON.stringify(analysisResult.scenes)}
        ---
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: userContent,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING,
                        description: 'A single, detailed Veo3 video prompt in ENGLISH, prepended with character descriptions if applicable.'
                    }
                }
            }
        });

        const parsedResponse: string[] = JSON.parse(response.text);

        if (!parsedResponse || parsedResponse.length === 0) {
            throw new Error("Không thể tạo prompt Veo3 từ các phân cảnh.");
        }
        
        return parsedResponse;

    } catch (error) {
        console.error("Lỗi khi tạo prompts Veo3:", error);
        if (error instanceof Error) {
            throw new Error(`Đã xảy ra lỗi: ${error.message}`);
        }
        throw new Error("Đã xảy ra lỗi không xác định trong quá trình tạo prompts.");
    }
};

export const analyzeAndRewriteScript = async (
    script: string,
    tone: string,
    targetDurationMinutes: number,
    language: string
): Promise<ScriptAnalysisResult> => {
    const ai = getAiClient();
    try {
        const targetCharCount = targetDurationMinutes > 0 ? targetDurationMinutes * 1000 : null;
        
        const systemInstruction = `You are an expert script analyst and screenwriter, specializing in transforming existing content for YouTube while avoiding policy violations. Your task is to perform a deep analysis of a competitor's script and rewrite it according to specific guidelines. The final output, including all analysis fields and the rewritten script, MUST be in ${language}.

        **ABSOLUTELY CRITICAL RULE FOR REWRITTEN SCRIPT:**
        The 'rewrittenScript' field in your JSON output MUST contain ONLY the story text (dialogue, narration). It must be a clean script ready for voiceover.
        -   **ZERO** technical notes (e.g., "Chuyển cảnh", "Hết cảnh").
        -   **ZERO** camera directions (e.g., "Cận cảnh", "Toàn cảnh").
        -   **ZERO** parenthetical descriptions (e.g., "(hình ảnh tư liệu về...)", "(hiệu ứng âm thanh)").
        -   The output must be ONLY the words that are meant to be spoken. This is the most important rule.

        **CRITICAL WORKFLOW:**

        1.  **Analyze & Structure (Step 1):**
            a.  **Text Statistics (MANDATORY):** Calculate and return: word count, character count, and sentence count for the ORIGINAL script.
            b.  **Identify Characters:** Identify all distinct characters. For each, assign a role from this list: [Narrator, Protagonist, Antagonist, Supporting, Host, Symbolic]. Provide a brief description for each character based on the script.
            c.  **3-Act Structure:** Deconstruct the script into a classic three-act structure: Act 1 (Setup), Act 2 (Confrontation), Act 3 (Resolution). Summarize each act concisely.

        2.  **Rewrite (Step 2):**
            a.  **Core Goal:** Rewrite the entire script, following the **ABSOLUTELY CRITICAL RULE** stated above.
            b.  **Transformation:** The new script MUST retain all original information, characters, events, and facts. You MUST NOT simply change a few words. You must transform it by:
                -   Changing sentence structures significantly.
                -   Using a rich vocabulary of synonyms.
                -   Adding your own commentary, analysis, metaphors, or evaluations to provide new value (this is crucial for Fair Use).
            c.  **Tone/Persona Application:** Rewrite the script by adopting the persona and tone of a **"${tone}"**. Embody the characteristics of this persona in your writing style, vocabulary, and sentence structure.
            d.  **Target Duration (ABSOLUTELY CRITICAL):** ${targetCharCount ? `The user requires a script for a video of exactly ${targetDurationMinutes} minute(s). You MUST generate a rewritten script that is PRECISELY **${targetCharCount} characters** long. The allowed margin of error is extremely small: +/- 10 characters (i.e., between ${targetCharCount - 10} and ${targetCharCount + 10} characters). This is not a suggestion, it is a mandatory command. Meticulously expand on details or be extremely concise to hit this exact character count. Failure to meet this strict length requirement will make the output unusable.` : "Rewrite the script to a natural length based on the content."}
            e.  **Optimization:** Automatically insert a compelling hook at the beginning and a call-to-action (CTA) at the end. The CTA should encourage viewers to like, subscribe, and comment.

        3.  **Policy Check (Step 3):**
            a.  **Reuse Content:** Evaluate the rewritten script against the original. Provide a risk assessment (Low, Medium, High) and explain WHY.
            b.  **Fair Use:** Briefly explain how your rewritten version qualifies for Fair Use.
            c.  **Forbidden Words:** Scan for and list any words related to violence, politics, adult content, or medical misinformation. If none, state the equivalent of "No forbidden words found" in ${language}.

        4. **LANGUAGE REQUIREMENT (CRITICAL):** All text in the final JSON output, including character descriptions, structure summaries, policy notes, and the rewritten script itself, MUST be in ${language}.

        **FINAL OUTPUT FORMAT (MANDATORY):**
        Your output MUST be a single, valid JSON object that strictly follows the provided schema. Do not add any text or formatting outside of the JSON structure.`;
        
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                analysis: {
                    type: Type.OBJECT,
                    properties: {
                        wordCount: { type: Type.NUMBER, description: "Word count of the ORIGINAL script." },
                        charCount: { type: Type.NUMBER, description: "Character count of the ORIGINAL script." },
                        sentenceCount: { type: Type.NUMBER, description: "Sentence count of the ORIGINAL script." },
                        policyCheck: {
                            type: Type.OBJECT,
                            properties: {
                                reuseRisk: { type: Type.STRING, description: "Risk assessment for Reuse Content (Low, Medium, High) with a brief explanation in the target language." },
                                fairUseNotes: { type: Type.STRING, description: "Explanation of how the rewrite qualifies for Fair Use in the target language." },
                                forbiddenWordsFound: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of forbidden words found, or an empty array." }
                            },
                            required: ['reuseRisk', 'fairUseNotes', 'forbiddenWordsFound']
                        }
                    },
                    required: ['wordCount', 'charCount', 'sentenceCount', 'policyCheck']
                },
                characters: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            role: { type: Type.STRING },
                            description: { type: Type.STRING }
                        },
                        required: ['name', 'role', 'description']
                    }
                },
                threeActStructure: {
                    type: Type.OBJECT,
                    properties: {
                        act1_setup: { type: Type.STRING, description: "Summary of Act 1 (Setup) in the target language." },
                        act2_confrontation: { type: Type.STRING, description: "Summary of Act 2 (Confrontation) in the target language." },
                        act3_resolution: { type: Type.STRING, description: "Summary of Act 3 (Resolution) in the target language." }
                    },
                    required: ['act1_setup', 'act2_confrontation', 'act3_resolution']
                },
                rewrittenScript: { type: Type.STRING, description: "The complete, rewritten script in the specified tone and target language." }
            },
            required: ['analysis', 'characters', 'threeActStructure', 'rewrittenScript']
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `**Script to analyze and rewrite:**\n---\n${script}\n---`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema,
            }
        });

        const parsedResponse: ScriptAnalysisResult = JSON.parse(response.text);
        
        if (!parsedResponse) {
            throw new Error("Không thể phân tích và viết lại kịch bản.");
        }
        
        return parsedResponse;

    } catch (error) {
        console.error("Lỗi khi viết lại kịch bản:", error);
        if (error instanceof Error) {
            throw new Error(`Đã xảy ra lỗi: ${error.message}`);
        }
        throw new Error("Đã xảy ra lỗi không xác định trong quá trình viết lại kịch bản.");
    }
};

export const continueRewriteScript = async (
    originalScript: string,
    tone: string,
    language: string,
    targetDurationMinutes: number,
    partNumber: number,
    totalParts: number,
    previousRewrittenScript: string
): Promise<string> => {
    const ai = getAiClient();
    try {
        const targetCharCount = targetDurationMinutes > 0 ? targetDurationMinutes * 1000 : null;

        const systemInstruction = `You are an expert screenwriter continuing a script rewriting task. You must work in ${language}.

        **CONTEXT:**
        - **Original Script:** The full original script is provided below for complete context.
        - **Task:** You are writing PART ${partNumber} of a ${totalParts}-part series.
        - **Previously Written:** The content for the previous part(s) is provided below.
        - **Your Goal:** Write the NEXT part of the script. It must seamlessly and logically continue from where the previous part ended.

        **CRITICAL INSTRUCTIONS:**
        1.  **SEAMLESS CONTINUITY (ABSOLUTE MANDATORY):** Your output MUST be a direct continuation of the previously written script. Start writing immediately from the point where the previous text ended. There must be NO introduction, NO greeting, NO part number, and NO mention that this is a new section. The transition must be completely invisible to the reader.
        2.  **Adopt Persona:** Maintain the persona of a **"${tone}"**.
        3.  **Target Duration (ABSOLUTELY CRITICAL):** This new part of the script must be PRECISELY ${targetDurationMinutes} minute(s) long. This translates to an exact character count of **${targetCharCount} characters**. You are allowed a tiny margin of error of +/- 10 characters (i.e., the text you generate must be between ${targetCharCount - 10} and ${targetCharCount + 10} characters long). This is a non-negotiable requirement. Do whatever is necessary—add detail, use more descriptive words, or be concise—to meet this exact length.
        4.  **Language:** The output MUST be in ${language}.
        5.  **Output Format (STRICT):**
            -   Output ONLY the text for this new part.
            -   **DO NOT** include any preamble like "Here is Part ${partNumber}:", "Tiếp theo là phần 2:", "Chào mừng đến với phần 2", etc.
            -   **DO NOT** repeat any of the previous script.
            -   **DO NOT** add any analysis or JSON.
            -   The output must be just the new story text and nothing else.
        6.  **Clean Storytelling Output (CRITICAL):** The script part you write MUST be pure narrative/dialogue text suitable for a voiceover. DO NOT include any technical directions, scene transition notes (e.g., "Chuyển cảnh"), camera instructions, or parenthetical visual descriptions. Just the new story text.

        **PREVIOUSLY REWRITTEN SCRIPT (Part ${partNumber - 1}):**
        ---
        ${previousRewrittenScript}
        ---
        `;
        
        const userContent = `
        **FULL ORIGINAL SCRIPT (for context):**
        ---
        ${originalScript}
        ---

        Please now write Part ${partNumber} of ${totalParts}.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: userContent,
            config: {
                systemInstruction,
            }
        });

        return response.text.trim();

    } catch (error) {
        console.error(`Lỗi khi viết tiếp kịch bản phần ${partNumber}:`, error);
        if (error instanceof Error) {
            throw new Error(`Đã xảy ra lỗi khi viết tiếp phần ${partNumber}: ${error.message}`);
        }
        throw new Error(`Đã xảy ra lỗi không xác định trong quá trình viết tiếp kịch bản.`);
    }
};

export const generateSunoPrompts = async (
  userInput: string,
  inputMode: 'idea' | 'lyrics',
  options: {
    genre: string;
    mood: string;
    vocals: string;
    language: string;
    instruments: string;
  }
): Promise<SunoPrompt[]> => {
    const ai = getAiClient();
    try {
        const { genre, mood, vocals, language, instruments } = options;
        const promptCount = 3; // Generate 3 variations by default

        const systemInstruction = `You are a creative music producer and an expert prompt engineer for AI music generation tools like Suno. Your task is to generate unique, high-quality, and detailed music prompts based on the user's input and specifications.

        **CRITICAL WORKFLOW:**
        You will operate in one of two modes based on the user's 'inputMode'.

        **Mode 1: 'idea'**
        1.  The user provides a short theme or idea.
        2.  Your FIRST task is to expand this idea into a **complete song with full lyrics** in the specified language (${language}). The song MUST have a clear structure (e.g., [Verse 1], [Chorus], [Verse 2], [Chorus], [Bridge], [Outro]).
        3.  Your SECOND task is to analyze the song you just wrote and generate a creative song title and a detailed music prompt.
        4.  The 'lyrics' field in the final JSON MUST contain the full lyrics you generated.

        **Mode 2: 'lyrics'**
        1.  The user provides their own complete song lyrics.
        2.  Your task is to analyze these lyrics to understand their theme, mood, and structure.
        3.  Generate a fitting song title and a detailed music prompt that matches the provided lyrics.
        4.  The 'lyrics' field in the final JSON MUST contain the original, unchanged lyrics provided by the user.
        
        **ALL-MODE Instructions:**
        1.  **Generate Variations:** Create exactly ${promptCount} different and creative variations. Each variation should offer a unique angle on the user's core concept.
        2.  **Auto BPM (MANDATORY):** Based on the selected genre and mood, you MUST determine and include an appropriate BPM in the prompt string. For example: for 'Ballad', suggest a slow tempo like '70 BPM'; for 'EDM', suggest an energetic tempo like '128 BPM'.
        3.  **Prompt Language:** The main descriptive part of the prompt MUST be in ENGLISH, as this is what AI music models understand best.
        4.  **Song & Lyric Language:** The song title and the lyrics must be in the user-specified language: **${language}**.
        5.  **Prompt Structure:** Each generated prompt must be a comprehensive, single-line string of descriptive tags.
            - It MUST include: genre, mood, key instruments, vocal description (unless 'Không lời'), and the auto-generated BPM.
            - If vocals are 'Không lời', the prompt must include tags like "instrumental" or "no lyrics".
            - It MUST end with technical quality tags like: ", masterful composition, studio quality, rich reverb, stereo mix, 16-bit 44.1kHz".
        
        6.  **Generate Suno Settings (MANDATORY):** For each variation, you MUST also generate recommended settings for 'Weirdness' and 'Style Influence' in VIETNAMESE.
            - **Weirdness:** Provide a percentage range (e.g., '0% - 25%'). This controls creativity vs. predictability. Explain your choice briefly.
            - **Style Influence:** Provide a percentage range (e.g., '50% - 75%'). This controls how strongly the prompt's style tags influence the output. Explain your choice briefly.

        7.  **Output Format:** Your final output MUST be a single, valid JSON array of objects. Each object represents one prompt variation and must contain all the required fields.
        `;

        const userContent = `
        **Input Mode:** "${inputMode}"
        **User Input (Idea or Lyrics):**
        ---
        ${userInput}
        ---
        **Genre:** ${genre}
        **Mood:** ${mood}
        **Vocals:** ${vocals}
        **Language for Title/Lyrics:** ${language}
        **Main Instruments:** ${instruments}

        Please generate the JSON output based on these details.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: userContent,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: {
                                type: Type.STRING,
                                description: `A creative and fitting song title in ${language}.`
                            },
                            prompt: {
                                type: Type.STRING,
                                description: "The full, detailed, single-line prompt in ENGLISH, including all musical and technical details and an auto-generated BPM."
                            },
                            lyrics: {
                                type: Type.STRING,
                                description: `The full song lyrics in ${language}. If inputMode was 'idea', this is the AI-generated lyrics. If inputMode was 'lyrics', this is the user's original lyrics.`
                            },
                            weirdness: {
                                type: Type.OBJECT,
                                properties: {
                                    value: { type: Type.STRING, description: "Recommended percentage range for Weirdness (e.g., '0% - 20%')." },
                                    explanation: { type: Type.STRING, description: "Brief explanation for the Weirdness setting in VIETNAMESE." }
                                },
                                required: ['value', 'explanation']
                            },
                            styleInfluence: {
                                type: Type.OBJECT,
                                properties: {
                                    value: { type: Type.STRING, description: "Recommended percentage range for Style Influence (e.g., '60% - 80%')." },
                                    explanation: { type: Type.STRING, description: "Brief explanation for the Style Influence setting in VIETNAMESE." }
                                },
                                required: ['value', 'explanation']
                            }
                        },
                        required: ['title', 'prompt', 'lyrics', 'weirdness', 'styleInfluence']
                    }
                }
            }
        });

        const parsedResponse: SunoPrompt[] = JSON.parse(response.text);

        if (!parsedResponse || parsedResponse.length === 0) {
            throw new Error("Không thể tạo prompt cho Suno.");
        }
        
        return parsedResponse;

    } catch (error) {
        console.error("Lỗi khi tạo prompts cho Suno:", error);
        if (error instanceof Error) {
            throw new Error(`Đã xảy ra lỗi: ${error.message}`);
        }
        throw new Error("Đã xảy ra lỗi không xác định trong quá trình tạo prompts cho Suno.");
    }
};