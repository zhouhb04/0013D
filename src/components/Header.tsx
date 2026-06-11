/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Camera, Sun, Moon, Sparkles, HelpCircle } from 'lucide-react';
import { ThemeMode } from '../types';

interface HeaderProps {
  theme: ThemeMode;
  toggleTheme: () => void;
}

export default function Header({ theme, toggleTheme }: HeaderProps) {
  return (
    <header className="w-full py-3.5 px-5 rounded-2xl mb-6 backdrop-blur-xl border transition-all duration-300 bg-white/80 border-zinc-200/60 shadow-xs" id="app-header">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Modern App Title & Squircle Icon Container */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-[#007aff] flex items-center justify-center shadow-lg shadow-[#007aff]/15 relative overflow-hidden">
            <div className="absolute inset-0.5 rounded-[8px] border border-white/10 bg-gradient-to-b from-[#0a84ff] to-[#007aff] flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-zinc-900">
                VisionMatrix Pro
              </h1>
            </div>
            <p className="text-[10px] font-normal text-zinc-500">
              3D 摄影参数与全景漫游调校工具
            </p>
          </div>
        </div>

        {/* Header Right elements */}
        <div className="flex items-center gap-3">
          {/* Active status indicator pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium border bg-zinc-50 text-zinc-650 border-zinc-200">
            <Sparkles className="w-3.5 h-3.5 text-[#007aff]" />
            <span>智能镜头测算</span>
          </div>
        </div>

      </div>
    </header>
  );
}
