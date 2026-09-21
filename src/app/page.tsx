"use client";

import { useState, useRef } from "react";
import ChatWidget from "@/components/ChatWidget";
import Image from "next/image";
import {
  ChevronRight,
  ShieldCheck,
  Layers,
  PenTool,
  CheckCircle2,
  Download,
  Award,
  Zap,
  Ruler,
  ChevronDown,
  Star,
  Check,
  X,
  Box,
  Grid,
  Wind,
} from "lucide-react";

// ─── STATIC DATA ────────────────────────────────────────────────────────────

type ProductCategory = "metals" | "composites";

interface Product {
  title: string;
  desc: string;
  tags: string[];
  category: ProductCategory;
  icon: React.ReactNode;
}

const products: Product[] = [
  {
    title: "Corrugated Metals",
    desc: "Up to 40% stronger than flat sheet of equal gauge. Ideal for long-span roofs and siding with 25-year structural performance.",
    tags: ["Durable", "Cost-Effective", "Low Maintenance"],
    category: "metals",
    icon: <Layers className="w-7 h-7 text-gray-700" />,
  },
  {
    title: "Expanded Metals",
    desc: "Open mesh structure providing 30–60% natural light transmission - engineered for modern ventilated facades and solar shading.",
    tags: ["Lightweight", "Ventilation", "Aesthetics"],
    category: "metals",
    icon: <Grid className="w-7 h-7 text-gray-700" />,
  },
  {
    title: "Wire Mesh",
    desc: "Architect-specified for balconies, staircases, and facades. Balances airflow, light, and privacy with 200+ pattern options.",
    tags: ["Transparency", "Design Flexibility", "200+ Patterns"],
    category: "metals",
    icon: <Wind className="w-7 h-7 text-gray-700" />,
  },
  {
    title: "Perforated Metals",
    desc: "Engineered for light filtration and acoustic control. Custom punch patterns from 1mm aperture up to 50mm - DXF/DWG files accepted.",
    tags: ["Acoustics", "Custom Patterns", "Shading"],
    category: "metals",
    icon: <Box className="w-7 h-7 text-gray-700" />,
  },
  {
    title: "Aluminum Composite (ACM)",
    desc: "Rigid core between two aluminum skins. Impact-resistant, weather-proof, 50+ color options. Standard orders ship in 5–10 days.",
    tags: ["Rigidity", "Lightweight", "Weather-Resistant", "50+ Colors"],
    category: "composites",
    icon: <ShieldCheck className="w-7 h-7 text-gray-700" />,
  },
  {
    title: "Phenolic / HPL",
    desc: "High-pressure laminates rated for 15+ years exterior use. Scratch-resistant, UV-stable, available in wood, stone, and solid finishes.",
    tags: ["Wear-Resistant", "UV-Stable", "15-Year Rating"],
    category: "composites",
    icon: <PenTool className="w-7 h-7 text-gray-700" />,
  },
];

const comparisonRows = [
  {
    feature: "Lead Time",
    futura: "5–15 business days",
    competitor: "6–12 weeks typical",
  },
  {
    feature: "Custom Sizing",
    futura: "Any dimension, CNC-cut",
    competitor: "Standard sizes only",
  },
  {
    feature: "Finish Options",
    futura: "50+ colors & textures",
    competitor: "8–12 standard finishes",
  },
  {
    feature: "Warranty",
    futura: "15-year structural warranty",
    competitor: "1–2 years typical",
  },
  {
    feature: "Technical Support",
    futura: "Dedicated spec consultant",
    competitor: "None / generic sales",
  },
];

const faqs = [
  {
    q: "What is your minimum order quantity (MOQ)?",
    a: "We accommodate orders from a single panel to full project volumes. For custom-cut orders, minimums start at [X] panels per SKU. Contact us for a project-specific quote and we'll find a solution that fits your scope.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes. We deliver to 30+ countries via freight and express courier. Standard export documentation, customs support, and export crating are included for international shipments at no additional charge.",
  },
  {
    q: "Can panels be cut to custom dimensions?",
    a: "Absolutely. Our CNC fabrication handles any dimension up to [max sheet size] with ±0.5mm tolerance. Provide your cut list - DXF, DWG, PDF, or AI - and we ship panels ready for direct installation.",
  },
  {
    q: "How quickly can I receive a sample kit?",
    a: "Sample kits ship within [2–3 business days] and include material swatches, finish samples, and technical data sheets for each product in your selection. Sample kits are complimentary for qualified projects.",
  },
  {
    q: "Are your products compatible with LEED and green building certifications?",
    a: "Our ACM and HPL panels contribute to LEED credit categories including Materials & Resources and Indoor Environmental Quality. Full technical documentation and material declarations are available on request.",
  },
  {
    q: "What file formats do you accept for custom perforation patterns?",
    a: "We accept DXF, DWG, PDF, and AI files for custom perforation and pixel-print patterns. Our engineering team reviews every file before production to confirm machinability and pattern integrity.",
  },
];

const PANEL_AREA_SQ_FT = 4 * 8; // Standard 4 ft × 8 ft panel
const WASTE_FACTOR = 1.1; // 10% waste allowance

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function Home() {
  const formRef = useRef<HTMLElement>(null);

  // ── Form state ───────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "Corrugated Metals",
    intent: "Sample Kit",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // ── Catalog filter ───────────────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState<"all" | ProductCategory>("all");

  // ── Estimator state ──────────────────────────────────────────────────────
  const [estWidth, setEstWidth] = useState("");
  const [estHeight, setEstHeight] = useState("");
  const [estMaterial, setEstMaterial] = useState("Corrugated Metals");
  const [estResult, setEstResult] = useState<{
    area: number;
    panels: number;
  } | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const filteredProducts =
    activeFilter === "all"
      ? products
      : products.filter((p) => p.category === activeFilter);

  /** Pre-fill form fields and smooth-scroll to the contact section */
  const scrollToForm = (service?: string, intent?: string) => {
    setFormData((prev) => ({
      ...prev,
      ...(service !== undefined ? { service } : {}),
      ...(intent !== undefined ? { intent } : {}),
    }));
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus({
          type: "success",
          message:
            "Thank you! Your request has been received. We'll send spec sheets and pricing within 24 hours.",
        });
        setFormData({
          name: "",
          email: "",
          phone: "",
          service: "Corrugated Metals",
          intent: "Sample Kit",
          message: "",
        });
      } else {
        setSubmitStatus({
          type: "error",
          message: "Failed to submit request. Please try again.",
        });
      }
    } catch {
      setSubmitStatus({
        type: "error",
        message: "An error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateEstimate = () => {
    const w = parseFloat(estWidth);
    const h = parseFloat(estHeight);
    if (!w || !h || w <= 0 || h <= 0) return;
    const area = Math.round(w * h * 10) / 10;
    const panels = Math.ceil((area / PANEL_AREA_SQ_FT) * WASTE_FACTOR);
    setEstResult({ area, panels });
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center">
      {/* ══════════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-2xl font-black text-white tracking-tighter cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            FUTURA<span className="text-brand-500">.</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-300">
            <a href="#catalog" className="hover:text-white transition-colors">Catalog</a>
            <a href="#comparison" className="hover:text-white transition-colors">Comparison</a>
            <a href="#gallery" className="hover:text-white transition-colors">Gallery</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
          <button onClick={() => scrollToForm()} className="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-md font-semibold text-sm transition-colors">
            Get a Quote
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════ */}      <section className="w-full md:min-h-[100dvh] pt-20 flex flex-col justify-between bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-12 relative z-10 grid grid-cols-1 md:grid-cols-12 items-center gap-12 flex-1 w-full">
          {/* ── Left: copy block (77%) ────────────────────────────── */}
          <div className="md:col-span-9 space-y-6 animate-fade-in flex flex-col justify-center">
            {/* Speed badge */}
            <div className="inline-flex items-center gap-2 bg-brand-600/30 border border-brand-500/50 rounded-full px-4 py-1.5 text-white text-sm font-semibold w-fit">
              <Zap className="w-4 h-4" aria-hidden="true" />
              Ships in 5–15 Business Days
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Spec-Grade Architectural Panels -{" "}
              <span className="text-brand-500">Built to Last 15 Years</span>
            </h1>

            <p className="text-lg text-gray-300 leading-relaxed max-w-3xl">
              Futura supplies architects, contractors, and developers with
              premium surface materials - corrugated metals, ACM, and HPL
              panels - backed by 15-year warranties and delivered to site in
              days, not months.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => scrollToForm()}
                className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-3 rounded-md font-semibold transition-colors flex items-center gap-2"
              >
                Explore Catalog
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
              <a
                href="/FGI02.2_SurfacesCatalog.pdf"
                download
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-md font-semibold backdrop-blur-sm transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" aria-hidden="true" />
                Download Full Catalog
              </a>
            </div>
          </div>

          {/* ── Right: panel render (23%) ─────────────────────────── */}
          <div className="md:col-span-3 relative flex items-center justify-center bg-transparent mt-8 md:mt-0 overflow-visible">
            <Image
              src="/hero-panels.png"
              alt="Corrugated metal, ACM, and HPL architectural facade panels"
              width={600}
              height={600}
              priority
              className="w-full h-auto max-h-[60vh] object-contain select-none bg-transparent scale-125 lg:scale-140 transform-gpu origin-center"
              draggable={false}
            />
          </div>
        </div>

        {/* ── Trust stat bar ─────────────────────────────────────── */}
        <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-3 py-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { value: "500+", label: "Projects Delivered" },
              { value: "30+", label: "Countries Served" },
              { value: "15 Yr", label: "Warranty Coverage" },
              { value: "24h", label: "Quote Turnaround" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-bold text-brand-400">
                  {stat.value}
                </div>
                <div className="text-[12px] sm:text-[13px] text-[#9CA3AF] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        {/* ── Marquee & Certificates ─────────────────────────────── */}
        <div className="border-t border-white/10 bg-slate-900 overflow-hidden py-2.5">
          <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row items-center gap-5">
            <div className="flex flex-wrap justify-center gap-4 md:border-r md:border-white/10 md:pr-6 shrink-0">
              {["ISO 9001", "LEED Compatible", "FM Approved"].map(cert => (
                <span key={cert} className="inline-flex items-center gap-1.5 text-[13px] text-gray-400 font-medium whitespace-nowrap">
                  <Award className="w-4 h-4 text-brand-500" /> {cert}
                </span>
              ))}
            </div>
            <div className="flex-1 overflow-hidden relative flex items-center h-6.5">
              <div className="absolute left-0 w-16 h-full bg-gradient-to-r from-slate-900 to-transparent z-10" />
              <div className="absolute right-0 w-16 h-full bg-gradient-to-l from-slate-900 to-transparent z-10" />
              <div className="animate-marquee flex gap-12 text-gray-500 font-bold text-lg uppercase tracking-widest whitespace-nowrap opacity-50">
                <span>Skanska</span><span>Turner</span><span>Gensler</span><span>PCL Construction</span><span>Balfour Beatty</span><span>Lendlease</span>
                <span>Skanska</span><span>Turner</span><span>Gensler</span><span>PCL Construction</span><span>Balfour Beatty</span><span>Lendlease</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          VALUE PROPOSITIONS
      ══════════════════════════════════════════════════════════ */}
      <section className="w-full py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Why Architects & Contractors Choose Futura
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-16">
            We bridge the gap between design intent and site reality -
            delivering materials that perform structurally, aesthetically, and
            on schedule.
          </p>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                Icon: ShieldCheck,
                title: "Unmatched Durability",
                body: "Tested to withstand corrosion, UV degradation, and impact. Every panel ships with a 15-year structural warranty — 7× longer than commodity alternatives.",
              },
              {
                Icon: Layers,
                title: "50+ Finishes, Any Dimension",
                body: "Choose from 50+ colors, textures, and sustainable composites. CNC-cut to any dimension with ±0.5mm tolerance for plug-and-play installation.",
              },
              {
                Icon: PenTool,
                title: "Project-Ready in Days",
                body: "Standard orders ship in 5–10 business days. Custom fabrication in 10–15 days. Dedicated spec consultant from first inquiry to final delivery.",
              },
            ].map(({ Icon, title, body }) => (
              <div
                key={title}
                className="p-8 rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center text-center hover:shadow-lg transition-shadow"
              >
                <Icon
                  className="w-12 h-12 text-brand-600 mb-4"
                  aria-hidden="true"
                />
                <h3 className="text-xl font-semibold mb-3">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PRODUCT CATALOG
      ══════════════════════════════════════════════════════════ */}
      <section id="catalog" className="w-full py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Surface Materials Catalog
            </h2>
            <p className="text-gray-600 mb-8">
              Click any product to request a sample kit or technical spec sheet
              — pre-filled, ready in 60 seconds.
            </p>

            {/* Category filter tabs */}
            <div
              role="tablist"
              aria-label="Filter products by category"
              className="inline-flex rounded-lg border border-gray-200 bg-white p-1 gap-1"
            >
              {(
                [
                  { id: "all", label: "All Materials" },
                  { id: "metals", label: "Metal Panels" },
                  { id: "composites", label: "Composite Panels" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeFilter === tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${activeFilter === tab.id
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <div
                key={product.title}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-200 flex flex-col"
              >
                <div className="p-8 flex-1">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-brand-600 mb-6 border border-gray-200/60 shadow-sm">
                    {product.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {product.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-5 leading-relaxed">
                    {product.desc}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Per-product micro-CTA */}
                <div className="px-8 pb-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => scrollToForm(product.title, "Sample Kit")}
                    className="w-full text-center text-brand-600 hover:text-brand-700 font-semibold text-sm flex items-center justify-center gap-1 transition-colors"
                  >
                    Request Sample & Specs
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FEATURED PROJECTS GALLERY
      ══════════════════════════════════════════════════════════ */}
      <section id="gallery" className="w-full py-20 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Featured Installations</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              See how Futura panels perform in real-world high-rise, commercial, and cultural projects across the globe.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { num: 1, title: 'Nexus Mixed-Use Tower', date: 'Completed 2025' },
              { num: 2, title: 'Global Logistics Hub', date: 'Completed 2024' },
              { num: 3, title: 'Lumina Cultural Center', date: 'Completed 2023' }
            ].map(project => (
              <div key={project.num} className="rounded-2xl overflow-hidden aspect-[4/5] relative group cursor-pointer border border-white/10">
                <Image
                  src={`/gallery-${project.num}.jpg`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  alt={project.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform">
                  <div className="text-brand-400 text-xs font-bold uppercase tracking-wider mb-2 opacity-0 group-hover:opacity-100 transition-opacity delay-100">{project.date}</div>
                  <div className="text-xl font-semibold leading-tight text-white">{project.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════
          BATTLECARD — Us vs. Competitors
      ══════════════════════════════════════════════════════════ */}
      <section className="w-full py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Futura vs. Standard Suppliers
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              See how we stack up against typical commodity distributors and
              slow-ship importers on every factor that matters to your project.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Accessible table for screen readers */}
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th scope="col" className="text-left px-6 py-4 font-semibold w-1/3">
                    Feature
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold text-center text-brand-400 w-1/3">
                    Futura
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold text-center text-gray-400 w-1/3">
                    Typical Supplier
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr
                    key={row.feature}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {row.feature}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center gap-1.5 text-green-700 font-semibold">
                        <Check
                          className="w-4 h-4 text-green-600 flex-shrink-0"
                          aria-hidden="true"
                        />
                        {row.futura}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center gap-1.5 text-gray-500">
                        <X
                          className="w-4 h-4 text-red-400 flex-shrink-0"
                          aria-hidden="true"
                        />
                        {row.competitor}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => scrollToForm(undefined, "Full Quote")}
              className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-md font-semibold transition-colors inline-flex items-center gap-2"
            >
              Get a Project Quote
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SURFACE AREA ESTIMATOR
      ══════════════════════════════════════════════════════════ */}
      <section className="w-full py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              <Ruler className="w-4 h-4" aria-hidden="true" />
              Free Estimator Tool
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How Many Panels Does Your Project Need?
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Enter your façade or surface dimensions for an instant estimate —
              then request a precise quote in 60 seconds.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 md:p-10">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div>
                <label
                  htmlFor="est-width"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Width (ft)
                </label>
                <input
                  id="est-width"
                  type="number"
                  min="1"
                  placeholder="e.g. 80"
                  value={estWidth}
                  onChange={(e) => setEstWidth(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="est-height"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Height (ft)
                </label>
                <input
                  id="est-height"
                  type="number"
                  min="1"
                  placeholder="e.g. 40"
                  value={estHeight}
                  onChange={(e) => setEstHeight(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="est-material"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Material Type
                </label>
                <select
                  id="est-material"
                  value={estMaterial}
                  onChange={(e) => setEstMaterial(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors bg-white"
                >
                  {products.map((p) => (
                    <option key={p.title} value={p.title}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={calculateEstimate}
              className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-md font-semibold transition-colors"
            >
              Calculate Estimate
            </button>

            {estResult && (
              <div className="mt-8 p-6 bg-brand-50 border border-brand-100 rounded-xl">
                <div className="grid grid-cols-2 gap-6 mb-4 text-center">
                  <div>
                    <div className="text-3xl font-extrabold text-brand-600">
                      {estResult.area.toLocaleString()} ft²
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Total Surface Area
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-extrabold text-brand-600">
                      ~{estResult.panels}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Panels Needed{" "}
                      <span className="text-xs text-gray-400">
                        (incl. 10% waste)
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-5">
                  * Estimate based on standard 4 ft × 8 ft panel with 10% waste
                  factor. Actual count may vary with opening deductions and
                  pattern repeats.
                </p>
                <button
                  onClick={() => scrollToForm(estMaterial, "Full Quote")}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-md font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  Get Exact Quote for This Project
                  <ChevronRight className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SOCIAL PROOF
      ══════════════════════════════════════════════════════════ */}
      <section className="w-full py-20 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">
              Trusted by Architects & Developers Worldwide
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              From commercial high-rises to bespoke residential facades, Futura
              panels are specified by design professionals across 30+ countries.
            </p>
          </div>

          {/* Testimonial cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-14">
            {[
              {
                quote:
                  "Futura delivered pre-cut ACM panels within a strict 3-week window for our mixed-use tower in Chicago. The color consistency across all 600+ units matched our master swatches without a single rejection on-site. In 12 years of facade detailing, this is the cleanest spec-to-install turnaround we have seen.",
                name: "Marcus Vance, AIA",
                firm: "Principal Architect, High-Rise & Mixed-Use Studio",
              },
              {
                quote:
                  "Out of three bidding suppliers for our 40,000 sq ft logistics hub, Futura was the only team capable of meeting the NRC 0.85 acoustic threshold on perforated metal. Panels arrived pre-labeled per grid elevations, saving our sub-contractors roughly 80 install hours.",
                name: "David R. Lin",
                firm: "Senior Project Executive, Top 100 ENR General Contractor",
              },
              {
                quote:
                  "Achieving the custom fluted profile while maintaining LEED Gold eligibility seemed impossible on our budget. Futura's engineering team engineered an optimized sub-framing system that reduced thermal bridging and passed peer review on the first submission.",
                name: "Elena Rostova, LEED AP BD+C",
                firm: "Facade Consultant & Sustainable Design Lead",
              },
            ].map((testimonial, idx) => (
              <figure
                key={idx}
                className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col"
              >
                {/* Star rating */}
                <div
                  className="flex gap-1 mb-5"
                  role="img"
                  aria-label="5 out of 5 stars"
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-brand-500 text-brand-500"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <blockquote className="text-gray-300 leading-relaxed mb-6 italic flex-1">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <figcaption>
                  <div className="font-semibold text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-400">{testimonial.firm}</div>
                </figcaption>
              </figure>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════ */}
      <section className="w-full py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600">
              Common questions from architects, developers, and contractors.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className="group rounded-xl border border-gray-200 bg-gray-50 overflow-hidden"
              >
                <summary className="flex items-center justify-between px-6 py-5 cursor-pointer font-semibold text-gray-900">
                  {faq.q}
                  <ChevronDown
                    className="w-5 h-5 text-gray-400 transition-transform duration-200 group-open:rotate-180 flex-shrink-0 ml-4"
                    aria-hidden="true"
                  />
                </summary>
                <div className="px-6 pb-5 pt-4 text-gray-600 text-sm leading-relaxed border-t border-gray-200">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CONTACT FORM  (ref target for scrollToForm)
      ══════════════════════════════════════════════════════════ */}
      <section
        id="contact"
        ref={formRef}
        className="w-full py-24 bg-gray-50 relative"
      >
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">

            {/* Left panel */}
            <div className="md:w-2/5 p-10 text-white bg-brand-800 flex flex-col justify-center">
              <h3 className="text-3xl font-bold mb-4">
                Get Spec Sheet &amp; Pricing in 24h
              </h3>
              <p className="text-brand-100 mb-8 text-sm leading-relaxed">
                Tell us your project and we&apos;ll send technical data sheets,
                finish options, and a project-specific quote within one business
                day — no commitment required.
              </p>
              <ul className="space-y-4 text-sm" aria-label="Why choose Futura">
                {[
                  "Dedicated spec consultant",
                  "Custom cut-to-size available",
                  "Ships to 30+ countries",
                  "15-year warranty included",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2
                      className="w-5 h-5 text-brand-400 flex-shrink-0"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — form */}
            <div className="md:w-3/5 p-10 bg-white">

              {/* Intent selector (micro-commitment) */}
              <fieldset className="mb-6">
                <legend className="text-sm font-semibold text-gray-700 mb-3">
                  I&apos;m looking for:
                </legend>
                <div className="flex flex-wrap gap-2" role="group">
                  {["Sample Kit", "Technical Specs", "Full Quote"].map(
                    (intent) => (
                      <button
                        key={intent}
                        type="button"
                        aria-pressed={formData.intent === intent}
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, intent }))
                        }
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${formData.intent === intent
                          ? "bg-brand-600 text-white border-brand-600"
                          : "border-gray-300 text-gray-600 hover:border-brand-500 hover:text-brand-600"
                          }`}
                      >
                        {intent}
                      </button>
                    )
                  )}
                </div>
              </fieldset>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Full Name *
                    </label>
                    <input
                      required
                      id="name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      autoComplete="name"
                      className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Work Email *
                    </label>
                    <input
                      required
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                      className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                      placeholder="john@firm.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      autoComplete="tel"
                      className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="service"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Product of Interest
                    </label>
                    <select
                      id="service"
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors bg-white"
                    >
                      {products.map((p) => (
                        <option key={p.title} value={p.title}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Project Details
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                    placeholder="Briefly describe your project, dimensions, or specific finish requirements..."
                  />
                </div>

                {submitStatus.type && (
                  <div
                    role="alert"
                    className={`p-4 rounded-md text-sm ${submitStatus.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                      }`}
                  >
                    {submitStatus.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? "Sending…"
                    : "Get Spec Sheet + Pricing in 24h →"}
                </button>

                <p className="text-xs text-center text-gray-400">
                  No spam. No commitment. Your data is used only to respond to
                  your inquiry.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer className="w-full py-10 bg-slate-900 text-slate-400 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm">
              © {new Date().getFullYear()} Futura Surface Materials. All rights
              reserved.
            </p>
            <nav
              aria-label="Footer navigation"
              className="flex flex-wrap gap-6 text-sm"
            >
              <a href="#catalog" className="hover:text-white transition-colors">
                Catalog
              </a>
              <a href="#contact" className="hover:text-white transition-colors">
                Get a Quote
              </a>
              <a
                href="/FGI02.2_SurfacesCatalog.pdf"
                download
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Download Catalog
              </a>
            </nav>
          </div>
        </div>
      </footer>

      {/* ── Chat Widget ──────────────────────────────────────────────── */}
      <ChatWidget />
    </main>
  );
}
