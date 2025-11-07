
import React, { useState, useEffect, useCallback } from 'react';

interface TextBox {
    content: string;
    rowStart: number;
    colStart: number;
}

type Theme = 'light' | 'dark' | 'clear';
type PlaceholderMode = 'fixed' | 'random' | 'random-custom';

const CardGridBuilder: React.FC = () => {
    const [height, setHeight] = useState(6);
    const [width, setWidth] = useState(20);
    const [theme, setTheme] = useState<Theme>('light');
    const [placeholderMode, setPlaceholderMode] = useState<PlaceholderMode>('fixed');
    const [customPlaceholder, setCustomPlaceholder] = useState('+');
    const [textInputs, setTextInputs] = useState<TextBox[]>([
        { content: 'MARK', rowStart: 1, colStart: 1 },
        { content: 'NS', rowStart: 6, colStart: 19 }
    ]);
    const [gridHtml, setGridHtml] = useState<string>('');
    const [isGenerated, setIsGenerated] = useState(false);
    const [printError, setPrintError] = useState('');

    const generateCard = useCallback(() => {
        if (isNaN(height) || isNaN(width) || height <= 0 || width <= 0) {
            setGridHtml('<p class="text-red-500 text-center">Please enter valid positive dimensions for Height and Width.</p>');
            setIsGenerated(false);
            return;
        }

        const gridState: { char: string; occupied: boolean }[][] = Array(height).fill(null).map(() => 
            Array(width).fill({ char: '', occupied: false })
        );

        textInputs.forEach(input => {
            const content = String(input.content || '');
            const len = content.length;
            const startRow = Math.min(height, Math.max(1, input.rowStart || 1));
            const anchorCol = Math.min(width, Math.max(1, input.colStart || 1));
            const effectiveStartCol = anchorCol; 
            const effectiveEndCol = effectiveStartCol + len - 1;

            for (let i = 0; i < len; i++) {
                const char = content[i];
                const r = startRow - 1;
                const c = effectiveStartCol - 1 + i;

                if (r >= 0 && r < height && c >= 0 && c < width && c + 1 <= effectiveEndCol) {
                    gridState[r][c] = { char: char, occupied: true };
                }
            }
        });

        let htmlContent = '';
        let customCharIndex = 0;

        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                const cell = gridState[r][c];
                let cellClass = 'grid-cell font-bold';
                let charContent = cell.char;

                if (!cell.occupied) {
                    cellClass += ' empty-cell';
                    if (placeholderMode === 'fixed') {
                        charContent = customPlaceholder[customCharIndex % customPlaceholder.length] || '+';
                        customCharIndex++;
                    } else if (placeholderMode === 'random-custom') {
                        charContent = customPlaceholder[Math.floor(Math.random() * customPlaceholder.length)] || '+';
                    } else {
                        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                        charContent = chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                } else {
                     charContent = charContent.toUpperCase();
                     cellClass += ' opacity-100';
                }
                htmlContent += `<div class="${cellClass}">${charContent}</div>`;
            }
        }
        
        setGridHtml(htmlContent);
        setIsGenerated(true);
    }, [height, width, textInputs, placeholderMode, customPlaceholder]);

    useEffect(() => {
        generateCard();
    }, [generateCard]);

    const addTextBox = () => {
        setTextInputs([...textInputs, { content: '', rowStart: 1, colStart: 1 }]);
    };

    const updateTextBox = (index: number, key: keyof TextBox, value: string | number) => {
        const newInputs = [...textInputs];
        (newInputs[index] as any)[key] = value;
        setTextInputs(newInputs);
    };

    const removeTextBox = (index: number) => {
        setTextInputs(textInputs.filter((_, i) => i !== index));
    };

    const exportHtml = () => {
        if (!isGenerated) return;

        const isClearTheme = theme === 'clear';
        const containerPadding = isClearTheme ? '0' : '1.5rem';
        const containerShadow = isClearTheme ? 'none' : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        const containerBackground = isClearTheme ? 'transparent' : (theme === 'dark' ? 'black' : 'white');

        const exportStyle = `
            body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background-color: #f7f7f7; }
            .exported-card { display: grid; border-radius: 0.75rem; padding: ${containerPadding}; box-shadow: ${containerShadow}; background-color: ${containerBackground}; grid-template-columns: repeat(${width}, minmax(0, 1fr)); grid-template-rows: repeat(${height}, minmax(0, 1fr)); width: fit-content; }
            .grid-cell { font-family: 'Red Hat Mono', monospace; display: flex; justify-content: center; align-items: center; min-width: 25px; min-height: 25px; font-size: 1.25rem; font-weight: 700; opacity: 1; }
            .theme-light { color: #1f2937; } .theme-dark { color: white; } .theme-clear { color: #1f2937; }
            .theme-light .empty-cell, .theme-clear .empty-cell { color: #9ca3af; opacity: 0.25; font-weight: 300; }
            .theme-dark .empty-cell { color: #aaaaaa; opacity: 0.25; font-weight: 300; }
        `;
        
        const exportedHtmlContent = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Exported Grid Card</title><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;700&family=Red+Hat+Mono:wght@300;700&display=swap');${exportStyle}</style></head><body><div class="exported-card theme-${theme}">${gridHtml}</div></body></html>`;

        const blob = new Blob([exportedHtmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'card_grid_export.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const exportPdf = () => {
        if (!isGenerated) return;

        const isClearTheme = theme === 'clear';
        const containerPadding = isClearTheme ? '0' : '1.5rem';
        const containerBackground = isClearTheme ? 'transparent' : (theme === 'dark' ? 'black' : 'white');

        const exportStyle = `
            body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background-color: #f7f7f7; }
            .exported-card { display: grid; border-radius: 0.75rem; padding: ${containerPadding}; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); background-color: ${containerBackground}; }
            .grid-cell { font-family: 'Red Hat Mono', monospace; display: flex; justify-content: center; align-items: center; min-width: 25px; min-height: 25px; font-size: 1.25rem; font-weight: 700; opacity: 1; }
            .theme-light { color: #1f2937; } .theme-dark { color: white; } .theme-clear { color: #1f2937; }
            .theme-light .empty-cell, .theme-clear .empty-cell { color: #9ca3af; opacity: 0.25; font-weight: 300; }
            .theme-dark .empty-cell { color: #aaaaaa; opacity: 0.25; font-weight: 300; }
            @media print {
                body { background-color: white !important; color: black !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                .exported-card { background-color: white !important; color: black !important; box-shadow: none !important; margin: 0 auto; padding: 0; }
                .grid-cell { color: black !important; opacity: 1 !important; }
                .empty-cell { color: #555555 !important; opacity: 0.7 !important; font-weight: 300 !important; }
            }
        `;
        
        const exportedHtmlContent = `<!DOCTYPE html><html lang="en"><head><title>Printable Grid Card</title><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;700&family=Red+Hat+Mono:wght@300;700&display=swap');${exportStyle}</style></head><body><div class="exported-card theme-${theme}" style="grid-template-columns: repeat(${width}, minmax(0, 1fr)); grid-template-rows: repeat(${height}, minmax(0, 1fr)); width: fit-content;">${gridHtml}</div></body></html>`;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            setPrintError("Error: Please allow popups to open the print dialog.");
            setTimeout(() => setPrintError(''), 7000);
            return;
        }

        printWindow.document.open();
        printWindow.document.write(exportedHtmlContent);
        printWindow.document.close();
        printWindow.onload = () => { setTimeout(() => printWindow.print(), 200); };
    };
    
    const isCustomInputVisible = placeholderMode === 'fixed' || placeholderMode === 'random-custom';

    return (
      <div className="bg-[#161b22] border border-[#30363d] p-4 md:p-8 rounded-2xl shadow-2xl">
        <div className="bg-[#0d1117] p-6 rounded-xl shadow-lg mb-8 border border-[#30363d]">
          <h2 className="text-xl font-semibold mb-4 text-gray-200">Grid Settings & Appearance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                  <label htmlFor="grid-height" className="block text-sm font-medium text-gray-400 mb-1">Height (Rows)</label>
                  <input type="number" id="grid-height" value={height} min="1" onChange={e => setHeight(parseInt(e.target.value))} className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                  <label htmlFor="grid-width" className="block text-sm font-medium text-gray-400 mb-1">Width (Columns)</label>
                  <input type="number" id="grid-width" value={width} min="1" onChange={e => setWidth(parseInt(e.target.value))} className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                  <label htmlFor="theme-selector" className="block text-sm font-medium text-gray-400 mb-1">Color Theme</label>
                  <select id="theme-selector" value={theme} onChange={e => setTheme(e.target.value as Theme)} className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="light">Black on White (Light)</option>
                      <option value="dark">White on Pure Black (Dark)</option>
                      <option value="clear">Clear Background (Dark Text)</option>
                  </select>
              </div>
          </div>
  
          <h2 className="text-xl font-semibold mt-6 mb-4 text-gray-200">Placeholder Settings</h2>
          <div className="grid grid-cols-1 gap-4 mb-4 items-end">
              <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Placeholder Content Mode</label>
                  <div className="flex flex-wrap gap-4">
                      {(['fixed', 'random', 'random-custom'] as PlaceholderMode[]).map(mode => (
                          <label key={mode} className="inline-flex items-center">
                              <input type="radio" name="placeholder-mode" value={mode} checked={placeholderMode === mode} onChange={() => setPlaceholderMode(mode)} className="form-radio text-indigo-600 h-4 w-4 bg-gray-700 border-gray-600" />
                              <span className="ml-2 text-gray-300 capitalize">{mode.replace('-', ' ')}</span>
                          </label>
                      ))}
                  </div>
              </div>
              <div className={!isCustomInputVisible ? 'hidden' : ''}>
                  <label htmlFor="custom-placeholder-char" className="block text-sm font-medium text-gray-400 mb-1">Custom Character(s)</label>
                  <input type="text" id="custom-placeholder-char" value={customPlaceholder} onChange={e => setCustomPlaceholder(e.target.value)} maxLength={10} className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
          </div>
  
          <h2 className="text-xl font-semibold mt-6 mb-4 text-gray-200">Text Boxes</h2>
          <div className="space-y-4 mb-4">
              {textInputs.map((input, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-2 border p-3 rounded-lg bg-[#0d1117] border-[#30363d] items-end">
                      <div className="flex-1 w-full">
                          <label className="block text-xs font-medium text-gray-500">Content</label>
                          <input type="text" value={input.content} onChange={e => updateTextBox(index, 'content', e.target.value)} className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded-lg" />
                      </div>
                      <div className="w-full md:w-1/6">
                          <label className="block text-xs font-medium text-gray-500">Row</label>
                          <input type="number" value={input.rowStart} min="1" onChange={e => updateTextBox(index, 'rowStart', parseInt(e.target.value) || 1)} className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded-lg" />
                      </div>
                      <div className="w-full md:w-1/6">
                          <label className="block text-xs font-medium text-gray-500">Col Start</label>
                          <input type="number" value={input.colStart} min="1" onChange={e => updateTextBox(index, 'colStart', parseInt(e.target.value) || 1)} className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded-lg" />
                      </div>
                      <button onClick={() => removeTextBox(index)} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-150 text-sm h-fit">Remove</button>
                  </div>
              ))}
          </div>
          <button onClick={addTextBox} className="text-sm px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-150">+ Add Text Box</button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button onClick={generateCard} className="flex-grow bg-indigo-600 text-white p-3 rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 font-semibold">Recalculate Grid</button>
            <button onClick={exportHtml} disabled={!isGenerated} className="flex-grow bg-gray-600 text-gray-200 p-3 rounded-lg shadow-md hover:bg-gray-700 transition duration-150 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">Export HTML</button>
            <button onClick={exportPdf} disabled={!isGenerated} className="flex-grow bg-gray-600 text-gray-200 p-3 rounded-lg shadow-md hover:bg-gray-700 transition duration-150 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">Export PDF</button>
        </div>
        {printError && <p className="text-red-500 mt-4 text-center">{printError}</p>}
        
        <h2 className="text-xl font-semibold mb-4 text-gray-200">Generated Card Preview</h2>
        <div className="bg-[#0d1117] p-4 rounded-xl shadow-lg overflow-x-auto border border-[#30363d]">
            <div
                className={`w-fit mx-auto theme-${theme} ${theme === 'clear' ? 'p-0' : 'p-4'} rounded-xl ${theme === 'clear' ? '' : 'shadow-inner'}`}
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`
                }}
                dangerouslySetInnerHTML={{ __html: gridHtml }}
            />
        </div>
      </div>
    );
};

export default CardGridBuilder;
