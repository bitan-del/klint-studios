import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Sparkles, Image as ImageIcon, Download, Layers, Database, Palette, Users, Wand2 } from 'lucide-react';
import { getCanvaFeatures, isCanvaConfigured, isCanvaAuthenticated } from '../../services/canvaService';

export const CanvaFeaturesDisplay: React.FC = () => {
  const [features, setFeatures] = useState<Array<{ name: string; description: string; available: boolean }>>([]);
  const [configured, setConfigured] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const loadFeatures = () => {
      const canvaFeatures = getCanvaFeatures();
      setFeatures(canvaFeatures);
      setConfigured(isCanvaConfigured());
      setAuthenticated(isCanvaAuthenticated());
    };

    loadFeatures();
    // Refresh every 5 seconds to check status
    const interval = setInterval(loadFeatures, 5000);
    return () => clearInterval(interval);
  }, []);

  const featureIcons: Record<string, React.ReactNode> = {
    'Design Import': <ImageIcon size={18} />,
    'Design Editing': <Layers size={18} />,
    'Design Export': <Download size={18} />,
    'Asset Management': <Database size={18} />,
    'Data Connectors': <Database size={18} />,
    'Brand Templates': <Palette size={18} />,
    'Collaboration': <Users size={18} />,
    'AI-Powered Design': <Wand2 size={18} />,
  };

  return (
    <div className="p-4 bg-zinc-800/50 rounded-lg border border-white/10 space-y-4">
      {/* Status */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          {configured ? (
            <CheckCircle2 size={20} className="text-emerald-400" />
          ) : (
            <XCircle size={20} className="text-red-400" />
          )}
          <span className="text-sm text-zinc-300">
            {configured ? 'Configured' : 'Not Configured'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {authenticated ? (
            <CheckCircle2 size={20} className="text-emerald-400" />
          ) : (
            <XCircle size={20} className="text-amber-400" />
          )}
          <span className="text-sm text-zinc-300">
            {authenticated ? 'Authenticated' : 'Not Authenticated'}
          </span>
        </div>
      </div>

      {/* Features List */}
      <div className="grid md:grid-cols-2 gap-3">
        {features.map((feature, index) => {
          const Icon = featureIcons[feature.name] || <Sparkles size={18} />;
          return (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                feature.available
                  ? 'bg-emerald-900/20 border-emerald-500/30'
                  : 'bg-zinc-900/50 border-zinc-700/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${feature.available ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {Icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-zinc-200">{feature.name}</h4>
                    {feature.available ? (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    ) : (
                      <XCircle size={14} className="text-zinc-500" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">{feature.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/30 border border-blue-500/30 text-blue-300 text-xs rounded-lg p-3 mt-4">
        <strong>Available Features:</strong>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li><strong>Design Import:</strong> Import images into Canva and create editable designs</li>
          <li><strong>Design Editing:</strong> Programmatically edit Canva designs (size, position, elements)</li>
          <li><strong>Design Export:</strong> Export designs as PNG, JPG, or PDF</li>
          <li><strong>Asset Management:</strong> Manage and organize creative assets in Canva</li>
          <li><strong>Data Connectors:</strong> Integrate external data sources for dynamic content</li>
          <li><strong>Brand Templates:</strong> Create and manage brand-compliant templates</li>
          <li><strong>Collaboration:</strong> Share designs and manage team collaboration</li>
          <li><strong>AI-Powered Design:</strong> Leverage Canva AI features for automated design generation</li>
        </ul>
      </div>
    </div>
  );
};

