
import React, { useState } from 'react';
import CardGridBuilder from './components/CardGridBuilder';
import BinaryArtGenerator from './components/BinaryArtGenerator';

type AppType = 'grid' | 'art';

const App: React.FC = () => {
    const [activeApp, setActiveApp] = useState<AppType>('grid');

    const NavButton: React.FC<{ appType: AppType; label: string; }> = ({ appType, label }) => (
        <button
            onClick={() => setActiveApp(appType)}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 text-sm md:text-base font-semibold ${
                activeApp === appType
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-[#161b22] text-gray-300 hover:bg-[#30363d]'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-blue-400">Creative Grid Tools</h1>
                    <p className="text-gray-400 mt-2">A suite of powerful character-based visual generators</p>
                </header>
                
                <nav className="flex justify-center items-center gap-4 mb-8 p-2 bg-[#161b22] border border-[#30363d] rounded-xl shadow-lg w-fit mx-auto">
                    <NavButton appType="grid" label="Card Grid Generator" />
                    <NavButton appType="art" label="Binary Art Generator" />
                </nav>

                <main>
                    {activeApp === 'grid' && <CardGridBuilder />}
                    {activeApp === 'art' && <BinaryArtGenerator />}
                </main>
            </div>
        </div>
    );
};

export default App;
