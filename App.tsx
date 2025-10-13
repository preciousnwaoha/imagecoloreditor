
import React, { useState, useCallback, useRef } from 'react';

// --- Helper Functions ---
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
  const [fillColor, setFillColor] = useState<string>('#4f46e5');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setResultImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please select a valid image file (PNG, JPG, etc.).');
      setOriginalImage(null);
    }
  };

  const processImage = useCallback(async () => {
    if (!originalImage) {
      setError('Please upload an image first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImage(null);

    // Give UI time to update loading state
    await new Promise(resolve => setTimeout(resolve, 50));

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

          const rgbColor = hexToRgb(fillColor);
          if (!rgbColor) throw new Error('Invalid hex color format.');

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha > 0) { // If pixel is not fully transparent
              data[i] = rgbColor.r;
              data[i + 1] = rgbColor.g;
              data[i + 2] = rgbColor.b;
            }
          }

          ctx.putImageData(imageData, 0, 0);
          setResultImage(canvas.toDataURL('image/png'));
          resolve();
        };
        image.onerror = () => reject(new Error('Failed to load the image for processing.'));
      });
      
      image.src = originalImage;
      await imageLoadPromise;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during processing.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, fillColor]);
  
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

            {/* Step 2: Color */}
            <div>
              <label htmlFor="color-picker" className="block text-sm font-medium text-slate-300 mb-2">2. Pick Fill Color</label>
              <div className="relative">
                <input
                    id="color-picker"
                    type="color"
                    value={fillColor}
                    onChange={(e) => setFillColor(e.target.value)}
                    className="w-14 h-12 p-1 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer appearance-none"
                    style={{'--tw-ring-color': fillColor} as React.CSSProperties} // Custom property for dynamic ring color
                />
                <input
                    type="text"
                    value={fillColor}
                    onChange={(e) => setFillColor(e.target.value)}
                    className="absolute left-16 top-0 h-12 w-40 pl-4 pr-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Step 3: Process */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">3. Generate</label>
              <button
                onClick={processImage}
                disabled={!originalImage || isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold text-lg transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : 'Fill with Color'}
              </button>
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
