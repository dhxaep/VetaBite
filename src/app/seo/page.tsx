"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Eye,
  Link as LinkIcon,
  Tag,
  Image as ImageIcon,
  Globe,
  Users,
  Camera,
  Save,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";

interface SeoData {
  title: string;
  description: string;
  keywords: string;
  author: string;
  thumbnailUrl: string;
  ogImageUrl: string;
  twitterHandle: string;
  canonicalUrl: string;
}

export default function SeoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<SeoData>({
    title: "",
    description: "",
    keywords: "",
    author: "",
    thumbnailUrl: "",
    ogImageUrl: "",
    twitterHandle: "",
    canonicalUrl: "",
  });
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    loadSeo();
  }, []);

  const loadSeo = async () => {
    try {
      setLoading(true);
      const seo = await api<SeoData>("/api/admin/settings/seo");
      setData(seo);
      generatePreview(seo);
    } catch (err: any) {
      console.error("Failed to load SEO settings:", err);
      setMessage({ text: "Gagal memuat setting SEO.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = (seo: SeoData) => {
    const previewText = `Title: ${seo.title}\nDesc: ${seo.description}\nKeywords: ${seo.keywords}\nAuthor: ${seo.author}\nThumbnail: ${seo.thumbnailUrl}\nOG Image: ${seo.ogImageUrl}\nTwitter: ${seo.twitterHandle}\nCanonical: ${seo.canonicalUrl}`;
    setPreview(previewText);
  };

  const handleChange = (field: keyof SeoData, value: string) => {
    const updated = { ...data, [field]: value };
    setData(updated);
    generatePreview(updated);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await api<{ success: boolean; message: string }>("/api/admin/settings/seo", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setMessage({ text: "SEO settings saved.", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to save.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-base p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-on-surface">Loading SEO settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-base text-on-surface p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">SEO & Meta Panel</h1>
                <p className="text-text-muted text-sm">Manage website SEO, meta tags, and thumbnails for vetabite.my.id</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-full text-xs font-medium">
              <ShieldCheck className="h-3 w-3" />
              <span>Admin Access Only • Requires Google OAuth</span>
            </div>
          </div>

          {message.text && (
            <div className={`p-3 rounded-xl mb-6 ${message.type === "success" ? "bg-success/20 border border-success/30 text-success" : "bg-error/20 border border-error/30 text-error"}`}>
              {message.text}
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-surface rounded-2xl p-6 border border-border">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Tag className="h-5 w-5" /> Core SEO
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Site Title</label>
                    <input
                      type="text"
                      value={data.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      className="w-full p-3 rounded-xl bg-surface-container border border-border focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="VetaBite - Portal Kantin UPN Veteran Jakarta"
                    />
                    <p className="text-xs text-text-muted mt-1">Appears in browser tab & search results.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Meta Description</label>
                    <textarea
                      rows={3}
                      value={data.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      className="w-full p-3 rounded-xl bg-surface-container border border-border focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Platform Pemesanan & Antrean Cerdas Kantin UPNVJ Tanpa Antre..."
                    />
                    <p className="text-xs text-text-muted mt-1">Keep under 160 characters for best display.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Keywords</label>
                    <textarea
                      rows={2}
                      value={data.keywords}
                      onChange={(e) => handleChange("keywords", e.target.value)}
                      className="w-full p-3 rounded-xl bg-surface-container border border-border focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="VetaBite, Kantin UPN, UPNVJ, Pesan Makanan Online..."
                    />
                    <p className="text-xs text-text-muted mt-1">Comma‑separated keywords for search engines.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Author / Copyright</label>
                    <input
                      type="text"
                      value={data.author}
                      onChange={(e) => handleChange("author", e.target.value)}
                      className="w-full p-3 rounded-xl bg-surface-container border border-border focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="VetaBite Team"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded-2xl p-6 border border-border">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Globe className="h-5 w-5" /> Social & Thumbnails
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                        <ImageIcon className="h-4 w-4" /> Thumbnail URL
                      </label>
                      <input
                        type="text"
                        value={data.thumbnailUrl}
                        onChange={(e) => handleChange("thumbnailUrl", e.target.value)}
                        className="w-full p-3 rounded-xl bg-surface-container border border-border focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="/LOGO.jpeg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                        <Camera className="h-4 w-4" /> OpenGraph Image
                      </label>
                      <input
                        type="text"
                        value={data.ogImageUrl}
                        onChange={(e) => handleChange("ogImageUrl", e.target.value)}
                        className="w-full p-3 rounded-xl bg-surface-container border border-border focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="/LOGO.jpeg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                        <LinkIcon className="h-4 w-4" /> Canonical URL
                      </label>
                      <input
                        type="text"
                        value={data.canonicalUrl}
                        onChange={(e) => handleChange("canonicalUrl", e.target.value)}
                        className="w-full p-3 rounded-xl bg-surface-container border border-border focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="https://vetabite.my.id"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                        <Users className="h-4 w-4" /> Twitter Handle
                      </label>
                      <input
                        type="text"
                        value={data.twitterHandle}
                        onChange={(e) => handleChange("twitterHandle", e.target.value)}
                        className="w-full p-3 rounded-xl bg-surface-container border border-border focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="@vetabite"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={loadSeo}
                  className="px-5 py-2.5 rounded-xl border border-border text-on-surface hover:bg-surface-container transition-colors mr-3"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save SEO Settings
                </button>
              </div>
            </form>
          </div>

          {/* Right: Preview */}
          <div className="space-y-6">
            <div className="bg-surface rounded-2xl p-6 border border-border">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5" /> Preview
              </h2>
              <div className="space-y-4">
                <div className="bg-surface-container p-4 rounded-xl">
                  <h3 className="font-medium text-sm mb-2">Search Result Snippet</h3>
                  <div className="space-y-1 text-sm">
                    <div className="text-primary font-semibold truncate">{data.title || "[No title]"}</div>
                    <div className="text-text-muted text-xs truncate">{data.canonicalUrl || "https://vetabite.my.id"}</div>
                    <div className="text-on-surface text-sm line-clamp-2">{data.description || "[No description]"}</div>
                  </div>
                </div>
                <div className="bg-surface-container p-4 rounded-xl">
                  <h3 className="font-medium text-sm mb-2">Social Card</h3>
                  <div className="aspect-[1200/630] bg-surface-container-high rounded-lg border border-border overflow-hidden">
                    {data.ogImageUrl ? (
                      <img
                        src={data.ogImageUrl}
                        alt="OG Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted">
                        <Camera className="h-8 w-8" />
                      </div>
                    )}
                    <div className="p-3">
                      <div className="font-bold text-sm truncate">{data.title || "Title"}</div>
                      <div className="text-xs text-text-muted truncate">{data.description?.substring(0, 60) || "Description"}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container p-4 rounded-xl">
                  <h3 className="font-medium text-sm mb-2">Raw Data</h3>
                  <pre className="text-xs bg-background-base p-3 rounded-lg overflow-auto max-h-60">
                    {preview}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-6 border border-border">
              <h2 className="text-lg font-semibold mb-4">Instructions</h2>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs flex-shrink-0">1</div>
                  <span>Upload thumbnail images to <code className="bg-surface-container px-1.5 py-0.5 rounded">public/uploads/</code> first.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs flex-shrink-0">2</div>
                  <span>Use absolute URLs for external images, relative paths for local.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs flex-shrink-0">3</div>
                  <span>Changes appear after page refresh; search engines may take days to update.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-center text-text-muted text-sm">
          <p>SEO Panel • Vetabite.my.id • Access restricted to authorized administrators only.</p>
        </div>
      </div>
    </div>
  );
}