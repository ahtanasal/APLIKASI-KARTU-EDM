import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Save, 
  RotateCcw, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  User, 
  Users, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Phone,
  Trash2
} from 'lucide-react';
import type { Umat } from '../types';
import { Solar } from 'lunar-javascript';
import { pinyin } from 'pinyin-pro';

const SHI_CHEN = [
  { label: 'ZI (子时) (23:00-01:00)', value: 'ZI (子时) (23:00-01:00)' },
  { label: 'CHOU (丑时) (01:00-03:00)', value: 'CHOU (丑时) (01:00-03:00)' },
  { label: 'YIN (寅时) (03:00-05:00)', value: 'YIN (寅时) (03:00-05:00)' },
  { label: 'MAO (卯时) (05:00-07:00)', value: 'MAO (卯时) (05:00-07:00)' },
  { label: 'CHEN (辰时) (07:00-09:00)', value: 'CHEN (辰时) (07:00-09:00)' },
  { label: 'SI (巳时) (09:00-11:00)', value: 'SI (巳时) (09:00-11:00)' },
  { label: 'WU (午时) (11:00-13:00)', value: 'WU (午时) (11:00-13:00)' },
  { label: 'WEI (未时) (13:00-15:00)', value: 'WEI (未时) (13:00-15:00)' },
  { label: 'SHEN (申时) (15:00-17:00)', value: 'SHEN (申时) (15:00-17:00)' },
  { label: 'YOU (酉时) (17:00-19:00)', value: 'YOU (酉时) (17:00-19:00)' },
  { label: 'XU (戌时) (19:00-21:00)', value: 'XU (戌时) (19:00-21:00)' },
  { label: 'HAI (亥时) (21:00-23:00)', value: 'HAI (亥时) (21:00-23:00)' }
];

const calculateLunarDate = (masehi: string, waktu?: string) => {
  if (!masehi) return "";
  try {
    const parts = masehi.split("-");
    if (parts.length !== 3) return "";
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return "";
    
    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();
    
    let res = `${lunar.getYearInGanZhi()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
    
    if (waktu) {
      // Extract Mandarin character from "ZI (子时) (23:00-01:00)"
      const match = waktu.match(/\((.*?)\)/);
      if (match && match[1]) {
        res += ` ${match[1]}`;
      }
    }
    
    return res;
  } catch (e) {
    console.error("Lunar conversion error in editor:", e);
    return "";
  }
};

interface BatchEditorProps {
  umats: Umat[];
  masterViharas: { name: string; pinyin: string }[];
  masterPanditas: { name: string; pinyin: string }[];
  onSaveAll: (updatedUmats: Umat[]) => void;
  onCancel: () => void;
}

const formatPanditaName = (name: string): string => {
  if (!name) return "";
  const trimmed = name.trim();

  // Case A: Exactly 3 Chinese characters without spaces
  const chineseCharRegex = /^[\u4e00-\u9fa5]{3}$/;
  if (chineseCharRegex.test(trimmed)) {
    return trimmed[0] + "點傳師" + trimmed.slice(1);
  }

  // Case B: 3 words separated by spaces (e.g., "Zhang Cen Chiu" or "Tan Kim San")
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 3) {
    return `${words[0]} 點傳師 ${words[1]} ${words[2]}`;
  }

  return trimmed;
};

export const BatchEditor: React.FC<BatchEditorProps> = ({
  umats,
  masterViharas,
  masterPanditas,
  onSaveAll,
  onCancel,
}) => {
  const [drafts, setDrafts] = useState<Umat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVihara, setFilterVihara] = useState('');
  const [filterIncompleteOnly, setFilterIncompleteOnly] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    // Deep copy to prevent mutating parent state directly
    const copied: Umat[] = JSON.parse(JSON.stringify(umats));
    const processed = copied.map(u => {
      // 1. If vihara is present and viharaPinyin is missing, autofill from masterViharas
      if (u.vihara) {
        const query = u.vihara.trim().toUpperCase();
        const matched = masterViharas.find(v => (v.name?.trim() || '').toUpperCase() === query);
        if (matched && matched.pinyin) {
          u.viharaPinyin = matched.pinyin.toUpperCase();
        }
      }

      // Helper function to auto-convert Chinese/Hanzi to Pinyin if the pinyin is empty
      const autoPinyin = (text: string | undefined, currentPinyin: string | undefined): string | undefined => {
        if (text && (!currentPinyin || !currentPinyin.trim())) {
          const hasChinese = /[\u4e00-\u9fa5]/.test(text);
          if (hasChinese) {
            try {
              const py = pinyin(text, { toneType: 'none' });
              if (py) {
                return py.toUpperCase();
              }
            } catch(e) {
              console.error("Auto pinyin generation failed for", text, e);
            }
          }
        }
        return currentPinyin;
      };

      // 2. Automate Pinyin generation for name (Mandarin), pengajak (Mandarin), and penanggung (Mandarin) if empty
      u.namaPinyin = autoPinyin(u.nama, u.namaPinyin);
      u.pengajakPinyin = autoPinyin(u.pengajak, u.pengajakPinyin);
      u.penanggungPinyin = autoPinyin(u.penanggung, u.penanggungPinyin);

      // 3. Ensure if we have masehi date, tanggalLunar is generated or corrected
      if (u.tanggalMasehi && !u.tanggalLunar) {
        u.tanggalLunar = calculateLunarDate(u.tanggalMasehi, u.waktu);
      }
      return u;
    });
    setDrafts(processed);
  }, [umats, masterViharas]);

  const findPinyinMatchInDrafts = (name: string, currentId: string) => {
    if (!name.trim()) return null;
    const query = name.trim().toUpperCase();

    // 1. Check Master Panditas
    const mpMaster = masterPanditas.find(p => (p.name?.trim() || '').toUpperCase() === query);
    if (mpMaster && mpMaster.pinyin) return mpMaster.pinyin;

    // 2. Check Master Viharas
    const mvMaster = masterViharas.find(v => (v.name?.trim() || '').toUpperCase() === query);
    if (mvMaster && mvMaster.pinyin) return mvMaster.pinyin;

    // 3. Check drafts
    for (const u of drafts) {
      if (u.id === currentId) continue;
      if ((u.nama?.trim() || '').toUpperCase() === query && u.namaPinyin) return u.namaPinyin;
      if ((u.namaIndonesia?.trim() || '').toUpperCase() === query && u.namaPinyin) return u.namaPinyin;
      if ((u.vihara?.trim() || '').toUpperCase() === query && u.viharaPinyin) return u.viharaPinyin;
      if ((u.pandita?.trim() || '').toUpperCase() === query && u.panditaPinyin) return u.panditaPinyin;
      if ((u.pengajak?.trim() || '').toUpperCase() === query && u.pengajakPinyin) return u.pengajakPinyin;
      if ((u.penanggung?.trim() || '').toUpperCase() === query && u.penanggungPinyin) return u.penanggungPinyin;
    }

    return null;
  };

  const isUmatIncomplete = (u: Umat) => {
    return (
      !u.noId ||
      !u.nama?.trim() ||
      !u.namaPinyin?.trim() ||
      !u.vihara?.trim() ||
      !u.viharaPinyin?.trim() ||
      !u.pandita?.trim() ||
      !u.panditaPinyin?.trim() ||
      !u.pengajak?.trim() ||
      !u.pengajakPinyin?.trim() ||
      !u.penanggung?.trim() ||
      !u.penanggungPinyin?.trim()
    );
  };

  const handleCellChange = (id: string, field: keyof Umat, val: string) => {
    setDrafts(prev => prev.map(u => {
      if (u.id !== id) return u;

      // Handle standard trimming and value parsing
      const cleanedInput = val.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
      let updatedVal = cleanedInput;
      
      let newUmat = { ...u };

      if (field === 'nama') {
        newUmat.nama = updatedVal; // Keep Chinese characters as input
        if (updatedVal && (!newUmat.namaPinyin || !newUmat.namaPinyin.trim())) {
          const hasChinese = /[\u4e00-\u9fa5]/.test(updatedVal);
          if (hasChinese) {
            try {
              const py = pinyin(updatedVal, { toneType: 'none' });
              if (py) {
                newUmat.namaPinyin = py.toUpperCase();
              }
            } catch(e) {
              console.error("Auto pinyin failed in edit", e);
            }
          }
        }
      } else if (field === 'waktu') {
        newUmat.waktu = updatedVal; // Keep case and characters for SHI_CHEN
      } else if (field === 'tanggalLunar') {
        newUmat.tanggalLunar = updatedVal;
      } else {
        newUmat[field] = updatedVal.toUpperCase() as any;
      }

      // Auto recalculate Lunar Date when gregorian or shi chen is changed
      if (field === 'tanggalMasehi' || field === 'waktu') {
        newUmat.tanggalLunar = calculateLunarDate(newUmat.tanggalMasehi || '', newUmat.waktu);
      }

      // Auto-formatting actions and Pinyin Autocomplete
      if (field === 'vihara') {
        const formatVihara = updatedVal.trim();
        newUmat.vihara = formatVihara.toUpperCase();
        if (formatVihara) {
          // Check masterViharas first automatically
          const matchedMaster = masterViharas.find(v => (v.name?.trim() || '').toUpperCase() === formatVihara.toUpperCase());
          if (matchedMaster && matchedMaster.pinyin) {
            newUmat.viharaPinyin = matchedMaster.pinyin.toUpperCase();
          } else {
            const matched = findPinyinMatchInDrafts(formatVihara, id);
            if (matched) {
              newUmat.viharaPinyin = matched.toUpperCase();
            }
          }
        }
      }
      
      if (field === 'pandita') {
        const formatPandita = formatPanditaName(updatedVal.trim());
        newUmat.pandita = formatPandita.toUpperCase();
        if (formatPandita) {
          const matchedMaster = masterPanditas.find(p => (p.name?.trim() || '').toUpperCase() === formatPandita.toUpperCase() || (p.name?.trim() || '').toUpperCase() === updatedVal.trim().toUpperCase());
          if (matchedMaster && matchedMaster.pinyin) {
            newUmat.panditaPinyin = matchedMaster.pinyin.toUpperCase();
          } else {
            const matched = findPinyinMatchInDrafts(formatPandita, id) || findPinyinMatchInDrafts(updatedVal.trim(), id);
            if (matched) {
              newUmat.panditaPinyin = matched.toUpperCase();
            }
          }
        }
      }

      if (field === 'pengajak') {
        const formatPengajak = updatedVal.trim();
        newUmat.pengajak = formatPengajak.toUpperCase();
        if (formatPengajak) {
          const matched = findPinyinMatchInDrafts(formatPengajak, id);
          if (matched) {
            newUmat.pengajakPinyin = matched.toUpperCase();
          } else if (!newUmat.pengajakPinyin || !newUmat.pengajakPinyin.trim()) {
            const hasChinese = /[\u4e00-\u9fa5]/.test(formatPengajak);
            if (hasChinese) {
              try {
                const py = pinyin(formatPengajak, { toneType: 'none' });
                if (py) {
                  newUmat.pengajakPinyin = py.toUpperCase();
                }
              } catch(e) {
                console.error("Auto pinyin failed for pengajak", e);
              }
            }
          }
        }
      }

      if (field === 'penanggung') {
        const formatPenanggung = updatedVal.trim();
        newUmat.penanggung = formatPenanggung.toUpperCase();
        if (formatPenanggung) {
          const matched = findPinyinMatchInDrafts(formatPenanggung, id);
          if (matched) {
            newUmat.penanggungPinyin = matched.toUpperCase();
          } else if (!newUmat.penanggungPinyin || !newUmat.penanggungPinyin.trim()) {
            const hasChinese = /[\u4e00-\u9fa5]/.test(formatPenanggung);
            if (hasChinese) {
              try {
                const py = pinyin(formatPenanggung, { toneType: 'none' });
                if (py) {
                  newUmat.penanggungPinyin = py.toUpperCase();
                }
              } catch(e) {
                console.error("Auto pinyin failed for penanggung", e);
              }
            }
          }
        }
      }

      return newUmat;
    }));
  };

  const handleReset = () => {
    if (window.confirm('Batalkan seluruh perubahan draf ini?')) {
      setDrafts(JSON.parse(JSON.stringify(umats)));
    }
  };

  const handleSave = () => {
    // Validate required fields (at least NAMA PEMOHON TAO & No ID)
    const invalidList = drafts.filter(u => !u.nama?.trim() || !u.noId?.trim());
    if (invalidList.length > 0) {
      alert(`Ada ${invalidList.length} umat yang tidak mempunyai NAMA PEMOHON TAO atau No ID. Mohon lengkapi terlebih dahulu!`);
      return;
    }

    onSaveAll(drafts);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleDeleteRow = (id: string, name: string) => {
    if (window.confirm(`Hapus data umat ${name || 'ini'} dari draf pengeditan batch? (Tindakan ini akan mempengaruhi database utama saat disimpan)`)) {
      setDrafts(prev => prev.filter(u => u.id !== id));
    }
  };

  // Filter logic
  const filteredDrafts = drafts.filter(u => {
    // Search query
    const searchString = searchQuery.trim().toUpperCase();
    const matchesSearch = !searchString || 
      (u.namaIndonesia || '').toUpperCase().includes(searchString) ||
      (u.nama || '').toUpperCase().includes(searchString) ||
      (u.namaPinyin || '').toUpperCase().includes(searchString) ||
      (u.noId || '').toUpperCase().includes(searchString) ||
      (u.vihara || '').toUpperCase().includes(searchString);

    // Vihara filter
    const matchesVihara = !filterVihara || u.vihara?.toUpperCase() === filterVihara.toUpperCase();

    // Incomplete filter
    const matchesIncomplete = !filterIncompleteOnly || isUmatIncomplete(u);

    return matchesSearch && matchesVihara && matchesIncomplete;
  });

  // Calculate stats
  const totalDraftCount = drafts.length;
  const incompleteDraftCount = drafts.filter(isUmatIncomplete).length;

  // Pagination logic
  const totalRecords = filteredDrafts.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedDrafts = filteredDrafts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    // Reset to page 1 if search/filter narrows list below current page
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [searchQuery, filterVihara, filterIncompleteOnly, totalPages]);

  return (
    <div className="space-y-6" id="bulk-edit-container">
      {/* Header and Stats Panels */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
        <div>
          <h2 className="font-serif text-3xl font-bold text-stone-800 tracking-tight">Edit Data Umat</h2>
          <p className="text-xs text-stone-500 mt-1">
            Sistem Spreadsheet-Grid untuk mengedit & melengkapi seluruh data umat secara cepat. Input pinyin akan tercari otomatis apabila data sudah tersimpan di sistem.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-stone-600 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold hover:bg-stone-100 transition-all cursor-pointer"
            title="Reset Perubahan"
          >
            <RotateCcw size={14} />
            Batal
          </button>
          
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 active:scale-95 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Save size={14} />
            Simpan Perubahan
          </button>
        </div>
      </div>

      {isSaved && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-3 bg-emerald-50 text-emerald-800 border border-emerald-100 px-5 py-3 rounded-2xl text-xs font-bold"
        >
          <CheckCircle2 size={16} className="text-emerald-500" />
          Seluruh data umat berhasil diperbarui & disimpan ke dalam database sistem.
        </motion.div>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-500">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">Total Umat</p>
            <p className="text-lg font-bold text-stone-800">{totalDraftCount}</p>
          </div>
        </div>

        <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertCircle size={18} />
          </div>
          <div>
            <p className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">Data Belum Lengkap</p>
            <p className="text-lg font-bold text-amber-800">{incompleteDraftCount}</p>
          </div>
        </div>

        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Data Lengkap</p>
            <p className="text-lg font-bold text-stone-800">{totalDraftCount - incompleteDraftCount}</p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
            <input 
              type="text"
              placeholder="Cari umat atau vihara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-100 rounded-xl pl-9 pr-4 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-stone-400"
            />
          </div>

          {/* Vihara filter */}
          <select
            value={filterVihara}
            onChange={(e) => setFilterVihara(e.target.value)}
            className="bg-stone-50 border border-stone-100 rounded-xl px-3 py-1.5 text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
          >
            <option value="">Semua Vihara</option>
            {masterViharas.map(v => (
              <option key={v.name} value={v.name}>{v.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          {/* Incomplete toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
              type="checkbox"
              checked={filterIncompleteOnly}
              onChange={(e) => setFilterIncompleteOnly(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 border-stone-300 focus:ring-amber-500"
            />
            <span className="text-xs font-semibold text-stone-600 flex items-center gap-1">
              <Sparkles size={12} className="text-amber-500" />
              Tampilkan Hanya Data Belum Lengkap
            </span>
          </label>
        </div>
      </div>

      {/* Grid Spreadsheet */}
      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
        {paginatedDrafts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed select-text">
              <thead>
                <tr className="bg-stone-50/70 border-b border-stone-100">
                  <th className="w-12 text-center text-[10px] uppercase tracking-wider text-stone-400 font-bold py-3 px-2 sticky left-0 bg-stone-100 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">No</th>
                  <th className="w-44 text-[10px] uppercase tracking-wider text-stone-400 font-bold py-3 px-2 sticky left-12 bg-stone-100 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Nama Indonesia</th>
                  <th className="w-32 text-[10px] uppercase tracking-wider text-stone-400 font-bold py-3 px-2 sticky left-[224px] bg-stone-100 z-20 border-r-2 border-stone-200 shadow-[4px_0_8px_rgba(0,0,0,0.06)]">No. ID</th>
                  <th className="w-44 text-[10px] uppercase tracking-wider text-stone-400 font-bold py-3 px-2">NAMA PEMOHON TAO <span className="text-red-500 font-bold">*</span></th>
                  <th className="w-36 text-[10px] uppercase tracking-wider text-stone-400 font-bold py-3 px-2">Nama Pinyin</th>
                  <th className="w-40 text-[10px] uppercase tracking-wider text-stone-400 font-bold py-3 px-2">Vihara</th>
                  <th className="w-36 text-[10px] uppercase tracking-wider text-stone-400 font-bold py-3 px-2">Vihara Pinyin</th>
                  <th className="w-44 text-[10px] uppercase tracking-wider text-stone-400 font-bold py-3 px-2">Pandita</th>
                  <th className="w-40 text-[10px] uppercase tracking-wider text-stone-400 font-bold py-3 px-2">Pandita Pinyin</th>
                  <th className="w-40 text-[10px] uppercase tracking-wider text-stone-400 font-bold py-3 px-2">Pengajak</th>
                  <th className="w-36 text-[10px] uppercase tracking-wider text-stone-400 font-bold py-3 px-2">Pengajak Pinyin</th>
                  <th className="w-40 text-[10px] uppercase tracking-wider text-stone-400 font-bold py-3 px-2">Penanggung</th>
                  <th className="w-36 text-[10px] uppercase tracking-wider text-stone-400 font-bold py-3 px-2">Penanggung Pinyin</th>
                  <th className="w-36 text-[10px] uppercase tracking-wider text-stone-400 font-bold py-3 px-2">Tgl Masehi</th>
                  <th className="w-56 text-[10px] uppercase tracking-wider text-stone-400 font-bold py-3 px-2">Waktu Memohon</th>
                  <th className="w-48 text-[10px] uppercase tracking-wider text-stone-400 font-bold py-3 px-2">Tgl Lunar (Auto)</th>
                  <th className="w-32 text-[10px] uppercase tracking-wider text-stone-400 font-bold py-3 px-2">Jabatan</th>
                  <th className="w-36 text-[10px] uppercase tracking-wider text-stone-400 font-bold py-3 px-2">WhatsApp</th>
                  <th className="w-14 text-center text-[10px] uppercase tracking-wider text-stone-400 font-bold py-3 px-2">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {paginatedDrafts.map((u, index) => {
                  const globalIdx = (currentPage - 1) * pageSize + index + 1;
                  const isRowIncomplete = isUmatIncomplete(u);

                  return (
                    <tr 
                      key={u.id} 
                      className={`hover:bg-amber-50/20 transition-colors group ${
                        isRowIncomplete ? 'bg-[#faf8f5]' : 'bg-white'
                      }`}
                    >
                      {/* Sticky Number Index */}
                      <td className={`text-center text-xs font-semibold py-2 px-2 sticky left-0 text-stone-500 leading-normal z-10 font-mono shadow-[2px_0_5px_rgba(0,0,0,0.02)] ${
                        isRowIncomplete ? 'bg-[#faf8f5]' : 'bg-white'
                      } group-hover:bg-[#f5f1ea]`}>
                        {globalIdx}
                      </td>

                      {/* Sticky Nama Indonesia (Required field, EDITABLE) */}
                      <td className={`py-2 px-2 sticky left-12 z-10 ${
                        isRowIncomplete ? 'bg-[#faf8f5]' : 'bg-white'
                      } group-hover:bg-[#f5f1ea]`}>
                        <input 
                          type="text" 
                          value={u.namaIndonesia || ''} 
                          placeholder="NAMA LENGKAP"
                          onChange={(e) => handleCellChange(u.id || '', 'namaIndonesia', e.target.value)}
                          className="w-full bg-transparent border-none text-xs font-bold text-stone-900 focus:bg-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500 rounded-md px-1.5 py-1 uppercase"
                        />
                      </td>

                      {/* Sticky No. ID (LOCKED / READ-ONLY) */}
                      <td className={`py-1 px-1 sticky left-[224px] z-10 border-r-2 border-stone-200 shadow-[4px_0_8px_rgba(0,0,0,0.06)] ${
                        isRowIncomplete ? 'bg-[#faf8f5]' : 'bg-white'
                      } group-hover:bg-[#f5f1ea]`}>
                        <input 
                          type="text" 
                          value={u.noId || ''} 
                          placeholder="REG-XXX"
                          readOnly
                          className="w-full bg-stone-100/60 border border-transparent text-xs font-mono font-bold text-stone-500 select-all rounded-md px-1.5 py-1 uppercase cursor-not-allowed"
                          title="No ID dikunci (tidak dapat diubah)"
                        />
                      </td>

                      {/* NAMA PEMOHON TAO (Mandarin - Required, EDITABLE) */}
                      <td className="py-1 px-1">
                        <input 
                          type="text" 
                          value={u.nama || ''} 
                          placeholder="求道人"
                          onChange={(e) => handleCellChange(u.id || '', 'nama', e.target.value)}
                          className={`w-full bg-transparent border border-transparent hover:border-stone-100 text-xs font-semibold text-stone-900 focus:bg-stone-50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 rounded-md px-1.5 py-1 ${
                            !u.nama ? 'bg-amber-50/40' : ''
                          }`}
                        />
                      </td>

                      {/* Nama Pinyin */}
                      <td className="py-1 px-1">
                        <input 
                          type="text" 
                          value={u.namaPinyin || ''} 
                          placeholder="Nama Pinyin"
                          onChange={(e) => handleCellChange(u.id || '', 'namaPinyin', e.target.value)}
                          className={`w-full bg-transparent border border-transparent hover:border-stone-100 text-xs text-stone-700 focus:bg-stone-50 focus:border-amber-500 focus:outline-none focus:ring-0 rounded-md px-1.5 py-1 uppercase ${
                            !u.namaPinyin ? 'bg-amber-50/40' : ''
                          }`}
                        />
                      </td>

                      {/* Vihara */}
                      <td className="py-1 px-1">
                        <input 
                          type="text" 
                          value={u.vihara || ''} 
                          placeholder="Vihara / 壇名"
                          onChange={(e) => handleCellChange(u.id || '', 'vihara', e.target.value)}
                          className={`w-full bg-transparent border border-transparent hover:border-stone-100 text-xs text-stone-800 focus:bg-stone-50 focus:border-amber-500 focus:outline-none focus:ring-0 rounded-md px-1.5 py-1 uppercase ${
                            !u.vihara ? 'bg-amber-50/40' : ''
                          }`}
                        />
                      </td>

                      {/* Vihara Pinyin */}
                      <td className="py-1 px-1">
                        <input 
                          type="text" 
                          value={u.viharaPinyin || ''} 
                          placeholder="Pinyin Vihara"
                          onChange={(e) => handleCellChange(u.id || '', 'viharaPinyin', e.target.value)}
                          className={`w-full bg-transparent border border-transparent hover:border-stone-100 text-xs text-stone-700 focus:bg-stone-50 focus:border-amber-500 focus:outline-none focus:ring-0 rounded-md px-1.5 py-1 uppercase ${
                            !u.viharaPinyin ? 'bg-amber-50/45 text-amber-700 placeholder:text-amber-300 font-medium' : ''
                          }`}
                        />
                      </td>

                      {/* Pandita */}
                      <td className="py-1 px-1">
                        <input 
                          type="text" 
                          value={u.pandita || ''} 
                          placeholder="PANDITA / 點傳師"
                          onChange={(e) => handleCellChange(u.id || '', 'pandita', e.target.value)}
                          className={`w-full bg-transparent border border-transparent hover:border-stone-100 text-xs text-stone-800 font-bold focus:bg-stone-50 focus:border-amber-500 focus:outline-none focus:ring-0 rounded-md px-1.5 py-1 uppercase ${
                            !u.pandita ? 'bg-amber-50/40' : ''
                          }`}
                        />
                      </td>

                      {/* Pandita Pinyin */}
                      <td className="py-1 px-1">
                        <input 
                          type="text" 
                          value={u.panditaPinyin || ''} 
                          placeholder="Pinyin Pandita"
                          onChange={(e) => handleCellChange(u.id || '', 'panditaPinyin', e.target.value)}
                          className={`w-full bg-transparent border border-transparent hover:border-stone-100 text-xs text-stone-700 focus:bg-stone-50 focus:border-amber-500 focus:outline-none focus:ring-0 rounded-md px-1.5 py-1 uppercase ${
                            !u.panditaPinyin ? 'bg-amber-50/45 text-amber-700 placeholder:text-amber-300 font-medium' : ''
                          }`}
                        />
                      </td>

                      {/* Pengajak */}
                      <td className="py-1 px-1">
                        <input 
                          type="text" 
                          value={u.pengajak || ''} 
                          placeholder="PENGAJAK / 引師"
                          onChange={(e) => handleCellChange(u.id || '', 'pengajak', e.target.value)}
                          className={`w-full bg-transparent border border-transparent hover:border-stone-100 text-xs text-stone-700 focus:bg-stone-50 focus:border-amber-500 focus:outline-none focus:ring-0 rounded-md px-1.5 py-1 uppercase ${
                            !u.pengajak ? 'bg-amber-50/40' : ''
                          }`}
                        />
                      </td>

                      {/* Pengajak Pinyin */}
                      <td className="py-1 px-1">
                        <input 
                          type="text" 
                          value={u.pengajakPinyin || ''} 
                          placeholder="Pinyin Pengajak"
                          onChange={(e) => handleCellChange(u.id || '', 'pengajakPinyin', e.target.value)}
                          className={`w-full bg-transparent border border-transparent hover:border-stone-100 text-xs text-stone-600 focus:bg-stone-50 focus:border-amber-500 focus:outline-none focus:ring-0 rounded-md px-1.5 py-1 uppercase ${
                            !u.pengajakPinyin ? 'bg-amber-50/45 text-amber-700 placeholder:text-amber-300 font-medium' : ''
                          }`}
                        />
                      </td>

                      {/* Penanggung */}
                      <td className="py-1 px-1">
                        <input 
                          type="text" 
                          value={u.penanggung || ''} 
                          placeholder="PENANGGUNG / 保師"
                          onChange={(e) => handleCellChange(u.id || '', 'penanggung', e.target.value)}
                          className={`w-full bg-transparent border border-transparent hover:border-stone-100 text-xs text-stone-700 focus:bg-stone-50 focus:border-amber-500 focus:outline-none focus:ring-0 rounded-md px-1.5 py-1 uppercase ${
                            !u.penanggung ? 'bg-amber-50/40' : ''
                          }`}
                        />
                      </td>

                      {/* Penanggung Pinyin */}
                      <td className="py-1 px-1">
                        <input 
                          type="text" 
                          value={u.penanggungPinyin || ''} 
                          placeholder="Pinyin Penanggung"
                          onChange={(e) => handleCellChange(u.id || '', 'penanggungPinyin', e.target.value)}
                          className={`w-full bg-transparent border border-transparent hover:border-stone-100 text-xs text-stone-600 focus:bg-stone-50 focus:border-amber-500 focus:outline-none focus:ring-0 rounded-md px-1.5 py-1 uppercase ${
                            !u.penanggungPinyin ? 'bg-amber-50/45 text-amber-700 placeholder:text-amber-300 font-medium' : ''
                          }`}
                        />
                      </td>

                      {/* Tanggal Masehi */}
                      <td className="py-1 px-1">
                        <input 
                          type="text" 
                          value={u.tanggalMasehi || ''} 
                          placeholder="DD-MM-YYYY"
                          onChange={(e) => handleCellChange(u.id || '', 'tanggalMasehi', e.target.value)}
                          className="w-full bg-transparent border border-transparent hover:border-stone-100 text-xs font-mono text-stone-700 focus:bg-stone-50 focus:border-amber-500 focus:outline-none focus:ring-0 rounded-md px-1.5 py-1 uppercase"
                        />
                      </td>

                      {/* Waktu Memohon */}
                      <td className="py-1 px-1">
                        <select
                          value={u.waktu || ''}
                          onChange={(e) => handleCellChange(u.id || '', 'waktu', e.target.value)}
                          className="w-full bg-transparent border border-stone-200 hover:border-amber-500 text-xs text-stone-700 focus:bg-stone-50 focus:border-amber-500 focus:outline-none rounded-md px-1 py-1 cursor-pointer font-medium"
                        >
                          <option value="">-- PILIH WAKTU --</option>
                          {SHI_CHEN.map(sc => (
                            <option key={sc.value} value={sc.value}>{sc.label}</option>
                          ))}
                        </select>
                      </td>

                      {/* Tanggal Lunar (Auto) */}
                      <td className="py-1 px-1">
                        <input 
                          type="text" 
                          value={u.tanggalLunar || ''} 
                          placeholder="Hasil Tanggal Lunar"
                          readOnly
                          className="w-full bg-stone-100/60 border border-transparent text-xs text-stone-500 select-all rounded-md px-1.5 py-1 font-medium cursor-not-allowed"
                          title="Tanggal Lunar dihitung otomatis dari Tanggal Masehi & Waktu Memohon"
                        />
                      </td>

                      {/* Jabatan Suci */}
                      <td className="py-1 px-1">
                        <input 
                          type="text" 
                          value={u.jabatanSuci || ''} 
                          placeholder="道親 - UMAT"
                          onChange={(e) => handleCellChange(u.id || '', 'jabatanSuci', e.target.value)}
                          className="w-full bg-transparent border border-transparent hover:border-stone-100 text-xs text-stone-700 focus:bg-stone-50 focus:border-amber-500 focus:outline-none focus:ring-0 rounded-md px-1.5 py-1 uppercase"
                        />
                      </td>

                      {/* Phone */}
                      <td className="py-1 px-1">
                        <input 
                          type="text" 
                          value={u.phone || ''} 
                          placeholder="No. WhatsApp/HP"
                          onChange={(e) => handleCellChange(u.id || '', 'phone', e.target.value)}
                          className="w-full bg-transparent border border-transparent hover:border-stone-100 text-xs text-stone-700 focus:bg-stone-50 focus:border-amber-500 focus:outline-none focus:ring-0 rounded-md px-1.5 py-1 uppercase"
                        />
                      </td>

                      {/* Delete Action button */}
                      <td className="text-center py-2 px-2">
                        <button 
                          onClick={() => handleDeleteRow(u.id || '', u.nama || u.namaIndonesia || '')}
                          className="text-stone-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                          title="Hapus Baris dari Draf"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-50 rounded-full text-stone-300">
              <Users size={32} />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-stone-600">Tidak ada data umat yang sesuai</p>
              <p className="text-sm text-stone-400">
                {filterIncompleteOnly 
                  ? "Hebat! Semua data umat sudah terisi lengkap." 
                  : "Coba ubah filter pencarian Anda untuk menampilkan data lain."}
              </p>
            </div>
          </div>
        )}

        {/* Footer / Pagination Controls */}
        {filteredDrafts.length > 0 && (
          <div className="bg-stone-50/70 border-t border-stone-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-stone-500 font-sans">
              Menampilkan <span className="font-bold text-stone-800">{(currentPage - 1) * pageSize + 1}</span> - <span className="font-bold text-stone-800">{Math.min(currentPage * pageSize, totalRecords)}</span> dari <span className="font-bold text-stone-800">{totalRecords}</span> data umat.
            </div>

            <div className="flex items-center gap-4">
              {/* Page size helper */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-stone-400">Tampilkan</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-stone-100 rounded-xl px-2 py-1 text-xs text-stone-700 focus:outline-none font-medium cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 bg-white border border-stone-100 rounded-xl text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-semibold text-stone-600 font-mono px-2">
                  Halaman {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-1.5 bg-white border border-stone-100 rounded-xl text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
