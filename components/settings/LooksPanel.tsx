import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { Save, Layers, Trash2, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LooksPanel: React.FC = () => {
    const { looks, saveLook, applyLook, deleteLook, t } = useStudio();
    const { user } = useAuth();
    const [name, setName] = useState('');
    
    // Lock for free users
    const isLocked = user?.plan === 'free';

    const handleSave = () => {
        if(name.trim()) {
            saveLook(name.trim());
            setName('');
        }
    };

    return (
        <div className="space-y-4 relative">
            {isLocked && (
                <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                    <div className="bg-zinc-800 border border-emerald-500/30 rounded-lg p-4 text-center max-w-xs">
                        <Lock size={32} className="text-emerald-400 mx-auto mb-2" />
                        <p className="text-zinc-300 font-semibold mb-1">Premium Feature</p>
                        <p className="text-xs text-zinc-400">Upgrade to Solo or higher to save and apply looks</p>
                    </div>
                </div>
            )}
            <div className={isLocked ? 'opacity-50 pointer-events-none' : ''}>
                <label htmlFor="look-name" className="text-sm font-semibold text-zinc-300">
                    {t('save_current_look')}
                    {isLocked && <Lock size={12} className="inline-block ml-1.5 text-emerald-400" />}
                </label>
                <p className="text-xs text-zinc-400 mt-1 mb-2">{t('save_current_look_desc')}</p>
                <div className="flex gap-2">
                    <input
                        id="look-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('save_current_look_placeholder')}
                        className="flex-1 p-2.5 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft"
                        disabled={isLocked}
                    />
                    <button
                        onClick={handleSave}
                        disabled={!name.trim() || isLocked}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Save Look"
                    >
                        <Save size={18} />
                    </button>
                </div>
            </div>

            {looks.length > 0 && (
                <div className={`border-t border-zinc-700 pt-4 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
                     <h4 className="text-sm font-semibold text-zinc-300 mb-2">{t('my_looks')}</h4>
                     <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {looks.map(look => (
                            <div key={look.id} className="flex items-center justify-between p-2 rounded-md bg-zinc-800/70 hover:bg-zinc-800 transition-colors">
                                <p className="text-sm text-zinc-200 font-medium truncate pr-2">{look.name}</p>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                     <button onClick={() => applyLook(look.id)} disabled={isLocked} className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={t('apply_look')}>
                                        <Layers size={16} />
                                    </button>
                                    <button onClick={() => deleteLook(look.id)} disabled={isLocked} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={t('delete_look')}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
            )}
        </div>
    );
};