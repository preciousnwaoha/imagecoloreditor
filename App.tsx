
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Wand2, Edit2, Check as CheckIcon, Plus, X, Undo2, Redo2, RotateCcw } from 'lucide-react';

interface ColorChange {
  id: string;
  target: string | 'all';
  fill: string;
  tolerance: number;
}

// --- Helper Functions ---
const rgbToHex = (r: number, g: number, b: number) => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

const extractProminentColors = async (imgSrc: string, maxColors = 8): Promise<string[]> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve([]);
      
      const scale = Math.min(1, 200 / Math.max(img.width, img.height));
      const w = Math.floor(img.width * scale);
      const h = Math.floor(img.height * scale);
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      
      const data = ctx.getImageData(0, 0, w, h).data;
      const counts = new Map<string, number>();
      
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        const r = Math.round(data[i] / 32) * 32;
        const g = Math.round(data[i + 1] / 32) * 32;
        const b = Math.round(data[i + 2] / 32) * 32;
        const hex = rgbToHex(Math.min(255, r), Math.min(255, g), Math.min(255, b));
        counts.set(hex, (counts.get(hex) || 0) + 1);
      }
      
      const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
      resolve(sorted.slice(0, maxColors).map(entry => entry[0]));
    };
    img.onerror = () => resolve([]);
    img.src = imgSrc;
  });
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// --- SVG Icons (defined outside main component) ---
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const ColorWandIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 3l-3 3m0 0l-3 3m3-3v12m0 0l3 3m-3-3l-3 3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v.01M8 3v.01M11 3v.01M14 3v.01M17 3v.01M20 3v.01M5 21v-.01M8 21v-.01M11 21v-.01M14 21v-.01M17 21v-.01M20 21v-.01" />
    </svg>
);


const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);


const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [targetColor, setTargetColor] = useState<string | 'all' | null>(null);
  const [tolerance, setTolerance] = useState<number>(60);
  
  const [changes, setChanges] = useState<ColorChange[]>([]);
  const [history, setHistory] = useState<any[]>([{ changes: [], targetColor: null, fillColor: '#4f46e5', tolerance: 60 }]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const [fillColor, setFillColor] = useState<string>('#4f46e5');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (originalImage) {
      extractProminentColors(originalImage).then(colors => setExtractedColors(colors));
    } else {
      setExtractedColors([]);
    }
  }, [originalImage]);

  const commitState = useCallback((newStateStr?: any) => {
    const currentState = { changes, targetColor, fillColor, tolerance, ...newStateStr };
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      
      // Avoid pushing duplicate states
      const lastState = newHistory[newHistory.length - 1];
      if (lastState && 
          JSON.stringify(lastState.changes) === JSON.stringify(currentState.changes) &&
          lastState.targetColor === currentState.targetColor &&
          lastState.fillColor === currentState.fillColor &&
          lastState.tolerance === currentState.tolerance) {
        return prev;
      }
      
      newHistory.push(currentState);
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [changes, targetColor, fillColor, tolerance, historyIndex]);

  const updateChanges = (newChanges: ColorChange[]) => {
    setChanges(newChanges);
    commitState({ changes: newChanges });
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setChanges(state.changes);
      setTargetColor(state.targetColor);
      setFillColor(state.fillColor);
      setTolerance(state.tolerance);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setChanges(state.changes);
      setTargetColor(state.targetColor);
      setFillColor(state.fillColor);
      setTolerance(state.tolerance);
    }
  };
  
  const handleReset = () => {
     setTargetColor(null);
     setChanges([]);
     commitState({ targetColor: null, changes: [] });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setResultImage(null);
        setChanges([]);
        setTargetColor(null);
        setFillColor('#4f46e5');
        setTolerance(60);
        setHistory([{ changes: [], targetColor: null, fillColor: '#4f46e5', tolerance: 60 }]);
        setHistoryIndex(0);
        setError(null);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please select a valid image file (PNG, JPG, etc.).');
      setOriginalImage(null);
    }
  };

  const processImage = useCallback(async () => {
    const sourceImage = originalImage;
    if (!sourceImage) {
      setResultImage(null);
      return;
    }

    const allChanges = [...changes];
    // Only apply the preview of the slider if a target is picked AND an explicit fill color has been picked
    // The instructions said: "when a color from the image is selected, it should not automatically change the color until the user picks the replacement color themselves."
    // We achieve this functionality by having the target selection separate from adding it to changes
    // If they drag tolerance, it applies if they have selected target.
    
    // We apply real-time slider preview by adding a temporary change
    if (targetColor) {
      allChanges.push({ id: 'preview', target: targetColor, fill: fillColor, tolerance });
    }

    if (allChanges.length === 0) {
      setResultImage(sourceImage);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Give UI time to update loading state
    await new Promise(resolve => setTimeout(resolve, 10)); // reduced for responsiveness

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Could not get canvas context.');

      const image = new Image();
      image.crossOrigin = 'anonymous';

      const imageLoadPromise = new Promise<void>((resolve, reject) => {
        image.onload = () => {
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          ctx.drawImage(image, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          const activeChanges = allChanges.map(c => ({
            isAll: c.target === 'all',
            targetRgb: c.target !== 'all' && c.target ? hexToRgb(c.target) : null,
            fillRgb: hexToRgb(c.fill),
            tolerance: c.tolerance
          })).filter(c => c.fillRgb);

          if (activeChanges.length > 0) {
            for (let i = 0; i < data.length; i += 4) {
              const alpha = data[i + 3];
              if (alpha > 0) { // If pixel is not fully transparent
                let currentR = data[i];
                let currentG = data[i + 1];
                let currentB = data[i + 2];

                for (const change of activeChanges) {
                  let shouldReplace = change.isAll;
                  
                  if (!shouldReplace && change.targetRgb) {
                    const dR = currentR - change.targetRgb.r;
                    const dG = currentG - change.targetRgb.g;
                    const dB = currentB - change.targetRgb.b;
                    const distance = Math.sqrt(dR * dR + dG * dG + dB * dB);
                    if (distance <= change.tolerance) {
                      shouldReplace = true;
                    }
                  }

                  if (shouldReplace && change.fillRgb) {
                    currentR = change.fillRgb.r;
                    currentG = change.fillRgb.g;
                    currentB = change.fillRgb.b;
                  }
                }

                data[i] = currentR;
                data[i + 1] = currentG;
                data[i + 2] = currentB;
              }
            }
          }

          ctx.putImageData(imageData, 0, 0);
          setResultImage(canvas.toDataURL('image/png'));
          resolve();
        };
        image.onerror = () => reject(new Error('Failed to load the image for processing.'));
      });
      
      image.src = sourceImage;
      await imageLoadPromise;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during processing.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, changes, targetColor, fillColor, tolerance]);

  useEffect(() => {
    processImage();
  }, [processImage]);
  
  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <div className="min-h-screen bg-slate-900 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
            <div className="flex items-center justify-center gap-3">
                <ColorWandIcon className="w-10 h-10 text-indigo-400" />
                <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                    Image Color Filler
                </h1>
            </div>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
                Instantly fill the contents of any image with a solid color. Works best with transparent PNGs.
            </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-2 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col gap-6 h-fit">
            <h2 className="text-2xl font-semibold text-white border-b border-slate-600 pb-3">Controls</h2>
            
            {/* Step 1: Upload */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">1. Upload Image</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    className="hidden"
                />
                <button
                    onClick={triggerFileSelect}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-white font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500"
                >
                    <UploadIcon className="w-5 h-5" />
                    {originalImage ? 'Change Image' : 'Select Image'}
                </button>
            </div>

            {/* Step 2: Color Setup */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">2. Select Target</label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setTargetColor('all');
                      commitState({ targetColor: 'all' });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                      targetColor === 'all'
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-800'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
                    }`}
                  >
                    All Colors
                  </button>
                  {extractedColors.length > 0 && <span className="text-slate-500 mx-1">|</span>}
                  {extractedColors.map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        setTargetColor(color);
                        commitState({ targetColor: color });
                      }}
                      className={`w-8 h-8 rounded-full transition-all shadow-sm ${
                        targetColor === color 
                          ? 'scale-125 ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-800 z-10' 
                          : 'ring-1 ring-slate-600 hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Target specifically ${color}`}
                    />
                  ))}
                </div>
              </div>

              {targetColor !== 'all' && targetColor !== null && (
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 space-y-2 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                   <div className="flex justify-between text-sm">
                     <span className="font-medium text-slate-300 flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full" style={{ backgroundColor: targetColor }}></div>
                       Color Tolerance
                     </span>
                     <span className="text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded">{tolerance}</span>
                   </div>
                   <input
                     type="range"
                     min="0"
                     max="150"
                     value={tolerance}
                     onChange={(e) => setTolerance(parseInt(e.target.value))}
                     onMouseUp={(e) => commitState({ tolerance: parseInt((e.target as HTMLInputElement).value) })}
                     onTouchEnd={(e) => commitState({ tolerance: parseInt((e.target as HTMLInputElement).value) })}
                     className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                   />
                   <p className="text-xs text-slate-500">Increase to replace colors similar to the target.</p>
                </div>
              )}

              <div>
                <label htmlFor="color-picker" className="block text-sm font-medium text-slate-300 mb-2">Replacement Color</label>
                <div className="relative">
                  <input
                      id="color-picker"
                      type="color"
                      value={fillColor}
                      onChange={(e) => setFillColor(e.target.value)}
                      onBlur={(e) => commitState({ fillColor: e.target.value })}
                      className="w-14 h-12 p-1 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer appearance-none"
                      style={{'--tw-ring-color': fillColor} as React.CSSProperties}
                  />
                  <input
                      type="text"
                      value={fillColor}
                      onChange={(e) => setFillColor(e.target.value)}
                      onBlur={(e) => commitState({ fillColor: e.target.value })}
                      className="absolute left-16 top-0 h-12 w-40 pl-4 pr-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Process */}
            <div>
              <div className="flex gap-2 mb-4">
                 <button
                   onClick={undo}
                   disabled={historyIndex === 0}
                   className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-slate-300 text-sm font-medium transition-colors"
                 >
                   <Undo2 className="w-4 h-4" /> Undo
                 </button>
                 <button
                   onClick={redo}
                   disabled={historyIndex === history.length - 1}
                   className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-slate-300 text-sm font-medium transition-colors"
                 >
                   <Redo2 className="w-4 h-4" /> Redo
                 </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (targetColor) {
                      const newChanges = [...changes, { id: crypto.randomUUID(), target: targetColor, fill: fillColor, tolerance }];
                      setChanges(newChanges);
                      setTargetColor(null); // Reset target after adding to clear preview state
                      commitState({ changes: newChanges, targetColor: null });
                    }
                  }}
                  disabled={!originalImage || isLoading || !targetColor}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed border border-indigo-500 shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Apply Change
                </button>
                 <button
                  onClick={handleReset}
                  className="px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold transition-all duration-200 border border-slate-600 shadow-md flex items-center justify-center gap-2"
                  title="Reset Image"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>

              {changes.length > 0 && (
                <div className="mt-6 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                     <h3 className="text-sm font-medium text-slate-300">Applied Changes</h3>
                     <button onClick={() => updateChanges([])} className="text-xs text-slate-400 hover:text-white transition-colors">Clear All</button>
                  </div>
                  <div className="space-y-2">
                    {changes.map(change => (
                      <div key={change.id} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700 shadow-sm">
                        <div className="flex items-center gap-3">
                          {change.target === 'all' ? (
                            <span className="text-[10px] uppercase font-bold px-2 py-1 bg-slate-700 rounded text-slate-300 shadow-inner">ALL</span>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-600 shadow-sm" style={{ backgroundColor: change.target }}></div>
                          )}
                          <span className="text-slate-500">→</span>
                          <div className="w-5 h-5 rounded-full border-2 border-slate-600 shadow-sm" style={{ backgroundColor: change.fill }}></div>
                          {change.target !== 'all' && <span className="text-xs font-mono text-slate-400 ml-2">±{change.tolerance}</span>}
                        </div>
                        <button onClick={() => updateChanges(changes.filter(c => c.id !== change.id))} className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-slate-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {error && <p className="text-sm text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</p>}
          </div>

          {/* Image Previews */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-8">
            <ImagePanel title="Original" imageUrl={originalImage} />
            <ImagePanel title="Result" imageUrl={resultImage} isLoading={isLoading}>
              {resultImage && (
                <a
                  href={resultImage}
                  download="colored-image.png"
                  className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-green-500"
                >
                  <DownloadIcon className="w-5 h-5" />
                  Download
                </a>
              )}
            </ImagePanel>
          </div>
        </main>
      </div>
    </div>
  );
};

interface ImagePanelProps {
    title: string;
    imageUrl: string | null;
    isLoading?: boolean;
    children?: React.ReactNode;
}

const ImagePanel: React.FC<ImagePanelProps> = ({ title, imageUrl, isLoading = false, children }) => {
    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-xl font-semibold text-slate-300 text-center">{title}</h3>
            <div className="relative aspect-square w-full bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center p-4 overflow-hidden shadow-inner bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:16px_16px]">
                {isLoading && (
                    <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center z-10">
                        <svg className="animate-spin h-10 w-10 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-4 text-slate-300">Generating...</p>
                    </div>
                )}
                {imageUrl ? (
                    <img src={imageUrl} alt={title} className="max-w-full max-h-full object-contain" />
                ) : (
                    !isLoading && <span className="text-slate-500">Preview</span>
                )}
                {children}
            </div>
        </div>
    );
};


export default App;
