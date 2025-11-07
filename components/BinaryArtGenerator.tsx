
import React, { useState, useRef, useCallback } from 'react';

const MIN_WEIGHT = 300;
const MAX_WEIGHT = 700;
const WEIGHT_RANGE = MAX_WEIGHT - MIN_WEIGHT;
const NUM_CHAR_LEVELS = 14;
const CHAR_LEVEL_SIZE = 256 / NUM_CHAR_LEVELS;

const BinaryArtGenerator: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [charInput, setCharInput] = useState<string>('01');
    const [invertToggle, setInvertToggle] = useState<boolean>(false);
    const [resolution, setResolution] = useState<number>(100);
    const [artOutputHtml, setArtOutputHtml] = useState<string>('<p class="text-center text-gray-500 p-12">Upload an image and press \'Generate Binary Art\' to see your artwork here.</p>');
    const [isGenerated, setIsGenerated] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const artOutputRef = useRef<HTMLDivElement>(null);

    const showStatus = (text: string, type: 'success' | 'error') => {
        setStatusMessage({ text, type });
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                setOriginalImage(img);
                setImagePreview(e.target?.result as string);
                setIsGenerated(false);
                showStatus("Image loaded successfully. Adjust settings and generate.", 'success');
                setArtOutputHtml('<p class="text-center text-gray-500 p-12">Ready to generate art. Press the button below.</p>');
            };
            img.onerror = () => {
                setOriginalImage(null);
                showStatus("Error loading image. Please try a different file.", 'error');
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const generateBinaryArt = useCallback(() => {
        if (!originalImage || !canvasRef.current) {
            showStatus("Please upload an image first.", 'error');
            return;
        }

        setIsGenerating(true);
        setIsGenerated(false);
        setArtOutputHtml('<p class="text-center text-blue-400 p-12">Analyzing image and generating characters...</p>');
        showStatus('Generating... please wait.', 'success');

        setTimeout(() => {
            try {
                const charString = charInput.trim();
                let customCharacters = charString.length > 0 ? charString.split('') : ['0', '1'];
                if (customCharacters.length === 0) customCharacters = ['0', '1'];

                const aspectRatio = originalImage.naturalHeight / originalImage.naturalWidth;
                const resolutionHeight = Math.floor(resolution * aspectRatio * 0.55);

                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) throw new Error('Could not get canvas context');

                canvas.width = resolution;
                canvas.height = resolutionHeight;
                ctx.drawImage(originalImage, 0, 0, resolution, resolutionHeight);

                const imageData = ctx.getImageData(0, 0, resolution, resolutionHeight);
                const data = imageData.data;
                let outputHTML = '';

                for (let y = 0; y < resolutionHeight; y++) {
                    for (let x = 0; x < resolution; x++) {
                        const i = (y * resolution + x) * 4;
                        const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                        const effectiveLuminance = invertToggle ? (255 - luminance) : luminance;
                        
                        const continuousWeight = MIN_WEIGHT + (effectiveLuminance / 255.0) * WEIGHT_RANGE;
                        const finalWeight = Math.round(Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, continuousWeight)));
                        
                        let opacity = Math.max(0.1, effectiveLuminance / 255.0);
                        
                        let charLevelIndex = Math.floor(effectiveLuminance / CHAR_LEVEL_SIZE);
                        charLevelIndex = Math.max(0, Math.min(NUM_CHAR_LEVELS - 1, charLevelIndex));
                        const densityChar = customCharacters[charLevelIndex % customCharacters.length];

                        outputHTML += `<span style="opacity: ${opacity.toFixed(3)}; font-weight: ${finalWeight};">${densityChar}</span>`;
                    }
                    outputHTML += '\n';
                }

                setArtOutputHtml(outputHTML);
                setIsGenerated(true);
                showStatus("Art generated! You can now download the file.", 'success');
            } catch (error) {
                console.error("Error during art generation:", error);
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                showStatus(`Failed to generate art: ${errorMessage}`, 'error');
            } finally {
                setIsGenerating(false);
            }
        }, 100);
    }, [originalImage, charInput, invertToggle, resolution]);

    const handleDownload = (type: 'html' | 'pdf') => {
        if (!isGenerated || !artOutputRef.current) {
            showStatus("Please generate art before downloading.", 'error');
            return;
        }

        const currentFontSize = artOutputRef.current.style.fontSize || '8px';
        const printStyles = `
            @media print {
                body { background-color: white !important; color: black !important; margin: 0; padding: 0; }
                .art-display { color: black !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 20px; }
            }`;
        
        const downloadableHTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Binary Art</title><link href="https://fonts.googleapis.com/css2?family=Red+Hat+Mono:wght@300..900&display=swap" rel="stylesheet"><style>body { background-color: #0d1117; color: #ffffff; margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; } .art-display { font-family: 'Red Hat Mono', monospace; line-height: 0.95; word-break: break-all; white-space: pre-wrap; font-size: ${currentFontSize}; max-width: fit-content; margin: auto; } ${printStyles}</style></head><body><div class="art-display">${artOutputHtml}</div></body></html>`;

        if (type === 'html') {
            const blob = new Blob([downloadableHTML], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `binary_art_res_${resolution}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            const printWindow = window.open('', '_blank');
            if(printWindow) {
              printWindow.document.write(downloadableHTML);
              printWindow.document.close();
              setTimeout(() => {
                  printWindow.focus();
                  printWindow.print();
              }, 500);
            } else {
              showStatus("Popup blocked. Please allow popups to save as PDF.", "error");
            }
        }
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-[#161b22] p-6 rounded-xl shadow-2xl border border-[#30363d] h-fit">
                <h2 className="text-2xl font-semibold mb-4 text-gray-200">Settings & Input</h2>
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2 text-gray-400">Upload Source Image</label>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"/>
                    <p className="mt-2 text-xs text-gray-500 italic">{fileName}</p>
                </div>
                <div className="mb-6">
                    <label htmlFor="charInput" className="block text-sm font-medium mb-2 text-gray-400">Custom Characters (Cycle)</label>
                    <input type="text" id="charInput" value={charInput} onChange={e => setCharInput(e.target.value)} className="w-full p-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-gray-100 focus:ring-blue-500 focus:border-blue-500"/>
                    <p className="text-xs text-gray-500 mt-1">Darker areas use characters first in the sequence.</p>
                </div>
                <div className="mb-6 flex items-center">
                    <input type="checkbox" id="invertToggle" checked={invertToggle} onChange={e => setInvertToggle(e.target.checked)} className="h-4 w-4 text-blue-600 bg-[#0d1117] border-gray-600 rounded focus:ring-blue-500"/>
                    <label htmlFor="invertToggle" className="ml-3 block text-sm font-medium text-gray-400">Invert Grayscale Mapping</label>
                </div>
                <div className="mb-8">
                    <label htmlFor="resolutionSlider" className="block text-sm font-medium text-gray-400 mb-2">Resolution Width ({resolution} chars)</label>
                    <input type="range" id="resolutionSlider" min="50" max="300" value={resolution} step="10" onChange={e => setResolution(parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg"/>
                    <p className="text-xs text-gray-500 mt-1">Controls horizontal detail.</p>
                </div>
                <div className="flex flex-col space-y-3">
                    <button onClick={generateBinaryArt} disabled={!originalImage || isGenerating} className="py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-wait">
                        {isGenerating ? 'Generating...' : 'Generate Binary Art'}
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleDownload('html')} disabled={!isGenerated} className="py-3 px-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg transition duration-150 ease-in-out disabled:opacity-50 text-sm">Download HTML</button>
                        <button onClick={() => handleDownload('pdf')} disabled={!isGenerated} className="py-3 px-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg transition duration-150 ease-in-out disabled:opacity-50 text-sm">Save as PDF</button>
                    </div>
                </div>
                {statusMessage && <div className={`mt-6 p-3 text-sm rounded-lg ${statusMessage.type === 'success' ? 'bg-green-800/50 text-green-200' : 'bg-red-800/50 text-red-200'}`}>{statusMessage.text}</div>}
            </div>
            <div className="lg:col-span-2 bg-[#161b22] p-6 rounded-xl shadow-2xl border border-[#30363d] overflow-hidden flex flex-col">
                <h2 className="text-2xl font-semibold mb-4 text-gray-200">Generated Output</h2>
                {imagePreview && (
                    <div className="mb-4">
                        <h3 className="text-lg font-medium text-gray-400 mb-2">Original Image Preview</h3>
                        <img src={imagePreview} className="max-w-full max-h-48 object-contain rounded-lg border border-gray-700 mx-auto" alt="Original"/>
                    </div>
                )}
                <canvas ref={canvasRef} className="hidden"></canvas>
                <div
                    ref={artOutputRef}
                    className="art-container text-xs sm:text-sm flex-grow h-96 overflow-auto bg-black p-4 rounded-lg border border-gray-700"
                    style={{ fontSize: Math.max(2, Math.min(10, (artOutputRef.current?.clientWidth || 800) / resolution) * 1.8) + 'px' }}
                    dangerouslySetInnerHTML={{ __html: artOutputHtml }}
                />
            </div>
        </div>
    );
};

export default BinaryArtGenerator;
