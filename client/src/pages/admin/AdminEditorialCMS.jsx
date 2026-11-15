import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Sparkles,
  Edit2,
  Trash2,
  Eye,
  Check,
  X,
  Upload,
} from 'lucide-react';
import adminService from '../../services/admin.service';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { formatDate } from '../../utils/formatters';

export default function AdminEditorialCMS() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Founder Story',
    author: 'Golden Circle Editorial Board',
    readingTime: '5 min read',
    summary: '',
    content: '',
    coverImage: '',
    status: 'published',
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await adminService.getCMS();
      const list = Array.isArray(res) ? res : res.items || [];
      setItems(list);
    } catch (err) {
      console.warn('Failed to fetch CMS items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'Founder Story',
      author: 'Golden Circle Editorial Board',
      readingTime: '5 min read',
      summary: '',
      content: '',
      coverImage: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&auto=format&fit=crop&q=80',
      status: 'published',
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      category: item.category || 'Founder Story',
      author: item.author || 'Golden Circle Editorial Board',
      readingTime: item.readingTime || '5 min read',
      summary: item.summary || '',
      content: item.content || '',
      coverImage: item.coverImage || '',
      status: item.status || 'published',
    });
    setIsEditorOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        await adminService.updateCMS(editingItem._id || editingItem.id, formData);
      } else {
        await adminService.createCMS(formData);
      }
      setIsEditorOpen(false);
      await fetchItems();
    } catch (err) {
      alert(err.message || 'Failed to save editorial publication');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this publication?')) return;
    try {
      await adminService.deleteCMS(id);
      setItems((prev) => prev.filter((i) => (i._id || i.id) !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete publication');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
            <FileText className="w-4 h-4 text-amber-600" /> Editorial & Content Publishing
          </div>
          <h1 className="text-2xl font-bold text-charcoal font-serif">Founder Stories & Syndicate Dispatches</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Craft exclusive founder interviews, market intelligence digests, and podcast episode write-ups.
          </p>
        </div>

        <Button onClick={handleOpenCreate} size="md" variant="primary" className="gap-2 shadow-xs">
          <Plus className="w-4 h-4" /> New Publication
        </Button>
      </div>

      {/* Publications Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-2">
          <Spinner size="lg" />
          <span className="text-xs text-neutral-500">Loading editorial archives...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200 text-neutral-400">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">No editorial stories published yet</p>
          <div className="mt-4">
            <Button size="sm" variant="secondary" onClick={handleOpenCreate}>
              Write First Story
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item._id || item.id}
              className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm flex flex-col justify-between hover:border-amber-300 transition group"
            >
              <div>
                {item.coverImage && (
                  <div className="h-44 w-full bg-neutral-100 overflow-hidden relative">
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-charcoal/80 text-white backdrop-blur-xs">
                      {item.category}
                    </span>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-2">
                    <span>{item.author}</span>
                    <span>{item.readingTime}</span>
                  </div>

                  <h3 className="font-bold text-charcoal text-base line-clamp-2 group-hover:text-amber-700 transition">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-2 line-clamp-3 leading-relaxed">
                    {item.summary || item.content}
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-neutral-50/70 border-t border-neutral-100 flex items-center justify-between text-xs">
                <span className="text-neutral-400">{item.createdAt ? formatDate(item.createdAt) : 'Published'}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 text-neutral-500 hover:text-amber-700 hover:bg-neutral-200/50 rounded-lg transition"
                    title="Edit publication"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id || item.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete publication"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-neutral-200 shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-charcoal text-base font-serif">
                  {editingItem ? 'Edit Publication' : 'Draft New Editorial Dispatch'}
                </h3>
                <p className="text-xs text-neutral-500">Publish high-impact founder insights to The Golden Circle.</p>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-charcoal hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">Headline / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scaling to $10M ARR: Inside Zepto's Fast Delivery Symphony"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Founder Story">Founder Story</option>
                    <option value="Market Intel">Market Intel</option>
                    <option value="Syndicate Dispatch">Syndicate Dispatch</option>
                    <option value="Podcast">Podcast Episode</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Author / Bylines</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">Cover Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  className="w-full text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">Executive Summary</label>
                <textarea
                  rows={2}
                  required
                  placeholder="1-2 sentences summarizing the thesis..."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full text-xs bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">Full Article Content (Markdown supported)</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Write the full founder story or dispatch..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full text-xs bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2.5">
                <Button variant="ghost" size="sm" type="button" onClick={() => setIsEditorOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={saving}>
                  {editingItem ? 'Save Changes' : 'Publish Story'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
