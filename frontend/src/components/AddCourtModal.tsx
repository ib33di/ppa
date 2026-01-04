import React, { useState } from 'react';
import { Icon } from './Icons';
import { api } from '../lib/api';

interface AddCourtModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddCourtModal({ onClose, onSuccess }: AddCourtModalProps) {
  const [name, setName] = useState('');
  const [ranges, setRanges] = useState<Array<{ start_time: string; end_time: string }>>([
    { start_time: '07:00', end_time: '23:30' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/courts', {
        name,
        is_active: true,
        availability: ranges
          .filter(r => r.start_time && r.end_time)
          .map(r => ({ start_time: r.start_time, end_time: r.end_time })),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add court');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Add New Court</h3>
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
            <label className="text-sm font-medium text-zinc-400 mb-2 block">Court Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white"
              placeholder="e.g., Main Court"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-400 mb-2 block">Allowed Play Hours (24H)</label>
            <div className="space-y-2">
              {ranges.map((r, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={r.start_time}
                    onChange={(e) => {
                      const next = [...ranges];
                      next[idx] = { ...next[idx], start_time: e.target.value };
                      setRanges(next);
                    }}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
                  />
                  <span className="text-xs text-zinc-500">→</span>
                  <input
                    type="time"
                    value={r.end_time}
                    onChange={(e) => {
                      const next = [...ranges];
                      next[idx] = { ...next[idx], end_time: e.target.value };
                      setRanges(next);
                    }}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
                  />
                  {ranges.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setRanges(ranges.filter((_, i) => i !== idx))}
                      className="px-2 py-2 text-zinc-500 hover:text-white"
                      title="Remove range"
                    >
                      <Icon name="x" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setRanges([...ranges, { start_time: '07:00', end_time: '23:30' }])}
                className="text-xs text-zinc-400 hover:text-white underline underline-offset-4"
              >
                Add another time range
              </button>
            </div>
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

