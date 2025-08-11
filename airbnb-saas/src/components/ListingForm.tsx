'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase as clientSupabase } from '@/lib/supabase';

type ListingFormData = {
  address: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  features: string;
  tone: string;
  translate: boolean;
  neighborhood: string;
  interiorStyle: string;
  renovations: string;
  outdoorFeatures: string;
  amenitiesNearby: string;
  hoaInfo: string;
};

type Props = {
  onGenerate: (formData: ListingFormData) => Promise<void> | void;
  credits: number | null;
  fetchCredits: () => Promise<void>;
};

const initialFormState: ListingFormData = {
  address: '',
  bedrooms: 2,
  bathrooms: 1,
  squareFeet: 800,
  features: '',
  tone: 'Casual',
  translate: false,
  neighborhood: '',
  interiorStyle: '',
  renovations: '',
  outdoorFeatures: '',
  amenitiesNearby: '',
  hoaInfo: '',
};

const KEY_FIELDS: (keyof ListingFormData)[] = [
  'address',
  'bedrooms',
  'bathrooms',
  'squareFeet',
  'features',
  'neighborhood',
  'interiorStyle',
  'renovations',
  'outdoorFeatures',
  'amenitiesNearby',
];

const DRAFT_KEY = 'listing_form_draft_v1';
const FEATURES_MAX = 600;

export default function ListingForm({ onGenerate, credits, fetchCredits }: Props) {
  const [formData, setFormData] = useState<ListingFormData>(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  // Restore draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setFormData(JSON.parse(raw));
    } catch {}
  }, []);

  // Autosave draft
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [formData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, type, value } = e.target;
    const isCheckbox = type === 'checkbox';
    const newValue = isCheckbox
      ? (e.target as HTMLInputElement).checked
      : type === 'number'
      ? Number(value)
      : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  // Completeness meter
  const { completeness, missing } = useMemo(() => {
    const missingList: string[] = [];
    let filled = 0;

    KEY_FIELDS.forEach((k) => {
      const v = (formData as any)[k];
      const isFilled =
        typeof v === 'number' ? Number.isFinite(v) && v > 0 : Boolean(String(v || '').trim());
      if (isFilled) filled += 1;
      else missingList.push(humanizeKey(k));
    });

    const pct = Math.round((filled / KEY_FIELDS.length) * 100);
    return { completeness: pct, missing: missingList };
  }, [formData]);

  // (A) helper hook location — we keep it quiet to avoid spam
  useEffect(() => {
    // reserved for future subtle UI hints
  }, [completeness]);

  const canSubmit = !submitting && !(credits !== null && credits <= 0);

  // (B) clean handleSubmit with gentle toast + no duplicates
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (!formData.address.trim()) {
      toast.error('Please enter the property address.');
      return;
    }
    if (!formData.bedrooms || !formData.bathrooms || !formData.squareFeet) {
      toast.error('Please fill bedrooms, bathrooms, and square feet.');
      return;
    }

    if (completeness < 50) {
      toast('Tip: Add a few more details (amenities, features, style) for best results.', {
        icon: '💡',
      });
    }

    setSubmitting(true);
    try {
      await onGenerate(formData);
      // keep draft for tweaks/regens
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard shortcut: Ctrl/Cmd+Enter
  const onKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === 'Enter') {
      (e.target as HTMLElement).blur();
      e.preventDefault();
      // @ts-ignore
      e.currentTarget.requestSubmit?.();
    }
  };

  const loadExample = () => {
    setFormData({
      address: '123 Oakwood Lane, Springfield, IL',
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1750,
      features: 'Spacious open floor plan, energy-efficient appliances, hardwood floors',
      tone: 'Warm and welcoming',
      translate: false,
      neighborhood: 'Oakwood Estates',
      interiorStyle: 'Contemporary farmhouse',
      renovations: 'Fully renovated kitchen (2022)',
      outdoorFeatures: 'Fenced backyard with covered patio',
      amenitiesNearby: 'Community park, walking trails, local farmers market',
      hoaInfo: 'HOA includes lawn care and snow removal',
    });
    toast('Example loaded');
  };

  const clearAll = () => {
    setFormData(initialFormState);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    toast('Cleared');
  };

  const featuresCount = formData.features.length;
  const meterColor =
    completeness >= 80
      ? 'linear-gradient(90deg,#16a34a,#22c55e)'
      : completeness >= 50
      ? 'linear-gradient(90deg,#2563eb,#3b82f6)'
      : 'linear-gradient(90deg,#ea580c,#f97316)';

  return (
    <form onSubmit={handleSubmit} onKeyDown={onKeyDown} className="space-y-6 p-6 bg-white rounded shadow">
      {/* Header + Completeness */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Listing Details</h2>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full border ${
                completeness >= 80 ? 'border-green-600 text-green-700' : 'border-gray-300 text-gray-500'
              }`}
              title="Best results when you complete most key fields."
            >
              Best results at 80%+
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Add concrete facts. The generator uses only what you provide—no made-up details.
          </p>

          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">Completeness</span>
              <span className="font-medium">{completeness}%</span>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-2 rounded-full transition-all" style={{ width: `${completeness}%`, background: meterColor }} />
            </div>
            {missing.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">Add {listToEnglish(missing)} for best results.</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button type="button" onClick={loadExample} className="text-sm text-blue-600 hover:underline">
            Try example
          </button>
          <button type="button" onClick={clearAll} className="text-sm text-gray-600 hover:underline">
            Clear
          </button>
        </div>
      </div>

      {/* Address + Neighborhood */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldText
          label="Property Address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="e.g., 123 Oakwood Lane, Springfield, IL"
          required
          helper="Street, city, and state help ground the description."
        />
        <FieldText
          label="Neighborhood"
          name="neighborhood"
          value={formData.neighborhood}
          onChange={handleChange}
          placeholder="e.g., Oakwood Estates"
          helper="Optional—adds context and credibility."
        />
      </div>

      {/* Core specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FieldNumber label="Bedrooms" name="bedrooms" value={formData.bedrooms} onChange={handleChange} required placeholder="e.g., 3" />
        <FieldNumber label="Bathrooms" name="bathrooms" value={formData.bathrooms} onChange={handleChange} required step={0.5} placeholder="e.g., 2" />
        <FieldNumber label="Square Feet" name="squareFeet" value={formData.squareFeet} onChange={handleChange} required placeholder="e.g., 1750" />
      </div>

      {/* Style + Renovations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldText
          label="Interior Style"
          name="interiorStyle"
          value={formData.interiorStyle}
          onChange={handleChange}
          placeholder="e.g., Contemporary farmhouse"
          helper="Overall design vibe (Modern, Rustic, etc.)."
        />
        <FieldText
          label="Recent Renovations"
          name="renovations"
          value={formData.renovations}
          onChange={handleChange}
          placeholder="e.g., Fully renovated kitchen (2022)"
          helper="Call out upgrades with year if relevant."
        />
      </div>

      {/* Outdoor + Features */}
      <FieldText
        label="Outdoor Features"
        name="outdoorFeatures"
        value={formData.outdoorFeatures}
        onChange={handleChange}
        placeholder="e.g., Fenced backyard with covered patio"
      />

      <div>
        <label className="block text-sm font-medium mb-1">Special Features (comma-separated)</label>
        <textarea
          rows={3}
          maxLength={FEATURES_MAX}
          className="w-full p-2 border rounded"
          name="features"
          placeholder="e.g., Spacious open floor plan, energy-efficient appliances, hardwood floors"
          value={formData.features}
          onChange={handleChange}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <p>Add 3–6 concise items that truly differentiate the home.</p>
          <span>{formData.features.length}/{FEATURES_MAX}</span>
        </div>
      </div>

      {/* Nearby + HOA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldText
          label="Nearby Amenities"
          name="amenitiesNearby"
          value={formData.amenitiesNearby}
          onChange={handleChange}
          placeholder="e.g., Community park, walking trails, local farmers market"
          helper="Stick to items within ~5–10 minutes to keep it credible."
        />
        <FieldText
          label="HOA Information"
          name="hoaInfo"
          value={formData.hoaInfo}
          onChange={handleChange}
          placeholder="e.g., HOA includes lawn care and snow removal"
        />
      </div>

      {/* Tone + Translate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tone</label>
          <select name="tone" className="w-full p-2 border rounded" value={formData.tone} onChange={handleChange}>
            <option value="Professional">Professional</option>
            <option value="Warm and welcoming">Warm and welcoming</option>
            <option value="Luxury">Luxury</option>
            <option value="Family-Friendly">Family-Friendly</option>
            <option value="Exciting">Exciting</option>
            <option value="Casual">Casual</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Sets the voice of the listing.</p>
        </div>

        <label className="flex items-center gap-3 mt-6 md:mt-0">
          <input type="checkbox" name="translate" checked={formData.translate} onChange={handleChange} />
          <span className="text-sm">Include Spanish translation</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
          disabled={!canSubmit}
          title={credits !== null && credits <= 0 ? 'Out of credits' : undefined}
        >
          {submitting ? 'Generating…' : 'Generate Listing'}
        </button>

        {credits !== null && credits <= 0 && (
          <button
            type="button"
            className="px-3 py-2 rounded border"
            onClick={async () => {
              const { data, error } = await clientSupabase.rpc('grant_trial_credits');
              if (error) {
                console.error(error);
                toast.error('Could not grant credits');
                return;
              }
              if (data) {
                toast.success('10 free credits added!');
                await fetchCredits();
              } else {
                toast('You’ve already claimed your daily credits.');
              }
            }}
          >
            Get 10 free credits
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Tip: Short, concrete facts beat long paragraphs. Press <kbd>Ctrl/Cmd</kbd> + <kbd>Enter</kbd> to generate.
      </p>
    </form>
  );
}

/* ---------- Small field components ---------- */

function FieldNumber({
  label,
  name,
  value,
  onChange,
  required,
  step,
  placeholder,
}: {
  label: string;
  name: keyof ListingFormData;
  value: number;
  onChange: any;
  required?: boolean;
  step?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        required={required}
        type="number"
        min={0}
        step={step}
        className="w-full p-2 border rounded"
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

function FieldText({
  label,
  name,
  value,
  onChange,
  placeholder,
  helper,
  required,
}: {
  label: string;
  name: keyof ListingFormData;
  value: string;
  onChange: any;
  placeholder?: string;
  helper?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        required={required}
        className="w-full p-2 border rounded"
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {helper && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
    </div>
  );
}

/* ---------- Helpers ---------- */

function humanizeKey(k: keyof ListingFormData) {
  switch (k) {
    case 'squareFeet':
      return 'square footage';
    case 'amenitiesNearby':
      return 'nearby amenities';
    case 'outdoorFeatures':
      return 'outdoor features';
    case 'interiorStyle':
      return 'interior style';
    default:
      return k.replace(/([A-Z])/g, ' $1').toLowerCase();
  }
}

function listToEnglish(items: string[]) {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  const last = items[items.length - 1];
  return `${items.slice(0, -1).join(', ')}, and ${last}`;
}
