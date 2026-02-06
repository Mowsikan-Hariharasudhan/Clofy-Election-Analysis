import React from 'react';
import { tamilTranslations } from '../data/translations';
import { LayoutDashboard, Table, Map } from 'lucide-react';

interface NavbarProps {
    currentView: 'dashboard' | 'master' | 'map';
    setView: (view: 'dashboard' | 'master' | 'map') => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView }) => {
    return (
        <nav className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl font-bold tracking-tight">🗳️ {tamilTranslations.Analysis}</span>
                    </div>

                    <div className="flex space-x-1">
                        <button
                            onClick={() => setView('dashboard')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 
                ${currentView === 'dashboard' ? 'bg-white text-blue-700 font-bold' : 'hover:bg-blue-600 text-blue-100'}`}
                        >
                            <LayoutDashboard size={20} />
                            <span>{tamilTranslations.Visualizations}</span>
                        </button>
                        <button
                            onClick={() => setView('master')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 
                ${currentView === 'master' ? 'bg-white text-blue-700 font-bold' : 'hover:bg-blue-600 text-blue-100'}`}
                        >
                            <Table size={20} />
                            <span>{tamilTranslations.MasterSheet}</span>
                        </button>
                        <button
                            onClick={() => setView('map')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 
                ${currentView === 'map' ? 'bg-white text-blue-700 font-bold' : 'hover:bg-blue-600 text-blue-100'}`}
                        >
                            <Map size={20} />
                            <span>Map</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
