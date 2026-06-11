import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

function parseBase64Image(dataUrl: string) {
  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return {
      mimeType: matches[1],
      data: matches[2]
    };
  }
  return {
    mimeType: "image/png",
    data: dataUrl
  };
}

function getValueByPath(obj: any, pathStr: string): any {
  if (!obj || !pathStr) return null;
  const normalizedPath = pathStr.replace(/\[(\d+)\]/g, '.$1');
  const keys = normalizedPath.split('.').filter(Boolean);
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return null;
    current = current[key];
  }
  return current;
}

function sanitizeEndpointAndConfig(config: any): any {
  if (!config) return config;
  const newConfig = { ...config };

  // Combine fields to inspect if they represent pasted code blocks (Python, Node.js, cURL, etc.)
  const allText = `${config.endpoint || ''}\n${config.apiKey || ''}\n${config.model || ''}`;

  if (
    allText.includes('import ') ||
    allText.includes('from ') ||
    allText.includes('client =') ||
    allText.includes('base_url=') ||
    allText.includes('api_key=') ||
    allText.includes('curl ') ||
    allText.includes('--url') ||
    (config.endpoint && config.endpoint.trim().includes('\n'))
  ) {
    console.log(`[RENDER API] Sanitizer: Detected code block / script payload in config fields. Extracting keys...`);

    // Extract Endpoint / Base URL
    const baseUrlRegexs = [
      /base_url\s*[:=]\s*["']([^"']+)["']/i,
      /baseURL\s*[:=]\s*["']([^"']+)["']/i,
      /endpoint\s*[:=]\s*["']([^"']+)["']/i,
      /https?:\/\/[^\s"'#\)\{\}\[\]]+/i
    ];

    for (const regex of baseUrlRegexs) {
      const match = allText.match(regex);
      if (match) {
        let extractedUrl = match[1] || match[0];
        // Strip quotes or structural chars
        extractedUrl = extractedUrl.replace(/["'\n\s\),\;]/g, '').replace(/\/+$/, '');
        if (extractedUrl.startsWith('http')) {
          newConfig.endpoint = extractedUrl;
          break;
        }
      }
    }

    // Extract API Key
    const apiKeyRegexs = [
      /api_key\s*[:=]\s*["']([^"']+)["']/i,
      /apiKey\s*[:=]\s*["']([^"']+)["']/i,
      /Bearer\s+([^"'\s]+)/i
    ];

    let foundKey = false;
    for (const regex of apiKeyRegexs) {
      const match = allText.match(regex);
      if (match && match[1]) {
        newConfig.apiKey = match[1].trim();
        foundKey = true;
        break;
      }
    }

    // Dynamic Env Var lookups (if code refers to os.environ.get("MIMO_API_KEY") etc.)
    if (!foundKey) {
      const envVarMatch = allText.match(/os\.environ\.get\(\s*["']([^"']+)["']\s*\)/) ||
                          allText.match(/os\.environ\[\s*["']([^"']+)["']\s*\]/) ||
                          allText.match(/process\.env\.([A-Za-z0-9_]+)/);
      if (envVarMatch && envVarMatch[1]) {
        const envVarName = envVarMatch[1];
        if (process.env[envVarName]) {
          newConfig.apiKey = process.env[envVarName]!;
          console.log(`[RENDER API] Sanitizer: Successfully queried env value from process.env.${envVarName}`);
        }
      }
    }

    // Extract Model Name
    const modelRegexs = [
      /model\s*[:=]\s*["']([^"']+)["']/i,
      /model_name\s*[:=]\s*["']([^"']+)["']/i
    ];
    for (const regex of modelRegexs) {
      const match = allText.match(regex);
      if (match && match[1]) {
        newConfig.model = match[1].trim();
        break;
      }
    }
  }

  // General URL validation: ensure we don't try to query multi-line string or invalid chars as URL
  if (newConfig.endpoint) {
    if (newConfig.endpoint.includes('\n') || newConfig.endpoint.includes(' ')) {
      const urlMatch = newConfig.endpoint.match(/https?:\/\/[^\s"'#\)]+/);
      if (urlMatch) {
        newConfig.endpoint = urlMatch[0];
      }
    }
    // Clean trailing endpoints
    newConfig.endpoint = newConfig.endpoint
      .replace(/\/images\/generations$/, "")
      .replace(/\/chat\/completions$/, "")
      .replace(/\/+$/, "");
  }

  return newConfig;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set body parsers with larger limit to accept uploaded images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Routes
  app.post("/api/render", async (req, res) => {
    try {
      let { image, prompt, customApiConfig } = req.body;
      if (!image) {
        return res.status(400).json({ error: "请先上传需要渲染的图片" });
      }

      // Automatically sanitize and parse potential code snippets/tokens
      customApiConfig = sanitizeEndpointAndConfig(customApiConfig);

      const { mimeType, data } = parseBase64Image(image);

      console.log(`[RENDER API] Starting image regeneration with prompt: ${prompt}`);

      // Handle OpenAI / OpenAI-compatible model API custom connection
      if (customApiConfig && customApiConfig.provider === 'openai' && customApiConfig.apiKey) {
        const baseUrl = (customApiConfig.endpoint || "https://api.openai.com/v1").replace(/\/+$/, '');
        const imagesEndpoint = `${baseUrl}/images/generations`;
        const modelName = customApiConfig.model || "dall-e-3";
        
        console.log(`[RENDER API] Calling OpenAI-compatible endpoint: ${imagesEndpoint} with model ${modelName}`);
        
        const responseOpenAI = await fetch(imagesEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${customApiConfig.apiKey}`
          },
          body: JSON.stringify({
            model: modelName,
            prompt: `Cinematic high-fidelity photography. ${prompt}. Recreate the main subject of original image with maximum realistic and correct perspectives, standard proportional composition.`,
            n: 1,
            size: "512x512",
            response_format: "b64_json"
          })
        });

        if (!responseOpenAI.ok) {
          const errMsg = await responseOpenAI.text();
          let parsedErr;
          try {
            parsedErr = JSON.parse(errMsg);
          } catch(e) {}
          const friendlyError = parsedErr?.error?.message || errMsg || "API call failed";
          throw new Error(`OpenAI兼容接口呼叫失败 Status:${responseOpenAI.status} - ${friendlyError}`);
        }

        const resData = await responseOpenAI.json();
        const base64Enc = resData?.data?.[0]?.b64_json || resData?.data?.[0]?.url;
        if (!base64Enc) {
          throw new Error("OpenAI-compatible endpoint didn't return any suitable image payload (b64_json/url)");
        }

        const finalImageUrl = base64Enc.startsWith('http') || base64Enc.startsWith('data:') ? base64Enc : `data:image/png;base64,${base64Enc}`;
        console.log("[RENDER API] OpenAI-compatible Image generated successfully.");
        return res.json({ imageUrl: finalImageUrl, textResponse: `由自定义 OpenAI 兼容绘图引擎渲染 (模型: ${modelName})` });
      }

      // Handle SiliconFlow Image Generation APIs
      if (customApiConfig && customApiConfig.provider === 'siliconflow' && customApiConfig.apiKey) {
        const baseUrl = (customApiConfig.endpoint || "https://api.siliconflow.cn/v1").replace(/\/+$/, '');
        const imagesEndpoint = `${baseUrl}/images/generations`;
        const modelName = customApiConfig.model || "black-forest-labs/FLUX.1-schnell";
        
        console.log(`[RENDER API] Calling SiliconFlow endpoint: ${imagesEndpoint} with model ${modelName}`);
        
        const responseSF = await fetch(imagesEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${customApiConfig.apiKey}`
          },
          body: JSON.stringify({
            model: modelName,
            prompt: `Cinematic high-fidelity photography, perfect lighting, correct proportions. ${prompt}`,
            image_size: "512x512",
            batch_size: 1
          })
        });

        if (!responseSF.ok) {
          const errMsg = await responseSF.text();
          let parsedErr;
          try {
            parsedErr = JSON.parse(errMsg);
          } catch(e) {}
          const friendlyError = parsedErr?.message || parsedErr?.error?.message || errMsg || "API call failed";
          throw new Error(`硅基流动接口呼叫失败 Status:${responseSF.status} - ${friendlyError}`);
        }

        const resData = await responseSF.json();
        const extractedImage = resData?.images?.[0]?.url || resData?.data?.[0]?.url || resData?.data?.[0]?.b64_json;
        if (!extractedImage) {
          throw new Error("硅基流动没有返回有效的图片 payload (images[0].url / data[0].url / data[0].b64_json)");
        }

        const finalImageUrl = extractedImage.startsWith('http') || extractedImage.startsWith('data:') ? extractedImage : `data:image/png;base64,${extractedImage}`;
        console.log("[RENDER API] SiliconFlow Image generated successfully.");
        return res.json({ imageUrl: finalImageUrl, textResponse: `由硅基流动 SiliconFlow 图像大模型渲染 (模型: ${modelName})` });
      }

      // Handle fully Custom REST API connection
      if (customApiConfig && customApiConfig.provider === 'custom_rest' && customApiConfig.endpoint) {
        const url = customApiConfig.endpoint;
        const method = customApiConfig.customMethod || "POST";
        
        // Parse Headers
        let headers: Record<string, string> = { "Content-Type": "application/json" };
        if (customApiConfig.customHeaders) {
          try {
            headers = { ...headers, ...JSON.parse(customApiConfig.customHeaders) };
          } catch (e: any) {
            console.error("[RENDER API] Failed to parse custom headers JSON:", e);
          }
        }
        if (customApiConfig.apiKey) {
          headers["Authorization"] = headers["Authorization"] || `Bearer ${customApiConfig.apiKey}`;
        }

        // Parse and replace placeholders in Body
        let body: any = null;
        if (method !== 'GET' && method !== 'HEAD') {
          let bodyStr = customApiConfig.customBodyTemplate || `{"prompt": "\${PROMPT}", "image": "\${IMAGE_DATA_URI}"}`;
          // Replace placeholders (escaping quotes to avoid JSON syntax breaking)
          const escapedPrompt = prompt.replace(/"/g, '\\"').replace(/\n/g, '\\n');
          bodyStr = bodyStr
            .replace(/\$\{PROMPT\}/g, escapedPrompt)
            .replace(/\$\{IMAGE_BASE64\}/g, data)
            .replace(/\$\{IMAGE_DATA_URI\}/g, image);
          
          try {
            body = JSON.parse(bodyStr);
          } catch (e: any) {
            // If body template is not valid JSON after rendering, send as string
            body = bodyStr;
          }
        }

        console.log(`[RENDER API] Calling custom REST API [${method}] to: ${url}`);
        
        const responseCustom = await fetch(url, {
          method,
          headers,
          body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
        });

        if (!responseCustom.ok) {
          const errMsg = await responseCustom.text();
          throw new Error(`定制大模型接口响应异常 [${responseCustom.status}]: ${errMsg}`);
        }

        const resData = await responseCustom.json();
        
        // Extract using responsePath
        const responsePath = customApiConfig.customResponsePath || "imageUrl";
        const extractedValue = getValueByPath(resData, responsePath);
        
        if (!extractedValue) {
          console.error("[RENDER API] Full API response for debugging:", resData);
          throw new Error(`解析大模型响应失败：无法在返回包中通过路径「${responsePath}」找到有效的图像。`);
        }

        const finalImageUrl = extractedValue.startsWith('http') || extractedValue.startsWith('data:') ? extractedValue : `data:image/png;base64,${extractedValue}`;
        
        return res.json({ 
          imageUrl: finalImageUrl, 
          textResponse: `由高级自定义 REST 大模型端渲染 (URL: ${url})` 
        });
      }

      // Handle custom or standard Gemini Multi-modal API connection
      let activeAi = ai;
      if (customApiConfig && customApiConfig.provider === 'gemini' && customApiConfig.apiKey) {
        console.log(`[RENDER API] Instantiating custom GoogleGenAI client with user-provided API key.`);
        activeAi = new GoogleGenAI({
          apiKey: customApiConfig.apiKey,
          httpOptions: {
            baseUrl: customApiConfig.endpoint || undefined,
            headers: {
              'User-Agent': 'aistudio-build-custom',
            }
          }
        });
      }

      const response = await activeAi.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: data,
                mimeType: mimeType,
              },
            },
            {
              text: `你是一个专业的3D相机渲染器与图像重绘系统。你需要根据用户提供的这张参考图片，配合提示词指令，生成一张高画质的、视角符合相机参数要求的逼真重画图片。
              
视角提示词摄影指令：
${prompt}

请在图像中：
1. 延续并保持原图中的主体（人物、角色、物体、核心场景、色调等）的总体造型与视觉风格。
2. 彻底重新摆放机位和视角。例如将相机移动到指定的水平、垂直偏角、景别。
3. 严格遵循提示词中的视角、角度、景别与镜头大小指示，将这些指示视作你最终摄影生成画面的构图法则。
请直接生成并输出修改、渲染全新视角后的最终图片。`,
            },
          ],
        },
      });

      let generatedImageUrl: string | null = null;
      let textResponse = "";

      if (response?.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64Enc = part.inlineData.data;
            const mimeStr = part.inlineData.mimeType || "image/png";
            generatedImageUrl = `data:${mimeStr};base64,${base64Enc}`;
          } else if (part.text) {
            textResponse += part.text;
          }
        }
      }

      if (!generatedImageUrl) {
        console.warn("[RENDER API] No inlineData found. Received text response:", textResponse);
        return res.status(500).json({
          error: "生成新视角图片失败：模型未返回任何图片。由于安全策略或生成不匹配，通常会返回一段文本：\n" + (textResponse || "未提供原因。")
        });
      }

      console.log("[RENDER API] Image generated successfully.");
      return res.json({ imageUrl: generatedImageUrl, textResponse });

    } catch (error: any) {
      console.error("[RENDER API] Error detail:", error);
      
      // Extract properties manually to build a robust diagnostic text
      let errorString = "";
      if (error) {
        try {
          const props = Object.getOwnPropertyNames(error).reduce((acc: any, key) => {
            acc[key] = error[key];
            return acc;
          }, {});
          errorString = JSON.stringify(props);
        } catch (e) {
          errorString = String(error) + " " + (error?.message || "");
        }
      }

      const errMessage = error?.message ? String(error.message) : "";
      const errString = String(error);
      const errStack = error?.stack ? String(error.stack) : "";
      const errCode = error?.code ? String(error.code) : "";
      const errStatus = error?.status ? String(error.status) : "";
      const errStatusCode = error?.statusCode ? String(error.statusCode) : "";
      
      const fullDiagnosticText = [
        errMessage,
        errString,
        errStack,
        errCode,
        errStatus,
        errStatusCode,
        errorString
      ].join(" | ").toLowerCase();

      const isQuota = fullDiagnosticText.includes("resource_exhausted") || 
                      fullDiagnosticText.includes("429") || 
                      fullDiagnosticText.includes("quota") || 
                      fullDiagnosticText.includes("rate_limit") || 
                      fullDiagnosticText.includes("limit_exceeded") || 
                      fullDiagnosticText.includes("limit exceeded") ||
                      error?.status === "RESOURCE_EXHAUSTED" ||
                      error?.code === 429 ||
                      error?.status === 429 ||
                      error?.statusCode === 429;
      
      if (isQuota) {
        console.log("[RENDER API] Quota limit exceeded. Informing client for premium fallback rendering mapping.");
        return res.status(200).json({
          fallback: true,
          errorType: "QUOTA_EXCEEDED",
          message: "您的 Gemini 免费额度已耗尽 (RESOURCE_EXHAUSTED 429)。已为您自动激活内置的「VisionMatrix Pro - 物理级 3D 摄影几何投影模拟引擎」，您仍可实时调整 3D 摄像机并交互预览！",
          imageUrl: req.body?.image
        });
      }
      
      return res.status(500).json({ error: error.message || "服务器由于网络或API原因渲染失败，请检查并重试" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html for all single-page app routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
