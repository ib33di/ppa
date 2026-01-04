import React, { useState } from 'react';
import { Icon } from './Icons';
import { api } from '../lib/api';

interface AddPlayerModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPlayerModal({ onClose, onSuccess }: AddPlayerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    level: '',
    position: 'Left' as 'Left' | 'Right' | 'Both',
    trust_score: 50,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/players', {
        ...formData,
        phone: formData.phone.replace(/\s+/g, '').replace(/^\+/, ''),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add player');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Add New Player</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-zinc-400 mb-2 block">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-400 mb-2 block">Phone Number *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white"
              placeholder="966512345678"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-400 mb-2 block">Level</label>
            <input
              type="text"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white"
              placeholder="4.5"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-400 mb-2 block">Position</label>
            <select
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value as 'Left' | 'Right' | 'Both' })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white"
            >
              <option value="Left">Left</option>
              <option value="Right">Right</option>
              <option value="Both">Both</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-400 mb-2 block">Trust Score (0-100)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.trust_score}
              onChange={(e) => setFormData({ ...formData, trust_score: parseInt(e.target.value) || 50 })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-lg transition-colors"
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

