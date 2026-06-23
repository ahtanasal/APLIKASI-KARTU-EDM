/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Users, 
  Search, 
  Calendar, 
  User, 
  ShieldCheck, 
  MapPin, 
  IdCard as IdCardIcon,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Clock,
  Download,
  Trash2,
  Printer,
  CheckCircle2,
  MessageSquare,
  Pencil,
  FileDown,
  FileUp,
  Settings,
  Home,
  Palette,
  FileSpreadsheet,
  Layers,
  RefreshCw,
  Edit
} from 'lucide-react';

const TARGET_FIELDS = [
  { key: 'noId' as const, label: 'No. ID / Register', description: 'Nomor ID Anggota / Registrasi', required: true },
  { key: 'nama' as const, label: 'NAMA PEMOHON TAO', description: 'Nama huruf Mandarin / 求道人', required: true },
  { key: 'namaIndonesia' as const, label: 'Nama Indonesia', description: 'Nama Lengkap / Nama Indonesia' },
  { key: 'namaPinyin' as const, label: 'Nama Pinyin', description: 'Pinyin / Ejaan nama Mandarin' },
  { key: 'jabatanSuci' as const, label: 'Jabatan Suci', description: 'Jabatan suci / 天職 (Umat, Tan Cu, dll)' },
  { key: 'vihara' as const, label: 'Vihara', description: 'Nama Vihara / 壇名' },
  { key: 'viharaPinyin' as const, label: 'Vihara Pinyin', description: 'Ejaan Pinyin Vihara' },
  { key: 'pandita' as const, label: 'Pandita', description: 'Nama Pandita / 點傳師' },
  { key: 'panditaPinyin' as const, label: 'Pandita Pinyin', description: 'Pinyin Pandita' },
  { key: 'pengajak' as const, label: 'Pengajak', description: 'Nama Pengajak / 引師' },
  { key: 'pengajakPinyin' as const, label: 'Pengajak Pinyin', description: 'Pinyin Pengajak' },
  { key: 'penanggung' as const, label: 'Penanggung', description: 'Nama Penanggung / 保師' },
  { key: 'penanggungPinyin' as const, label: 'Penanggung Pinyin', description: 'Pinyin Penanggung' },
  { key: 'tanggalMasehi' as const, label: 'Tanggal Masehi', description: 'Tanggal mohon ketuhanan (Masehi)' },
  { key: 'tanggalLunar' as const, label: 'Tanggal Lunar', description: 'Tanggal Lunar / Imlek (Akan dikonversi otomatis jika kosong)' },
  { key: 'phone' as const, label: 'No. HP / WhatsApp', description: 'Contact Info / WhatsApp' },
];
import { format } from 'date-fns';
import { Solar } from 'lunar-javascript';
import { pinyin } from 'pinyin-pro';
import { cn } from './lib/utils';
import type { UmatInput, Umat } from './types';
import { IdCard } from './components/IdCard';
import { DesignerPage } from './components/DesignerPage';
import { BatchEditor } from './components/BatchEditor';
import { db } from './lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot
} from 'firebase/firestore';

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
  { label: 'HAI (亥时) (21:00-23:00)', value: 'HAI (亥时) (21:00-23:00)' },
];
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

// Helper to format Pandita Name (Dian Chuan Shi) based on Tao UK systems
const formatPanditaName = (name: string): string => {
  if (!name) return "";
  const trimmed = name.trim();

  // Case A: Exactly 3 Chinese characters without spaces (e.g. 張珍球, 許媽源, 林碧蓮)
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

// Fallback for crypto.randomUUID
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

export default function App() {
  useEffect(() => {
    document.title = "Kartu Umat EDM SMD";
  }, []);

  const [activeTab, setActiveTab] = useState<'landing' | 'list' | 'input' | 'master' | 'relations' | 'design' | 'edit-all'>('landing');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [umats, setUmats] = useState<Umat[]>([]);
  const [selectedUmat, setSelectedUmat] = useState<Umat | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [printLayoutMode, setPrintLayoutMode] = useState<'all-fronts-first' | 'interleaved'>('all-fronts-first');
  const [printGap, setPrintGap] = useState<number>(6);
  const [editingUmat, setEditingUmat] = useState<Umat | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [jabatanFilter, setJabatanFilter] = useState<string>('all');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const printContainerRef = React.useRef<HTMLDivElement>(null);

  // TAO UK Import states
  const taoFileInputRef = React.useRef<HTMLInputElement>(null);
  const [isTaoModalOpen, setIsTaoModalOpen] = useState(false);
  const [taoHeaders, setTaoHeaders] = useState<string[]>([]);
  const [taoDataRows, setTaoDataRows] = useState<any[]>([]);
  const [taoMapping, setTaoMapping] = useState<Record<string, string>>({});

  // Master Data
  const [masterViharas, setMasterViharas] = useState<{name: string, pinyin: string}[]>([]);
  const [masterPanditas, setMasterPanditas] = useState<{name: string, pinyin: string}[]>([]);

  // Clean real-time Firestore synchronization
  useEffect(() => {
    // 1. Sync Umats from Firestore in real-time
    const unsubscribeUmats = onSnapshot(collection(db, 'umats'), (snapshot) => {
      const list: Umat[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Umat);
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      
      // If Firestore is completely empty but the user has data in localStorage,
      // upload their local data to Firestore to migrate smoothly!
      if (list.length === 0) {
        const localSaved = localStorage.getItem('edm_umats');
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log("Migrating local data to remote Firestore...", parsed.length);
              const migrated = parsed.map(u => ({
                ...u,
                id: u.id || generateId(),
                createdAt: u.createdAt || new Date().toISOString()
              }));
              // Batch write helper
              migrated.forEach(async (u) => {
                await setDoc(doc(db, 'umats', u.id), u);
              });
              return;
            }
          } catch (e) {
            console.error("Local migration parse failed:", e);
          }
        }
      }
      
      setUmats(list);
    });

    // 2. Sync Master Viharas
    const unsubscribeViharas = onSnapshot(doc(db, 'metadata', 'viharas'), (snapshot) => {
      if (snapshot.exists()) {
        setMasterViharas(snapshot.data().list || []);
      } else {
        // Fallback to local storage or defaults, then seed
        const localSaved = localStorage.getItem('edm_master_viharas');
        let initial = [
          { name: '崇慧佛院', pinyin: 'CHONG HUI FO YEN' },
          { name: '禮德佛堂', pinyin: 'LI DE FO TANG' }
        ];
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              initial = parsed;
            }
          } catch (e) {}
        }
        setMasterViharas(initial);
        setDoc(doc(db, 'metadata', 'viharas'), { list: initial });
      }
    });

    // 3. Sync Master Panditas
    const unsubscribePanditas = onSnapshot(doc(db, 'metadata', 'panditas'), (snapshot) => {
      if (snapshot.exists()) {
        setMasterPanditas(snapshot.data().list || []);
      } else {
        // Fallback to local storage or defaults, then seed
        const localSaved = localStorage.getItem('edm_master_panditas');
        let initial = [
          { name: '林點傳師碧蓮', pinyin: 'Pandita Lim Pi Lien' },
          { name: '張點傳師珍球', pinyin: 'Pandita Zhang Cen Chiu' },
          { name: '許點傳師媽源', pinyin: 'Pandita Xi Ma Yen' }
        ];
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              initial = parsed;
            }
          } catch (e) {}
        }
        setMasterPanditas(initial);
        setDoc(doc(db, 'metadata', 'panditas'), { list: initial });
      }
    });

    return () => {
      unsubscribeUmats();
      unsubscribeViharas();
      unsubscribePanditas();
    };
  }, []);

  function findPinyinMatch(name: string) {
    if (!name.trim()) return null;
    const query = name.trim().toUpperCase();

    // 1. Check Master Panditas
    const mpMaster = masterPanditas.find(p => (p.name?.trim() || '').toUpperCase() === query);
    if (mpMaster && mpMaster.pinyin) return mpMaster.pinyin;

    // 2. Check Master Viharas
    const mvMaster = masterViharas.find(v => (v.name?.trim() || '').toUpperCase() === query);
    if (mvMaster && mvMaster.pinyin) return mvMaster.pinyin;

    // 3. Check existing Umats records for any matching field
    for (const u of umats) {
      // Check Nama / Pinyin
      if ((u.nama?.trim() || '').toUpperCase() === query && u.namaPinyin) return u.namaPinyin;
      if ((u.namaIndonesia?.trim() || '').toUpperCase() === query && u.namaPinyin) return u.namaPinyin;
      
      // Check Vihara
      if ((u.vihara?.trim() || '').toUpperCase() === query && u.viharaPinyin) return u.viharaPinyin;
      
      // Check Pandita
      if ((u.pandita?.trim() || '').toUpperCase() === query && u.panditaPinyin) return u.panditaPinyin;
      
      // Check Pengajak
      if ((u.pengajak?.trim() || '').toUpperCase() === query && u.pengajakPinyin) return u.pengajakPinyin;
      
      // Check Penanggung
      if ((u.penanggung?.trim() || '').toUpperCase() === query && u.penanggungPinyin) return u.penanggungPinyin;
    }

    // fallback: if name contains Chinese/Hanzi characters, convert to Pinyin automatically!
    if (/[\u4e00-\u9fa5]/.test(name)) {
      try {
        const py = pinyin(name, { toneType: 'none' });
        if (py) {
          return py.toUpperCase();
        }
      } catch (e) {
        console.error("pinyin fallback conversion failed in findPinyinMatch", e);
      }
    }

    return null;
  }

  const saveToLocal = async (newUmats: Umat[]) => {
    // 1. Identify deleted items and delete them in Firestore
    const currentIds = new Set<string>(umats.map(u => u.id || ''));
    const newIds = new Set<string>(newUmats.map(u => u.id || ''));
    const deletedIds = Array.from(currentIds).filter((id): id is string => id !== '' && !newIds.has(id));
    for (const id of deletedIds) {
      try {
        await deleteDoc(doc(db, 'umats', id));
      } catch (err) {
        console.error("Failed to delete umat from Firestore:", err);
      }
    }

    // 2. Identify new or changed items and write them to Firestore
    const changedOrNew = newUmats.filter(nu => {
      const existing = umats.find(u => u.id === nu.id);
      return !existing || JSON.stringify(existing) !== JSON.stringify(nu);
    });
    for (const u of changedOrNew) {
      if (!u.id) continue;
      try {
        await setDoc(doc(db, 'umats', u.id), u);
      } catch (err) {
        console.error("Failed to save/update umat in Firestore:", err);
      }
    }
    
    // Also backup to localStorage
    try {
      localStorage.setItem('edm_umats', JSON.stringify(newUmats));
    } catch (e) {}
  };

  const handleSaveUmat = (data: UmatInput) => {
    // Check duplication of nama or noId in existing umats (excluding the current editing item if editing)
    const isEditing = !!editingUmat;
    const duplicateNama = umats.find(u => 
      (!isEditing || u.id !== editingUmat?.id) && 
      u.nama.trim().toUpperCase() === data.nama.trim().toUpperCase()
    );
    const duplicateNoId = umats.find(u => 
      (!isEditing || u.id !== editingUmat?.id) && 
      u.noId.trim().toUpperCase() === data.noId.trim().toUpperCase()
    );

    if (duplicateNama || duplicateNoId) {
      const warningParts: string[] = [];
      if (duplicateNama) {
        warningParts.push(`- Nama pemohon TAO "${data.nama}" sudah terdaftar dengan No ID "${duplicateNama.noId}"`);
      }
      if (duplicateNoId) {
        warningParts.push(`- No ID Card "${data.noId}" sudah digunakan oleh "${duplicateNoId.nama}"`);
      }
      
      const confirmSave = window.confirm(
        `PERINGATAN DUPLIKASI DATA!\n\n${warningParts.join('\n')}\n\nApakah Anda yakin ingin tetap melanjutkan penyimpanan?`
      );
      
      if (!confirmSave) {
        return; // Batalkan penyimpanan
      }
    }

    if (editingUmat) {
      const updatedUmats = umats.map(u => u.id === editingUmat.id ? { ...u, ...data } : u);
      saveToLocal(updatedUmats);
      setEditingUmat(null);
    } else {
      const newUmat: Umat = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString()
      };
      saveToLocal([newUmat, ...umats]);
    }
    setActiveTab('list');
  };

  const handleShareWhatsApp = (umat: Umat) => {
    const encodedData = btoa(JSON.stringify(umat));
    const shareUrl = `${window.location.origin}${window.location.pathname}?view=${encodedData}`;
    
    const text = `*KARTU IDENTITAS UMAT*\n*Vihara Eka Dharma Manggala*\n\n------------------------------\n*Data Umat*\n------------------------------\nNama: ${umat.nama}\nNo ID: ${umat.noId}\nJabatan: ${umat.jabatanSuci || '-'}\nVihara: ${umat.vihara}\n\nLihat Kartu Identitas Digital:\n${shareUrl}\n\n------------------------------\n_Data dikirim melalui Aplikasi EDM_`;
    
    const phone = umat.phone ? umat.phone.replace(/[^0-9+]/g, '') : '';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleDeleteUmat = (id?: string) => {
    if (!id) return;
    
    if (window.confirm('Apakah Anda yakin ingin menghapus data umat ini?')) {
      const updatedUmats = umats.filter(u => u.id !== id);
      saveToLocal(updatedUmats);
      
      // Remove from selection if deleted
      if (selectedIds.has(id)) {
        const newSelected = new Set(selectedIds);
        newSelected.delete(id);
        setSelectedIds(newSelected);
      }
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    
    if (window.confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.size} data umat yang terpilih?`)) {
      const updatedUmats = umats.filter(u => !selectedIds.has(u.id));
      saveToLocal(updatedUmats);
      setSelectedIds(new Set());
    }
  };

  const toggleSelectUmat = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSavePDF = async () => {
    setIsExportingPDF(true);
    try {
      if (!printContainerRef.current) return;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pages = printContainerRef.current.querySelectorAll('.a4-page');
      
      if (pages.length === 0) {
        throw new Error('No pages found to print');
      }

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        
        // Scroll target page into view to force rendering/painting in viewport
        page.scrollIntoView({ block: 'start', behavior: 'auto' });
        // Wait for a small delay so browser completes layout, rendering, and painting
        await new Promise((resolve) => setTimeout(resolve, 300));

        const width = page.offsetWidth || 794;
        const height = page.offsetHeight || 1123;

        const imgData = await toPng(page, { 
          pixelRatio: 2.2, // Extremely safe, memory efficient, and provides gorgeous retina-grade resolution
          backgroundColor: '#ffffff',
          fontEmbedCSS: '', // Disables embedding extra web fonts to make rendering extremely fast and bypass CORS failures
          width: width,
          height: height,
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left',
            margin: '0',
            padding: '0'
          }
        });
        
        if (i > 0) pdf.addPage();
        // Force image to fit A4 precisely without margins
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
      }
      
      pdf.save(`ID_CARDS_EDM_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handlePrintSelected = async () => {
    if (selectedIds.size === 0) return;
    
    const now = new Date().toISOString();
    const updatedUmats = umats.map(u => 
      selectedIds.has(u.id) ? { ...u, lastPrintedAt: now } : u
    );
    
    saveToLocal(updatedUmats);
    
    // Start PDF Generation process
    setIsPrintMode(true);
    
    // Give time for PrintingView to render, then invoke PDF generator
    setTimeout(() => {
      handleSavePDF();
    }, 1500);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('view');
    if (sharedData) {
      try {
        const decoded = JSON.parse(atob(sharedData));
        setSelectedUmat(decoded);
      } catch (e) {
        console.error('Failed to decode shared card', e);
      }
    }
  }, []);

  const handleDownloadTemplate = () => {
    const templateData = [{
      'No ID': '12345/ABC',
      'Nama': 'Nama Mandarin',
      'Nama Pinyin': 'Nama Pinyin',
      'Nama Indonesia': 'Nama Indonesia',
      'Jabatan': 'Jabatan',
      'Vihara': '',
      'Vihara Pinyin': '',
      'Pandita': 'Nama Pandita',
      'Pandita Pinyin': '',
      'Pengajak': 'Nama Pengajak',
      'Pengajak Pinyin': '',
      'Penanggung': 'Nama Penanggung',
      'Penanggung Pinyin': '',
      'Tanggal Masehi': '01-01-2024',
      'Tanggal Lunar': '15 LUNAR MONTH',
      'WhatsApp': '08123456789'
    }];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Import');
    XLSX.writeFile(workbook, 'Template_Import_Umat.xlsx');
  };

  const handleExportExcel = () => {
    if (umats.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return;
    }

    const exportData = umats.map(u => ({
      'No ID': u.noId,
      'Nama': u.nama,
      'Nama Pinyin': u.namaPinyin || '',
      'Nama Indonesia': u.namaIndonesia,
      'Jabatan': u.jabatanSuci,
      'Vihara': u.vihara,
      'Vihara Pinyin': u.viharaPinyin || '',
      'Pandita': u.pandita,
      'Pandita Pinyin': u.panditaPinyin || '',
      'Pengajak': u.pengajak,
      'Pengajak Pinyin': u.pengajakPinyin || '',
      'Penanggung': u.penanggung,
      'Penanggung Pinyin': u.penanggungPinyin || '',
      'Tanggal Masehi': u.tanggalMasehi,
      'Tanggal Lunar': u.tanggalLunar,
      'WhatsApp': u.phone || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Umat');
    XLSX.writeFile(workbook, `Data_Umat_EDM_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet) as any[];

        const importedUmats: Umat[] = data.map(item => {
          const rawVihara = String(item['Vihara'] || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
          let rawViharaPinyin = String(item['Vihara Pinyin'] || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
          if (!rawViharaPinyin && rawVihara) {
            const matchedViharaPinyin = findPinyinMatch(rawVihara);
            if (matchedViharaPinyin) {
              rawViharaPinyin = matchedViharaPinyin;
            }
          }
          const rawPandita = String(item['Pandita'] || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
          const formattedPandita = formatPanditaName(rawPandita);
          
          let rawPanditaPinyin = String(item['Pandita Pinyin'] || '').trim();
          if (!rawPanditaPinyin && formattedPandita) {
            const matchedPinyin = findPinyinMatch(formattedPandita) || findPinyinMatch(rawPandita);
            if (matchedPinyin) {
              rawPanditaPinyin = matchedPinyin;
            }
          }

          return {
            id: generateId(),
            noId: String(item['No ID'] || ''),
            nama: String(item['Nama'] || ''),
            namaPinyin: String(item['Nama Pinyin'] || '').trim() || (item['Nama'] ? (findPinyinMatch(String(item['Nama']).trim()) || '') : ''),
            namaIndonesia: String(item['Nama Indonesia'] || ''),
            jabatanSuci: String(item['Jabatan'] || ''),
            vihara: rawVihara,
            viharaPinyin: rawViharaPinyin,
            pandita: formattedPandita,
            panditaPinyin: rawPanditaPinyin,
            pengajak: String(item['Pengajak'] || ''),
            pengajakPinyin: String(item['Pengajak Pinyin'] || '').trim() || (item['Pengajak'] ? (findPinyinMatch(String(item['Pengajak']).trim()) || '') : ''),
            penanggung: String(item['Penanggung'] || ''),
            penanggungPinyin: String(item['Penanggung Pinyin'] || '').trim() || (item['Penanggung'] ? (findPinyinMatch(String(item['Penanggung']).trim()) || '') : ''),
            tanggalMasehi: String(item['Tanggal Masehi'] || format(new Date(), 'dd-MM-yyyy')),
            tanggalLunar: String(item['Tanggal Lunar'] || ''),
            phone: String(item['WhatsApp'] || ''),
            createdAt: new Date().toISOString(),
          };
        }).filter(u => u.nama && u.noId);

        if (importedUmats.length === 0) {
          alert('Tidak ada data valid yang ditemukan');
          return;
        }

        if (window.confirm(`Berhasil membaca ${importedUmats.length} data. Apakah Anda ingin mengimpor data ini? (Data yang ada akan digabungkan)`)) {
          const combined = [...importedUmats, ...umats];
          saveToLocal(combined);
          alert('Data berhasil diimpor');
        }
      } catch (err) {
        console.error('Error importing excel:', err);
        alert('Gagal mengimpor data. Pastikan format file benar.');
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleImportTaoExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (data.length === 0) {
          alert('Tidak ada data dalam file excel.');
          return;
        }

        const headers = Array.from(new Set(data.flatMap(row => Object.keys(row))));
        
        // Auto-detect columns based on predefined keywords
        const keywords: Record<string, string[]> = {
          noId: ['no id', 'id', 'no. id', 'id umat', 'no_id', 'id_umat', 'id_tao', 'no urut', 'no.', 'no_urut'],
          nama: ['nama', '求道人', 'name', 'nama mandarin', 'nama_mandarin', 'chinese name', 'hanzi'],
          namaIndonesia: ['nama indonesia', 'nama lengkap', 'nama indo', 'indonesia', 'nama_indonesia', 'nama_lengkap', 'full name', 'fullname'],
          namaPinyin: ['pinyin', 'nama pinyin', 'pinyin nama', 'nama_pinyin', 'pinyin_nama', 'ejaan', 'pinyin name'],
          pandita: ['pandita', '點傳師', 'dian chuan shi', 'dianchuan', 'pdt', 'danchuanshi', 'dianchuanshi'],
          panditaPinyin: ['pandita pinyin', 'pdt pinyin', 'pinyin pandita', 'panditapinyin'],
          pengajak: ['pengajak', '引師', 'yin shi', 'yinshi', 'pengajak_nama'],
          pengajakPinyin: ['pengajak pinyin', 'pinyin pengajak', 'pengajakpinyin'],
          penanggung: ['penanggung', '保師', 'bao shi', 'baoshi', 'penanggung_nama', 'penjamin'],
          penanggungPinyin: ['penanggung pinyin', 'pinyin penanggung', 'penanggungpinyin'],
          vihara: ['vihara', '壇名', 'nama vihara', 'nama_vihara', 'vihara_nama', 'clique', 'temple'],
          viharaPinyin: ['vihara pinyin', 'pinyin vihara', 'viharapinyin'],
          tanggalMasehi: ['tanggal', 'tanggal masehi', 'tgl', 'date', 'masehi', 'tgl masehi', '求道日期', 'tanggal_masehi', 'tanggal_mohon'],
          tanggalLunar: ['lunar', 'imlek', '农历', 'yinli', 'tanggal lunar', 'tgl imlek', 'tanggal_lunar', 'lunar_date'],
          phone: ['phone', 'whatsapp', 'wa', 'no hp', 'no. hp', 'hp', 'telp', 'telepon', 'mobile'],
          jabatanSuci: ['jabatan', 'jabatan suci', '天職', 'jabatan_suci', 'role', 'status']
        };

        const initialMapping: Record<string, string> = {};
        TARGET_FIELDS.forEach(field => {
          const kws = keywords[field.key] || [];
          const matchedHeader = headers.find(h => {
            const lowerHeader = String(h).trim().toLowerCase();
            return kws.some(kw => lowerHeader === kw || lowerHeader.includes(kw));
          });
          initialMapping[field.key] = matchedHeader ? String(matchedHeader) : '';
        });

        setTaoHeaders(headers);
        setTaoDataRows(data);
        setTaoMapping(initialMapping);
        setIsTaoModalOpen(true);
      } catch (err) {
        console.error('Error importing TAO Excel:', err);
        alert('Gagal membaca file excel. Silakan periksa kembali format file.');
      }
      
      if (taoFileInputRef.current) taoFileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleProcessTaoImport = () => {
    try {
      const importedUmats: Umat[] = taoDataRows.map(row => {
        const getMappedValue = (key: keyof Umat) => {
          const colName = taoMapping[key];
          return colName ? String(row[colName] ?? '').trim() : '';
        };

        let noId = getMappedValue('noId');
        if (!noId) {
          noId = 'T-' + Math.floor(100000 + Math.random() * 900000);
        }

        let namaIndonesia = getMappedValue('namaIndonesia');
        let nama = getMappedValue('nama');
        if (!namaIndonesia && nama) namaIndonesia = nama;
        if (!nama && namaIndonesia) nama = namaIndonesia;

        let tanggalMasehi = getMappedValue('tanggalMasehi');
        if (!tanggalMasehi) {
          tanggalMasehi = format(new Date(), 'dd-MM-yyyy');
        } else {
          if (!isNaN(Number(tanggalMasehi)) && Number(tanggalMasehi) > 30000) {
            try {
              const excelDate = Number(tanggalMasehi);
              const dateObj = new Date((excelDate - 25569) * 86400 * 1000);
              tanggalMasehi = format(dateObj, 'dd-MM-yyyy');
            } catch (err) {
              // fallback
            }
          } else {
            if (tanggalMasehi.includes('T')) {
              tanggalMasehi = tanggalMasehi.split('T')[0];
            }
            if (tanggalMasehi.includes('-')) {
              const parts = tanggalMasehi.split('-');
              if (parts[0].length === 4) {
                tanggalMasehi = `${parts[2]}-${parts[1]}-${parts[0]}`;
              }
            } else if (tanggalMasehi.includes('/')) {
              const parts = tanggalMasehi.split('/');
              if (parts[2]?.length === 4) {
                tanggalMasehi = `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
              } else if (parts[0]?.length === 4) {
                tanggalMasehi = `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
              }
            }
          }
        }

        let tanggalLunar = getMappedValue('tanggalLunar');
        if (!tanggalLunar && tanggalMasehi) {
          try {
            const parts = tanggalMasehi.split('-');
            if (parts.length === 3) {
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10);
              const year = parseInt(parts[2], 10);
              if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                const solarObj = Solar.fromYmd(year, month, day);
                const lunarObj = solarObj.getLunar();
                tanggalLunar = `${lunarObj.getYearInGanZhi()}年${lunarObj.getMonthInChinese()}月${lunarObj.getDayInChinese()}`;
              }
            }
          } catch (e) {
            console.error('Lunar conversion failed', e);
          }
        }

        const rawVihara = (getMappedValue('vihara') || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
        let rawViharaPinyin = (getMappedValue('viharaPinyin') || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
        if (!rawViharaPinyin && rawVihara) {
          const matchedViharaPinyin = findPinyinMatch(rawVihara);
          if (matchedViharaPinyin) {
            rawViharaPinyin = matchedViharaPinyin;
          }
        }
        const rawPandita = getMappedValue('pandita').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
        const formattedPandita = formatPanditaName(rawPandita);
        
        let rawPanditaPinyin = getMappedValue('panditaPinyin').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
        if (!rawPanditaPinyin && formattedPandita) {
          const matchedPinyin = findPinyinMatch(formattedPandita) || findPinyinMatch(rawPandita);
          if (matchedPinyin) {
            rawPanditaPinyin = matchedPinyin;
          }
        }

        const umat: Umat = {
          id: generateId(),
          noId,
          nama,
          namaPinyin: getMappedValue('namaPinyin') || (nama ? (findPinyinMatch(nama) || '') : ''),
          namaIndonesia,
          jabatanSuci: getMappedValue('jabatanSuci') || '道親 - Umat',
          vihara: rawVihara,
          viharaPinyin: rawViharaPinyin,
          pandita: formattedPandita,
          panditaPinyin: rawPanditaPinyin,
          pengajak: getMappedValue('pengajak'),
          pengajakPinyin: getMappedValue('pengajakPinyin') || (getMappedValue('pengajak') ? (findPinyinMatch(getMappedValue('pengajak')) || '') : ''),
          penanggung: getMappedValue('penanggung'),
          penanggungPinyin: getMappedValue('penanggungPinyin') || (getMappedValue('penanggung') ? (findPinyinMatch(getMappedValue('penanggung')) || '') : ''),
          tanggalMasehi,
          tanggalLunar: tanggalLunar || '',
          phone: getMappedValue('phone'),
          createdAt: new Date().toISOString(),
        };

        return umat;
      }).filter(u => u.nama || u.namaIndonesia);

      if (importedUmats.length === 0) {
        alert('Tidak ada data valid yang dapat di-import.');
        return;
      }

      const combined = [...importedUmats, ...umats];
      saveToLocal(combined);
      setIsTaoModalOpen(false);
      alert(`Berhasil mengimpor ${importedUmats.length} data umat dari sistem TAO UK!`);
    } catch (err) {
      console.error('Error processing TAO import:', err);
      alert('Terjadi kesalahan saat memproses data. Silakan periksa kembali pemetaan kolom.');
    }
  };

  const filteredUmats = umats.filter(u => {
    const matchesSearch = 
      u.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.noId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.namaIndonesia?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesJabatan = jabatanFilter === 'all' || 
      u.jabatanSuci === jabatanFilter ||
      (() => {
        if (!u.jabatanSuci) return false;
        const filterLower = jabatanFilter.toLowerCase();
        const umatLower = u.jabatanSuci.toLowerCase();
        
        // Check exact match
        if (umatLower === filterLower) return true;
        
        // If filter is "道親 - Umat", match "Umat" or "道親"
        if (filterLower.includes('umat') && (umatLower.includes('umat') || umatLower.includes('道親'))) return true;
        
        // Split parts
        const parts = filterLower.split('-').map(p => p.trim());
        return parts.some(p => p && umatLower.includes(p));
      })();
    
    return matchesSearch && matchesJabatan;
  });

  return (
    <div className="min-h-screen flex bg-temple-bg">
      <AnimatePresence mode="wait">
        {activeTab === 'landing' ? (
          <motion.div
            key="landing-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-temple-bg overflow-auto"
          >
            <LandingPage onNavigate={(tab) => setActiveTab(tab)} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isSidebarOpen && activeTab !== 'landing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {activeTab !== 'landing' && (
        <motion.aside
          className={cn(
            "fixed inset-y-0 left-0 w-72 bg-white border-r border-stone-200 z-50 transform lg:translate-x-0 transition-transform duration-300 ease-in-out",
            !isSidebarOpen && "-translate-x-full"
          )}
        >
          <div className="h-full flex flex-col">
            <div className="p-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden border border-stone-100">
                  <img src="/images/front_logo.png" alt="Cong De Logo" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <h1 className="font-serif text-base font-bold leading-none">Eka Dharma Manggala</h1>
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mt-1">Samarinda</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-4 py-8 space-y-2">
              <NavItem 
                icon={<Home size={18} />} 
                label="Beranda" 
                active={activeTab === 'landing'} 
                onClick={() => { setActiveTab('landing'); setIsSidebarOpen(false); }} 
              />
              <NavItem 
                icon={<Plus size={18} />} 
                label="Input Data Umat" 
                active={activeTab === 'input'} 
                onClick={() => { 
                  setActiveTab('input'); 
                  setEditingUmat(null);
                  setIsSidebarOpen(false); 
                }} 
              />
              <NavItem 
                icon={<Users size={18} />} 
                label="Data Umat" 
                active={activeTab === 'list'} 
                onClick={() => { setActiveTab('list'); setIsSidebarOpen(false); }} 
              />
              <NavItem 
                icon={<Edit size={18} />} 
                label="Edit Data Umat" 
                active={activeTab === 'edit-all'} 
                onClick={() => { setActiveTab('edit-all'); setIsSidebarOpen(false); }} 
              />
              <NavItem 
                icon={<ShieldCheck size={18} />} 
                label="Relasi Pengurus" 
                active={activeTab === 'relations'} 
                onClick={() => { setActiveTab('relations'); setIsSidebarOpen(false); }} 
              />
              <NavItem 
                icon={<Palette size={18} />} 
                label="Desain ID Card" 
                active={activeTab === 'design'} 
                onClick={() => { setActiveTab('design'); setIsSidebarOpen(false); }} 
              />
              <NavItem 
                icon={<Settings size={18} />} 
                label="Master Data" 
                active={activeTab === 'master'} 
                onClick={() => { setActiveTab('master'); setIsSidebarOpen(false); }} 
              />
            </nav>

            <div className="p-8 border-t border-stone-100 flex flex-col gap-2">
              <p className="text-[10px] text-stone-400 font-medium">© 2026 EDM Samarinda</p>
              <p className="text-[8px] text-stone-300 italic">Database Ready</p>
            </div>
          </div>
        </motion.aside>
      )}

      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300",
        activeTab !== 'landing' ? "lg:ml-72" : ""
      )}>
        {activeTab !== 'landing' && (
          <header className="h-16 flex items-center justify-between px-6 bg-white/50 backdrop-blur-md sticky top-0 z-30 lg:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-stone-600">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <img src="/images/front_logo.png" alt="Logo" className="w-6 h-6 object-contain" />
              <span className="font-serif font-bold text-stone-800 text-sm">Eka Dharma Manggala</span>
            </div>
            <div className="w-10" />
          </header>
        )}

        <div className="max-w-4xl mx-auto p-6 md:p-12">
          <AnimatePresence mode="wait">
            {activeTab === 'input' ? (
              <motion.div
                key="input-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <div className="space-y-2">
                  <h2 className="font-serif text-4xl font-bold text-stone-800 tracking-tight">
                    {editingUmat ? 'Perbarui Data Umat' : 'Pendaftaran Umat'}
                  </h2>
                  <p className="text-stone-500 max-w-lg">
                    {editingUmat 
                      ? 'Silakan perbarui informasi umat pada formulir di bawah ini.' 
                      : 'Silakan lengkapi formulir di bawah ini untuk menambahkan data umat baru ke dalam sistem portal.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-8 items-start">
                  <div className="lg:col-span-4">
                    <UmatForm 
                      onSubmit={handleSaveUmat} 
                      initialData={editingUmat || undefined}
                      masterViharas={masterViharas}
                      masterPanditas={masterPanditas}
                      umats={umats}
                    />
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'list' ? (
              <motion.div
                key="list-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="font-serif text-4xl font-bold text-stone-800">Data Umat</h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImportExcel} 
                      accept=".xlsx, .xls" 
                      className="hidden" 
                    />
                    <input 
                      type="file" 
                      ref={taoFileInputRef} 
                      onChange={handleImportTaoExcel} 
                      accept=".xlsx, .xls" 
                      className="hidden" 
                    />
                    <button 
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-200 transition-all shadow-sm"
                    >
                      <FileDown size={14} className="text-rose-600" />
                      Template
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-50 transition-all shadow-sm"
                    >
                      <FileUp size={14} />
                      Import Standard
                    </button>
                    <button 
                      onClick={() => taoFileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-xs font-bold hover:from-amber-600 hover:to-amber-700 transition-all shadow-md shadow-amber-500/10"
                    >
                      <FileSpreadsheet size={14} />
                      Import TAO UK
                    </button>
                    <button 
                      onClick={handleExportExcel}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-50 transition-all shadow-sm"
                    >
                      <FileDown size={14} />
                      Export
                    </button>
                    {selectedIds.size > 0 && (
                      <div className="flex flex-wrap items-center gap-2 animate-in fade-in zoom-in duration-300">
                        <button 
                          onClick={() => setSelectedIds(new Set())}
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all border border-red-100"
                        >
                          <X size={14} />
                          Batal Pilih
                        </button>
                        <button 
                          onClick={handlePrintSelected}
                          className="flex items-center gap-3 px-6 py-2 bg-temple-wood text-white rounded-xl text-xs font-bold hover:shadow-xl hover:bg-temple-wood/90 transition-all shadow-lg shadow-temple-wood/20"
                        >
                          <Printer size={14} />
                          Cetak {selectedIds.size} Kartu
                        </button>
                        <button 
                          onClick={handleDeleteSelected}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all border border-red-600 shadow-md shadow-red-600/10"
                        >
                          <Trash2 size={14} />
                          Hapus {selectedIds.size} Umat
                        </button>
                      </div>
                    )}
                    <button 
                      onClick={() => {
                        if (selectedIds.size === filteredUmats.length && filteredUmats.length > 0) {
                          setSelectedIds(new Set());
                        } else {
                          setSelectedIds(new Set(filteredUmats.map(u => u.id)));
                        }
                      }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm",
                        selectedIds.size === filteredUmats.length && filteredUmats.length > 0
                          ? "bg-stone-800 border-stone-800 text-white shadow-md"
                          : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                      )}
                    >
                      <CheckCircle2 size={14} />
                      {selectedIds.size === filteredUmats.length && filteredUmats.length > 0 ? 'Batalkan Semua' : 'Pilih Semua'}
                    </button>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Cari nama atau ID..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:border-temple-gold transition-colors w-full md:w-64"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {[
                    { label: 'Semua', value: 'all' },
                    { label: 'Tien Chuan Se', value: '點傳師 - Tien Chuan Se' },
                    { label: 'Ciang Se', value: '講師 - Ciang Se' },
                    { label: 'Than Cu', value: '壇主 - Than Cu' },
                    { label: 'Fu Than Cu', value: '副壇主 - Fu Than Cu' },
                    { label: 'Umat', value: '道親 - Umat' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setJabatanFilter(opt.value)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                        jabatanFilter === opt.value
                          ? "bg-stone-800 border-stone-800 text-white shadow-md"
                          : "bg-white border-stone-200 text-stone-500 hover:border-stone-400"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {filteredUmats.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredUmats.map((u) => (
                        <motion.div 
                          key={u.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={cn(
                            "bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-temple-gold/30 transition-colors relative",
                            selectedIds.has(u.id) && "border-temple-gold ring-1 ring-temple-gold/20"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => toggleSelectUmat(u.id)}
                              className={cn(
                                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                selectedIds.has(u.id) 
                                  ? "bg-temple-gold border-temple-gold text-white" 
                                  : "border-stone-200 text-transparent hover:border-stone-300"
                              )}
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400">
                              <User size={24} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-lg font-bold text-stone-800 flex items-baseline gap-2 uppercase">
                                  {u.nama}
                                  {u.namaPinyin && (
                                    <span className="text-xs font-semibold text-stone-400 tracking-wide">
                                      {u.namaPinyin}
                                    </span>
                                  )}
                                </h4>
                                {u.lastPrintedAt && (
                                  <span className="px-2 py-0.5 bg-stone-100 text-[10px] font-bold text-stone-500 rounded-md flex items-center gap-1">
                                    <Printer size={10} />
                                    TERCETAK: {format(new Date(u.lastPrintedAt), 'dd/MM/yy')}
                                  </span>
                                )}
                              </div>
                              {u.namaIndonesia && (
                                <p className="text-xs font-bold text-rose-600/80 uppercase mb-0.5">
                                  {u.namaIndonesia}
                                </p>
                              )}
                              <p className="text-sm text-stone-500 font-medium uppercase">
                                ID: {u.noId} • {u.jabatanSuci} {u.waktu ? `• ${u.waktu}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => {
                                setEditingUmat(u);
                                setActiveTab('input');
                              }}
                              className="p-2 text-stone-300 hover:text-temple-gold hover:bg-temple-gold/5 rounded-xl transition-all"
                              title="Edit Data"
                            >
                              <Pencil size={18} />
                            </button>
                            <button 
                              onClick={() => setSelectedUmat(u)}
                              className="flex items-center gap-2 px-4 py-2 bg-temple-wood text-white rounded-xl text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-temple-wood/10"
                            >
                              <IdCardIcon size={14} />
                              ID Card
                            </button>
                            <button 
                              onClick={() => handleDeleteUmat(u.id)}
                              className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              title="Hapus Data"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-stone-200 border-dashed py-12 px-8 text-center space-y-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-50 rounded-full text-stone-300">
                        <Users size={32} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-stone-600">Belum ada data</p>
                        <p className="text-sm text-stone-400">Belum ada data umat yang tersimpan.</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : activeTab === 'relations' ? (
              <motion.div
                key="relations-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <RelationsView umats={umats} onShowCard={(u) => setSelectedUmat(u)} />
              </motion.div>
            ) : activeTab === 'design' ? (
              <motion.div
                key="design-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <DesignerPage />
              </motion.div>
            ) : activeTab === 'edit-all' ? (
              <motion.div
                key="edit-all-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <BatchEditor 
                  umats={umats}
                  masterViharas={masterViharas}
                  masterPanditas={masterPanditas}
                  onSaveAll={(updatedUmats) => {
                    saveToLocal(updatedUmats);
                  }}
                  onCancel={() => {
                    setActiveTab('list');
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="master-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <MasterDataManager 
                  viharas={masterViharas} 
                  setViharas={async (v) => {
                    await setDoc(doc(db, 'metadata', 'viharas'), { list: v });
                  }}
                  panditas={masterPanditas}
                  setPanditas={async (p) => {
                    await setDoc(doc(db, 'metadata', 'panditas'), { list: p });
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {selectedUmat && (
            <IdCard 
              data={selectedUmat} 
              onClose={() => setSelectedUmat(null)} 
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isTaoModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col border border-stone-100 text-stone-700"
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-stone-100 bg-gradient-to-r from-amber-50/60 to-orange-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                      <FileSpreadsheet size={22} />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-stone-800 leading-tight">Pemetaan Kolom Excel - Sistem TAO UK</h3>
                      <p className="text-[11px] text-stone-500 mt-0.5">Petunjuk: Sesuaikan judul kolom dari file Excel Anda ke data kartu identitas.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsTaoModalOpen(false)}
                    className="p-2 hover:bg-stone-200/50 rounded-xl transition-colors text-stone-400 hover:text-stone-700"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Field Selectors */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <h4 className="font-serif font-bold text-stone-800 text-sm">Pemetaan Kolom (Mapping)</h4>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Mendeteksi Kolom Otomatis</span>
                    </div>

                    <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-2">
                      {TARGET_FIELDS.map((field) => {
                        const currentMappedVal = taoMapping[field.key] || '';
                        const isMapped = !!currentMappedVal;
                        return (
                          <div key={field.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-stone-50/60 rounded-2xl border border-stone-200/45 hover:border-stone-200 transition-all">
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-sans font-bold text-xs text-stone-700">{field.label}</span>
                                {field.required && (
                                  <span className="text-rose-500 text-[9px] font-bold uppercase">* Wajib</span>
                                )}
                                {isMapped && (
                                  <CheckCircle2 size={13} className="text-green-600 shrink-0" />
                                )}
                              </div>
                              <p className="text-[10px] text-stone-400 mt-1 font-medium leading-normal">{field.description}</p>
                            </div>

                            <select
                              value={currentMappedVal}
                              onChange={(e) => setTaoMapping({ ...taoMapping, [field.key]: e.target.value })}
                              className={cn(
                                "text-xs px-3 py-1.5 rounded-xl bg-white border outline-none font-semibold transition-all w-full sm:w-48",
                                isMapped ? "border-green-300 text-green-800 bg-green-50/10" : "border-stone-200 text-stone-500 hover:border-stone-300"
                              )}
                            >
                              <option value="">(Kosong / Default)</option>
                              {taoHeaders.map(hdr => (
                                <option key={hdr} value={hdr}>{hdr}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Interactive Sample Preview */}
                  <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-4">
                        <h4 className="font-serif font-bold text-stone-800 text-sm">Pratinjau Hasil Mapped (3 Teratas)</h4>
                        <span className="text-[10px] text-stone-400 font-bold">Total: {taoDataRows.length} Umat</span>
                      </div>

                      <div className="space-y-3 max-h-[46vh] overflow-y-auto pr-2">
                        {taoDataRows.slice(0, 3).map((row, idx) => {
                          const getVal = (key: keyof Umat) => {
                            const val = taoMapping[key];
                            return val ? String(row[val] ?? '') : '';
                          };

                          let namaIdn = getVal('namaIndonesia');
                          let namaKanji = getVal('nama');
                          if (!namaIdn && namaKanji) namaIdn = namaKanji;
                          if (!namaKanji && namaIdn) namaKanji = namaIdn;

                          return (
                            <div key={idx} className="p-3 bg-stone-50 border border-stone-200/50 rounded-2xl text-[11px] space-y-2 hover:bg-stone-100/40 transition-colors">
                              <div className="flex items-center justify-between border-b border-stone-100 pb-1 flex-wrap gap-2">
                                <span className="font-mono text-[9px] text-stone-400 font-bold">Baris #{idx + 1}</span>
                                <span className="font-sans font-bold text-stone-600 bg-stone-200/50 px-1.5 py-0.5 rounded text-[8px] truncate max-w-[140px]">
                                  {getVal('noId') || '(Auto-Generate ID)'}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                <div>
                                  <span className="text-[9px] text-stone-400">Nama Indonesia:</span>
                                  <p className="font-bold text-stone-700 truncate">{namaIdn || '-'}</p>
                                </div>
                                <div>
                                  <span className="text-[9px] text-stone-400">Nama Mandarin:</span>
                                  <p className="font-bold text-stone-700 truncate">{namaKanji || '-'}</p>
                                </div>
                                <div>
                                  <span className="text-[9px] text-stone-400">Pdt (點傳師):</span>
                                  <p className="font-semibold text-stone-600 truncate">{getVal('pandita') || '-'}</p>
                                </div>
                                <div>
                                  <span className="text-[9px] text-stone-400">Jabatan:</span>
                                  <p className="font-semibold text-stone-600 truncate">{getVal('jabatanSuci') || '道親 (Umat)'}</p>
                                </div>
                                <div>
                                  <span className="text-[9px] text-stone-400">Tgl Masehi:</span>
                                  <p className="font-semibold text-stone-600 truncate">{getVal('tanggalMasehi') || '-'}</p>
                                </div>
                                <div>
                                  <span className="text-[9px] text-stone-400">Tgl Lunar:</span>
                                  <p className="font-medium text-stone-600 italic truncate">
                                    {getVal('tanggalLunar') || '✨ Auto-konversi Lunar'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-amber-50/50 rounded-2xl border border-amber-200/40 p-3 space-y-1 text-amber-800 text-[11px] leading-relaxed">
                      <p className="font-bold">✨ Fitur Konverter Lunar Praktis!</p>
                      <p>Sistem akan mengonversi Tanggal Masehi menjadi Tanggal Imlek (Lunar) beraksara Mandarin secara otomatis jika kolom Tanggal Lunar dibiarkan kosong.</p>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-stone-100 bg-stone-50 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setIsTaoModalOpen(false)}
                    className="px-5 py-2.5 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-600 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleProcessTaoImport}
                    disabled={!taoMapping.nama || !taoMapping.noId}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all",
                      (taoMapping.nama && taoMapping.noId)
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 hover:shadow-xl hover:shadow-amber-500/10 active:scale-[0.98]"
                        : "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
                    )}
                  >
                    <CheckCircle2 size={16} />
                    Mulai Import {taoDataRows.length} Data
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {isPrintMode && (
          <div className="print-modal-parent fixed inset-0 z-[9999] bg-stone-50 print:bg-white print:static print:inset-auto overflow-auto no-scrollbar">
            {isExportingPDF && (
              <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-white text-center p-6 animate-in fade-in duration-300">
                <div className="w-16 h-16 border-4 border-temple-gold border-t-transparent rounded-full animate-spin mb-6 shadow-lg shadow-temple-gold/20" />
                <h3 className="text-2xl font-serif font-bold mb-2 tracking-tight">Menyiapkan PDF...</h3>
                <p className="text-white/60 text-sm max-w-xs mx-auto">Kami sedang memproses kartu identitas Anda ke dalam format PDF kualitas tinggi.</p>
              </div>
            )}
            
            {/* Sticky Print Control Panel (Hidden on Print) */}
            <div className="sticky top-0 left-0 right-0 z-[100] bg-stone-900 border-b border-stone-800 text-white p-4 md:px-8 print:hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                  <Printer size={20} />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm leading-tight text-white">Panel Cetak Kartu Identitas</h4>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    Jumlah: <span className="font-bold text-amber-400">{selectedIds.size}</span> Kartu | Estimasi: <span className="font-bold text-amber-400">{Math.ceil(selectedIds.size / 9)}</span> Lembar A4 (Bolak-Balik)
                  </p>
                </div>
              </div>

              {/* Layout & Spacing Selectors wrapper */}
              <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center">
                {/* Layout Mode Selector (Indonesian instructions) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold shrink-0">Susunan Halaman:</span>
                  <div className="flex flex-wrap gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
                    <button
                      onClick={() => setPrintLayoutMode('all-fronts-first')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                        printLayoutMode === 'all-fronts-first'
                          ? "bg-amber-500 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      )}
                    >
                      <Layers size={13} />
                      Semua Depan Dulu, Baru Belakang (Manual)
                    </button>
                    <button
                      onClick={() => setPrintLayoutMode('interleaved')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                        printLayoutMode === 'interleaved'
                          ? "bg-amber-500 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      )}
                    >
                      <RefreshCw size={13} />
                      Depan & Belakang Bergantian (Duplex)
                    </button>
                  </div>
                </div>

                {/* Card Gap Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold shrink-0">Jarak Antar Kartu:</span>
                  <div className="flex flex-wrap gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
                    <button
                      onClick={() => setPrintGap(0)}
                      title="Rapat tanpa jarak"
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                        printGap === 0
                          ? "bg-amber-500 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      )}
                    >
                      0mm
                    </button>
                    <button
                      onClick={() => setPrintGap(2)}
                      title="Rekomendasi jarak 2mm untuk pemotongan manual"
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                        printGap === 2
                          ? "bg-amber-500 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      )}
                    >
                      2mm (Saran)
                    </button>
                    <button
                      onClick={() => setPrintGap(4)}
                      title="Jarak lebar 4mm"
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                        printGap === 4
                          ? "bg-amber-500 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      )}
                    >
                      4mm
                    </button>
                    <button
                      onClick={() => setPrintGap(6)}
                      title="Jarak lebar 6mm"
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                        printGap === 6
                          ? "bg-amber-500 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      )}
                    >
                      6mm (Baru)
                    </button>
                    <button
                      onClick={() => setPrintGap(8)}
                      title="Jarak lebar 8mm"
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                        printGap === 8
                          ? "bg-amber-500 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      )}
                    >
                      8mm
                    </button>
                    <button
                      onClick={() => setPrintGap(10)}
                      title="Jarak lebar 10mm"
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                        printGap === 10
                          ? "bg-amber-500 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      )}
                    >
                      10mm
                    </button>
                    <button
                      onClick={() => setPrintGap(12)}
                      title="Jarak lebar 12mm"
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                        printGap === 12
                          ? "bg-amber-500 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      )}
                    >
                      12mm
                    </button>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 self-end lg:self-auto shrink-0">
                <button 
                  onClick={handleSavePDF}
                  disabled={isExportingPDF}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <FileDown size={15} />
                  Simpan PDF (Save PDF)
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-extrabold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Printer size={15} />
                  Cetak Sekarang
                </button>
                <button 
                  onClick={() => setIsPrintMode(false)}
                  className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 font-bold rounded-xl text-xs transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Helpful Print Dialog configuration tips (Hidden on Print) */}
            <div className="bg-amber-500/10 border-b border-stone-800 text-stone-300 px-6 py-3 text-xs print:hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span>
                  <strong>Saran Cetak Presisi (Bolak-Balik Selaras):</strong> Pada jendela print browser Anda, ubah pengaturan <strong>Margin menjadi "None" (Tanpa Margin)</strong> dan <strong>Skala menjadi "Default" (100%)</strong> agar posisi depan & belakang pas dan lurus sehingga mudah dipotong.
                </span>
              </div>
              <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded whitespace-nowrap shrink-0">Mirroring Baris Diaktifkan</span>
            </div>

            {/* Print Document Container */}
            <div ref={printContainerRef} className="py-8 print:py-0 w-full flex justify-center">
              <PrintingView umats={umats.filter(u => selectedIds.has(u.id))} layoutMode={printLayoutMode} gap={printGap} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// --- Printing View Component ---
function PrintingView({ umats, layoutMode = 'all-fronts-first', gap = 0 }: { umats: Umat[], layoutMode?: 'all-fronts-first' | 'interleaved', gap?: number }) {
  // Items per A4 page (e.g., 3 columns x 3 rows = 9 ID cards)
  const batchSize = 9;
  const batches: Umat[][] = [];
  for (let i = 0; i < umats.length; i += batchSize) {
    batches.push(umats.slice(i, i + batchSize));
  }

  // Helper to pad any batch to exactly 9 items
  const getPaddedBatch = (batch: Umat[]) => {
    const padded = [...batch];
    while (padded.length < 9) {
      padded.push(null as any);
    }
    return padded;
  };

  // Helper to mirror back grid items horizontally so that they align exactly when printed double-sided
  const getMirroredBackBatch = (paddedBatch: (Umat | null)[]) => {
    return [
      paddedBatch[2], paddedBatch[1], paddedBatch[0], // Row 1 horizontally mirrored
      paddedBatch[5], paddedBatch[4], paddedBatch[3], // Row 2 horizontally mirrored
      paddedBatch[8], paddedBatch[7], paddedBatch[6]  // Row 3 horizontally mirrored
    ];
  };

  return (
    <div className="print-container font-sans bg-white p-0 md:p-8 flex flex-col items-center">
      <style>{`
        @media print {
          /* Force standard body/html/root view for printer engine to support multi-page */
          html, body {
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            position: static !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Force React root parent layout to expand cleanly without flex/height restrictions */
          #root {
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            position: static !important;
          }

          /* Force app wrapper container to render as static block layout in print */
          #root > div {
            display: block !important;
            position: static !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            background: white !important;
          }
          
          /* Hide all standard layout panels to prevent empty pages */
          #root > div > aside,
          #root > div > main > header,
          .no-print,
          .print-hidden,
          button,
          nav {
            display: none !important;
          }

          /* Reset spacing on the main container which has lg:ml-72 on screen */
          #root > div > main {
            margin-left: 0 !important;
            padding: 0 !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
          }

          /* Reset absolute/fixed print modal parents to standard static flow */
          .print-modal-parent {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { 
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            visibility: visible;
            padding: 0 !important;
            margin: 0 !important;
          }
          @page { size: A4 portrait; margin: 0; }
        }
        
        .a4-page {
          width: 210mm;
          height: 297mm;
          margin: 0 auto 20mm;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          page-break-after: always;
          break-after: page;
          page-break-inside: avoid;
          break-inside: avoid;
          display: grid;
          grid-template-columns: repeat(3, 54mm);
          grid-template-rows: repeat(3, 85mm);
          gap: ${gap}mm;
          justify-content: center;
          align-content: center;
          overflow: hidden;
          box-sizing: border-box;
          position: relative;
        }
        @media print {
          .a4-page { 
            margin: 0 !important; 
            box-shadow: none !important; 
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      `}</style>

      {layoutMode === 'all-fronts-first' ? (
        <>
          {/* Bagian Pertama: Semua Sisi Depan Terlebih Dahulu */}
          {batches.map((batch, bIndex) => (
            <div key={`front-page-${bIndex}`} className="a4-page">
              {getPaddedBatch(batch).map((u, idx) => {
                if (!u) {
                  return <div key={`empty-front-${idx}`} className="w-[54mm] h-[85mm] opacity-0" />;
                }
                return (
                  <div key={`front-${u.id}`} className="flex items-center justify-center relative w-[54mm] h-[85mm]">
                    <IdCard data={u} isFrontOnly forceSmall />
                  </div>
                );
              })}
            </div>
          ))}

          {/* Bagian Kedua: Semua Sisi Belakang Sesuai Urutan (Mirrored Horizontally) */}
          {batches.map((batch, bIndex) => (
            <div key={`back-page-${bIndex}`} className="a4-page">
              {getMirroredBackBatch(getPaddedBatch(batch)).map((u, idx) => {
                if (!u) {
                  return <div key={`empty-back-${idx}`} className="w-[54mm] h-[85mm] opacity-0" />;
                }
                return (
                  <div key={`back-${u.id}`} className="flex items-center justify-center relative w-[54mm] h-[85mm]">
                    <IdCard data={u} isBackOnly forceSmall />
                  </div>
                );
              })}
            </div>
          ))}
        </>
      ) : (
        /* Sisi Depan & Belakang Bergantian per Lembar (Mirrored Horizontally on Back Side) */
        batches.map((batch, bIndex) => (
          <React.Fragment key={bIndex}>
            {/* Halaman Depan Batch Ini */}
            <div className="a4-page">
              {getPaddedBatch(batch).map((u, idx) => {
                if (!u) {
                  return <div key={`empty-front-${idx}`} className="w-[54mm] h-[85mm] opacity-0" />;
                }
                return (
                  <div key={`front-${u.id}`} className="flex items-center justify-center relative w-[54mm] h-[85mm]">
                    <IdCard data={u} isFrontOnly forceSmall />
                  </div>
                );
              })}
            </div>

            {/* Halaman Belakang Batch Ini */}
            <div className="a4-page">
              {getMirroredBackBatch(getPaddedBatch(batch)).map((u, idx) => {
                if (!u) {
                  return <div key={`empty-back-${idx}`} className="w-[54mm] h-[85mm] opacity-0" />;
                }
                return (
                  <div key={`back-${u.id}`} className="flex items-center justify-center relative w-[54mm] h-[85mm]">
                    <IdCard data={u} isBackOnly forceSmall />
                  </div>
                );
              })}
            </div>
          </React.Fragment>
        ))
      )}
    </div>
  );
}

// --- Landing Page Component ---
function LandingPage({ onNavigate }: { onNavigate: (tab: 'list' | 'input' | 'design') => void }) {
  return (
    <div className="h-screen w-full relative flex items-center justify-center overflow-auto py-20 no-scrollbar">
      {/* Background with multiple layers */}
      <div className="absolute inset-0 bg-stone-100">
        <div 
          className="absolute inset-0 opacity-20 contrast-125 mix-blend-multiply"
          style={{ 
            backgroundImage: 'url(/images/JiGong_3.jpeg)', 
            backgroundSize: 'cover', 
            backgroundPosition: 'center' 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-50/80 via-transparent to-stone-50/90" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-5xl w-full px-6 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* Logo Frame */}
          <div className="flex justify-center mb-8">
            <div className="relative p-2 rounded-full border-2 border-temple-gold/20 animate-pulse">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full flex items-center justify-center shadow-2xl overflow-hidden border border-stone-200">
                <img src="/images/front_logo.png" alt="Cong De Logo" className="w-20 h-20 md:w-28 md:h-28 object-contain" />
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-temple-gold" />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-temple-gold" />
            </div>
          </div>

          <div className="space-y-2">
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm md:text-base font-serif text-temple-gold font-black tracking-[0.3em] uppercase"
            >
              發 一 崇 德
            </motion.h2>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 tracking-tight">
              Eka Dharma Manggala
            </h1>
            <p className="text-stone-500 font-medium tracking-[0.2em] md:text-lg">SAMARINDA</p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-6xl mx-auto w-full"
          >
            <button
              onClick={() => onNavigate('input')}
              className="group relative bg-white p-8 rounded-[32px] shadow-xl hover:shadow-2xl transition-all duration-500 border border-stone-100 flex flex-col items-center text-center overflow-hidden hover:-translate-y-2"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform relative z-10">
                <Plus size={32} />
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-2 relative z-10">Input Data Umat</h3>
              <p className="text-sm text-stone-500 relative z-10">Pendaftaran data umat baru</p>
              <div className="mt-6 flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest relative z-10">
                Mulai <ChevronRight size={14} />
              </div>
            </button>

            <button
              onClick={() => onNavigate('list')}
              className="group relative bg-white p-8 rounded-[32px] shadow-xl hover:shadow-2xl transition-all duration-500 border border-stone-100 flex flex-col items-center text-center overflow-hidden hover:-translate-y-2"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-temple-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-800 mb-6 group-hover:scale-110 transition-transform relative z-10">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-2 relative z-10">Data Umat</h3>
              <p className="text-sm text-stone-500 relative z-10">Lihat dan kelola database umat</p>
              <div className="mt-6 flex items-center gap-2 text-stone-800 font-bold text-xs uppercase tracking-widest relative z-10">
                Buka <ChevronRight size={14} />
              </div>
            </button>

            <button
              onClick={() => onNavigate('design')}
              className="group relative bg-white p-8 rounded-[32px] shadow-xl hover:shadow-2xl transition-all duration-500 border border-stone-100 flex flex-col items-center text-center overflow-hidden hover:-translate-y-2"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6 group-hover:scale-110 transition-transform relative z-10">
                <Palette size={32} />
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-2 relative z-10">Desain Kartu</h3>
              <p className="text-sm text-stone-500 relative z-10">Sesuaikan tata letak dan gambar kartu</p>
              <div className="mt-6 flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-widest relative z-10">
                Sesuaikan <ChevronRight size={14} />
              </div>
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative background patterns */}
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-temple-gold/5 blur-[100px] -z-10" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -z-10" />
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
        active 
          ? "bg-temple-wood text-white shadow-lg shadow-temple-wood/20" 
          : "text-stone-500 hover:bg-stone-100"
      )}
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
      {active && <motion.div layoutId="active-indicator" className="ml-auto"><ChevronRight size={14} /></motion.div>}
    </button>
  );
}

function UmatForm({ 
  onSubmit, 
  initialData, 
  masterViharas = [], 
  masterPanditas = [],
  umats = []
}: { 
  onSubmit: (data: UmatInput) => void, 
  initialData?: UmatInput,
  masterViharas?: {name: string, pinyin: string}[],
  masterPanditas?: {name: string, pinyin: string}[],
  umats?: Umat[]
}) {
  const findPinyinMatch = (name: string) => {
    if (!name.trim()) return null;
    const query = name.trim().toUpperCase();

    // 1. Check Master Panditas
    const mpMaster = masterPanditas.find(p => (p.name?.trim() || '').toUpperCase() === query);
    if (mpMaster && mpMaster.pinyin) return mpMaster.pinyin;

    // 2. Check Master Viharas
    const mvMaster = masterViharas.find(v => (v.name?.trim() || '').toUpperCase() === query);
    if (mvMaster && mvMaster.pinyin) return mvMaster.pinyin;

    // 3. Check existing Umats records for any matching field
    for (const u of umats) {
      // Check Nama / Pinyin
      if ((u.nama?.trim() || '').toUpperCase() === query && u.namaPinyin) return u.namaPinyin;
      if ((u.namaIndonesia?.trim() || '').toUpperCase() === query && u.namaPinyin) return u.namaPinyin;
      
      // Check Vihara
      if ((u.vihara?.trim() || '').toUpperCase() === query && u.viharaPinyin) return u.viharaPinyin;
      
      // Check Pandita
      if ((u.pandita?.trim() || '').toUpperCase() === query && u.panditaPinyin) return u.panditaPinyin;
      
      // Check Pengajak
      if ((u.pengajak?.trim() || '').toUpperCase() === query && u.pengajakPinyin) return u.pengajakPinyin;
      
      // Check Penanggung
      if ((u.penanggung?.trim() || '').toUpperCase() === query && u.penanggungPinyin) return u.penanggungPinyin;
    }

    // fallback: if name contains Chinese/Hanzi characters, convert to Pinyin automatically!
    if (/[\u4e00-\u9fa5]/.test(name)) {
      try {
        const py = pinyin(name, { toneType: 'none' });
        if (py) {
          return py.toUpperCase();
        }
      } catch (e) {
        console.error("pinyin fallback conversion failed in UmatForm findPinyinMatch", e);
      }
    }

    return null;
  };

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
      console.error("Lunar conversion error:", e);
      return "";
    }
  };

  const [loading, setLoading] = useState(false);
  const [viharaSelect, setViharaSelect] = useState<string>('');
  const [panditaSelect, setPanditaSelect] = useState<string>('');

  const [formData, setFormData] = useState<UmatInput>(initialData || {
    tanggalMasehi: format(new Date(), 'dd-MM-yyyy'),
    tanggalLunar: calculateLunarDate(format(new Date(), 'dd-MM-yyyy')),
    pandita: '',
    panditaPinyin: '',
    pengajak: '',
    pengajakPinyin: '',
    penanggung: '',
    penanggungPinyin: '',
    vihara: '',
    viharaPinyin: '',
    nama: '',
    namaPinyin: '',
    namaIndonesia: '',
    jabatanSuci: '',
    noId: '',
    phone: '',
    waktu: ''
  });

  useEffect(() => {
    if (initialData) {
      const data = { ...initialData };
      if (data.nama && (!data.namaPinyin || !data.namaPinyin.trim())) {
        const queryPinyin = findPinyinMatch(data.nama);
        if (queryPinyin) {
          data.namaPinyin = queryPinyin;
        }
      }
      if (data.pengajak && (!data.pengajakPinyin || !data.pengajakPinyin.trim())) {
        const queryPinyin = findPinyinMatch(data.pengajak);
        if (queryPinyin) {
          data.pengajakPinyin = queryPinyin;
        }
      }
      if (data.penanggung && (!data.penanggungPinyin || !data.penanggungPinyin.trim())) {
        const queryPinyin = findPinyinMatch(data.penanggung);
        if (queryPinyin) {
          data.penanggungPinyin = queryPinyin;
        }
      }
      setFormData(data);
      
      const foundVihara = masterViharas.find(v => v.name === data.vihara);
      if (foundVihara) {
        setViharaSelect(foundVihara.name);
      } else if (initialData.vihara) {
        setViharaSelect('Lainnya');
      }

      const foundPandita = masterPanditas.find(p => p.name === initialData.pandita);
      if (foundPandita) {
        setPanditaSelect(foundPandita.name);
      } else if (initialData.pandita) {
        setPanditaSelect('Lainnya');
      }
    } else {
      // Defaults for new form
      setViharaSelect('');
    }
  }, [initialData, masterViharas, masterPanditas]);

  const handleViharaSelectChange = (val: string) => {
    setViharaSelect(val);
    if (val === 'Lainnya' || val === '') {
      setFormData(prev => ({ ...prev, vihara: '', viharaPinyin: '' }));
    } else {
      const v = masterViharas.find(item => item.name === val);
      if (v) {
        setFormData(prev => ({ ...prev, vihara: v.name, viharaPinyin: v.pinyin }));
      }
    }
  };

  const handlePanditaSelectChange = (val: string) => {
    setPanditaSelect(val);
    if (val === 'Lainnya') {
      setFormData(prev => ({ ...prev, pandita: '', panditaPinyin: '' }));
    } else {
      const p = masterPanditas.find(item => item.name === val);
      if (p) {
        setFormData(prev => ({ ...prev, pandita: p.name, panditaPinyin: p.pinyin }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.noId) {
      alert('Mohon isi Nama dan No ID');
      return;
    }
    
    // Handle default Jabatan Suci
    const finalJabatanSuci = formData.jabatanSuci || '道親 - Umat';
    
    // Convert all string fields to uppercase
    const capitalizedData: UmatInput = Object.keys(formData).reduce((acc, key) => {
      let val = formData[key as keyof UmatInput];
      if (key === 'jabatanSuci' && !val) {
        acc[key] = finalJabatanSuci.toUpperCase();
      } else if (typeof val === 'string') {
        const trimmed = val.trim();
        if (key === 'vihara' || key === 'viharaPinyin') {
          // Ensure vihara and its pinyin stay on exactly 1 line
          acc[key as keyof UmatInput] = trimmed.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').toUpperCase();
        } else if (key === 'pandita') {
          const cleaned = trimmed.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
          acc[key as keyof UmatInput] = formatPanditaName(cleaned).toUpperCase();
        } else if (key === 'panditaPinyin') {
          acc[key as keyof UmatInput] = trimmed.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').toUpperCase();
        } else {
          acc[key as keyof UmatInput] = trimmed.toUpperCase();
        }
      } else {
        acc[key as keyof UmatInput] = val;
      }
      return acc;
    }, {} as UmatInput);

    // Autofill Pandita Pinyin if found in the system
    if (!capitalizedData.panditaPinyin && capitalizedData.pandita) {
      const matchedPinyin = findPinyinMatch(capitalizedData.pandita);
      if (matchedPinyin) {
        capitalizedData.panditaPinyin = matchedPinyin.toUpperCase();
      }
    }

    setLoading(true);
    setTimeout(() => {
      onSubmit(capitalizedData);
      setLoading(false);
    }, 800);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 md:p-12 rounded-[40px] border border-stone-100 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        <div className="space-y-8">
          <h3 className="text-xs uppercase tracking-widest text-temple-gold font-bold">Administrasi & Vihara</h3>
          
          <FormField 
            label="Tanggal Memohon TAO (Masehi)" 
            id="tanggalMasehi"
            icon={<Calendar size={18} />}
            type="date"
            value={(() => {
              if (!formData.tanggalMasehi) return "";
              const parts = formData.tanggalMasehi.split("-");
              if (parts.length === 3 && parts[0].length === 2) {
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
              }
              return formData.tanggalMasehi;
            })()}
            onChange={(v) => {
              if (!v) {
                setFormData(prev => ({ ...prev, tanggalMasehi: "", tanggalLunar: "" }));
                return;
              }
              const parts = v.split("-");
              if (parts.length === 3) {
                const formatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
                const lunar = calculateLunarDate(formatted, formData.waktu);
                setFormData(prev => ({ ...prev, tanggalMasehi: formatted, tanggalLunar: lunar }));
              } else {
                setFormData(prev => ({ ...prev, tanggalMasehi: v }));
              }
            }}
          />

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1 font-sans">
              Waktu Memohon TAO
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-temple-gold transition-colors z-10">
                <Clock size={18} />
              </div>
              <select
                value={formData.waktu || ''}
                onChange={(e) => {
                  const newWaktu = e.target.value;
                  const lunar = calculateLunarDate(formData.tanggalMasehi, newWaktu);
                  setFormData(prev => ({ ...prev, waktu: newWaktu, tanggalLunar: lunar }));
                }}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-3 pl-12 pr-10 text-stone-800 focus:outline-none focus:ring-2 focus:ring-temple-gold/10 focus:border-temple-gold transition-all appearance-none cursor-pointer font-sans"
              >
                <option value="">PILIH WAKTU</option>
                {SHI_CHEN.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          <FormField 
            label="Tanggal Memohon TAO (Lunar)" 
            id="tanggalLunar"
            icon={<Calendar size={18} />}
            placeholder="Contoh: 15 LUNAR MONTH"
            value={formData.tanggalLunar}
            onChange={(v) => setFormData(prev => ({ ...prev, tanggalLunar: v }))}
          />

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1 font-sans">
              Pilih Vihara
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-temple-gold transition-colors z-10">
                <MapPin size={18} />
              </div>
              <select
                value={viharaSelect}
                onChange={(e) => handleViharaSelectChange(e.target.value)}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-3 pl-12 pr-4 text-stone-800 focus:outline-none focus:ring-2 focus:ring-temple-gold/10 focus:border-temple-gold transition-all appearance-none cursor-pointer font-sans"
              >
                <option value="">Pilih Vihara</option>
                {masterViharas.map(v => (
                  <option key={v.name} value={v.name}>{v.name} {v.pinyin ? `(${v.pinyin})` : ''}</option>
                ))}
                <option value="Lainnya">Lainnya</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                <ChevronRight size={14} className="rotate-90" />
              </div>
            </div>
          </div>

          {viharaSelect === 'Lainnya' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-8 overflow-hidden"
            >
              <FormField 
                label="Nama Vihara" 
                id="vihara"
                icon={<MapPin size={18} />}
                placeholder="Masukkan Nama Vihara"
                value={formData.vihara}
                onChange={(v) => {
                  setFormData(prev => ({ ...prev, vihara: v }));
                  if (!v.trim()) {
                    setFormData(prev => ({ ...prev, viharaPinyin: "" }));
                    return;
                  }
                  const pinyin = findPinyinMatch(v);
                  if (pinyin) {
                    setFormData(prev => ({ ...prev, viharaPinyin: pinyin }));
                  }
                }}
              />

              <FormField 
                label="Vihara Pinyin" 
                id="viharaPinyin"
                icon={<MapPin size={18} />}
                placeholder="Pinyin Vihara"
                value={formData.viharaPinyin || ''}
                onChange={(v) => setFormData(prev => ({ ...prev, viharaPinyin: v }))}
              />
            </motion.div>
          )}
        </div>

        <div className="space-y-8">
          {/* Section: Pandita */}
          <div className="space-y-6">
            <h3 className="text-xs uppercase tracking-widest text-temple-gold font-bold">Data Pandita</h3>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1 font-sans">
                Pilih Pandita
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-temple-gold transition-colors z-10">
                  <User size={18} />
                </div>
                <select
                  value={panditaSelect}
                  onChange={(e) => handlePanditaSelectChange(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-3 pl-12 pr-4 text-stone-800 focus:outline-none focus:ring-2 focus:ring-temple-gold/10 focus:border-temple-gold transition-all appearance-none cursor-pointer font-sans"
                >
                  <option value="">Pilih Pandita...</option>
                  {masterPanditas.map(p => (
                    <option key={p.name} value={p.name}>{p.name} {p.pinyin ? `(${p.pinyin})` : ''}</option>
                  ))}
                  <option value="Lainnya">Lainnya</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                  <ChevronRight size={14} className="rotate-90" />
                </div>
              </div>
            </div>

            {panditaSelect === 'Lainnya' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-6 overflow-hidden"
              >
                <FormField 
                  label="Nama Pandita" 
                  id="pandita"
                  icon={<User size={18} />}
                  placeholder="Masukkan Nama Pandita"
                  value={formData.pandita}
                  onChange={(v) => {
                    const cleaned = v.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
                    const formatted = formatPanditaName(cleaned);
                    setFormData(prev => ({ ...prev, pandita: formatted }));
                    
                    if (!cleaned.trim()) {
                      setFormData(prev => ({ ...prev, panditaPinyin: "" }));
                      return;
                    }
                    
                    const pinyin = findPinyinMatch(formatted) || findPinyinMatch(cleaned) || findPinyinMatch(v);
                    if (pinyin) {
                      setFormData(prev => ({ ...prev, panditaPinyin: pinyin }));
                    }
                  }}
                />

                <FormField 
                  label="Pandita Pinyin" 
                  id="panditaPinyin"
                  icon={<User size={18} />}
                  placeholder="Pinyin Pandita"
                  value={formData.panditaPinyin || ''}
                  onChange={(v) => setFormData(prev => ({ ...prev, panditaPinyin: v }))}
                />
              </motion.div>
            )}
          </div>

          {/* Section: ID & Sacred Position */}
          <div className="space-y-6 pt-6 border-t border-stone-100">
            <h3 className="text-xs uppercase tracking-widest text-temple-gold font-bold">No ID & Jabatan Suci</h3>

            <FormField 
              label="No. ID / Kartu" 
              id="noId"
              icon={<IdCardIcon size={18} />}
              placeholder="Contoh: EDM-001"
              value={formData.noId}
              required={true}
              onChange={(v) => setFormData(prev => ({ ...prev, noId: v }))}
            />

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1 font-sans">
                Jabatan Suci
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-temple-gold transition-colors z-10">
                  <ShieldCheck size={18} />
                </div>
                <select
                  value={formData.jabatanSuci}
                  onChange={(e) => setFormData(prev => ({ ...prev, jabatanSuci: e.target.value }))}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-3 pl-12 pr-4 text-stone-800 focus:outline-none focus:ring-2 focus:ring-temple-gold/10 focus:border-temple-gold transition-all appearance-none cursor-pointer font-sans uppercase"
                >
                  <option value="">Pilih Jabatan...</option>
                  <option value="點傳師 - TIEN CHUAN SE">點傳師 - Tien Chuan Se</option>
                  <option value="講師 - CIANG SE">講師 - Ciang Se</option>
                  <option value="壇主 - THAN CU">壇主 - Than Cu</option>
                  <option value="副壇主 - FU THAN CU">副壇主 - Fu Than Cu</option>
                  <option value="道親 - UMAT">道親 - Umat</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                  <ChevronRight size={14} className="rotate-90" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8 pt-8 border-t border-stone-50">
          <h3 className="text-xs uppercase tracking-widest text-temple-gold font-bold">Data Nama & Kontak</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField 
              label="NAMA PEMOHON TAO" 
              id="nama"
              icon={<User size={18} />}
              placeholder="Nama Mandarin"
              required={true}
              disabled={!!initialData}
              value={formData.nama}
              onChange={(v) => {
                setFormData(prev => ({ ...prev, nama: v }));
                if (!v.trim()) {
                  setFormData(prev => ({ ...prev, namaPinyin: "" }));
                  return;
                }
                const pinyin = findPinyinMatch(v);
                if (pinyin) {
                  setFormData(prev => ({ ...prev, namaPinyin: pinyin }));
                }
              }}
            />
            <FormField 
              label="Nama (Pinyin)" 
              id="namaPinyin"
              icon={<User size={18} />}
              placeholder="Pinyin"
              value={formData.namaPinyin || ''}
              onChange={(v) => setFormData(prev => ({ ...prev, namaPinyin: v }))}
            />
            <FormField 
              label="Nama Indonesia" 
              id="namaIndonesia"
              icon={<User size={18} />}
              placeholder="Nama Lengkap Indonesia"
              value={formData.namaIndonesia}
              onChange={(v) => setFormData(prev => ({ ...prev, namaIndonesia: v }))}
            />
            <FormField 
              label="WhatsApp" 
              id="phone"
              icon={<MessageSquare size={18} />}
              placeholder="628..."
              value={formData.phone}
              onChange={(v) => setFormData(prev => ({ ...prev, phone: v }))}
            />
          </div>
        </div>

        <div className="md:col-span-2 space-y-8 pt-8 border-t border-stone-50">
          <h3 className="text-xs uppercase tracking-widest text-temple-gold font-bold">Pengajak & Penanggung</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField 
              label="Pengajak" 
              id="pengajak"
              icon={<User size={18} />}
              placeholder="Nama"
              value={formData.pengajak}
              onChange={(v) => {
                setFormData(prev => ({ ...prev, pengajak: v }));
                if (!v.trim()) {
                  setFormData(prev => ({ ...prev, pengajakPinyin: "" }));
                  return;
                }
                const pinyin = findPinyinMatch(v);
                if (pinyin) {
                  setFormData(prev => ({ ...prev, pengajakPinyin: pinyin }));
                }
              }}
            />
            <FormField 
              label="Pengajak Pinyin" 
              id="pengajakPinyin"
              icon={<User size={18} />}
              placeholder="Pinyin"
              value={formData.pengajakPinyin || ''}
              onChange={(v) => setFormData(prev => ({ ...prev, pengajakPinyin: v }))}
            />
            <FormField 
              label="Penanggung" 
              id="penanggung"
              icon={<User size={18} />}
              placeholder="Nama"
              value={formData.penanggung}
              onChange={(v) => {
                setFormData(prev => ({ ...prev, penanggung: v }));
                if (!v.trim()) {
                  setFormData(prev => ({ ...prev, penanggungPinyin: "" }));
                  return;
                }
                const pinyin = findPinyinMatch(v);
                if (pinyin) {
                  setFormData(prev => ({ ...prev, penanggungPinyin: pinyin }));
                }
              }}
            />
            <FormField 
              label="Penanggung Pinyin" 
              id="penanggungPinyin"
              icon={<User size={18} />}
              placeholder="Pinyin"
              value={formData.penanggungPinyin || ''}
              onChange={(v) => setFormData(prev => ({ ...prev, penanggungPinyin: v }))}
            />
          </div>
        </div>
      </div>

      <div className="pt-8">
        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full bg-temple-wood text-white py-4 rounded-2xl font-semibold shadow-xl shadow-temple-wood/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2",
            loading && "animate-pulse"
          )}
        >
          {loading ? "Menyimpan..." : (
            <>
              {initialData ? <Pencil size={20} /> : <Download size={20} />}
              {initialData ? "Simpan Perubahan" : "Simpan Data Umat"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function FormField({ 
  label, 
  id, 
  icon, 
  type = "text", 
  placeholder, 
  value, 
  disabled = false,
  required = false,
  onChange 
}: { 
  label: string; 
  id: string; 
  icon: React.ReactNode;
  type?: string;
  placeholder?: string;
  value: string;
  disabled?: boolean;
  required?: boolean;
  onChange: (val: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1 font-sans flex items-center gap-1">
        {label}
        {required && <span className="text-rose-500 font-bold" title="Wajib Diisi">*</span>}
      </label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-temple-gold transition-colors">
          {icon}
        </div>
        <input
          id={id}
          type={type}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full bg-stone-50 border border-stone-100 rounded-2xl py-3 pl-12 pr-4 text-stone-800 focus:outline-none focus:ring-2 focus:ring-temple-gold/10 focus:border-temple-gold transition-all",
            disabled && "opacity-50 cursor-not-allowed bg-stone-100"
          )}
        />
      </div>
    </div>
  );
}

// --- Relations View Component ---
function RelationsView({ umats, onShowCard }: { umats: Umat[], onShowCard: (u: Umat) => void }) {
  const [viewType, setViewType] = useState<'pengajak' | 'penanggung'>('pengajak');
  const [search, setSearch] = useState('');

  const groups = React.useMemo(() => {
    const map: Record<string, { pinyin?: string; kids: Umat[] }> = {};
    umats.forEach(u => {
      const name = viewType === 'pengajak' ? u.pengajak : u.penanggung;
      const pinyin = viewType === 'pengajak' ? u.pengajakPinyin : u.penanggungPinyin;
      
      const cleanName = name?.trim().toUpperCase();
      if (!cleanName) return;

      if (!map[cleanName]) {
        map[cleanName] = { pinyin, kids: [] };
      }
      map[cleanName].kids.push(u);
    });

    return Object.entries(map)
      .filter(([name]) => name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b[1].kids.length - a[1].kids.length);
  }, [umats, viewType, search]);

  const findUmatByName = (name: string) => {
    return umats.find(u => 
      u.nama.toUpperCase() === name.toUpperCase() || 
      u.namaIndonesia.toUpperCase() === name.toUpperCase() ||
      u.noId.toUpperCase() === name.toUpperCase()
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="font-serif text-4xl font-bold text-stone-800 tracking-tight">Relasi Pengurus</h2>
          <p className="text-stone-500 max-w-lg">
            Melihat keterhubungan antara {viewType === 'pengajak' ? 'Pengajak' : 'Penanggung'} dengan umat yang dibimbing.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewType('pengajak')}
            className={cn(
              "px-6 py-2 rounded-2xl text-xs font-bold transition-all border",
              viewType === 'pengajak'
                ? "bg-temple-gold border-temple-gold text-white shadow-lg shadow-temple-gold/20"
                : "bg-white border-stone-200 text-stone-500 hover:border-stone-400"
            )}
          >
            PENGAJAK
          </button>
          <button
            onClick={() => setViewType('penanggung')}
            className={cn(
              "px-6 py-2 rounded-2xl text-xs font-bold transition-all border",
              viewType === 'penanggung'
                ? "bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-600/20"
                : "bg-white border-stone-200 text-stone-500 hover:border-stone-400"
            )}
          >
            PENANGGUNG
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
        <input
          type="text"
          placeholder={`Cari nama ${viewType}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-6 py-4 bg-white border border-stone-100 rounded-[28px] text-sm focus:outline-none focus:ring-2 focus:ring-stone-100 transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map(([name, data]) => {
          const managerUmat = findUmatByName(name);
          return (
            <motion.div
              key={name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[32px] border border-stone-100 shadow-sm overflow-hidden flex flex-col"
            >
              <div 
                onClick={() => managerUmat && onShowCard(managerUmat)}
                className={cn(
                  "p-6 flex items-center justify-between transition-colors",
                  viewType === 'pengajak' ? "bg-temple-gold/5 hover:bg-temple-gold/10" : "bg-rose-50 hover:bg-rose-100",
                  managerUmat ? "cursor-pointer" : "cursor-default"
                )}
              >
                <div>
                  <h3 className="font-bold text-lg text-stone-800 uppercase leading-none flex items-center gap-2">
                    {name}
                    {managerUmat && <IdCardIcon size={14} className="text-stone-400" />}
                  </h3>
                  {data.pinyin && <p className="text-[10px] font-black text-stone-400 mt-1 tracking-widest">{data.pinyin}</p>}
                </div>
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black",
                  viewType === 'pengajak' ? "bg-temple-gold/20 text-temple-gold" : "bg-rose-100 text-rose-600"
                )}>
                  <span className="text-lg leading-none">{data.kids.length}</span>
                  <span className="text-[8px] uppercase tracking-tighter">Umat</span>
                </div>
              </div>
              
              <div className="p-4 flex-1 space-y-2">
                {data.kids.map((kid) => (
                  <div 
                    key={kid.id} 
                    onClick={() => onShowCard(kid)}
                    className="flex items-center justify-between p-3 rounded-2xl border border-stone-50 hover:bg-stone-50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-700 uppercase flex items-center gap-1.5">
                          {kid.nama}
                          <IdCardIcon size={10} className="text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </p>
                        <p className="text-[10px] text-stone-400 font-medium">#{kid.noId}</p>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[9px] font-bold text-stone-300 uppercase tracking-tighter">{kid.jabatanSuci}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}

        {groups.length === 0 && (
          <div className="md:col-span-2 py-20 text-center space-y-4 bg-white/50 rounded-[40px] border-2 border-dashed border-stone-100">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-50 rounded-full text-stone-300">
              <Users size={32} />
            </div>
            <p className="text-stone-400 font-medium font-serif italic text-lg">Tidak ada data relasi yang ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Master Data Manager ---
function MasterDataManager({ 
  viharas, setViharas, 
  panditas, setPanditas 
}: { 
  viharas: {name: string, pinyin: string}[], 
  setViharas: (v: {name: string, pinyin: string}[]) => void,
  panditas: {name: string, pinyin: string}[],
  setPanditas: (p: {name: string, pinyin: string}[]) => void
}) {
  const [vName, setVName] = useState('');
  const [vPinyin, setVPinyin] = useState('');
  const [pName, setPName] = useState('');
  const [pPinyin, setPPinyin] = useState('');

  const addVihara = () => {
    if (!vName) return;
    const cleaned = vName.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    setViharas([...viharas, { name: cleaned.toUpperCase(), pinyin: (vPinyin || '').toUpperCase() }]);
    setVName('');
    setVPinyin('');
  };

  const removeVihara = (index: number) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus Vihara ${viharas[index].name}?`)) {
      const newList = [...viharas];
      newList.splice(index, 1);
      setViharas(newList);
    }
  };

  const addPandita = () => {
    if (!pName) return;
    const cleaned = pName.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    const formatted = formatPanditaName(cleaned);
    setPanditas([...panditas, { name: formatted.toUpperCase(), pinyin: (pPinyin || '').toUpperCase() }]);
    setPName('');
    setPPinyin('');
  };

  const removePandita = (index: number) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus Pandita ${panditas[index].name}?`)) {
      const newList = [...panditas];
      newList.splice(index, 1);
      setPanditas(newList);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="space-y-2">
        <h2 className="font-serif text-4xl font-bold text-stone-800 tracking-tight">Master Data</h2>
        <p className="text-stone-500 max-w-lg">Kelola daftar Vihara dan Pandita yang akan muncul sebagai pilihan di formulir.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Vihara Management */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <MapPin className="text-temple-gold" size={20} />
            Daftar Vihara
          </h3>
          
          <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 space-y-4">
            <input 
              placeholder="Nama Vihara (Mandarin/Indo)" 
              value={vName} 
              onChange={e => setVName(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-temple-gold font-sans"
            />
            <input 
              placeholder="Pinyin Vihara" 
              value={vPinyin} 
              onChange={e => setVPinyin(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-temple-gold font-sans"
            />
            <button 
              onClick={addVihara}
              className="w-full bg-stone-800 text-white rounded-xl py-2 text-xs font-bold hover:bg-stone-700 transition-all shadow-md uppercase tracking-widest"
            >
              Tambah Vihara
            </button>
          </div>

          <div className="space-y-2">
            {viharas.map((v, i) => (
              <div key={i} className="bg-white border border-stone-100 px-4 py-3 rounded-2xl flex items-center justify-between group animate-in slide-in-from-left-2 duration-300">
                <div>
                  <p className="font-bold text-stone-800 text-sm">{v.name}</p>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{v.pinyin}</p>
                </div>
                <button onClick={() => removeVihara(i)} className="text-stone-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Pandita Management */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <Users className="text-temple-gold" size={20} />
            Daftar Pandita
          </h3>
          
          <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 space-y-4">
            <input 
              placeholder="Nama Pandita" 
              value={pName} 
              onChange={e => setPName(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-temple-gold font-sans"
            />
            <input 
              placeholder="Pinyin Pandita (Opsional)" 
              value={pPinyin} 
              onChange={e => setPPinyin(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-temple-gold font-sans"
            />
            <button 
              onClick={addPandita}
              className="w-full bg-stone-800 text-white rounded-xl py-2 text-xs font-bold hover:bg-stone-700 transition-all shadow-md uppercase tracking-widest"
            >
              Tambah Pandita
            </button>
          </div>

          <div className="space-y-2">
            {panditas.map((p, i) => (
              <div key={i} className="bg-white border border-stone-100 px-4 py-3 rounded-2xl flex items-center justify-between group animate-in slide-in-from-left-2 duration-300">
                <div>
                  <p className="font-bold text-stone-800 text-sm">{p.name}</p>
                  {p.pinyin && <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{p.pinyin}</p>}
                </div>
                <button onClick={() => removePandita(i)} className="text-stone-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
