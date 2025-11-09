import React, { useState, useEffect } from 'react';
import { Plus, Folder, Sparkles, TrendingUp, Image as ImageIcon, Settings, Trash2, Loader2 } from 'lucide-react';
import { getBrandProfiles, createBrandProfile, deleteBrandProfile } from '../../services/brandService';
import type { BrandProfile } from '../../types/brand';
import { BrandStudioEditor } from './BrandStudioEditor';

interface BrandStudiosDashboardProps {
  onBack?: () => void;
}

export const BrandStudiosDashboard: React.FC<BrandStudiosDashboardProps> = ({ onBack }) => {
  const [profiles, setProfiles] = useState<BrandProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<BrandProfile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newClientId, setNewClientId] = useState('');

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setIsLoading(true);
      const data = await getBrandProfiles();
      setProfiles(data);
    } catch (error) {
      console.error('Error loading brand profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      alert('Please enter a brand name');
      return;
    }

    try {
      setIsCreating(true);
      const profile = await createBrandProfile(newProfileName.trim(), newClientId.trim() || undefined);
      setProfiles([profile, ...profiles]);
      setShowCreateModal(false);
      setNewProfileName('');
      setNewClientId('');
      setSelectedProfile(profile);
    } catch (error) {
      console.error('Error creating brand profile:', error);
      alert('Failed to create brand profile. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand profile? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteBrandProfile(id);
      setProfiles(profiles.filter(p => p.id !== id));
      if (selectedProfile?.id === id) {
        setSelectedProfile(null);
      }
    } catch (error) {
      console.error('Error deleting brand profile:', error);
      alert('Failed to delete brand profile. Please try again.');
    }
  };

  const getTrainingStatus = (profile: BrandProfile) => {
    if (profile.training_completeness >= 80) return { label: 'Ready', color: 'text-emerald-400' };
    if (profile.training_completeness >= 50) return { label: 'Training', color: 'text-yellow-400' };
    return { label: 'New', color: 'text-zinc-400' };
  };

  if (selectedProfile) {
    return (
      <BrandStudioEditor
        profile={selectedProfile}
        onBack={() => setSelectedProfile(null)}
        onUpdate={(updated) => {
          setProfiles(profiles.map(p => p.id === updated.id ? updated : p));
          setSelectedProfile(updated);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            {onBack && (
              <button
                onClick={onBack}
                className="text-zinc-400 hover:text-white mb-4 flex items-center gap-2"
              >
                ← Back
              </button>
            )}
            <h1 className="text-3xl font-bold text-white mb-2">Brand Studios</h1>
            <p className="text-zinc-400">
              Create and train AI-powered brand style profiles for your clients
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
          >
            <Plus size={20} />
            New Brand Studio
          </button>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-800 rounded-xl p-6 max-w-md w-full border border-zinc-700">
              <h2 className="text-xl font-bold text-white mb-4">Create New Brand Studio</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="e.g., Nike, Adidas, Client Name"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Client ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                    placeholder="e.g., CLIENT-001"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewProfileName('');
                      setNewClientId('');
                    }}
                    className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateProfile}
                    disabled={isCreating || !newProfileName.trim()}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Brand Profiles Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-emerald-400" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-20">
            <Folder size={64} className="mx-auto text-zinc-600 mb-4" />
            <h3 className="text-xl font-semibold text-zinc-400 mb-2">No Brand Studios Yet</h3>
            <p className="text-zinc-500 mb-6">
              Create your first brand studio to start training AI on client styles
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
            >
              <Plus size={20} />
              Create Brand Studio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => {
              const status = getTrainingStatus(profile);
              return (
                <div
                  key={profile.id}
                  className="bg-zinc-800 rounded-xl p-6 border border-zinc-700 hover:border-emerald-500/50 transition-all cursor-pointer group"
                  onClick={() => setSelectedProfile(profile)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{profile.name}</h3>
                      {profile.client_id && (
                        <p className="text-sm text-zinc-400">Client: {profile.client_id}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProfile(profile.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-zinc-700 rounded-lg transition-all text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">Training</span>
                      <span className={`text-sm font-medium ${status.color}`}>
                        {status.label} ({profile.training_completeness}%)
                      </span>
                    </div>

                    <div className="w-full bg-zinc-700 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all"
                        style={{ width: `${profile.training_completeness}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                      <div className="flex items-center gap-1">
                        <ImageIcon size={16} />
                        <span>{profile.reference_images.length} references</span>
                      </div>
                      {profile.color_palette.length > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="flex gap-1">
                            {profile.color_palette.slice(0, 3).map((color, i) => (
                              <div
                                key={i}
                                className="w-4 h-4 rounded-full border border-zinc-600"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {profile.style_description && (
                      <p className="text-sm text-zinc-400 line-clamp-2">
                        {profile.style_description}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProfile(profile);
                    }}
                    className="mt-4 w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg transition-colors text-sm font-medium"
                  >
                    Open Studio
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

