import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedPrompt, YouTubeSeoResult, VideoAnalysisResult } from '../types';

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
  };

  if (styleMap[style]) {
    return styleMap[style];
  }
  
  if (style === 'Default') {
      return '';
  }

  return `${style} style, 16:9 aspect ratio`;
};

export const generatePromptsFromScript = async (
  script: string,
  numberOfPrompts: number,
  style: string,
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
  language: 'Tiếng Việt' | 'Tiếng Anh'
): Promise<any[]> => {
  const ai = getAiClient();
  try {
    const styleInstruction = getStyleInstruction(style);
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

    const systemInstruction = `You are an expert animation film producer. Your task is to process a script, character descriptions, style, and duration to create a detailed scene breakdown. The script's dialogue language is ${mainEventsLanguage}.

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
                description: 'The detailed video prompt in English (with original dialogue), prefixed with its sequential number (e.g., "1. [prompt text]").' 
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