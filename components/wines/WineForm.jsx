'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createWine, updateWine } from '@/utils/actions';
import toast from 'react-hot-toast';
import ImageUpload from '@/components/wines/ImageUpload';
import ScanLabelButton from '@/components/wines/ScanLabelButton';
import { useSearchParams } from 'next/navigation';

const WINE_TYPES = [
  { value: 'RED',       label: '🔴 Roșu' },
  { value: 'WHITE',     label: '🟡 Alb' },
  { value: 'ROSE',      label: '🌸 Roze' },
  { value: 'SPARKLING', label: '✨ Spumant' },
  { value: 'DESSERT',   label: '🍯 Desert' },
  { value: 'FORTIFIED', label: '🏺 Fortifiat' },
];

const STATUSES = [
  { value: 'IN_CELLAR', label: 'În pivniță' },
  { value: 'CONSUMED',  label: 'Consumat' },
  { value: 'SOLD',      label: 'Vândut' },
  { value: 'GIFTED',    label: 'Dăruit' },
];

const BOTTLE_SIZES = ['0.187L', '0.375L', '0.5L', '0.75L', '1L', '1.5L', '3L', '6L'];

const AROMA_SUGGESTIONS = [
  'cireșe', 'fructe roșii', 'fructe negre', 'zmeură', 'afine', 'prune', 'coacăze',
  'citrice', 'mere', 'pere', 'piersici', 'caise', 'ananas', 'lămâie',
  'flori albe', 'trandafiri', 'violete', 'lavandă',
  'vanilie', 'cedru', 'stejar', 'tutun', 'cafea', 'ciocolată',
  'piper negru', 'scorțișoară', 'cuișoare', 'mentă', 'eucalipt',
  'pământ', 'minerale', 'piatră', 'piele', 'gudron', 'trufe',
  'miere', 'migdale', 'nuci', 'caramel', 'unt',
];

const SECTIONS = [
  { label: 'Bază',      icon: '🍷', shortLabel: 'Bază' },
  { label: 'Imagini',   icon: '🖼️', shortLabel: 'Foto' },
  { label: 'Detalii',   icon: '📋', shortLabel: 'Detalii' },
  { label: 'Stocare',   icon: '💰', shortLabel: 'Preț' },
  { label: 'Degustare', icon: '⭐', shortLabel: 'Rating' },
];

const defaultForm = {
  name: '', producer: '', country: '', region: '', subregion: '',
  type: 'RED', vintage: '', alcoholPercentage: '', quantity: '1',
  cellarLocation: '', purchaseDate: '', purchasePrice: '', estimatedValue: '',
  rating: '', tastingNotes: '', servingTemperature: '', agingPotential: '',
  bottleSize: '0.75L', status: 'IN_CELLAR', isFavorite: false,
  grapeVarieties: '', foodPairing: '',
  aromaProfile: [],
  drinkFrom: '', drinkUntil: '',
  labelImageUrl: '', bottleImageUrl: '',
};

export default function WineForm({ wine = null }) {
  const router = useRouter();
  const isEdit = !!wine;

  const searchParams = useSearchParams();
  const fromScan = searchParams.get('fromScan');

  const getScanDefaults = () => {
    if (!fromScan) return {};
    return {
      name:               searchParams.get('name')               || '',
      producer:           searchParams.get('producer')           || '',
      country:            searchParams.get('country')            || '',
      region:             searchParams.get('region')             || '',
      subregion:          searchParams.get('subregion')          || '',
      vintage:            searchParams.get('vintage')            || '',
      type:               searchParams.get('type')               || 'RED',
      alcoholPercentage:  searchParams.get('alcoholPercentage')  || '',
      grapeVarieties:     searchParams.get('grapeVarieties')     || '',
      agingPotential:     searchParams.get('agingPotential')     || '',
      servingTemperature: searchParams.get('servingTemperature') || '',
      tastingNotes:       searchParams.get('tastingNotes')       || '',
    };
  };

  const [form, setForm] = useState(wine ? {
    name:               wine.name               || '',
    producer:           wine.producer           || '',
    country:            wine.country            || '',
    region:             wine.region             || '',
    subregion:          wine.subregion          || '',
    type:               wine.type               || 'RED',
    status:             wine.status             || 'IN_CELLAR',
    bottleSize:         wine.bottleSize         || '0.75L',
    cellarLocation:     wine.cellarLocation     || '',
    servingTemperature: wine.servingTemperature || '',
    agingPotential:     wine.agingPotential     || '',
    tastingNotes:       wine.tastingNotes       || '',
    labelImageUrl:      wine.labelImageUrl      || '',
    bottleImageUrl:     wine.bottleImageUrl     || '',
    isFavorite:         wine.isFavorite         ?? false,
    vintage:            wine.vintage?.toString()           || '',
    alcoholPercentage:  wine.alcoholPercentage?.toString() || '',
    quantity:           wine.quantity?.toString()          || '1',
    purchasePrice:      wine.purchasePrice?.toString()     || '',
    estimatedValue:     wine.estimatedValue?.toString()    || '',
    rating:             wine.rating?.toString()            || '',
    purchaseDate:       wine.purchaseDate ? new Date(wine.purchaseDate).toISOString().split('T')[0] : '',
    grapeVarieties:     wine.grapeVarieties?.join(', ')    || '',
    foodPairing:        wine.foodPairing?.join(', ')       || '',
    aromaProfile:       wine.aromaProfile                  || [],
    drinkFrom:          wine.drinkFrom?.toString()         || '',
    drinkUntil:         wine.drinkUntil?.toString()        || '',
  } : { ...defaultForm, ...getScanDefaults() });

  const [section, setSection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});
  const [aromaInput, setAromaInput] = useState('');
  const [aromaFocused, setAromaFocused] = useState(false);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const isLastSection = section === SECTIONS.length - 1;

  const goNext = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (section < SECTIONS.length - 1) setSection(s => s + 1);
  };

  const goPrev = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (section === 0) router.push('/wines');
    else setSection(s => s - 1);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 55 && Math.abs(dx) > dy * 1.5) {
      if (dx < 0 && section < SECTIONS.length - 1) setSection(s => s + 1);
      if (dx > 0 && section > 0) setSection(s => s - 1);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const addAroma = (aroma) => {
    const trimmed = aroma.trim().toLowerCase();
    if (!trimmed || form.aromaProfile.includes(trimmed)) return;
    set('aromaProfile', [...form.aromaProfile, trimmed]);
    setAromaInput('');
  };

  const removeAroma = (aroma) => set('aromaProfile', form.aromaProfile.filter(a => a !== aroma));

  const filteredSuggestions = AROMA_SUGGESTIONS.filter(a =>
    aromaInput.length > 0 && a.includes(aromaInput.toLowerCase()) && !form.aromaProfile.includes(a)
  );

  const handleAIScan = (data) => {
    setForm(f => ({
      ...f,
      ...(data.name               && { name: data.name }),
      ...(data.producer           && { producer: data.producer }),
      ...(data.country            && { country: data.country }),
      ...(data.region             && { region: data.region }),
      ...(data.subregion          && { subregion: data.subregion }),
      ...(data.vintage            && { vintage: data.vintage }),
      ...(data.type               && { type: data.type }),
      ...(data.alcoholPercentage  && { alcoholPercentage: data.alcoholPercentage }),
      ...(data.bottleSize         && { bottleSize: data.bottleSize }),
      ...(data.grapeVarieties     && { grapeVarieties: data.grapeVarieties }),
      ...(data.foodPairing        && { foodPairing: data.foodPairing }),
      ...(data.agingPotential     && { agingPotential: data.agingPotential }),
      ...(data.servingTemperature && { servingTemperature: data.servingTemperature }),
      ...(data.tastingNotes       && { tastingNotes: data.tastingNotes }),
      ...(data.estimatedValue     && { estimatedValue: data.estimatedValue }),
      ...(data.aromaProfile?.length > 0 && { aromaProfile: data.aromaProfile }),
      ...(data.drinkFrom  && { drinkFrom:  data.drinkFrom.toString() }),
      ...(data.drinkUntil && { drinkUntil: data.drinkUntil.toString() }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Safety guard — never submit unless on last section
    if (section !== SECTIONS.length - 1) { goNext(e); return; }

    setLoading(true);
    setErrors({});
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'grapeVarieties' || k === 'foodPairing') {
        fd.append(k, JSON.stringify(v ? v.split(',').map(s => s.trim()).filter(Boolean) : []));
      } else if (k === 'aromaProfile') {
        fd.append(k, JSON.stringify(v));
      } else if (typeof v === 'boolean') {
        fd.append(k, v.toString());
      } else if (v !== '' && v !== null && v !== undefined) {
        fd.append(k, v);
      }
    });

    try {
      const result = isEdit ? await updateWine(wine.id, fd) : await createWine(fd);
      if (result?.error) {
        setErrors(result.error);
        toast.error('Verifică câmpurile cu erori');
        setLoading(false);
        return;
      }
      toast.success(isEdit ? 'Vin actualizat!' : 'Vin adăugat în colecție!');
    } catch (err) {
      if (!err.message?.includes('NEXT_REDIRECT')) {
        toast.error('A apărut o eroare');
        setLoading(false);
      }
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Jost:wght@300;400;500&display=swap');

        .wf { font-family: 'Jost', sans-serif; }

        /* ── DESKTOP TABS ── */
        .wf-tabs {
          display: flex; gap: 0; margin-bottom: 2rem;
          border-bottom: 1px solid rgba(196,69,105,0.15);
        }
        .wf-tab {
          padding: 0.65rem 1.1rem; font-size: 0.72rem; font-weight: 400;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(245,230,232,0.35); background: none; border: none;
          border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s;
          white-space: nowrap; font-family: 'Jost', sans-serif; margin-bottom: -1px;
        }
        .wf-tab:hover { color: rgba(245,230,232,0.65); }
        .wf-tab.active { color: #c44569; border-bottom-color: #c44569; }

        /* ── MOBILE HEADER ── */
        .wf-mobile-header { display: none; margin-bottom: 1.25rem; }
        .wf-mobile-title-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 0.75rem;
        }
        .wf-mobile-title {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 1.05rem; font-weight: 500; color: #f5e6e8;
        }
        .wf-mobile-count { font-size: 0.7rem; color: rgba(245,230,232,0.35); font-weight: 300; }
        .wf-progress-bar { height: 3px; background: rgba(196,69,105,0.15); border-radius: 2px; overflow: hidden; }
        .wf-progress-fill {
          height: 100%; background: linear-gradient(90deg, #8b1a2e, #c44569);
          border-radius: 2px; transition: width 0.4s cubic-bezier(.4,0,.2,1);
        }

        /* ── SECTIONS ── */
        .wf-section { display: none; }
        .wf-section.active { display: block; animation: wfIn 0.18s ease; }
        @keyframes wfIn { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }

        /* ── GRID & FIELDS ── */
        .wf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem; }
        .wf-full { grid-column: 1 / -1; }
        .wf-label {
          display: block; font-size: 0.68rem; text-transform: uppercase;
          letter-spacing: 0.15em; color: rgba(245,230,232,0.45); margin-bottom: 0.5rem; font-weight: 400;
        }
        .wf-label.required::after { content: ' *'; color: #c44569; }

        .wf-input, .wf-select, .wf-textarea {
          width: 100%; padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(196,69,105,0.15);
          border-radius: 10px; color: #f5e6e8; font-family: 'Jost', sans-serif;
          font-size: 16px; font-weight: 300; outline: none; transition: all 0.25s ease;
          box-sizing: border-box;
        }
        .wf-input::placeholder, .wf-textarea::placeholder { color: rgba(245,230,232,0.2); }
        .wf-input:focus, .wf-select:focus, .wf-textarea:focus {
          border-color: rgba(196,69,105,0.5); background: rgba(196,69,105,0.04);
          box-shadow: 0 0 0 3px rgba(196,69,105,0.07);
        }
        .wf-input.error { border-color: rgba(220,80,80,0.5); }
        .wf-input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #1a0810 inset; -webkit-text-fill-color: #f5e6e8; }
        .wf-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(196,69,105,0.6)' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 0.75rem center;
          padding-right: 2.2rem; cursor: pointer;
        }
        .wf-select option { background: #1a0810; }
        .wf-textarea { resize: vertical; min-height: 100px; line-height: 1.6; }
        .wf-error-msg { font-size: 0.68rem; color: rgba(220,80,80,0.8); margin-top: 0.35rem; }

        .wf-img-hint {
          font-size: 0.78rem; color: rgba(245,230,232,0.35); font-weight: 300;
          margin-bottom: 1.5rem; padding: 0.85rem 1rem;
          background: rgba(196,69,105,0.05); border: 1px solid rgba(196,69,105,0.1);
          border-radius: 10px; line-height: 1.7;
        }

        /* ── STARS ── */
        .wf-stars { display: flex; gap: 0.5rem; padding: 0.6rem 0; }
        .wf-star { font-size: 2rem; cursor: pointer; transition: transform 0.15s; line-height: 1; color: rgba(245,230,232,0.15); padding: 0.15rem; }
        .wf-star:hover, .wf-star.filled { color: #d4af37; }
        .wf-star:hover { transform: scale(1.2); }

        /* ── CHECKBOX ── */
        .wf-check-wrap {
          display: flex; align-items: center; gap: 0.65rem; padding: 0.9rem 1rem; min-height: 52px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(196,69,105,0.15);
          border-radius: 10px; cursor: pointer; transition: all 0.2s;
        }
        .wf-check-wrap:hover { border-color: rgba(196,69,105,0.35); background: rgba(196,69,105,0.04); }
        .wf-check-wrap input { display: none; }
        .wf-check-box {
          width: 22px; height: 22px; border: 1px solid rgba(196,69,105,0.4); border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.2s; font-size: 0.8rem;
        }
        .wf-check-box.checked { background: linear-gradient(135deg, #8b1a2e, #c44569); border-color: transparent; }
        .wf-check-label { font-size: 0.85rem; color: rgba(245,230,232,0.6); font-weight: 300; }

        /* ── AROME ── */
        .wf-aroma-wrap {
          border: 1px solid rgba(196,69,105,0.15); border-radius: 10px;
          background: rgba(255,255,255,0.04); padding: 0.7rem 0.85rem; transition: border-color 0.25s;
        }
        .wf-aroma-wrap:focus-within { border-color: rgba(196,69,105,0.5); box-shadow: 0 0 0 3px rgba(196,69,105,0.07); }
        .wf-aroma-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.5rem; }
        .wf-aroma-tag {
          display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.3rem 0.7rem;
          border-radius: 20px; background: rgba(196,69,105,0.12); border: 1px solid rgba(196,69,105,0.25);
          font-size: 0.78rem; color: rgba(245,230,232,0.8); font-weight: 300;
        }
        .wf-aroma-remove {
          background: none; border: none; cursor: pointer; color: rgba(196,69,105,0.6);
          font-size: 1rem; line-height: 1; padding: 0; min-width: 24px; min-height: 24px;
          display: flex; align-items: center; justify-content: center; transition: color 0.15s;
        }
        .wf-aroma-remove:hover { color: #c44569; }
        .wf-aroma-input {
          background: none; border: none; outline: none; color: #f5e6e8;
          font-family: 'Jost', sans-serif; font-size: 16px; font-weight: 300; width: 100%; padding: 0.25rem 0;
        }
        .wf-aroma-input::placeholder { color: rgba(245,230,232,0.2); }
        .wf-aroma-suggestions { margin-top: 0.6rem; display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .wf-aroma-suggestion {
          padding: 0.3rem 0.7rem; border-radius: 20px; font-size: 0.75rem;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(196,69,105,0.12);
          color: rgba(245,230,232,0.45); cursor: pointer; transition: all 0.15s;
          font-family: 'Jost', sans-serif; min-height: 34px; display: flex; align-items: center;
        }
        .wf-aroma-suggestion:hover, .wf-aroma-suggestion:active {
          background: rgba(196,69,105,0.1); border-color: rgba(196,69,105,0.3); color: rgba(245,230,232,0.8);
        }

        /* ── DRINK WINDOW ── */
        .wf-drink-window { display: grid; grid-template-columns: 1fr auto 1fr; gap: 0.75rem; align-items: end; }
        .wf-drink-sep { font-size: 0.75rem; color: rgba(245,230,232,0.3); text-align: center; padding-bottom: 0.85rem; }

        /* ── DESKTOP NAV ── */
        .wf-nav {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 2rem; padding-top: 1.5rem;
          border-top: 1px solid rgba(196,69,105,0.1); gap: 1rem;
        }
        .wf-btn-back {
          padding: 0.7rem 1.25rem; background: transparent;
          border: 1px solid rgba(196,69,105,0.2); border-radius: 10px;
          color: rgba(245,230,232,0.5); font-family: 'Jost', sans-serif;
          font-size: 0.78rem; letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .wf-btn-back:hover { border-color: rgba(196,69,105,0.4); color: rgba(245,230,232,0.8); }
        .wf-btn-next {
          padding: 0.7rem 1.5rem; background: linear-gradient(135deg, #8b1a2e, #c44569);
          border: none; border-radius: 10px; color: #f5e6e8; font-family: 'Jost', sans-serif;
          font-size: 0.78rem; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase;
          cursor: pointer; transition: all 0.25s; position: relative; overflow: hidden; white-space: nowrap;
        }
        .wf-btn-next::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, #c44569, #8b1a2e); opacity: 0; transition: opacity 0.25s; }
        .wf-btn-next:hover::before { opacity: 1; }
        .wf-btn-next:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(196,69,105,0.35); }
        .wf-btn-next:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .wf-btn-next span { position: relative; z-index: 1; }
        .wf-progress-dots { display: flex; gap: 4px; align-items: center; }
        .wf-prog-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(196,69,105,0.2); transition: all 0.2s; }
        .wf-prog-dot.active { background: #c44569; transform: scale(1.3); }
        .wf-prog-dot.done { background: rgba(196,69,105,0.5); }

        /* ── SPINNER ── */
        .wf-spinner {
          width: 14px; height: 14px; border: 2px solid rgba(245,230,232,0.3);
          border-top-color: #f5e6e8; border-radius: 50%;
          animation: wfspin 0.6s linear infinite; display: inline-block; vertical-align: middle; margin-right: 5px;
        }
        @keyframes wfspin { to { transform: rotate(360deg); } }

        /* ── SCAN BANNER ── */
        .wf-scan-banner {
          display: flex; align-items: center; gap: 0.6rem; padding: 0.7rem 1rem; margin-bottom: 1.25rem;
          background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.2);
          border-radius: 10px; font-size: 0.75rem; color: rgba(212,175,55,0.9);
        }

        /* ════════════════════════════════════════
           MOBILE BOTTOM BAR
           Structură:
             [  ← Anterior  |      Continuă →      ]   ← action row
             [ 🍷 | 🖼️ | 📋 | 💰 | ⭐ ]              ← tab row
        ════════════════════════════════════════ */
        .wf-bottom-bar {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
          background: rgba(10,2,6,0.97);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-top: 1px solid rgba(196,69,105,0.22);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        /* Action row */
        .wf-bar-actions {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.6rem 0.75rem 0.5rem;
          border-bottom: 1px solid rgba(196,69,105,0.1);
        }
        .wf-bar-btn-back {
          flex: 0 0 auto; height: 48px; padding: 0 1rem;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(196,69,105,0.2);
          border-radius: 12px; color: rgba(245,230,232,0.6);
          font-family: 'Jost', sans-serif; font-size: 0.85rem;
          cursor: pointer; transition: background 0.15s;
          display: flex; align-items: center; gap: 0.3rem; white-space: nowrap;
        }
        .wf-bar-btn-back:active { background: rgba(196,69,105,0.12); }
        .wf-bar-btn-next {
          flex: 1; height: 48px;
          background: linear-gradient(135deg, #8b1a2e, #c44569);
          border: none; border-radius: 12px; color: #f5e6e8;
          font-family: 'Jost', sans-serif; font-size: 0.9rem; font-weight: 500;
          letter-spacing: 0.05em; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 0.35rem;
          box-shadow: 0 3px 16px rgba(196,69,105,0.4);
          transition: opacity 0.15s, transform 0.1s;
        }
        .wf-bar-btn-next:active { opacity: 0.85; transform: scale(0.98); }
        .wf-bar-btn-next:disabled { opacity: 0.55; transform: none; }

        /* Tab row */
        .wf-bar-tabs { display: flex; }
        .wf-bar-tab {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 0.12rem;
          padding: 0.4rem 0.1rem 0.5rem; min-height: 54px;
          background: none; border: none; cursor: pointer;
          transition: background 0.12s; position: relative;
        }
        .wf-bar-tab:active { background: rgba(196,69,105,0.08); }
        /* Active indicator — top line per tab */
        .wf-bar-tab::before {
          content: ''; position: absolute; top: 0; left: 20%; right: 20%;
          height: 2px; border-radius: 0 0 2px 2px;
          background: transparent; transition: background 0.2s;
        }
        .wf-bar-tab.active::before { background: #c44569; }
        .wf-bar-tab.done::before  { background: rgba(196,69,105,0.3); }
        .wf-bar-icon { font-size: 1.2rem; line-height: 1; transition: transform 0.2s; }
        .wf-bar-tab.active .wf-bar-icon { transform: scale(1.2); }
        .wf-bar-lbl {
          font-size: 0.59rem; font-family: 'Jost', sans-serif;
          font-weight: 400; letter-spacing: 0.03em;
          color: rgba(245,230,232,0.28); transition: color 0.2s; white-space: nowrap;
        }
        .wf-bar-tab.active .wf-bar-lbl { color: #c44569; font-weight: 500; }
        .wf-bar-tab.done  .wf-bar-lbl  { color: rgba(196,69,105,0.5); }

        /* ── RESPONSIVE ── */
        @media (max-width: 640px) {
          .wf-tabs { display: none; }
          .wf-nav  { display: none; }
          .wf-mobile-header { display: block; }
          .wf-bottom-bar    { display: block; }

          /*
            Total bottom bar height:
              action row: 48px + 0.6+0.5rem padding ≈ 69px
              tab row: 54px
              border: 1px
              safe-area: variable (we use env())
            → give content ~130px clearance + safe area
          */
          .wf { padding-bottom: calc(136px + env(safe-area-inset-bottom, 16px)); }

          .wf-grid { grid-template-columns: 1fr; }
          .wf-full { grid-column: 1; }
          .wf-drink-window { grid-template-columns: 1fr auto 1fr; }

          .wf-input, .wf-select, .wf-textarea {
            min-height: 50px; padding: 0.8rem 1rem; border-radius: 12px;
          }
          .wf-textarea { min-height: 110px; }
          .wf-stars { gap: 0.6rem; }
          .wf-star  { font-size: 2.4rem; }
        }

        @media (min-width: 641px) {
          .wf-mobile-header { display: none !important; }
          .wf-bottom-bar    { display: none !important; }
        }
      `}</style>

      <form
        className="wf"
        onSubmit={handleSubmit}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {fromScan && (
          <div className="wf-scan-banner">
            <span>✨</span>
            <span>Câmpurile au fost completate automat de AI. Verifică și corectează dacă e necesar.</span>
          </div>
        )}

        {/* DESKTOP TABS */}
        <div className="wf-tabs">
          {SECTIONS.map((s, i) => (
            <button key={s.label} type="button"
              className={`wf-tab ${section === i ? 'active' : ''}`}
              onClick={() => setSection(i)}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* MOBILE HEADER */}
        <div className="wf-mobile-header">
          <div className="wf-mobile-title-row">
            <div className="wf-mobile-title">
              <span>{SECTIONS[section].icon}</span>
              <span>{SECTIONS[section].label}</span>
            </div>
            <span className="wf-mobile-count">{section + 1} / {SECTIONS.length}</span>
          </div>
          <div className="wf-progress-bar">
            <div className="wf-progress-fill" style={{ width: `${((section + 1) / SECTIONS.length) * 100}%` }} />
          </div>
        </div>

        {/* ── SECTION 0 ── */}
        <div className={`wf-section ${section === 0 ? 'active' : ''}`}>
          <ScanLabelButton onScan={handleAIScan} />
          <div className="wf-grid">
            <div className="wf-field wf-full">
              <label className="wf-label required">Nume vin</label>
              <input className={`wf-input ${errors.name ? 'error' : ''}`}
                placeholder="ex. Château Margaux" value={form.name}
                onChange={e => set('name', e.target.value)} required />
              {errors.name && <p className="wf-error-msg">{errors.name[0]}</p>}
            </div>
            <div className="wf-field">
              <label className="wf-label">Producător</label>
              <input className="wf-input" placeholder="ex. Domaine Leflaive"
                value={form.producer} onChange={e => set('producer', e.target.value)} />
            </div>
            <div className="wf-field">
              <label className="wf-label required">Tip vin</label>
              <select className="wf-select" value={form.type}
                onChange={e => set('type', e.target.value)} required>
                {WINE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="wf-field">
              <label className="wf-label">Țară</label>
              <input className="wf-input" placeholder="ex. Franța, România"
                value={form.country} onChange={e => set('country', e.target.value)} />
            </div>
            <div className="wf-field">
              <label className="wf-label">Regiune</label>
              <input className="wf-input" placeholder="ex. Bordeaux, Dealu Mare"
                value={form.region} onChange={e => set('region', e.target.value)} />
            </div>
            <div className="wf-field">
              <label className="wf-label">Subregiune</label>
              <input className="wf-input" placeholder="ex. Pauillac"
                value={form.subregion} onChange={e => set('subregion', e.target.value)} />
            </div>
            <div className="wf-field">
              <label className="wf-label">An recoltă</label>
              <input className="wf-input" type="number" placeholder="ex. 2018"
                min="1800" max={currentYear} value={form.vintage}
                onChange={e => set('vintage', e.target.value)} />
            </div>
            <div className="wf-field">
              <label className="wf-label">Status</label>
              <select className="wf-select" value={form.status}
                onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── SECTION 1 ── */}
        <div className={`wf-section ${section === 1 ? 'active' : ''}`}>
          <p className="wf-img-hint">🖼️ Adaugă imagini pentru a personaliza vinul în colecție. Poți încărca eticheta și/sau sticla.</p>
          <div className="wf-grid">
            <div className="wf-field">
              <ImageUpload label="Imagine etichetă" value={form.labelImageUrl}
                onChange={(url) => set('labelImageUrl', url || '')} folder="wines/labels" />
            </div>
            <div className="wf-field">
              <ImageUpload label="Imagine sticlă" value={form.bottleImageUrl}
                onChange={(url) => set('bottleImageUrl', url || '')} folder="wines/bottles" />
            </div>
          </div>
        </div>

        {/* ── SECTION 2 ── */}
        <div className={`wf-section ${section === 2 ? 'active' : ''}`}>
          <div className="wf-grid">
            <div className="wf-field">
              <label className="wf-label">Alcool (%)</label>
              <input className="wf-input" type="number" step="0.1" min="0" max="100"
                placeholder="ex. 13.5" value={form.alcoholPercentage}
                onChange={e => set('alcoholPercentage', e.target.value)} />
            </div>
            <div className="wf-field">
              <label className="wf-label">Cantitate (sticle)</label>
              <input className="wf-input" type="number" min="0" placeholder="1"
                value={form.quantity} onChange={e => set('quantity', e.target.value)} />
            </div>
            <div className="wf-field">
              <label className="wf-label">Mărime sticlă</label>
              <select className="wf-select" value={form.bottleSize}
                onChange={e => set('bottleSize', e.target.value)}>
                {BOTTLE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="wf-field">
              <label className="wf-label">Temperatură servire</label>
              <input className="wf-input" placeholder="ex. 16-18°C"
                value={form.servingTemperature} onChange={e => set('servingTemperature', e.target.value)} />
            </div>
            <div className="wf-field wf-full">
              <label className="wf-label">Soiuri de struguri</label>
              <input className="wf-input" placeholder="ex. Cabernet Sauvignon, Merlot"
                value={form.grapeVarieties} onChange={e => set('grapeVarieties', e.target.value)} />
            </div>
            <div className="wf-field wf-full">
              <label className="wf-label">Asocieri gastronomice</label>
              <input className="wf-input" placeholder="ex. Vită, Brânzeturi maturate"
                value={form.foodPairing} onChange={e => set('foodPairing', e.target.value)} />
            </div>
            <div className="wf-field wf-full">
              <label className="wf-label">Profil aromatic</label>
              <div className="wf-aroma-wrap">
                {form.aromaProfile.length > 0 && (
                  <div className="wf-aroma-tags">
                    {form.aromaProfile.map(a => (
                      <span key={a} className="wf-aroma-tag">
                        {a}
                        <button type="button" className="wf-aroma-remove" onClick={() => removeAroma(a)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
                <input className="wf-aroma-input"
                  placeholder={form.aromaProfile.length === 0 ? 'ex. cireșe, vanilie...' : 'Adaugă aromă...'}
                  value={aromaInput}
                  onChange={e => setAromaInput(e.target.value)}
                  onFocus={() => setAromaFocused(true)}
                  onBlur={() => setTimeout(() => setAromaFocused(false), 200)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); addAroma(aromaInput); }
                    if (e.key === ',' && aromaInput.trim()) { e.preventDefault(); addAroma(aromaInput.replace(',', '')); }
                  }}
                />
                {aromaFocused && filteredSuggestions.length > 0 && (
                  <div className="wf-aroma-suggestions">
                    {filteredSuggestions.slice(0, 8).map(s => (
                      <button key={s} type="button" className="wf-aroma-suggestion"
                        onMouseDown={e => { e.preventDefault(); addAroma(s); }}>+ {s}</button>
                    ))}
                  </div>
                )}
                {aromaInput === '' && form.aromaProfile.length === 0 && (
                  <div className="wf-aroma-suggestions">
                    {AROMA_SUGGESTIONS.slice(0, 8).map(s => (
                      <button key={s} type="button" className="wf-aroma-suggestion"
                        onClick={() => addAroma(s)}>+ {s}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="wf-field wf-full">
              <label className="wf-label">Potențial de maturare</label>
              <input className="wf-input" placeholder="ex. 5-10 ani"
                value={form.agingPotential} onChange={e => set('agingPotential', e.target.value)} />
            </div>
            <div className="wf-field wf-full">
              <label className="wf-label">Favorit</label>
              <label className="wf-check-wrap">
                <input type="checkbox" checked={form.isFavorite} onChange={e => set('isFavorite', e.target.checked)} />
                <div className={`wf-check-box ${form.isFavorite ? 'checked' : ''}`}>{form.isFavorite && '✓'}</div>
                <span className="wf-check-label">Adaugă la favorite ❤️</span>
              </label>
            </div>
          </div>
        </div>

        {/* ── SECTION 3 ── */}
        <div className={`wf-section ${section === 3 ? 'active' : ''}`}>
          <div className="wf-grid">
            <div className="wf-field">
              <label className="wf-label">Preț achiziție (€)</label>
              <input className="wf-input" type="number" step="0.01" min="0"
                placeholder="ex. 45.00" value={form.purchasePrice}
                onChange={e => set('purchasePrice', e.target.value)} />
            </div>
            <div className="wf-field">
              <label className="wf-label">Valoare estimată (€)</label>
              <input className="wf-input" type="number" step="0.01" min="0"
                placeholder="ex. 80.00" value={form.estimatedValue}
                onChange={e => set('estimatedValue', e.target.value)} />
            </div>
            <div className="wf-field">
              <label className="wf-label">Data achiziției</label>
              <input className="wf-input" type="date" value={form.purchaseDate}
                onChange={e => set('purchaseDate', e.target.value)} />
            </div>
            <div className="wf-field">
              <label className="wf-label">Locație pivniță</label>
              <input className="wf-input" placeholder="ex. Raft A, Rândul 3"
                value={form.cellarLocation} onChange={e => set('cellarLocation', e.target.value)} />
            </div>
            <div className="wf-field wf-full">
              <label className="wf-label">Fereastră optimă de consum</label>
              <div className="wf-drink-window">
                <div>
                  <label className="wf-label" style={{ fontSize: '0.62rem', marginBottom: '0.35rem' }}>De la (an)</label>
                  <input className="wf-input" type="number" placeholder={`${currentYear}`}
                    min="1900" max="2100" value={form.drinkFrom}
                    onChange={e => set('drinkFrom', e.target.value)} />
                </div>
                <div className="wf-drink-sep">—</div>
                <div>
                  <label className="wf-label" style={{ fontSize: '0.62rem', marginBottom: '0.35rem' }}>Până la (an)</label>
                  <input className="wf-input" type="number" placeholder={`${currentYear + 10}`}
                    min="1900" max="2100" value={form.drinkUntil}
                    onChange={e => set('drinkUntil', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 4 ── */}
        <div className={`wf-section ${section === 4 ? 'active' : ''}`}>
          <div className="wf-grid">
            <div className="wf-field wf-full">
              <label className="wf-label">Rating personal</label>
              <div className="wf-stars">
                {[1,2,3,4,5].map(n => (
                  <span key={n}
                    className={`wf-star ${parseInt(form.rating) >= n ? 'filled' : ''}`}
                    onClick={() => set('rating', form.rating == n ? '' : n.toString())}>★</span>
                ))}
                {form.rating && (
                  <span style={{ fontSize: '0.8rem', color: 'rgba(245,230,232,0.4)', alignSelf: 'center', marginLeft: '0.25rem' }}>
                    {form.rating}/5
                  </span>
                )}
              </div>
            </div>
            <div className="wf-field wf-full">
              <label className="wf-label">Notițe de degustare</label>
              <textarea className="wf-textarea"
                placeholder="Descrie culoarea, structura, gustul, finisajul..."
                value={form.tastingNotes} onChange={e => set('tastingNotes', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ══ DESKTOP NAV ══ */}
        <div className="wf-nav">
          <button type="button" className="wf-btn-back" onClick={goPrev}>
            ← {section === 0 ? 'Înapoi' : 'Anterior'}
          </button>
          <div className="wf-progress-dots">
            {SECTIONS.map((_, i) => (
              <div key={i} className={`wf-prog-dot ${i === section ? 'active' : i < section ? 'done' : ''}`} />
            ))}
          </div>
          {!isLastSection ? (
            <button type="button" className="wf-btn-next" onClick={goNext}>
              <span>Continuă →</span>
            </button>
          ) : (
            <button type="submit" className="wf-btn-next" disabled={loading}>
              <span>
                {loading
                  ? <><span className="wf-spinner" />{isEdit ? 'Se salvează...' : 'Se adaugă...'}</>
                  : <>{isEdit ? '💾 Salvează' : '🍷 Adaugă în colecție'}</>
                }
              </span>
            </button>
          )}
        </div>

        {/* ══ MOBILE BOTTOM BAR ══ */}
        <div className="wf-bottom-bar">

          {/* Row 1 — action buttons */}
          <div className="wf-bar-actions">
            <button type="button" className="wf-bar-btn-back" onClick={goPrev}>
              ← {section === 0 ? 'Înapoi' : 'Anterior'}
            </button>
            {!isLastSection ? (
              <button
                type="button"
                className="wf-bar-btn-next"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); goNext(); }}
              >
                Continuă →
              </button>
            ) : (
              <button type="submit" className="wf-bar-btn-next" disabled={loading}>
                {loading
                  ? <><span className="wf-spinner" />{isEdit ? 'Salvare...' : 'Adăugare...'}</>
                  : <>{isEdit ? '💾 Salvează' : '🍷 Adaugă'}</>
                }
              </button>
            )}
          </div>

          {/* Row 2 — section tabs */}
          <div className="wf-bar-tabs">
            {SECTIONS.map((s, i) => (
              <button
                key={i} type="button"
                className={`wf-bar-tab ${i === section ? 'active' : i < section ? 'done' : ''}`}
                onClick={() => setSection(i)}
                aria-label={s.label}
              >
                <span className="wf-bar-icon">{s.icon}</span>
                <span className="wf-bar-lbl">{s.shortLabel}</span>
              </button>
            ))}
          </div>

        </div>
      </form>
    </>
  );
}