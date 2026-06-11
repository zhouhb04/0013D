/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Copy, 
  Check, 
  RotateCcw, 
  Image as ImageIcon, 
  Eye, 
  Download, 
  ArrowRight, 
  HelpCircle,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sliders,
  Flame,
  Settings,
  Key,
  Globe,
  Cpu,
  Compass,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CameraParameters, ThemeMode, CustomApiConfig } from './types';
import { mapParametersToPrompt } from './utils/promptMapper';
import CameraVisualizer from './components/CameraVisualizer';
import PanoramaViewer from './components/PanoramaViewer';
import Header from './components/Header';

// Helper to locally generate beautiful high-fidelity synthetic image presets
function generatePreset(type: 'avatar' | 'car'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (type === 'avatar') {
    // Cyberpunk portrait avatar
    const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 300);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(1, '#090514');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Grid lines
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 512; i += 32) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
    }

    // Glowing circles
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(256, 256, 120, 0, Math.PI * 2); ctx.stroke();

    ctx.strokeStyle = '#22d3ee';
    ctx.beginPath(); ctx.arc(256, 256, 150, 0, Math.PI * 2); ctx.stroke();

    // Stylized face/helmet silhouette
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.arc(256, 230, 60, 0, Math.PI * 2);
    ctx.fill();

    // Body shoulders
    ctx.beginPath();
    ctx.moveTo(176, 400);
    ctx.lineTo(196, 300);
    ctx.lineTo(316, 300);
    ctx.lineTo(336, 400);
    ctx.closePath();
    ctx.fill();

    // Futuristic glowing visor
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(216, 210, 80, 25);
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 15;
    ctx.fillRect(216, 210, 80, 25);
    ctx.shadowBlur = 0; // reset

    // Text label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CYBER_UNIT_72', 256, 450);
  } else {
    // Hypercar profile
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#111827');
    grad.addColorStop(1, '#030712');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Tech blueprint grid
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.15)';
    for (let i = 0; i < 512; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
    }

    // Car silhouette glowing yellow lights
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#fbbf24';
    // left light
    ctx.beginPath();
    ctx.moveTo(120, 280); ctx.lineTo(180, 275); ctx.lineTo(200, 290); ctx.closePath();
    ctx.fill();
    // right light
    ctx.beginPath();
    ctx.moveTo(392, 280); ctx.lineTo(332, 275); ctx.lineTo(312, 290); ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Grill outline
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(180, 290);
    ctx.lineTo(220, 340);
    ctx.lineTo(292, 340);
    ctx.lineTo(332, 290);
    ctx.closePath();
    ctx.stroke();

    // Car logo badge
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(256, 310, 8, 0, Math.PI * 2);
    ctx.fill();

    // Brand Label
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HYPER_DRIVE_X', 256, 440);
  }

  return canvas.toDataURL('image/png');
}

const DEFAULT_PARAMS: CameraParameters = {
  horizontalAngle: 0.0,
  verticalAngle: 0.0,
  distance: 6.0,
  digitalZoom: 1.0,
};

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>('light');

  const [activeViewMode, setActiveViewMode] = useState<'camera' | 'panorama'>('camera');
  const [cameraParams, setCameraParams] = useState<CameraParameters>(DEFAULT_PARAMS);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [renderedImage, setRenderedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [fullPreviewModal, setFullPreviewModal] = useState<string | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  const [showApiSettings, setShowApiSettings] = useState<boolean>(false);
  const [customApi, setCustomApi] = useState<CustomApiConfig>(() => {
    const defaults: CustomApiConfig = {
      provider: 'default',
      apiKey: '',
      endpoint: '',
      model: '',
      customMethod: 'POST',
      customHeaders: '{\n  "Content-Type": "application/json"\n}',
      customBodyTemplate: '{\n  "prompt": "${PROMPT}",\n  "image": "${IMAGE_DATA_URI}"\n}',
      customResponsePath: 'imageUrl'
    };

    try {
      const saved = localStorage.getItem('camera_app_custom_api');
      if (saved) {
        return { ...defaults, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Local storage API parsing error:", e);
    }
    return defaults;
  });

  // Sync API configuration changes to localStorage
  useEffect(() => {
    localStorage.setItem('camera_app_custom_api', JSON.stringify(customApi));
  }, [customApi]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync theme with body and local storage (Fixed to Light Mode)
  useEffect(() => {
    localStorage.setItem('camera_app_theme', 'light');
    const bodyClass = document.body.classList;
    bodyClass.add('bg-[#fafafc]');
    bodyClass.remove('bg-slate-950', 'bg-[#050505]');
  }, []);

  const toggleTheme = () => {
    // Locked to light mode
  };

  // 1. Interactive slider updates
  const handleParamChange = (field: keyof CameraParameters, val: number) => {
    setCameraParams((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleVisualizerChange = (newParams: Partial<CameraParameters>) => {
    setCameraParams((prev) => ({
      ...prev,
      ...newParams,
    }));
  };

  const resetParams = () => {
    setCameraParams(DEFAULT_PARAMS);
  };

  // Map parameters to photography tags
  const mappedObj = mapParametersToPrompt(cameraParams);

  // 2. Drag & Drop Upload Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('请提供有效的图片文件 (png, jpeg 等)。');
      return;
    }
    setError(null);
    setIsFallbackMode(false);
    setFallbackMessage(null);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
      setRenderedImage(null); // clear old render on new upload
    };
  };

  const loadPresetImage = (type: 'avatar' | 'car') => {
    setError(null);
    setIsFallbackMode(false);
    setFallbackMessage(null);
    const presetBase64 = generatePreset(type);
    setUploadedImage(presetBase64);
    setRenderedImage(null);
  };

  // 3. Form copy action
  const copyPromptText = () => {
    navigator.clipboard.writeText(mappedObj.fullPrompt);
    setCopySuccess(true);
    setTimeout(() => {
      setCopySuccess(false);
    }, 2000);
  };

  // 4. Invoke Server API to trigger Gemini Multimodal POV Render
  const triggerRender = async () => {
    if (!uploadedImage) {
      setError("请先上传一张参考图片或选择下方预设进行测试。");
      return;
    }

    if (customApi.provider !== 'default' && !customApi.apiKey.trim()) {
      setError("您已选择自定义线路，但尚未输入 API KEY 密钥。请先在适配面板中填写。");
      return;
    }

    setLoading(true);
    setError(null);

    // Sanitize parameters to avoid whitespace copy-paste errors
    const sanitizedConfig = {
      ...customApi,
      apiKey: customApi.apiKey.trim(),
      endpoint: customApi.endpoint.trim(),
      model: customApi.model.trim()
    };

    try {
      const response = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: uploadedImage,
          prompt: mappedObj.fullPrompt,
          customApiConfig: sanitizedConfig
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "调用渲染接口异常");
      }

      if (data.fallback) {
        setIsFallbackMode(true);
        setFallbackMessage(data.message);
        setRenderedImage(data.imageUrl);
      } else {
        setIsFallbackMode(false);
        setFallbackMessage(null);
        setRenderedImage(data.imageUrl);
      }
    } catch (err: any) {
      console.error("Renderer error:", err);
      setError(err.message || "相机视角渲染请求失败，请检查您的 Gemini API 密钥或网络情况，稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen px-4 md:px-8 py-6 flex flex-col items-center transition-colors duration-300 relative overflow-hidden ${
      theme === 'light' ? 'bg-[#f4f4f9] text-zinc-900 font-sans' : 'bg-[#0a0a0c] text-zinc-100 font-sans'
    }`} id="main-app-container">
      
      {/* Background Organic/Liquid Color Blobs behind glass */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" id="liquid-glass-background-blobs">
        <div className="absolute top-[5%] left-[5%] w-[45vw] h-[45vw] rounded-full filter blur-[120px] opacity-25 dark:opacity-20 animate-fluid-1 bg-gradient-to-tr from-[#007aff] to-[#34c759] transition-opacity duration-500" />
        <div className="absolute top-[40%] right-[-10%] w-[50vw] h-[50vw] rounded-full filter blur-[140px] opacity-28 dark:opacity-22 animate-fluid-2 bg-gradient-to-br from-[#af52de] to-[#ff9500] transition-opacity duration-500" />
        <div className="absolute bottom-[-10%] left-[15%] w-[40vw] h-[40vw] rounded-full filter blur-[110px] opacity-22 dark:opacity-18 animate-fluid-1 bg-gradient-to-r from-[#ff2d55] to-[#5856d6] transition-opacity duration-500" />
      </div>
      
      {/* Maximum Container constraint */}
      <div className="w-full max-w-7xl relative z-10">
        
        {/* Modern Applet Header */}
        <Header theme={theme} toggleTheme={toggleTheme} />

         {/* Global Error Notice if any */}
        {error && (
          <div className="w-full p-5 mb-6 rounded-xl border bg-red-500/10 border-red-500/20 text-red-500 text-sm flex flex-col gap-4 animate-fade-in" id="global-error-container">
            <div className="flex items-start gap-2.5">
              <span className="font-semibold block mt-0.5 text-lg">⚠️</span>
              <div className="flex-1 text-left">
                <span className="font-bold text-base block mb-1">接口响应异常 (API Error Notice)</span>
                <span className="opacity-95 font-mono break-all font-medium block whitespace-pre-wrap">{error}</span>
              </div>
            </div>

            {/* Smart assistance for API/Authentication problems */}
            {(error.toLowerCase().includes("key") || 
              error.toLowerCase().includes("401") || 
              error.toLowerCase().includes("unauthorized") || 
              error.toLowerCase().includes("token") || 
              error.toLowerCase().includes("forbidden") || 
              customApi.provider !== 'default') && (
              <div className={`mt-1 p-4 rounded-lg text-left text-xs leading-relaxed flex flex-col gap-2.5 border ${
                theme === 'light' ? 'bg-white border-slate-200 text-slate-700 font-sans' : 'bg-black/40 border-white/5 text-gray-300 font-sans'
              }`} id="error-troubleshooter-panel">
                <div className="font-bold flex items-center gap-1.5 text-red-400">
                  <span>💡</span>
                  <span>如果您遇到了 API 密钥无效 (401 Unauthorized) 或配置问题，请尝试以下解决方案：</span>
                </div>
                <div className="font-mono text-[11px] space-y-1.5 list-none pl-1">
                  <div>1. <strong>检查 API Key</strong>：请确保在下方自定配置中输入的密钥完整、属于正确接口，且没有多余的前后空格。我们已帮您自动过滤了复制时产生的外围空格。</div>
                  <div>2. <strong>核实接口代理(Endpoint)和模型名(Model Name)</strong>：确保您填写的代理服务商仍有额度，且模型名称完全匹配（例如：<code className="px-1 py-0.5 rounded bg-red-500/10 text-red-400">dall-e-3</code> 或硅基流动的 <code className="px-1 py-0.5 rounded bg-amber-500/10 text-amber-500">black-forest-labs/FLUX.1-schnell</code>）。</div>
                  <div>3. <strong>一键切回内置的免费体验线路</strong>：为降低生成门槛，推荐直接点击下方按钮切换回系统内置的免费 Gemini 额度线路，即可继续免费体验！</div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2 border-t border-dashed border-red-500/20 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomApi(prev => ({ ...prev, provider: 'default' }));
                      setError(null);
                    }}
                    className="px-3.5 py-1.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg cursor-pointer text-[11px] transition-all flex items-center gap-1 shadow-md hover:scale-[1.01] active:scale-[0.99]"
                    id="one-click-restore-default-api"
                  >
                    🚀 一键切换回「平台默认免费线路」并重试
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowApiSettings(true);
                      // Scroll to view the setup form
                      const element = document.getElementById("api-hub-panel");
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className={`px-3 py-1.5 font-semibold rounded-lg text-[11px] transition-all cursor-pointer border ${
                      theme === 'light' 
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' 
                        : 'bg-white/5 hover:bg-white/10 border-white/15 text-white'
                    }`}
                  >
                    🔧 展开并检查 API 配置表单
                  </button>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className={`px-3 py-1.5 font-semibold rounded-lg text-[11px] transition-all cursor-pointer border ${
                      theme === 'light' 
                        ? 'bg-transparent border-slate-300 hover:bg-slate-50 text-slate-650' 
                        : 'bg-transparent border-white/10 hover:bg-white/5 text-zinc-400'
                    }`}
                  >
                    忽略错误
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Two Column Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="app-workspace-grid">
          
          {/* LEFT COLUMN: Sidebar (Image inputs & Results panel) */}
          <motion.div 
            layout="position" 
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
            className="col-span-1 lg:col-span-5 flex flex-col gap-6" 
            id="left-column"
          >
            
            {/* Custom Model / API Hub */}
            <motion.div 
              layout 
              transition={{ type: "spring", stiffness: 220, damping: 26 }}
              className={`p-6 rounded-3xl flex flex-col gap-4 border border-white/10 ${
                theme === 'light' ? 'liquid-glass-light text-zinc-900 shadow-xl shadow-slate-100' : 'liquid-glass-dark text-zinc-100 shadow-2xl shadow-black/40'
              }`} 
              id="api-hub-panel"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200/50 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-[#007aff] to-[#00c7fc] text-white shadow-md shadow-[#007aff]/15">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold tracking-tight text-zinc-800 dark:text-zinc-250">
                      生成接口配置 (API Hub)
                    </h2>
                    <p className="text-[9.5px] text-zinc-450 dark:text-zinc-500 font-normal">网络请求与图像渲染计算管线</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 450, damping: 15 }}
                  type="button"
                  onClick={() => setShowApiSettings(!showApiSettings)}
                  className={`px-3 py-1.5 text-[10.5px] font-semibold rounded-xl transition-all duration-300 cursor-pointer shadow-sm border ${
                    customApi.provider !== 'default'
                      ? 'bg-[#007aff] text-white border-[#007aff]/25 hover:bg-[#006ee6]'
                      : 'bg-white dark:bg-black/20 border-zinc-200/50 dark:border-white/5 text-zinc-650 hover:text-zinc-950 dark:text-zinc-350 dark:hover:text-white'
                  }`}
                >
                  {showApiSettings ? '收起配置' : customApi.provider !== 'default' ? '已启用自定义端' : '展开配置'}
                </motion.button>
              </div>

              {/* Collapsed active status indicator with subtle dynamic dots */}
              {!showApiSettings && (
                <div className="text-left">
                  {customApi.provider === 'default' ? (
                    <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-zinc-100/50 dark:bg-white/5 border border-zinc-200/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                      <p className="text-[10px] text-zinc-500 font-medium">链路就绪: 共享 AI Studio 多并发免费生成通道</p>
                    </div>
                  ) : customApi.provider === 'gemini' ? (
                    <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-[#ef4444]/5 border border-[#ef4444]/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">专属 Gemini Bionic API 特点激活 (模型: Gemini Pro)</p>
                    </div>
                  ) : customApi.provider === 'openai' ? (
                    <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-[#007aff]/5 border border-[#007aff]/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-505 animate-pulse"></span>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">OpenAI 通道在线 (模型: {customApi.model || 'dall-e-3'})</p>
                    </div>
                  ) : customApi.provider === 'siliconflow' ? (
                    <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      <p className="text-[10px] text-amber-600 dark:text-amber-500 font-mono">SiliconFlow 极速微调芯片就绪 (模型: {customApi.model || 'FLUX.1'})</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-teal-500/5 border border-teal-500/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                      <p className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">REST API 通信就绪 (端点: {customApi.endpoint || '未填写'})</p>
                    </div>
                  )}
                </div>
              )}

              {/* Expanded Setup Fields */}
              <AnimatePresence>
                {showApiSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
                    className="overflow-hidden text-left flex flex-col gap-4"
                  >
                    {/* Provider Radio Selector Segmented Capsule */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                        选择生成引擎 / 物理渲染线路 (Providers)
                      </label>
                      <div className="relative p-1 rounded-2xl bg-zinc-200/55 dark:bg-white/5 border border-zinc-200/30 dark:border-white/5 grid grid-cols-5 gap-1">
                        {[
                          { id: 'default', label: '默认' },
                          { id: 'gemini', label: 'Gemini' },
                          { id: 'openai', label: 'OpenAI' },
                          { id: 'siliconflow', label: '硅基' },
                          { id: 'custom_rest', label: 'REST' }
                        ].map((p) => {
                          const isActive = customApi.provider === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setCustomApi(prev => ({ ...prev, provider: p.id as any }))}
                              className={`relative py-1.5 px-0.5 text-[9.5px] font-bold rounded-xl cursor-pointer text-center transition-all duration-300 z-10 ${
                                isActive
                                  ? theme === 'light' ? 'text-[#007aff]' : 'text-cyan-400'
                                  : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
                              }`}
                            >
                              {isActive && (
                                <motion.div 
                                  layoutId="apiProviderTab"
                                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                                  className={`absolute inset-0 rounded-xl -z-10 shadow-sm border ${
                                    theme === 'light' ? 'bg-white border-zinc-250/50' : 'bg-zinc-900 border-white/10'
                                  }`}
                                />
                              )}
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {customApi.provider !== 'default' && (
                      <div className="flex flex-col gap-3 font-mono text-[11px] animate-fade-in">
                        {/* API Key */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <Key className="w-3.5 h-3.5 text-purple-400" />
                            <label className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">
                              API KEY {customApi.provider === 'custom_rest' ? '(授权密钥/选填)' : '(授权密钥/必填)'}
                            </label>
                          </div>
                          <input
                            type="password"
                            placeholder={customApi.provider === 'siliconflow' ? "请输入硅基流动 API 密钥, 如 sk-xxxx..." : "请输入密钥, 例如 sk-xxxx..."}
                            value={customApi.apiKey}
                            onChange={e => setCustomApi(prev => ({ ...prev, apiKey: e.target.value }))}
                            className={`w-full px-3 py-2 rounded-lg text-xs font-mono border transition-all outline-none ${
                              theme === 'light'
                                ? 'bg-white border-slate-300 focus:border-purple-400'
                                : 'bg-black/40 border-white/10 text-white focus:border-purple-500'
                            }`}
                          />
                        </div>

                        {/* Custom Endpoint */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 text-blue-400" />
                            <label className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">
                              {customApi.provider === 'custom_rest' ? 'REST API URL (请求接口端点)' : 'API ENDPOINT (代理端点/非必填)'}
                            </label>
                          </div>
                          <input
                            type="text"
                            placeholder={
                              customApi.provider === 'gemini' 
                                ? 'https://generativelanguage.googleapis.com' 
                                : customApi.provider === 'siliconflow'
                                  ? 'https://api.siliconflow.cn/v1'
                                  : customApi.provider === 'custom_rest'
                                    ? 'https://your-custom-worker.xyz/api/generate'
                                    : 'https://api.openai.com/v1'
                            }
                            value={customApi.endpoint}
                            onChange={e => setCustomApi(prev => ({ ...prev, endpoint: e.target.value }))}
                            className={`w-full px-3 py-2 rounded-lg text-xs font-mono border transition-all outline-none ${
                              theme === 'light'
                                ? 'bg-white border-slate-300 focus:border-blue-400'
                                : 'bg-black/40 border-white/10 text-white focus:border-blue-500'
                            }`}
                          />
                          <p className="text-[9px] text-gray-450 leading-normal">
                            {customApi.provider === 'custom_rest' ? '请输入想要请求的完整的 HTTP REST 地址。' : '留空则在服务器端使用官方端点直接请求。若您处于特定网络环境，请输入此选项。'}
                          </p>
                        </div>

                        {/* Custom Model Name for OpenAI and SiliconFlow */}
                        {(customApi.provider === 'openai' || customApi.provider === 'siliconflow') && (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <Cpu className="w-3.5 h-3.5 text-amber-500" />
                              <label className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">模型名称 (MODEL NAME)</label>
                            </div>
                            <input
                              type="text"
                              placeholder={customApi.provider === 'siliconflow' ? "black-forest-labs/FLUX.1-schnell" : "dall-e-3 (或 flux, sd-xl 等任意文生图模型)"}
                              value={customApi.model}
                              onChange={e => setCustomApi(prev => ({ ...prev, model: e.target.value }))}
                              className={`w-full px-3 py-2 rounded-lg text-xs font-mono border transition-all outline-none ${
                                theme === 'light'
                                  ? 'bg-white border-slate-300 focus:border-amber-400'
                                  : 'bg-black/40 border-white/10 text-white focus:border-amber-500'
                              }`}
                            />
                            <p className="text-[9px] text-gray-450 leading-normal">
                              {customApi.provider === 'siliconflow' 
                                ? '可在硅基流动后台模型列表中选取任意生图模型填入此处。例如 black-forest-labs/FLUX.1-schnell, StabilityAI/stable-diffusion-xl-base-1.0 等。'
                                : '此接口遵循标准的 OpenAI /v1/images/generations 图像生成协议，支持 SiliconFlow、Novita 等第三方汇聚提供商输入任意图片模型名称。'
                              }
                            </p>
                          </div>
                        )}

                        {/* Advanced REST settings for custom_rest */}
                        {customApi.provider === 'custom_rest' && (
                          <div className="flex flex-col gap-3 pt-2 border-t border-dashed border-slate-200 dark:border-white/5 animate-fade-in">
                            <div className="grid grid-cols-2 gap-3">
                              {/* HTTP Method */}
                              <div className="flex flex-col gap-1">
                                <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">HTTP 请求方法</label>
                                <select
                                  value={customApi.customMethod || 'POST'}
                                  onChange={e => setCustomApi(prev => ({ ...prev, customMethod: e.target.value }))}
                                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono border outline-none ${
                                    theme === 'light'
                                      ? 'bg-white border-slate-300 focus:border-teal-400'
                                      : 'bg-black/40 border-white/10 text-white focus:border-teal-500'
                                  }`}
                                >
                                  <option value="POST">POST</option>
                                  <option value="GET">GET</option>
                                  <option value="PUT">PUT</option>
                                </select>
                              </div>

                              {/* JSON extraction path */}
                              <div className="flex flex-col gap-1">
                                <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">解包提取路径 (Response Path)</label>
                                <input
                                  type="text"
                                  placeholder="imageUrl (或 data[0].url / images[0] / output.url)"
                                  value={customApi.customResponsePath}
                                  onChange={e => setCustomApi(prev => ({ ...prev, customResponsePath: e.target.value }))}
                                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono border outline-none ${
                                    theme === 'light'
                                      ? 'bg-white border-slate-300 focus:border-teal-400'
                                      : 'bg-black/40 border-white/10 text-white focus:border-teal-500'
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Custom Headers */}
                            <div className="flex flex-col gap-1">
                              <label className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">自定义请求头 (JSON 格式)</label>
                              <textarea
                                rows={2}
                                value={customApi.customHeaders}
                                onChange={e => setCustomApi(prev => ({ ...prev, customHeaders: e.target.value }))}
                                className={`w-full px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-all outline-none ${
                                  theme === 'light'
                                    ? 'bg-white border-slate-300 focus:border-teal-400'
                                    : 'bg-black/40 border-white/10 text-zinc-300 focus:border-teal-500'
                                }`}
                              />
                            </div>

                            {/* Request Body payload template */}
                            {customApi.customMethod !== 'GET' && (
                              <div className="flex flex-col gap-1">
                                <label className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">
                                  请求 Body 模板 (支持变量替换)
                                </label>
                                <textarea
                                  rows={4}
                                  value={customApi.customBodyTemplate}
                                  onChange={e => setCustomApi(prev => ({ ...prev, customBodyTemplate: e.target.value }))}
                                  className={`w-full px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-all outline-none ${
                                    theme === 'light'
                                      ? 'bg-white border-slate-300 focus:border-teal-400'
                                      : 'bg-black/40 border-white/10 text-zinc-300 focus:border-teal-500'
                                  }`}
                                />
                                <div className="text-[9px] text-gray-450 leading-normal flex flex-col gap-0.5 mt-0.5 p-2 rounded bg-white/5 border border-dashed border-slate-200 dark:border-white/5 text-left">
                                  <span className="font-bold text-orange-400">💡 占位符提示 (提示词与图片已智能转义，防止破坏 JSON 结构):</span>
                                  <span>• <code>{"${PROMPT}"}</code>: 重绘相机构图提示词描述文本</span>
                                  <span>• <code>{"${IMAGE_BASE64}"}</code>: 原参考图纯 Base64 数据 (不含 URI 前缀)</span>
                                  <span>• <code>{"${IMAGE_DATA_URI}"}</code>: 原参考图完整 `data:image/png;base64,...`</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* 1. Reference Image Upload Section */}
            <motion.div 
              layout 
              transition={{ type: "spring", stiffness: 220, damping: 26 }}
              className={`p-6 rounded-3xl flex flex-col gap-4 border border-white/10 ${
                theme === 'light' ? 'liquid-glass-light text-zinc-900 shadow-xl shadow-slate-100' : 'liquid-glass-dark text-zinc-100 shadow-2xl shadow-black/40'
              }`} 
              id="upload-panel"
            >
              
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200/50 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-[#34c759] to-[#30d158] text-white shadow-md shadow-[#34c759]/15">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold tracking-tight text-zinc-800 dark:text-zinc-250">
                      基础参考图像 (Reference Input)
                    </h2>
                    <p className="text-[9.5px] text-zinc-450 dark:text-zinc-500 font-normal">多方位深度重构与标定空间对准点</p>
                  </div>
                </div>
                {uploadedImage && (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 450, damping: 15 }}
                    onClick={() => { setUploadedImage(null); setRenderedImage(null); }}
                    className="px-3 py-1.5 text-[10.5px] font-bold text-red-500 hover:text-red-750 tracking-tight cursor-pointer bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-250/20 shadow-xs"
                  >
                    清除图片
                  </motion.button>
                )}
              </div>
 
              {/* Upload Drop Zone Box */}
              <div 
                className={`relative h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-[#007aff] bg-[#007aff]/5' 
                    : theme === 'light' 
                      ? 'border-zinc-300 hover:border-zinc-450 hover:bg-zinc-50' 
                      : 'border-white/10 hover:border-[#007aff]/30 hover:bg-white/5'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                id="drop-zone"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileInput} 
                  accept="image/*" 
                  className="hidden" 
                />

                {uploadedImage ? (
                  <div className="w-full h-full p-2 relative flex items-center justify-center">
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded reference" 
                      className="max-h-full max-w-full rounded-md object-contain shadow-sm"
                    />
                    <div className="absolute bottom-2 inset-x-2 bg-black/80 text-[10px] text-gray-400 font-mono py-1 px-2 rounded text-center backdrop-blur-sm pointer-events-none">
                      点击或拖入以更换图片
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                      <Upload className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${theme === 'light' ? 'text-slate-600' : 'text-gray-300'}`}>支持鼠标拖放文件到此处</p>
                      <p className="text-[10px] text-gray-500 mt-1">或点击以此处开启手动浏览上传</p>
                    </div>
                    <span className="text-[9px] font-mono text-gray-500 px-2 py-0.5 rounded border border-white/10">PNG, JPG, WEBP</span>
                  </div>
                )}
              </div>

              {/* Instant High Fidelity Preset selection row */}
              <div className={`mt-4 pt-4 border-t ${theme === 'light' ? 'border-zinc-150' : 'border-white/5'}`}>
                <div className="text-[10px] text-zinc-500 uppercase mb-2.5 flex items-center gap-1.5 font-semibold">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>没有素材？尝试官方测试预设 (Raw Presets):</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    onClick={() => loadPresetImage('avatar')}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'bg-slate-100/80 hover:bg-slate-200 text-slate-700'
                        : 'bg-white/5 hover:bg-white/10 text-white'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#007aff] shadow-[0_0_8px_rgba(0,122,255,0.4)]"></span>
                    <span>赛博人像 (Cyber Portrait)</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    onClick={() => loadPresetImage('car')}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'bg-slate-100/80 hover:bg-slate-200 text-slate-700'
                        : 'bg-white/5 hover:bg-white/10 text-white'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#af52de] shadow-[0_0_8px_rgba(175,82,222,0.4)]"></span>
                    <span>未来跑车 (Hypercar)</span>
                  </motion.button>
                </div>
              </div>

            </motion.div>

            {/* 2. Generation Results Area */}
            <motion.div 
              layout 
              transition={{ type: "spring", stiffness: 220, damping: 26 }}
              className={`p-6 rounded-3xl flex flex-col gap-4 border border-white/10 min-h-[350px] ${
                theme === 'light' ? 'liquid-glass-light text-zinc-900 shadow-xl shadow-slate-100' : 'liquid-glass-dark text-zinc-100 shadow-2xl shadow-black/40'
              }`} 
              id="results-panel"
            >
              
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200/50 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-[#ff3b30] to-[#ff453a] text-white shadow-md shadow-[#ff3b30]/15">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold tracking-tight text-zinc-800 dark:text-zinc-250">
                      3D 视角深度重构 (Results Panel)
                    </h2>
                    <p className="text-[9.5px] text-zinc-450 dark:text-zinc-500 font-normal">多点光物理和深度对准三维影像</p>
                  </div>
                </div>
                {renderedImage && (
                  <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-white/5 p-1 rounded-xl border border-zinc-200/50 dark:border-white/5 shadow-xs">
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.85 }}
                      transition={{ type: "spring", stiffness: 450, damping: 15 }}
                      onClick={() => setFullPreviewModal(renderedImage)}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-300 transition-all duration-300 cursor-pointer"
                      title="放大预览"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </motion.button>
                    <motion.a
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.85 }}
                      transition={{ type: "spring", stiffness: 450, damping: 15 }}
                      href={renderedImage}
                      download={`rendered-POV-${mappedObj.horizontalTerm}-${mappedObj.verticalTerm}.png`}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-300 transition-all duration-300 cursor-pointer"
                      title="下载图像"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </motion.a>
                  </div>
                )}
              </div>

              {isFallbackMode && (
                <div className={`mb-4 p-3.5 border rounded-xl text-left text-xs animate-fade-in font-mono flex items-start gap-2.5 transition-all ${
                  theme === 'light'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-cyan-950/20 border-cyan-500/20 text-cyan-300'
                }`}>
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="font-bold uppercase tracking-wider block mb-0.5 text-cyan-100">3D Matrix Projection Lock Active</span>
                    <span>{fallbackMessage}</span>
                    <div className="mt-2 text-[9px] text-gray-500 font-sans leading-relaxed">
                      💡 <strong>实机调试技巧：</strong>您现在可以实时拖拉右侧的「3D 相机参数微调」滑块，系统将 high 频触发 60 FPS 的空间摄影透视、数字倍焦与距离投影映射。
                    </div>
                  </div>
                </div>
              )}

              {/* Graphic Display frame */}
              <div className={`relative flex-1 min-h-[220px] rounded-xl border flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${
                theme === 'light' ? 'bg-slate-50 border-slate-200/80' : 'bg-black/80 border-white/10'
              }`} id="image-display">
                
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="rendering-loader"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="flex flex-col items-center gap-4 p-6 text-center"
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full border-4 border-cyan-400/20 border-t-cyan-400 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-cyan-400">
                          <Camera className="w-4 h-4 animate-pulse" />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest animate-pulse font-mono">
                          Gemini Engine Rendering...
                        </p>
                        <p className="text-gray-500 text-[10px] mt-1.5 max-w-[280px] leading-relaxed">
                          结合 72 Poses 摄影语系正在生成符合水平 {cameraParams.horizontalAngle}°/垂直 {cameraParams.verticalAngle}° 偏移的新机位画卷
                        </p>
                      </div>
                    </motion.div>
                  ) : renderedImage ? (
                    isFallbackMode ? (
                      <motion.div
                        key="fallback-display"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full relative"
                      >
                        <div className="w-full h-full relative flex items-center justify-center bg-black/95 p-6 overflow-hidden group">
                          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                          
                          {/* Retro Camera HUD framing */}
                          <div className="absolute top-3 left-3 font-mono text-[8px] text-cyan-400 opacity-60 flex flex-col gap-0.5">
                            <span>POV_MATRIX: ACTIVE</span>
                            <span>AZIMUTH: {cameraParams.horizontalAngle}°</span>
                          </div>
                          <div className="absolute top-3 right-3 font-mono text-[8px] text-pink-500 opacity-60 flex flex-col items-end gap-0.5">
                            <span>SKS 3D SIMULATOR</span>
                            <span>ELEVATION: {cameraParams.verticalAngle}°</span>
                          </div>
                          
                          {/* Interactive 3D CSS transform wrapper */}
                          <div 
                            className="transition-transform duration-305 ease-out flex items-center justify-center w-full h-full"
                            style={{
                              perspective: '1200px',
                              transformStyle: 'preserve-3d',
                            }}
                          >
                            <div
                              className="relative shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-cyan-500/30 rounded-lg overflow-hidden transition-all duration-300 pointer-events-none"
                              style={{
                                transform: `rotateY(${cameraParams.horizontalAngle}deg) rotateX(${-cameraParams.verticalAngle}deg) scale(${cameraParams.digitalZoom * (1.2 - (cameraParams.distance - 6) * 0.05)})`,
                                transformStyle: 'preserve-3d',
                                maxWidth: '180px',
                                maxHeight: '180px',
                              }}
                            >
                              <img 
                                src={renderedImage} 
                                alt="3D Processed visualization fallback" 
                                className="object-contain w-full h-full select-none"
                              />
                              {/* Interactive scanline, futuristic grid or radar-like light overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/15 to-transparent pointer-events-none mix-blend-overlay"></div>
                              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[size:100%_4px,_6px_100%] opacity-40"></div>
                            </div>
                          </div>

                          <div className="absolute bottom-2 right-2 bg-pink-500/95 text-[8px] text-white font-mono py-1 px-2.5 rounded border border-pink-400/30 backdrop-blur-sm shadow-md uppercase tracking-wider">
                            SIMULATOR_3D: {mappedObj.horizontalTerm} | {mappedObj.verticalTerm}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="real-image-display"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full relative"
                      >
                        <div className="w-full h-full relative group">
                          <img 
                            src={renderedImage} 
                            alt="Rendered outcome" 
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute bottom-2 right-2 bg-black/80 text-[9px] text-cyan-400 font-mono py-1 px-2.5 rounded border border-cyan-500/30 backdrop-blur-sm shadow-md uppercase tracking-wider">
                            {mappedObj.horizontalTerm} | {mappedObj.verticalTerm}
                          </div>
                        </div>
                      </motion.div>
                    )
                  ) : (
                    <motion.div
                      key="idle-placeholder"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 text-center max-w-sm flex flex-col items-center gap-2"
                    >
                      <div className="w-10 h-10 rounded-lg bg-black/20 border border-white/5 flex items-center justify-center text-gray-500">
                        <Eye className="w-5 h-5 opacity-40" />
                      </div>
                      <p className={`text-xs font-semibold ${theme === 'light' ? 'text-slate-600' : 'text-gray-400'}`}>视角改变画面待渲染</p>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        在右侧调整 3D 相机拍摄方向与数字变焦，然后点击底部的渲染按钮，模型将重现该角度的三维投影画卷。
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>


          </div>

              {/* Render generation action trigger */}
              <div className="mt-4 font-sans">
                <motion.button
                  whileHover={uploadedImage && !loading ? { scale: 1.015, y: -0.5 } : {}}
                  whileTap={uploadedImage && !loading ? { scale: 0.985, y: 0.5 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  type="button"
                  onClick={triggerRender}
                  disabled={loading || !uploadedImage}
                  className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 border-[0.5px] ${
                    !uploadedImage 
                      ? theme === 'light'
                        ? 'bg-zinc-100 text-zinc-405 border-zinc-200 cursor-not-allowed'
                        : 'bg-zinc-900/60 text-zinc-650 cursor-not-allowed border-zinc-800' 
                      : loading
                        ? 'bg-[#007aff]/80 text-white cursor-wait border-transparent'
                        : theme === 'light'
                          ? 'bg-[#007aff] hover:bg-[#006ee6] text-white cursor-pointer shadow-sm border-transparent'
                          : 'bg-[#007aff] hover:bg-[#006ee6] text-white border-transparent cursor-pointer'
                  }`}
                  id="render-action-btn"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>正在重构摄影视角...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>重绘该视角 (Render Spot Preview)</span>
                    </>
                  )}
                </motion.button>
              </div>

            </motion.div>

          </motion.div>

          {/* RIGHT COLUMN: Camera Controls & 3D Interactive Scene */}
          <div className="col-span-1 lg:col-span-7 flex flex-col gap-6 font-sans text-left" id="right-column">
            
            {/* Elegant Mode Switcher Tabs */}
            <div className={`p-0.5 rounded-lg flex items-center transition-all ${
              theme === 'light'
                ? 'bg-zinc-200/60 border border-zinc-200'
                : 'bg-zinc-900 border border-white/5'
            }`} id="mode-switcher-tabs">
              <button
                type="button"
                onClick={() => setActiveViewMode('camera')}
                className={`flex-1 py-1.5 px-3 rounded-md font-medium text-[11px] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                  activeViewMode === 'camera'
                    ? theme === 'light'
                      ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                      : 'bg-zinc-700 text-white font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-[#007aff]" />
                <span>3D相机参数调试</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('panorama')}
                className={`flex-1 py-1.5 px-3 rounded-md font-medium text-[11px] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                  activeViewMode === 'panorama'
                    ? theme === 'light'
                      ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                      : 'bg-zinc-700 text-white font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-[#af52de]" />
                <span>3D 360°全景漫游</span>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeViewMode === 'camera' ? (
                <motion.div
                  key="camera-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                  className="flex flex-col gap-6 w-full"
                >
                {/* Camera Frustum Visualizer Panel */}
                <div className={`p-6 rounded-3xl flex flex-col gap-4 transition-all duration-500 border border-white/10 ${
                  theme === 'light' ? 'liquid-glass-light text-zinc-900 shadow-xl shadow-slate-100' : 'liquid-glass-dark text-zinc-100 shadow-2xl shadow-black/40'
                }`} id="camera-visualizer-panel">
                  
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200/50 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-gradient-to-tr from-[#007aff] to-[#00c7fc] text-white shadow-md shadow-[#007aff]/15">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-xs font-bold tracking-tight text-zinc-800 dark:text-zinc-250">
                          相机三维轴向追踪 (Visualizer Plane)
                        </h2>
                        <p className="text-[9.5px] text-zinc-450 dark:text-zinc-500 font-normal">多方位实景三维机位视景分析仪</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950/10 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 text-[10px] font-mono text-zinc-650 dark:text-zinc-300">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007aff] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#007aff]"></span>
                      </span>
                      <span>3D TRACKER READY</span>
                    </div>
                  </div>

                  {/* The high tech Three.js Camera viewport canvas */}
                  <CameraVisualizer 
                    params={cameraParams} 
                    onChange={handleVisualizerChange} 
                    imageSrc={uploadedImage} 
                    theme={theme}
                  />
                </div>

                {/* Parameter Adjustment Panel */}
                <div className={`p-6 rounded-3xl flex flex-col gap-5 transition-all duration-500 border border-white/10 ${
                  theme === 'light' ? 'liquid-glass-light text-zinc-900 shadow-xl shadow-slate-100' : 'liquid-glass-dark text-zinc-100 shadow-2xl shadow-black/40'
                }`} id="parameters-panel">
                  
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200/50 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-gradient-to-tr from-[#af52de] to-[#ff2d55] text-white shadow-md shadow-[#af52de]/15">
                        <Sliders className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-xs font-bold tracking-tight text-zinc-800 dark:text-zinc-250">
                          相机三维射角标定 (Matrix Alignment)
                        </h2>
                        <p className="text-[9.5px] text-zinc-450 dark:text-zinc-500 font-normal">三维多向机械空间传感器状态调校</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={resetParams}
                      className="px-3 py-1.5 text-[10.5px] font-bold rounded-xl flex items-center gap-1 border bg-white dark:bg-black/20 border-zinc-200 shadow-sm text-zinc-650 hover:text-zinc-950 transition-all duration-300 cursor-pointer"
                      id="reset-params-btn"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>复位参数</span>
                    </button>
                  </div>

                  {/* Sliders Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    
                    {/* A. Horizontal Angle Slider */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <div className="flex items-center justify-between">
                        <label className={`text-[11px] font-bold tracking-wider uppercase ${
                          theme === 'light' ? 'text-slate-600' : 'text-gray-400'
                        }`}>水平拍摄夹角</label>
                        <span className="text-xs font-mono font-bold text-cyan-400">{cameraParams.horizontalAngle}°</span>
                      </div>
                      <input 
                        type="range"
                        min="-180"
                        max="180"
                        step="0.5"
                        value={cameraParams.horizontalAngle}
                        onChange={(e) => handleParamChange('horizontalAngle', parseFloat(e.target.value))}
                        className="w-full h-1 rounded-lg bg-black/40 border border-white/10 accent-cyan-400 cursor-pointer"
                      />
                      <div className="flex justify-between text-[8px] text-gray-500 font-mono uppercase tracking-wide">
                        <span>后视角 -180°</span>
                        <span>正面 0°</span>
                        <span>后视角 180°</span>
                      </div>
                    </div>

                    {/* B. Vertical Angle Slider */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <div className="flex items-center justify-between">
                        <label className={`text-[11px] font-bold tracking-wider uppercase ${
                          theme === 'light' ? 'text-slate-600' : 'text-gray-400'
                        }`}>俯仰拍摄高度</label>
                        <span className="text-xs font-mono font-bold text-pink-400">{cameraParams.verticalAngle}°</span>
                      </div>
                      <input 
                        type="range"
                        min="-90"
                        max="90"
                        step="0.5"
                        value={cameraParams.verticalAngle}
                        onChange={(e) => handleParamChange('verticalAngle', parseFloat(e.target.value))}
                        className="w-full h-1 rounded-lg bg-black/40 border border-white/10 accent-pink-550 cursor-pointer"
                      />
                      <div className="flex justify-between text-[8px] text-gray-500 font-mono uppercase tracking-wide">
                        <span>仰拍 -90°</span>
                        <span>平视 0°</span>
                        <span>鸟瞰 90°</span>
                      </div>
                    </div>

                    {/* C. Virtual Distance Slider */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <div className="flex items-center justify-between">
                        <label className={`text-[11px] font-bold tracking-wider uppercase ${
                          theme === 'light' ? 'text-slate-600' : 'text-gray-400'
                        }`}>虚拟摄影焦距 (距离)</label>
                        <span className="text-xs font-mono font-bold text-yellow-500">{cameraParams.distance}m</span>
                      </div>
                      <input 
                        type="range"
                        min="2"
                        max="15"
                        step="0.1"
                        value={cameraParams.distance}
                        onChange={(e) => handleParamChange('distance', parseFloat(e.target.value))}
                        className="w-full h-1 rounded-lg bg-black/40 border border-white/10 accent-yellow-400 cursor-pointer"
                      />
                      <div className="flex justify-between text-[8px] text-gray-500 font-mono uppercase tracking-wide">
                        <span>特写 2.0m</span>
                        <span>中远景 6.0m</span>
                        <span>全身景 15.0m</span>
                      </div>
                    </div>

                    {/* D. Digital Zoom Slider */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <div className="flex items-center justify-between">
                        <label className={`text-[11px] font-bold tracking-wider uppercase ${
                          theme === 'light' ? 'text-slate-600' : 'text-gray-400'
                        }`}>数字画面缩放 (视域/FOV)</label>
                        <span className="text-xs font-mono font-bold text-teal-400">{cameraParams.digitalZoom}x</span>
                      </div>
                      <input 
                        type="range"
                        min="0.5"
                        max="3.0"
                        step="0.1"
                        value={cameraParams.digitalZoom}
                        onChange={(e) => handleParamChange('digitalZoom', parseFloat(e.target.value))}
                        className="w-full h-1 rounded-lg bg-black/40 border border-white/10 accent-teal-400 cursor-pointer"
                      />
                      <div className="flex justify-between text-[8px] text-gray-500 font-mono uppercase tracking-wide">
                        <span>鱼眼 0.5x</span>
                        <span>标准 1.0x</span>
                        <span>超长焦 3.0x</span>
                      </div>
                    </div>

                  </div>

                  {/* Reactive mapped photography tags Display */}
                  <div className={`mt-5 p-4 rounded-xl ${
                    theme === 'light' 
                      ? 'bg-slate-100 border border-slate-200' 
                      : 'bg-black/50 border border-white/10'
                  }`}>
                    <div className="text-[9px] text-gray-500 uppercase font-mono tracking-widest mb-3 text-left font-bold">
                      🎯 72 Poses 标准摄影映射参数详情 (SHOT PARAMETER MAPPING)
                    </div>
                    <div className="flex flex-wrap gap-2 text-left">
                      <span className={`text-[10px] font-mono border px-2.5 py-1 rounded-md font-medium ${
                        theme === 'light' 
                          ? 'bg-white border-slate-200 text-slate-800 shadow-xs' 
                          : 'bg-[#a5f3fc]/5 border-[#22d3ee]/20 text-[#22d3ee]'
                      }`}>
                        视角: {mappedObj.horizontalLabel}
                      </span>
                      <span className={`text-[10px] font-mono border px-2.5 py-1 rounded-md font-medium ${
                        theme === 'light' 
                          ? 'bg-white border-slate-200 text-slate-800 shadow-xs' 
                          : 'bg-[#fbcfe8]/5 border-[#f472b6]/20 text-[#f472b6]'
                      }`}>
                        高度: {mappedObj.verticalLabel}
                      </span>
                      <span className={`text-[10px] font-mono border px-2.5 py-1 rounded-md font-medium ${
                        theme === 'light' 
                          ? 'bg-white border-slate-200 text-slate-800 shadow-xs' 
                          : 'bg-[#fef08a]/5 border-[#facc15]/20 text-[#facc15]'
                      }`}>
                        景别: {mappedObj.distanceLabel}
                      </span>
                      <span className={`text-[10px] font-mono border px-2.5 py-1 rounded-md font-medium ${
                        theme === 'light' 
                          ? 'bg-white border-slate-200 text-slate-800 shadow-xs' 
                          : 'bg-white/5 border-white/10 text-white'
                      }`}>
                        镜头: {mappedObj.zoomLabel}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Generated prompt box with instant copy option */}
                <div className={`p-6 rounded-3xl flex flex-col gap-4 transition-all duration-500 border border-white/10 ${
                  theme === 'light' ? 'liquid-glass-light text-zinc-900 shadow-xl shadow-slate-100' : 'liquid-glass-dark text-zinc-100 shadow-2xl shadow-black/40'
                }`} id="prompt-output-panel">
                  
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200/50 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-gradient-to-tr from-[#52c41a] to-[#389e0d] text-white shadow-md shadow-[#52c41a]/15">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold tracking-tight text-zinc-800 dark:text-zinc-250">
                          生图指令集构图 (SKS PROMPT SPEC)
                        </h3>
                        <p className="text-[9.5px] text-zinc-450 dark:text-zinc-500 font-normal">高精度重绘与语义对准通信协议</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={copyPromptText}
                      className="px-3 py-1.5 text-[10.5px] font-bold rounded-xl flex items-center gap-1.5 border bg-white dark:bg-black/20 border-zinc-200 shadow-sm text-zinc-650 hover:text-zinc-950 transition-all duration-300 cursor-pointer"
                    >
                      {copySuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500 font-bold">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>一键复制</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Styled Display Box */}
                  <div 
                    onClick={copyPromptText}
                    className={`w-full p-4 rounded-xl font-mono text-xs cursor-pointer text-left transition-all flex items-center justify-between shadow-sm border ${
                      theme === 'light'
                        ? 'bg-slate-50 text-slate-800 hover:bg-slate-100 border-slate-200/80'
                        : 'bg-black/60 text-gray-300 hover:bg-black/80 border-white/10 hover:border-white/20'
                    }`}
                    id="prompt-display-card"
                  >
                    <span>{mappedObj.fullPrompt}</span>
                    <span className="text-[8px] text-gray-500 uppercase ml-2 pointer-events-none select-none font-sans font-bold tracking-wider">
                      Copy
                    </span>
                  </div>

                  <div className="text-[10px] text-gray-500 text-left mt-1 leading-relaxed font-sans">
                    💡 <strong>提示：</strong>格式遵守经典的三维摄影参数：<strong>＜sks&gt; [视角方向] [垂直角度] [景别] [镜头类型]</strong>。当您调整 3D 相机时，提示词标签会自动改变并同步传递进行智能光影构图渲染。
                  </div>

                </div>
              </motion.div>
            ) : (
              <motion.div
                key="panorama-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                className="w-full"
              >
                <div className={`p-6 rounded-3xl flex flex-col gap-4 transition-all duration-500 border border-white/10 ${
                  theme === 'light' ? 'liquid-glass-light text-zinc-900 shadow-xl shadow-slate-100' : 'liquid-glass-dark text-zinc-100 shadow-2xl shadow-black/40'
                }`} id="panorama-container-panel">
                  
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200/50 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-gradient-to-tr from-[#007aff] to-[#af52de] text-white shadow-md shadow-[#007aff]/15">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-xs font-bold tracking-tight text-zinc-800 dark:text-zinc-250">
                          三维全视域全景漫游画布 (Space Panorama Sphere)
                        </h2>
                        <p className="text-[9.5px] text-zinc-450 dark:text-zinc-500 font-normal">多方位无缝空间光场和环状漫游渲染</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950/10 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 text-[10px] font-mono text-zinc-650 dark:text-zinc-300">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                      </span>
                      <span>360° RENDER ON</span>
                    </div>
                  </div>

                  <PanoramaViewer 
                    theme={theme} 
                    uploadedSrc={uploadedImage} 
                    renderedSrc={renderedImage} 
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          </div>

          </div>

        </div>

      {/* Maximized Image modal */}
      <AnimatePresence>
        {fullPreviewModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
            onClick={() => setFullPreviewModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-xl flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={fullPreviewModal} 
                alt="Fullscreen POV Render" 
                className="max-w-full max-h-[80vh] object-contain rounded-lg border border-slate-800 shadow-2xl"
              />
              <button 
                onClick={() => setFullPreviewModal(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/80 border border-slate-800 text-slate-200 hover:bg-slate-900 transition-all cursor-pointer"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
