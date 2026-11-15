import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Building2,
  Image as ImageIcon,
  BookOpen,
  Box,
  Milestone,
  Newspaper,
  Layers,
  Save,
  Eye,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowLeft,
  Upload,
  Globe,
  Sliders,
  Check,
} from 'lucide-react';
import organizationService from '../../services/organization.service';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

export default function OrgProfileStudio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('branding');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Profile data
  const [profileData, setProfileData] = useState({
    name: '',
    logo: '',
    coverImage: '',
    tagline: '',
    industry: 'SaaS',
    companyStage: 'Seed',
    location: '',
    website: '',
    description: '',
    problemSolved: '',
    targetAudience: '',
    mission: '',
    vision: '',
    isPublished: true,
    contactInfo: {
      email: '',
      phone: '',
      address: '',
    },
    products: [],
    milestones: [],
    gallery: [],
    mediaFeatures: [],
    sectionOrder: [
      { key: 'overview', title: 'Snapshot & Overview', isVisible: true },
      { key: 'about', title: 'Story & Mission', isVisible: true },
      { key: 'products', title: 'Products & Solutions', isVisible: true },
      { key: 'milestones', title: 'Key Milestones', isVisible: true },
      { key: 'team', title: 'Leadership & Team', isVisible: true },
      { key: 'gallery', title: 'Life at Company', isVisible: true },
      { key: 'media', title: 'Press & Media', isVisible: true },
      { key: 'contact', title: 'Contact & Links', isVisible: true },
    ],
  });

  // Modals / forms for array items
  const [newProduct, setNewProduct] = useState({ name: '', description: '', category: 'Software', link: '', image: '' });
  const [newMilestone, setNewMilestone] = useState({ title: '', date: '', description: '', category: 'Product' });
  const [newGallery, setNewGallery] = useState({ url: '', caption: '', category: 'team' });
  const [newMedia, setNewMedia] = useState({ title: '', type: 'press', url: '', publisher: '', date: '' });

  useEffect(() => {
    const fetchStudio = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await organizationService.getStudioData(id);
        const org = res.organization || res;
        const prof = org.companyProfile || org.profile || {};

        setProfileData({
          name: org.name || '',
          logo: org.logo || '',
          coverImage: prof.coverImage || org.coverImage || '',
          tagline: prof.tagline || '',
          industry: prof.industry || 'SaaS',
          companyStage: prof.companyStage || 'Seed',
          location: org.location || '',
          website: org.website || '',
          description: prof.description || org.description || '',
          problemSolved: prof.problemSolved || '',
          targetAudience: prof.targetAudience || '',
          mission: prof.mission || '',
          vision: prof.vision || '',
          isPublished: prof.isPublished !== undefined ? prof.isPublished : true,
          contactInfo: prof.contactInfo || {
            email: '',
            phone: '',
            address: '',
          },
          products: prof.products || [],
          milestones: prof.milestones || [],
          gallery: prof.gallery || [],
          mediaFeatures: prof.mediaFeatures || [],
          sectionOrder: prof.sectionOrder || [
            { key: 'overview', title: 'Snapshot & Overview', isVisible: true },
            { key: 'about', title: 'Story & Mission', isVisible: true },
            { key: 'products', title: 'Products & Solutions', isVisible: true },
            { key: 'milestones', title: 'Key Milestones', isVisible: true },
            { key: 'team', title: 'Leadership & Team', isVisible: true },
            { key: 'gallery', title: 'Life at Company', isVisible: true },
            { key: 'media', title: 'Press & Media', isVisible: true },
            { key: 'contact', title: 'Contact & Links', isVisible: true },
          ],
        });
      } catch (err) {
        setError(err.message || 'Failed to load studio data');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchStudio();
  }, [id]);

  const handleSave = async (publishState = null) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      ...profileData,
      isPublished: publishState !== null ? publishState : profileData.isPublished,
    };

    try {
      await organizationService.saveStudioData(id, payload);
      setSuccess(publishState ? 'Profile published successfully to the public directory!' : 'Draft changes saved!');
      if (publishState !== null) {
        setProfileData((prev) => ({ ...prev, isPublished: publishState }));
      }
    } catch (err) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // Array item helpers
  const handleAddProduct = () => {
    if (!newProduct.name.trim()) return;
    const item = { ...newProduct, id: Date.now().toString() };
    setProfileData((prev) => ({ ...prev, products: [...prev.products, item] }));
    setNewProduct({ name: '', description: '', category: 'Software', link: '', image: '' });
  };

  const handleDeleteProduct = (productId) => {
    setProfileData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => (p._id || p.id) !== productId),
    }));
  };

  const handleAddMilestone = () => {
    if (!newMilestone.title.trim()) return;
    const item = { ...newMilestone, id: Date.now().toString() };
    setProfileData((prev) => ({ ...prev, milestones: [...prev.milestones, item] }));
    setNewMilestone({ title: '', date: '', description: '', category: 'Product' });
  };

  const handleDeleteMilestone = (milestoneId) => {
    setProfileData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((m) => (m._id || m.id) !== milestoneId),
    }));
  };

  const handleAddGallery = () => {
    if (!newGallery.url.trim()) return;
    const item = { ...newGallery, id: Date.now().toString() };
    setProfileData((prev) => ({ ...prev, gallery: [...prev.gallery, item] }));
    setNewGallery({ url: '', caption: '', category: 'team' });
  };

  const handleDeleteGallery = (imgId) => {
    setProfileData((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((g) => (g._id || g.id) !== imgId),
    }));
  };

  const handleAddMedia = () => {
    if (!newMedia.title.trim() || !newMedia.url.trim()) return;
    const item = { ...newMedia, id: Date.now().toString() };
    setProfileData((prev) => ({ ...prev, mediaFeatures: [...prev.mediaFeatures, item] }));
    setNewMedia({ title: '', type: 'press', url: '', publisher: '', date: '' });
  };

  const handleDeleteMedia = (mediaId) => {
    setProfileData((prev) => ({
      ...prev,
      mediaFeatures: prev.mediaFeatures.filter((m) => (m._id || m.id) !== mediaId),
    }));
  };

  const toggleSectionVisibility = (key) => {
    setProfileData((prev) => ({
      ...prev,
      sectionOrder: prev.sectionOrder.map((s) =>
        s.key === key ? { ...s, isVisible: !s.isVisible } : s
      ),
    }));
  };

  if (loading) {
    return (
      <div className="py-28 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-neutral-500">Opening Admin Profile Studio...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'branding', label: 'Branding & Hero', icon: ImageIcon },
    { id: 'story', label: 'Story & Mission', icon: BookOpen },
    { id: 'products', label: 'Products & Solutions', icon: Box },
    { id: 'milestones', label: 'Milestones & History', icon: Milestone },
    { id: 'gallery', label: 'Photo Gallery', icon: Sparkles },
    { id: 'media', label: 'Press & Media', icon: Newspaper },
    { id: 'sections', label: 'Layout & Sections', icon: Layers },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-neutral-200">
        <div>
          <Link
            to={`/organizations/${id}/dashboard`}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-amber-600 mb-2 transition"
          >
            <ArrowLeft size={13} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Admin Profile Studio
            </h1>
            <Badge variant={profileData.isPublished ? 'success' : 'warning'}>
              {profileData.isPublished ? 'Published Live' : 'Draft Mode'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Build and customize your startup's miniature website and public showcase.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link to={`/organizations/${id}`} target="_blank">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Eye size={14} /> Preview Live
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            loading={saving}
            onClick={() => handleSave(false)}
            className="gap-1.5"
          >
            <Save size={14} /> Save Draft
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            onClick={() => handleSave(true)}
            className="gap-1.5"
          >
            <Check size={14} /> Publish Changes
          </Button>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-600" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Studio Nav Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-8 scrollbar-none border-b border-neutral-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : 'text-neutral-600 hover:text-gray-900 hover:bg-neutral-50'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-amber-600' : 'text-neutral-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Branding & Hero */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          <Card padding="lg">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon className="text-amber-500" size={18} />
              Brand Assets & Hero Imagery
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Cover Photo URL (High resolution recommended: 1920x600)
                </label>
                <input
                  type="url"
                  value={profileData.coverImage}
                  onChange={(e) => setProfileData({ ...profileData, coverImage: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Logo Image URL (Square 400x400)
                </label>
                <input
                  type="url"
                  value={profileData.logo}
                  onChange={(e) => setProfileData({ ...profileData, logo: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Official Website
                </label>
                <input
                  type="url"
                  value={profileData.website}
                  onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                  placeholder="https://acme.ai"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Impact Tagline (Featured prominently below company name)
                </label>
                <input
                  type="text"
                  value={profileData.tagline}
                  onChange={(e) => setProfileData({ ...profileData, tagline: e.target.value })}
                  placeholder="e.g. Next-generation infrastructure powering the autonomous enterprise"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* Live Hero Banner Preview */}
            <div className="pt-4 border-t border-neutral-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                Live Hero Banner Preview
              </h3>
              <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-neutral-900 shadow-inner relative">
                {profileData.coverImage ? (
                  <img
                    src={profileData.coverImage}
                    alt="Cover preview"
                    className="w-full h-44 object-cover opacity-80"
                  />
                ) : (
                  <div
                    className="w-full h-44 flex items-center justify-center text-xs text-neutral-400"
                    style={{
                      background: 'linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%)',
                    }}
                  >
                    No cover photo provided (Default Golden Circle charcoal gradient will display)
                  </div>
                )}
                <div className="p-4 bg-white flex items-center gap-4">
                  {profileData.logo ? (
                    <img
                      src={profileData.logo}
                      alt="Logo preview"
                      className="h-12 w-12 rounded-xl object-contain border p-1 bg-white"
                    />
                  ) : (
                    <div
                      className="h-12 w-12 rounded-xl border flex items-center justify-center font-bold text-xs"
                      style={{ borderColor: '#C9A84C', color: '#A07830', backgroundColor: '#FFFDF5' }}
                    >
                      LOGO
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{profileData.name || 'Company Name'}</h4>
                    <p className="text-xs text-neutral-500">{profileData.tagline || 'Your company tagline will appear here'}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Story & Mission */}
      {activeTab === 'story' && (
        <div className="space-y-6">
          <Card padding="lg">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="text-amber-500" size={18} />
              Mission, Vision & Problem Narrative
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  The Problem We Solve
                </label>
                <textarea
                  rows={3}
                  value={profileData.problemSolved}
                  onChange={(e) => setProfileData({ ...profileData, problemSolved: e.target.value })}
                  placeholder="What is broken in your industry, and why does current tooling fail?"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Target Audience & Customers
                </label>
                <textarea
                  rows={2}
                  value={profileData.targetAudience}
                  onChange={(e) => setProfileData({ ...profileData, targetAudience: e.target.value })}
                  placeholder="Who relies on your solutions? (e.g. Enterprise DevOps leads, B2B founders, indie hackers)"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Our Mission Statement
                  </label>
                  <textarea
                    rows={3}
                    value={profileData.mission}
                    onChange={(e) => setProfileData({ ...profileData, mission: e.target.value })}
                    placeholder="Our core purpose in 2-3 sentences..."
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Our Long-Term Vision
                  </label>
                  <textarea
                    rows={3}
                    value={profileData.vision}
                    onChange={(e) => setProfileData({ ...profileData, vision: e.target.value })}
                    placeholder="Where do we envision our industry in 5-10 years?"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Expanded Company Story & Pitch
                </label>
                <textarea
                  rows={5}
                  value={profileData.description}
                  onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                  placeholder="Share the complete founding journey, culture, and achievements..."
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Products & Solutions */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <Card padding="lg">
            <h2 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Box className="text-amber-500" size={18} />
              Products & Solutions Showcase
            </h2>
            <p className="text-xs text-neutral-500 mb-6">
              Highlight flagship products, developer APIs, or core software offerings.
            </p>

            {/* Add product form */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 mb-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Add New Product</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Product / Service Name *"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="px-3.5 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <input
                  type="text"
                  placeholder="Category (e.g. Platform, API, Mobile)"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="px-3.5 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <input
                  type="url"
                  placeholder="Live URL / Launch Link"
                  value={newProduct.link}
                  onChange={(e) => setNewProduct({ ...newProduct, link: e.target.value })}
                  className="px-3.5 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <input
                  type="url"
                  placeholder="Product screenshot / icon URL"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  className="sm:col-span-2 px-3.5 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <Button variant="primary" size="sm" onClick={handleAddProduct} className="gap-1 text-xs">
                  <Plus size={14} /> Add Product Card
                </Button>
              </div>
              <textarea
                rows={2}
                placeholder="Product description and core features..."
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
            </div>

            {/* Existing products list */}
            <div className="space-y-3">
              {profileData.products.length === 0 ? (
                <p className="text-xs text-neutral-400 italic py-4 text-center">
                  No products added yet. Add your flagship software above.
                </p>
              ) : (
                profileData.products.map((p) => (
                  <div
                    key={p._id || p.id}
                    className="p-4 rounded-xl border border-neutral-200 bg-white flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 text-sm">{p.name}</span>
                        {p.category && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            {p.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 max-w-lg">{p.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteProduct(p._id || p.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 transition"
                      title="Remove product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: Milestones & History */}
      {activeTab === 'milestones' && (
        <div className="space-y-6">
          <Card padding="lg">
            <h2 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Milestone className="text-amber-500" size={18} />
              Company Milestones & History Timeline
            </h2>
            <p className="text-xs text-neutral-500 mb-6">
              Track major funding rounds, patent grants, product launches, and strategic achievements.
            </p>

            {/* Add milestone form */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 mb-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Add Milestone</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Date / Year (e.g. Q3 2024)"
                  value={newMilestone.date}
                  onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
                  className="px-3.5 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <input
                  type="text"
                  placeholder="Milestone Title *"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                  className="sm:col-span-2 px-3.5 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <Button variant="primary" size="sm" onClick={handleAddMilestone} className="gap-1 text-xs">
                  <Plus size={14} /> Add Milestone
                </Button>
              </div>
              <textarea
                rows={2}
                placeholder="Description of the milestone achievement..."
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
            </div>

            {/* Existing milestones list */}
            <div className="space-y-3">
              {profileData.milestones.length === 0 ? (
                <p className="text-xs text-neutral-400 italic py-4 text-center">
                  No milestones added yet. Add company accomplishments above.
                </p>
              ) : (
                profileData.milestones.map((m) => (
                  <div
                    key={m._id || m.id}
                    className="p-4 rounded-xl border border-neutral-200 bg-white flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          {m.date || 'Event'}
                        </span>
                        <span className="font-bold text-gray-900 text-sm">{m.title}</span>
                      </div>
                      <p className="text-xs text-neutral-500 max-w-lg">{m.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteMilestone(m._id || m.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 transition"
                      title="Remove milestone"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 5: Photo Gallery */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <Card padding="lg">
            <h2 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Sparkles className="text-amber-500" size={18} />
              Photo Gallery & Culture
            </h2>
            <p className="text-xs text-neutral-500 mb-6">
              Showcase office culture, hackathons, team offsites, and product demos.
            </p>

            {/* Add photo form */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 mb-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Add Gallery Image</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="url"
                  placeholder="Image URL (Unsplash or hosted) *"
                  value={newGallery.url}
                  onChange={(e) => setNewGallery({ ...newGallery, url: e.target.value })}
                  className="sm:col-span-2 px-3.5 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <select
                  value={newGallery.category}
                  onChange={(e) => setNewGallery({ ...newGallery, category: e.target.value })}
                  className="px-3.5 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="team">Team & People</option>
                  <option value="office">HQ & Workspace</option>
                  <option value="product">Product & Tech</option>
                  <option value="event">Events & Hackathons</option>
                </select>
                <Button variant="primary" size="sm" onClick={handleAddGallery} className="gap-1 text-xs">
                  <Plus size={14} /> Add Image
                </Button>
              </div>
              <input
                type="text"
                placeholder="Image caption or memory description..."
                value={newGallery.caption}
                onChange={(e) => setNewGallery({ ...newGallery, caption: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Gallery grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {profileData.gallery.length === 0 ? (
                <p className="text-xs text-neutral-400 italic py-4 col-span-full text-center">
                  No gallery photos added yet. Add your first photo above.
                </p>
              ) : (
                profileData.gallery.map((g) => (
                  <div
                    key={g._id || g.id}
                    className="relative group rounded-xl border border-neutral-200 overflow-hidden bg-neutral-100 aspect-video"
                  >
                    <img src={g.url} alt={g.caption} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition p-2.5 flex flex-col justify-between text-white">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/20 self-start">
                        {g.category}
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs truncate max-w-[120px]">{g.caption || 'Photo'}</span>
                        <button
                          onClick={() => handleDeleteGallery(g._id || g.id)}
                          className="p-1 text-red-300 hover:text-red-100 cursor-pointer"
                          title="Delete photo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 6: Press & Media */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          <Card padding="lg">
            <h2 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Newspaper className="text-amber-500" size={18} />
              Press, Interviews & Podcasts
            </h2>
            <p className="text-xs text-neutral-500 mb-6">
              Link feature articles, founder podcasts, YouTube demos, or industry press mentions.
            </p>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 mb-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Add Media Feature</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Headline / Title *"
                  value={newMedia.title}
                  onChange={(e) => setNewMedia({ ...newMedia, title: e.target.value })}
                  className="sm:col-span-2 px-3.5 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <select
                  value={newMedia.type}
                  onChange={(e) => setNewMedia({ ...newMedia, type: e.target.value })}
                  className="px-3.5 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="press">Press Article</option>
                  <option value="podcast">Podcast</option>
                  <option value="video">Video Feature</option>
                  <option value="interview">Founder Interview</option>
                </select>
                <Button variant="primary" size="sm" onClick={handleAddMedia} className="gap-1 text-xs">
                  <Plus size={14} /> Add Feature
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="url"
                  placeholder="Source / Article URL *"
                  value={newMedia.url}
                  onChange={(e) => setNewMedia({ ...newMedia, url: e.target.value })}
                  className="px-3.5 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <input
                  type="text"
                  placeholder="Publisher (e.g. TechCrunch, Forbes, YC)"
                  value={newMedia.publisher}
                  onChange={(e) => setNewMedia({ ...newMedia, publisher: e.target.value })}
                  className="px-3.5 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div className="space-y-3">
              {profileData.mediaFeatures.length === 0 ? (
                <p className="text-xs text-neutral-400 italic py-4 text-center">
                  No press mentions added yet. Add interviews or podcast appearances above.
                </p>
              ) : (
                profileData.mediaFeatures.map((m) => (
                  <div
                    key={m._id || m.id}
                    className="p-4 rounded-xl border border-neutral-200 bg-white flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          {m.type}
                        </span>
                        <span className="font-bold text-gray-900 text-sm">{m.title}</span>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {m.publisher && `${m.publisher} • `}
                        <a href={m.url} target="_blank" rel="noreferrer" className="text-amber-600 hover:underline">
                          View Feature ↗
                        </a>
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteMedia(m._id || m.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 transition"
                      title="Remove feature"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 7: Layout & Section Visibility */}
      {activeTab === 'sections' && (
        <div className="space-y-6">
          <Card padding="lg">
            <h2 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Layers className="text-amber-500" size={18} />
              Page Section Visibility
            </h2>
            <p className="text-xs text-neutral-500 mb-6">
              Toggle which sections appear on your public miniature website.
            </p>

            <div className="divide-y divide-neutral-200">
              {profileData.sectionOrder.map((sec) => (
                <div key={sec.key} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">{sec.title}</span>
                    <span className="text-xs text-neutral-400 block">Section identifier: {sec.key}</span>
                  </div>
                  <button
                    onClick={() => toggleSectionVisibility(sec.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      sec.isVisible
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                    }`}
                  >
                    {sec.isVisible ? 'Visible' : 'Hidden'}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Bottom Floating Action Bar */}
      <div className="mt-10 p-4 rounded-2xl bg-white border border-neutral-200 shadow-md flex items-center justify-between">
        <span className="text-xs text-neutral-500">
          Unsaved edits will remain in your browser session until submitted.
        </span>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            loading={saving}
            onClick={() => handleSave(false)}
          >
            Save Draft
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            onClick={() => handleSave(true)}
            className="gap-1.5"
          >
            <Check size={14} /> Publish Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
