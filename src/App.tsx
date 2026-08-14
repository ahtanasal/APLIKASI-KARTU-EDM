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
  Check,
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
  Edit,
  LogOut,
  Shield,
  UserCheck,
  UserPlus,
  LayoutGrid,
  List,
  Filter
} from 'lucide-react';

const TARGET_FIELDS = [
  { key: 'noId' as const, label: 'No. ID / Register', description: 'Nomor ID Anggota / Registrasi (道親編號)', required: true },
  { key: 'nama' as const, label: 'NAMA PEMOHON TAO', description: 'Nama huruf Mandarin / 姓名 / 求道人', required: true },
  { key: 'namaIndonesia' as const, label: 'Nama Indonesia', description: 'Nama Lengkap / Nama Indonesia' },
  { key: 'namaPinyin' as const, label: 'Nama Pinyin', description: 'Pinyin / Ejaan nama Mandarin' },
  { key: 'jabatanSuci' as const, label: 'Jabatan Suci', description: 'Jabatan suci / 天職 (Umat, Tan Cu, dll)' },
  { key: 'vihara' as const, label: 'Vihara', description: 'Nama Vihara / 求道地點 / 壇名' },
  { key: 'viharaPinyin' as const, label: 'Vihara Pinyin', description: 'Ejaan Pinyin Vihara' },
  { key: 'pandita' as const, label: 'Pandita', description: 'Nama Pandita / 傳道師 / 點傳師' },
  { key: 'panditaPinyin' as const, label: 'Pandita Pinyin', description: 'Pinyin Pandita' },
  { key: 'pengajak' as const, label: 'Pengajak', description: 'Nama Pengajak / 引師' },
  { key: 'pengajakPinyin' as const, label: 'Pengajak Pinyin', description: 'Pinyin Pengajak' },
  { key: 'penanggung' as const, label: 'Penanggung', description: 'Nama Penanggung / 保師' },
  { key: 'penanggungPinyin' as const, label: 'Penanggung Pinyin', description: 'Pinyin Penanggung' },
  { key: 'tanggalMasehi' as const, label: 'Tanggal Masehi', description: 'Tanggal mohon ketuhanan / 求道日期 (Masehi)' },
  { key: 'waktu' as const, label: 'Waktu Memohon TAO', description: 'Waktu / Jam / Shi Chen (求道時間/時辰)' },
  { key: 'tanggalLunar' as const, label: 'Tanggal Lunar', description: 'Tanggal Lunar / Imlek (Akan dikonversi otomatis jika kosong)' },
  { key: 'phone' as const, label: 'No. HP / WhatsApp', description: 'Contact Info / WhatsApp' },
];
import { format } from 'date-fns';
import { Solar } from 'lunar-javascript';
import { pinyin } from 'pinyin-pro';
import { cn } from './lib/utils';
import type { UmatInput, Umat, AppUser } from './types';
import { IdCard } from './components/IdCard';
import { DesignerPage } from './components/DesignerPage';
import { BatchEditor } from './components/BatchEditor';
import { LoginPage } from './components/LoginPage';
import { UserManagement } from './components/UserManagement';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc, 
  onSnapshot
} from 'firebase/firestore';

const SHI_CHEN = [
  { label: 'ZI (子時) (23:00-01:00)', value: 'ZI (子時) (23:00-01:00)' },
  { label: 'CHOU (丑時) (01:00-03:00)', value: 'CHOU (丑時) (01:00-03:00)' },
  { label: 'YIN (寅時) (03:00-05:00)', value: 'YIN (寅時) (03:00-05:00)' },
  { label: 'MAO (卯時) (05:00-07:00)', value: 'MAO (卯時) (05:00-07:00)' },
  { label: 'CHEN (辰時) (07:00-09:00)', value: 'CHEN (辰時) (07:00-09:00)' },
  { label: 'SI (巳時) (09:00-11:00)', value: 'SI (巳時) (09:00-11:00)' },
  { label: 'WU (午時) (11:00-13:00)', value: 'WU (午時) (11:00-13:00)' },
  { label: 'WEI (未時) (13:00-15:00)', value: 'WEI (未時) (13:00-15:00)' },
  { label: 'SHEN (申時) (15:00-17:00)', value: 'SHEN (申時) (15:00-17:00)' },
  { label: 'YOU (酉時) (17:00-19:00)', value: 'YOU (酉時) (17:00-19:00)' },
  { label: 'XU (戌時) (19:00-21:00)', value: 'XU (戌時) (19:00-21:00)' },
  { label: 'HAI (亥時) (21:00-23:00)', value: 'HAI (亥時) (21:00-23:00)' },
];
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

export const matchJabatanFilter = (jabatanSuci: string | undefined | null, filterValue: string): boolean => {
  if (filterValue === 'all') return true;
  if (!jabatanSuci) return false;

  const j = jabatanSuci.toLowerCase().trim();
  const f = filterValue.toLowerCase().trim();

  if (j === f) return true;

  // 1. Fu Than Cu (副壇主 / Fu Than Cu / Fu Tan Cu / Fu Thancu)
  if (f.includes('fu') || f.includes('副')) {
    const isFu = j.includes('fu') || j.includes('副');
    if (!isFu) return false;
    return j.includes('than') || j.includes('tan') || j.includes('cu') || j.includes('壇') || j.includes('主');
  }

  // 2. Than Cu (壇主 / Than Cu / Tan Cu) - MUST EXCLUDE Fu Than Cu!
  if (f.includes('than') || f.includes('tan') || f.includes('壇')) {
    // If it's a Fu Than Cu, explicitly reject for Than Cu filter
    if (j.includes('fu') || j.includes('副')) return false;
    return (j.includes('than') || j.includes('tan') || j.includes('壇')) && (j.includes('cu') || j.includes('主'));
  }

  // 3. Tien Chuan Se (點傳師)
  if (f.includes('tien') || f.includes('點傳師')) {
    return j.includes('tien') || j.includes('點傳師') || j.includes('chuan');
  }

  // 4. Ciang Se (講師)
  if (f.includes('ciang') || f.includes('jiang') || f.includes('講師')) {
    return j.includes('ciang') || j.includes('jiang') || j.includes('講師');
  }

  // 5. Umat (道親)
  if (f.includes('umat') || f.includes('道親')) {
    return j.includes('umat') || j.includes('道親');
  }

  return false;
};
import { toPng } from 'html-to-image';

// Safe Base64 encoding/decoding supporting UTF-8 (e.g. Chinese/Unicode characters)
export const safeBtoa = (str: string): string => {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  } catch (e) {
    console.error("safeBtoa error", e);
    return "";
  }
};

export const safeAtob = (str: string): string => {
  try {
    return decodeURIComponent(atob(str).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  } catch (e) {
    console.error("safeAtob error", e);
    return "";
  }
};

// Helper to format Pandita Name (Dian Chuan Shi) -> [Nama Mandarin] + 點傳師
const formatPanditaName = (name: string): string => {
  if (!name) return "";
  const cleanName = name.replace(/點傳師|点传师/g, "").replace(/\s+/g, " ").trim();
  if (!cleanName) return "";
  return cleanName + "點傳師";
};

// Helper to format Pandita Pinyin -> PANDITA + [Nama Pinyin]
const formatPanditaPinyin = (pinyin: string): string => {
  if (!pinyin) return "";
  const cleanPinyin = pinyin.replace(/\bPANDITA\b/gi, "").replace(/\s+/g, " ").trim();
  if (!cleanPinyin) return "";
  return `PANDITA ${cleanPinyin}`.toUpperCase();
};

export const calculateLunarDate = (masehi: string, waktu?: string) => {
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
    const numMonths: Record<number, string> = { 1:'一', 2:'二', 3:'三', 4:'四', 5:'五', 6:'六', 7:'七', 8:'八', 9:'九', 10:'十', 11:'十一', 12:'十二' };
    const rawM = Math.abs(lunar.getMonth());
    const mStr = `${lunar.getMonth() < 0 ? '閏' : ''}${numMonths[rawM] || lunar.getMonthInChinese()}月`;
    
    let res = `${lunar.getYearInGanZhi()}年${mStr}${lunar.getDayInChinese()}`;
    
    if (waktu) {
      // Extract Mandarin character from "ZI (子時) (23:00-01:00)"
      const match = waktu.match(/\((.*?)\)/);
      if (match && match[1]) {
        res += ` ${match[1]}`;
      }
    }
    
    return res.replace(/时/g, '時');
  } catch (e) {
    console.error("Lunar conversion error:", e);
    return "";
  }
};

// Fallback for crypto.randomUUID
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

// Default Admin Account
const DEFAULT_ADMIN: AppUser = {
  id: 'admin-default-wschfy',
  username: 'WSCHFY',
  password: 'Wschfy26',
  name: 'Admin Utama (WSCHFY)',
  level: 'admin',
  createdAt: new Date().toISOString()
};

export default function App() {
  useEffect(() => {
    document.title = "Kartu Umat EDM SMD";
  }, []);

  // Auth & Session States
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('edm_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [appUsers, setAppUsers] = useState<AppUser[]>([]);

  const [activeTab, setActiveTab] = useState<'landing' | 'list' | 'input' | 'master' | 'relations' | 'design' | 'edit-all' | 'users'>('landing');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [umats, setUmats] = useState<Umat[]>([]);
  const [selectedUmat, setSelectedUmat] = useState<Umat | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [printLayoutMode, setPrintLayoutMode] = useState<'all-fronts-first' | 'interleaved'>('all-fronts-first');
  const [printGap, setPrintGap] = useState<number>(2);
  const [printMargin, setPrintMargin] = useState<number>(5);
  const [printScale, setPrintScale] = useState<number>(100);
  const [printBackRotation, setPrintBackRotation] = useState<'-90' | '90'>('-90');
  const [printPaperSize, setPrintPaperSize] = useState<'a4' | '200x300'>('a4');
  const [editingUmat, setEditingUmat] = useState<Umat | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [jabatanFilter, setJabatanFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
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

  // Logout Feedback & Confirmation Modal states
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [logoutFeedback, setLogoutFeedback] = useState<string | null>(null);

  // User Level Access Guard
  useEffect(() => {
    if (currentUser) {
      if (currentUser.level === 'user') {
        // User level can access 'landing' (Beranda), 'input', and 'list'
        if (activeTab !== 'landing' && activeTab !== 'input' && activeTab !== 'list') {
          setActiveTab('landing');
        }
      }
    }
  }, [currentUser, activeTab]);

  // Real-time Firestore users listener
  useEffect(() => {
    try {
      const usersCol = collection(db, 'users');
      const unsub = onSnapshot(usersCol, (snapshot) => {
        const userList: AppUser[] = [];
        snapshot.forEach((docSnap) => {
          userList.push({ id: docSnap.id, ...docSnap.data() } as AppUser);
        });

        // Ensure default admin WSCHFY always exists
        const hasWschfy = userList.some(u => u.username.toUpperCase() === 'WSCHFY');
        if (!hasWschfy) {
          setDoc(doc(db, 'users', DEFAULT_ADMIN.id), DEFAULT_ADMIN).catch(console.error);
          userList.unshift(DEFAULT_ADMIN);
        }

        setAppUsers(userList);
        localStorage.setItem('edm_app_users', JSON.stringify(userList));
      }, (error) => {
        console.warn("Firestore users listener warning:", error);
        const localUsers = localStorage.getItem('edm_app_users');
        if (localUsers) {
          try {
            const parsed = JSON.parse(localUsers);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setAppUsers(parsed);
              return;
            }
          } catch (e) {}
        }
        setAppUsers([DEFAULT_ADMIN]);
      });

      return () => unsub();
    } catch (err) {
      console.error("Error setting up users listener:", err);
      setAppUsers([DEFAULT_ADMIN]);
    }
  }, []);

  // Auth & User Management Handlers
  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    localStorage.setItem('edm_auth_user', JSON.stringify(user));
    setLogoutFeedback(null);
    setActiveTab('landing'); // Always show Beranda page upon login
  };

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    setIsLogoutModalOpen(false);
    setCurrentUser(null);
    localStorage.removeItem('edm_auth_user');
    setLogoutFeedback('Anda telah berhasil keluar dari akun.');
  };

  const handleAddUser = async (newUserData: Omit<AppUser, 'id' | 'createdAt'>) => {
    const newId = generateId();
    const newUser: AppUser = {
      ...newUserData,
      id: newId,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', newId), newUser);
    } catch (e) {
      console.error("Firestore setDoc user error:", e);
    }

    const updated = [...appUsers, newUser];
    setAppUsers(updated);
    localStorage.setItem('edm_app_users', JSON.stringify(updated));
  };

  const handleUpdateUser = async (id: string, updatedData: Partial<AppUser>) => {
    try {
      await updateDoc(doc(db, 'users', id), updatedData);
    } catch (e) {
      console.error("Firestore updateDoc user error:", e);
    }

    const updated = appUsers.map(u => u.id === id ? { ...u, ...updatedData } : u);
    setAppUsers(updated);
    localStorage.setItem('edm_app_users', JSON.stringify(updated));

    if (currentUser && currentUser.id === id) {
      const newCurrent = { ...currentUser, ...updatedData };
      setCurrentUser(newCurrent);
      localStorage.setItem('edm_auth_user', JSON.stringify(newCurrent));
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (e) {
      console.error("Firestore deleteDoc user error:", e);
    }

    const updated = appUsers.filter(u => u.id !== id);
    setAppUsers(updated);
    localStorage.setItem('edm_app_users', JSON.stringify(updated));
  };

  // Clean real-time Firestore synchronization
  useEffect(() => {
    // Helper to load fallback local umats
    const loadLocalUmatsFallback = () => {
      const localSaved = localStorage.getItem('edm_umats');
      if (localSaved) {
        try {
          const parsed = JSON.parse(localSaved);
          if (Array.isArray(parsed)) {
            setUmats(parsed);
          }
        } catch (e) {}
      }
    };

    // Helper to load fallback local viharas
    const loadLocalViharasFallback = () => {
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
    };

    // Helper to load fallback local panditas
    const loadLocalPanditasFallback = () => {
      const localSaved = localStorage.getItem('edm_master_panditas');
      let initial = [
        { name: '林點傳師碧蓮', pinyin: 'Pandita LIN BI LIEN' },
        { name: '張點傳師珍球', pinyin: 'Pandita ZHANG ZHEN QIU' },
        { name: '許點傳師媽源', pinyin: 'Pandita XU MA YUAN' }
      ];
      if (localSaved) {
        try {
          const parsed = JSON.parse(localSaved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            initial = parsed.map((p: any) => ({
              ...p,
              pinyin: (p.pinyin || '')
                .replace(/lim\s*pi\s*lien/gi, 'LIN BI LIEN')
                .replace(/zhang\s*cen\s*chiu/gi, 'ZHANG ZHEN QIU')
                .replace(/xi\s*ma\s*yen/gi, 'XU MA YUAN')
            }));
          }
        } catch (e) {}
      }
      setMasterPanditas(initial);
    };

    // 1. Sync Umats from Firestore in real-time
    const unsubscribeUmats = onSnapshot(collection(db, 'umats'), (snapshot) => {
      const list: Umat[] = [];
      snapshot.forEach((doc) => {
        const item = doc.data() as Umat;
        if (item.panditaPinyin) {
          item.panditaPinyin = item.panditaPinyin
            .replace(/lim\s*pi\s*lien/gi, 'LIN BI LIEN')
            .replace(/zhang\s*cen\s*chiu/gi, 'ZHANG ZHEN QIU')
            .replace(/xi\s*ma\s*yen/gi, 'XU MA YUAN');
        }
        list.push(item);
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
                try {
                  await setDoc(doc(db, 'umats', u.id), u);
                } catch (err: any) {
                  if (err.code === 'permission-denied') {
                    handleFirestoreError(err, OperationType.CREATE, `umats/${u.id}`);
                  }
                }
              });
              return;
            }
          } catch (e) {
            console.error("Local migration parse failed:", e);
          }
        }
      }
      
      setUmats(list);
    }, (error: any) => {
      if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.LIST, 'umats');
      } else {
        console.warn("Firestore connection warning for 'umats':", error.message);
      }
      loadLocalUmatsFallback();
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
        try {
          setDoc(doc(db, 'metadata', 'viharas'), { list: initial });
        } catch (err: any) {
          if (err.code === 'permission-denied') {
            handleFirestoreError(err, OperationType.WRITE, 'metadata/viharas');
          }
        }
      }
    }, (error: any) => {
      if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.GET, 'metadata/viharas');
      } else {
        console.warn("Firestore connection warning for 'metadata/viharas':", error.message);
      }
      loadLocalViharasFallback();
    });

    // 3. Sync Master Panditas
    const unsubscribePanditas = onSnapshot(doc(db, 'metadata', 'panditas'), (snapshot) => {
      if (snapshot.exists()) {
        const rawList: { name: string, pinyin: string }[] = snapshot.data().list || [];
        let needsUpdate = false;
        const updatedList = rawList.map(p => {
          const formattedName = formatPanditaName(p.name);
          const formattedPinyin = formatPanditaPinyin(p.pinyin);
          if (formattedName !== p.name || formattedPinyin !== p.pinyin) {
            needsUpdate = true;
          }
          return { name: formattedName, pinyin: formattedPinyin };
        });

        setMasterPanditas(updatedList);
        if (needsUpdate) {
          try {
            setDoc(doc(db, 'metadata', 'panditas'), { list: updatedList });
          } catch (err: any) {}
        }
      } else {
        // Fallback to local storage or defaults, then seed
        const localSaved = localStorage.getItem('edm_master_panditas');
        let initial = [
          { name: '林碧蓮點傳師', pinyin: 'PANDITA LIN BI LIEN' },
          { name: '張珍球點傳師', pinyin: 'PANDITA ZHANG ZHEN QIU' },
          { name: '許媽源點傳師', pinyin: 'PANDITA XU MA YUAN' }
        ];
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              initial = parsed.map((p: any) => ({
                name: formatPanditaName(p.name),
                pinyin: formatPanditaPinyin(p.pinyin)
              }));
            }
          } catch (e) {}
        }
        setMasterPanditas(initial);
        try {
          setDoc(doc(db, 'metadata', 'panditas'), { list: initial });
        } catch (err: any) {
          if (err.code === 'permission-denied') {
            handleFirestoreError(err, OperationType.WRITE, 'metadata/panditas');
          }
        }
      }
    }, (error: any) => {
      if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.GET, 'metadata/panditas');
      } else {
        console.warn("Firestore connection warning for 'metadata/panditas':", error.message);
      }
      loadLocalPanditasFallback();
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
    // 1. Immediately update React state & localStorage so UI updates instantly and reliably
    setUmats(newUmats);
    try {
      localStorage.setItem('edm_umats', JSON.stringify(newUmats));
    } catch (e) {
      console.error("Failed to backup to localStorage:", e);
    }

    // 2. Identify deleted items and delete them in Firestore
    const currentIds = new Set<string>(umats.map(u => u.id || ''));
    const newIds = new Set<string>(newUmats.map(u => u.id || ''));
    const deletedIds = Array.from(currentIds).filter((id): id is string => id !== '' && !newIds.has(id));
    
    const deletePromises = deletedIds.map(async (id) => {
      try {
        await deleteDoc(doc(db, 'umats', id));
      } catch (err: any) {
        console.error("Failed to delete umat from Firestore:", err);
      }
    });

    // 3. Identify new or changed items and write them to Firestore in parallel!
    const changedOrNew = newUmats.filter(nu => {
      const existing = umats.find(u => u.id === nu.id);
      return !existing || JSON.stringify(existing) !== JSON.stringify(nu);
    });

    const writePromises = changedOrNew.map(async (u) => {
      if (!u.id) return;
      try {
        await setDoc(doc(db, 'umats', u.id), u);
      } catch (err: any) {
        console.error("Failed to save/update umat in Firestore:", err);
        if (err.code === 'permission-denied') {
          handleFirestoreError(err, OperationType.WRITE, `umats/${u.id}`);
        }
      }
    });

    await Promise.allSettled([...deletePromises, ...writePromises]);
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
    const encodedData = safeBtoa(JSON.stringify(umat));
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
      
      const pdfWidth = printPaperSize === '200x300' ? 200 : 210;
      const pdfHeight = printPaperSize === '200x300' ? 300 : 297;
      const pdf = new jsPDF('p', 'mm', printPaperSize === '200x300' ? [200, 300] : 'a4');
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

        const width = page.offsetWidth || Math.round(pdfWidth * 3.78);
        const height = page.offsetHeight || Math.round(pdfHeight * 3.78);

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
        
        if (i > 0) pdf.addPage(printPaperSize === '200x300' ? [200, 300] : 'a4');
        // Force image to fit page precisely without margins
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
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
        const decoded = JSON.parse(safeAtob(sharedData));
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
      'Waktu Mohon Tao': 'ZI (子時) (23:00-01:00)',
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
      'Waktu Mohon Tao': u.waktu || '',
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
          const rawVihara = String(item['Vihara'] || item['求道地點'] || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
          let rawViharaPinyin = String(item['Vihara Pinyin'] || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
          if (!rawViharaPinyin && rawVihara) {
            const matchedViharaPinyin = findPinyinMatch(rawVihara);
            if (matchedViharaPinyin) {
              rawViharaPinyin = matchedViharaPinyin;
            }
          }
          const rawPandita = String(item['Pandita'] || item['傳道師'] || item['點傳師'] || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
          const formattedPandita = formatPanditaName(rawPandita);
          
          let rawPanditaPinyin = String(item['Pandita Pinyin'] || '').trim();
          if (!rawPanditaPinyin && formattedPandita) {
            const matchedPinyin = findPinyinMatch(formattedPandita) || findPinyinMatch(rawPandita);
            if (matchedPinyin) {
              rawPanditaPinyin = matchedPinyin;
            }
          }

          let rawWaktu = String(item['Waktu Mohon Tao'] || item['Waktu Memohon TAO'] || item['Waktu'] || item['求道時間'] || item['時辰'] || '').trim();
          if (rawWaktu) {
            const matchedShiChen = SHI_CHEN.find(sc => 
              sc.value.toLowerCase() === rawWaktu.toLowerCase() || 
              sc.label.toLowerCase().includes(rawWaktu.toLowerCase()) ||
              sc.value.toLowerCase().includes(rawWaktu.toLowerCase()) ||
              (rawWaktu.length === 1 && sc.value.includes(rawWaktu))
            );
            if (matchedShiChen) {
              rawWaktu = matchedShiChen.value;
            }
          }

          const tglMasehi = String(item['Tanggal Masehi'] || item['求道日期'] || format(new Date(), 'dd-MM-yyyy'));
          let tglLunar = String(item['Tanggal Lunar'] || item['農曆'] || item['农历'] || '');
          if (!tglLunar && tglMasehi) {
            tglLunar = calculateLunarDate(tglMasehi, rawWaktu);
          }

          const rawNama = String(item['Nama'] || item['姓名'] || item['求道人'] || item['Nama Indonesia'] || '');
          const rawNamaIndo = String(item['Nama Indonesia'] || item['Nama'] || item['姓名'] || item['求道人'] || '');

          return {
            id: generateId(),
            noId: String(item['No ID'] || item['道親編號'] || ''),
            nama: rawNama,
            namaPinyin: String(item['Nama Pinyin'] || '').trim() || (rawNama ? (findPinyinMatch(rawNama.trim()) || '') : ''),
            namaIndonesia: rawNamaIndo,
            jabatanSuci: String(item['Jabatan'] || item['天職'] || '道親 - Umat'),
            vihara: rawVihara,
            viharaPinyin: rawViharaPinyin,
            pandita: formattedPandita,
            panditaPinyin: formatPanditaPinyin(rawPanditaPinyin),
            pengajak: String(item['Pengajak'] || item['引師'] || ''),
            pengajakPinyin: String(item['Pengajak Pinyin'] || '').trim() || (item['Pengajak'] || item['引師'] ? (findPinyinMatch(String(item['Pengajak'] || item['引師']).trim()) || '') : ''),
            penanggung: String(item['Penanggung'] || item['保師'] || ''),
            penanggungPinyin: String(item['Penanggung Pinyin'] || '').trim() || (item['Penanggung'] || item['保師'] ? (findPinyinMatch(String(item['Penanggung'] || item['保師']).trim()) || '') : ''),
            tanggalMasehi: tglMasehi,
            tanggalLunar: tglLunar,
            waktu: rawWaktu,
            phone: String(item['WhatsApp'] || item['No HP'] || item['電話'] || ''),
            createdAt: new Date().toISOString(),
          };
        }).filter(u => u.nama || u.namaIndonesia);

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
          noId: ['道親編號', 'no id', 'id', 'no. id', 'id umat', 'no_id', 'id_umat', 'id_tao', 'no urut', 'no.', 'no_urut', 'nomor', 'no_kartu', 'registrasi', '編號'],
          nama: ['姓名', 'nama pemohon', 'nama pemohon tao', 'pemohon tao', 'pemohon', 'nama', '求道人', 'name', 'nama mandarin', 'nama_mandarin', 'chinese name', 'hanzi'],
          namaIndonesia: ['nama indonesia', 'nama lengkap', 'nama indo', 'indonesia', 'nama_indonesia', 'nama_lengkap', 'full name', 'fullname'],
          namaPinyin: ['pinyin', 'nama pinyin', 'pinyin nama', 'nama_pinyin', 'pinyin_nama', 'ejaan', 'pinyin name'],
          pandita: ['傳道師', 'pandita', '點傳師', 'dian chuan shi', 'dianchuan', 'pdt', 'danchuanshi', 'dianchuanshi', '傳道'],
          panditaPinyin: ['pandita pinyin', 'pdt pinyin', 'pinyin pandita', 'panditapinyin'],
          pengajak: ['引師', 'pengajak', 'yin shi', 'yinshi', 'pengajak_nama'],
          pengajakPinyin: ['pengajak pinyin', 'pinyin pengajak', 'pengajakpinyin'],
          penanggung: ['保師', 'penanggung', 'bao shi', 'baoshi', 'penanggung_nama', 'penjamin'],
          penanggungPinyin: ['penanggung pinyin', 'pinyin penanggung', 'penanggungpinyin'],
          vihara: ['求道地點', 'vihara', '壇名', 'nama vihara', 'nama_vihara', 'vihara_nama', 'clique', 'temple', '求道地', '地點'],
          viharaPinyin: ['vihara pinyin', 'pinyin vihara', 'viharapinyin'],
          tanggalMasehi: ['求道日期', 'tanggal', 'tanggal masehi', 'tgl', 'date', 'masehi', 'tgl masehi', 'tanggal_masehi', 'tanggal_mohon', '日期'],
          waktu: ['求道時間', '求道時辰', '時辰', '時間', 'waktu', 'jam', 'waktu mohon tao', 'jam mohon tao', 'waktu_mohon_tao', 'waktu_mohon', 'jam_mohon', 'time', 'shi chen', 'shichen', 'waktu memohon tao'],
          tanggalLunar: ['lunar', 'imlek', '农历', '農曆', 'yinli', 'tanggal lunar', 'tgl imlek', 'tanggal_lunar', 'lunar_date'],
          phone: ['phone', 'whatsapp', 'wa', 'no hp', 'no. hp', 'hp', 'telp', 'telepon', 'mobile', '電話', '手機'],
          jabatanSuci: ['jabatan', 'jabatan suci', '天職', 'jabatan_suci', 'role', 'status']
        };

        const initialMapping: Record<string, string> = {};
        TARGET_FIELDS.forEach(field => {
          const kws = keywords[field.key] || [];
          // 1. Try exact match first
          let matchedHeader = headers.find(h => {
            const lowerHeader = String(h).trim().toLowerCase();
            return kws.some(kw => lowerHeader === kw);
          });
          // 2. Fallback to includes match if no exact match found
          if (!matchedHeader) {
            matchedHeader = headers.find(h => {
              const lowerHeader = String(h).trim().toLowerCase();
              return kws.some(kw => lowerHeader.includes(kw));
            });
          }
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

  const handleProcessTaoImport = async () => {
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
              if (parts.length === 3) {
                if (parts[0].length === 4) {
                  tanggalMasehi = `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
                } else if (parts[2].length === 4) {
                  tanggalMasehi = `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
                }
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

        let rawWaktu = getMappedValue('waktu').trim();
        if (rawWaktu) {
          const matchedShiChen = SHI_CHEN.find(sc => 
            sc.value.toLowerCase() === rawWaktu.toLowerCase() || 
            sc.label.toLowerCase().includes(rawWaktu.toLowerCase()) ||
            sc.value.toLowerCase().includes(rawWaktu.toLowerCase()) ||
            (rawWaktu.length === 1 && sc.value.includes(rawWaktu))
          );
          if (matchedShiChen) {
            rawWaktu = matchedShiChen.value;
          }
        }

        let tanggalLunar = getMappedValue('tanggalLunar');
        if (!tanggalLunar && tanggalMasehi) {
          tanggalLunar = calculateLunarDate(tanggalMasehi, rawWaktu);
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
          panditaPinyin: formatPanditaPinyin(rawPanditaPinyin),
          pengajak: getMappedValue('pengajak'),
          pengajakPinyin: getMappedValue('pengajakPinyin') || (getMappedValue('pengajak') ? (findPinyinMatch(getMappedValue('pengajak')) || '') : ''),
          penanggung: getMappedValue('penanggung'),
          penanggungPinyin: getMappedValue('penanggungPinyin') || (getMappedValue('penanggung') ? (findPinyinMatch(getMappedValue('penanggung')) || '') : ''),
          tanggalMasehi,
          tanggalLunar: tanggalLunar || '',
          waktu: rawWaktu,
          phone: getMappedValue('phone'),
          createdAt: new Date().toISOString(),
        };

        return umat;
      }).filter(u => u.nama || u.namaIndonesia);

      if (importedUmats.length === 0) {
        alert('Tidak ada data valid yang dapat di-import. Pastikan minimal kolom Nama atau Nama Pemohon terpetakan dengan benar.');
        return;
      }

      const combined = [...importedUmats, ...umats];
      setIsTaoModalOpen(false);
      await saveToLocal(combined);
      alert(`Berhasil mengimpor dan menyimpan ${importedUmats.length} data umat dari sistem TAO UK!`);
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
    
    const matchesJabatan = matchJabatanFilter(u.jabatanSuci, jabatanFilter);
    
    return matchesSearch && matchesJabatan;
  });

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} users={appUsers} logoutFeedback={logoutFeedback} />;
  }

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
            <LandingPage 
              onNavigate={(tab) => setActiveTab(tab as any)} 
              currentUser={currentUser}
              onLogout={handleLogoutClick}
            />
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
            "fixed inset-y-0 left-0 w-72 bg-white border-r border-stone-200 z-50 transform lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col justify-between",
            !isSidebarOpen && "-translate-x-full"
          )}
        >
          <div className="h-full flex flex-col justify-between">
            <div>
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

              <nav className="px-4 py-4 space-y-2 overflow-y-auto max-h-[calc(100vh-220px)] no-scrollbar">
                {currentUser.level === 'admin' ? (
                  <>
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
                    <NavItem 
                      icon={<UserPlus size={18} className="text-amber-600" />} 
                      label="Kelola User" 
                      active={activeTab === 'users'} 
                      onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }} 
                    />
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </nav>
            </div>

            <div className="p-4 border-t border-stone-100 flex flex-col gap-3 bg-stone-50/50">
              <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-stone-200/80 shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0",
                    currentUser.level === 'admin' ? "bg-amber-100 text-amber-900 border border-amber-200" : "bg-blue-100 text-blue-900 border border-blue-200"
                  )}>
                    {currentUser.level === 'admin' ? <Shield size={14} /> : <UserCheck size={14} />}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-stone-800 truncate">{currentUser.name || currentUser.username}</p>
                    <p className="text-[10px] text-stone-400 font-semibold capitalize">Level: {currentUser.level}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogoutClick}
                  className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shrink-0"
                  title="Keluar / Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
              <div className="flex items-center justify-between px-2">
                <p className="text-[10px] text-stone-400 font-medium">© 2026 EDM Samarinda</p>
                <p className="text-[8px] text-stone-300 italic">Database Ready</p>
              </div>
            </div>
          </div>
        </motion.aside>
      )}

      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300",
        activeTab !== 'landing' ? "lg:ml-72" : ""
      )}>
        {activeTab !== 'landing' && (
          <header className="h-16 flex items-center justify-between px-6 bg-white/50 backdrop-blur-md sticky top-0 z-30 lg:hidden border-b border-stone-200/60">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-stone-600">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <img src="/images/front_logo.png" alt="Logo" className="w-6 h-6 object-contain" />
              <span className="font-serif font-bold text-stone-800 text-sm">Eka Dharma Manggala</span>
            </div>
            <button 
              onClick={handleLogoutClick} 
              className="p-2 text-stone-500 hover:text-red-600 rounded-lg"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
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
                className="space-y-6"
              >
                {/* 1. Header Row */}
                <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 flex items-center justify-center font-bold">
                      <Users size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-serif text-2xl md:text-3xl font-bold text-stone-800">Data Umat</h2>
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-xs rounded-full border border-amber-200">
                          {filteredUmats.length} Umat
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">Kelola data pemohon Tao, ID Card, dan cetak kartu</p>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Input Data Button */}
                    <button
                      onClick={() => {
                        setEditingUmat(null);
                        setActiveTab('input');
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-2xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
                    >
                      <Plus size={16} />
                      <span>Input Umat Baru</span>
                    </button>

                    {/* Dropdown Import / Export */}
                    <div className="relative">
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
                        onClick={() => setIsImportExportOpen(!isImportExportOpen)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl text-xs font-bold transition-all border border-stone-200"
                      >
                        <FileSpreadsheet size={16} className="text-stone-600" />
                        <span>Import / Export</span>
                        <ChevronDown size={14} className={cn("transition-transform", isImportExportOpen && "rotate-180")} />
                      </button>

                      {isImportExportOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsImportExportOpen(false)} 
                          />
                          <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                            <button
                              onClick={() => {
                                handleDownloadTemplate();
                                setIsImportExportOpen(false);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-xl transition-colors text-left"
                            >
                              <FileDown size={14} className="text-amber-600" />
                              <span>Download Template Excel</span>
                            </button>
                            <button
                              onClick={() => {
                                fileInputRef.current?.click();
                                setIsImportExportOpen(false);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-xl transition-colors text-left"
                            >
                              <FileUp size={14} className="text-blue-600" />
                              <span>Import Excel Standard</span>
                            </button>
                            <button
                              onClick={() => {
                                taoFileInputRef.current?.click();
                                setIsImportExportOpen(false);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-amber-50 hover:text-amber-900 rounded-xl transition-colors text-left"
                            >
                              <FileSpreadsheet size={14} className="text-amber-600" />
                              <span>Import Form TAO UK</span>
                            </button>
                            <div className="border-t border-stone-100 my-1" />
                            <button
                              onClick={() => {
                                handleExportExcel();
                                setIsImportExportOpen(false);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl transition-colors text-left"
                            >
                              <Download size={14} className="text-emerald-600" />
                              <span>Export Ke Excel</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Search & Controls Bar */}
                <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-sm space-y-3">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    {/* Search Field */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Cari berdasarkan nama, Pinyin, nama Indonesia, No. ID, Vihara, Pandita..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Select All Toggle Button */}
                      <button 
                        onClick={() => {
                          if (selectedIds.size === filteredUmats.length && filteredUmats.length > 0) {
                            setSelectedIds(new Set());
                          } else {
                            setSelectedIds(new Set(filteredUmats.map(u => u.id)));
                          }
                        }}
                        className={cn(
                          "flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all border",
                          selectedIds.size === filteredUmats.length && filteredUmats.length > 0
                            ? "bg-amber-500 border-amber-500 text-stone-950 shadow-sm"
                            : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                        )}
                      >
                        <CheckCircle2 size={15} />
                        <span>{selectedIds.size === filteredUmats.length && filteredUmats.length > 0 ? 'Batal Pilih Semua' : 'Pilih Semua'}</span>
                      </button>

                      {/* View Mode Toggle */}
                      <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200">
                        <button
                          onClick={() => setViewMode('cards')}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                            viewMode === 'cards' ? "bg-white text-stone-900 shadow-xs font-bold" : "text-stone-500 hover:text-stone-800"
                          )}
                          title="Tampilan Kartu"
                        >
                          <LayoutGrid size={15} />
                          <span className="hidden sm:inline">Kartu</span>
                        </button>
                        <button
                          onClick={() => setViewMode('table')}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                            viewMode === 'table' ? "bg-white text-stone-900 shadow-xs font-bold" : "text-stone-500 hover:text-stone-800"
                          )}
                          title="Tampilan Tabel"
                        >
                          <List size={15} />
                          <span className="hidden sm:inline">Tabel</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Jabatan Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-stone-100 no-scrollbar">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
                      <Filter size={12} />
                      Jabatan:
                    </span>
                    {[
                      { label: 'Semua', value: 'all' },
                      { label: 'Tien Chuan Se', value: '點傳師 - Tien Chuan Se' },
                      { label: 'Ciang Se', value: '講師 - Ciang Se' },
                      { label: 'Than Cu', value: '壇主 - Than Cu' },
                      { label: 'Fu Than Cu', value: '副壇主 - Fu Than Cu' },
                      { label: 'Umat', value: '道親 - Umat' },
                    ].map((opt) => {
                      const count = opt.value === 'all' 
                        ? umats.length 
                        : umats.filter(u => matchJabatanFilter(u.jabatanSuci, opt.value)).length;

                      const isActive = jabatanFilter === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setJabatanFilter(opt.value)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                            isActive
                              ? "bg-stone-900 border-stone-900 text-amber-400 shadow-sm"
                              : "bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-100"
                          )}
                        >
                          <span>{opt.label}</span>
                          <span className={cn(
                            "px-1.5 py-0.2 rounded-md text-[10px] font-extrabold",
                            isActive ? "bg-amber-400/20 text-amber-300" : "bg-stone-200 text-stone-600"
                          )}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Floating Batch Selection Bar */}
                {selectedIds.size > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="sticky bottom-6 z-40 bg-stone-900 border border-stone-800 text-white p-3.5 px-6 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                        {selectedIds.size}
                      </div>
                      <span className="text-sm font-bold text-stone-100">
                        {selectedIds.size} Umat Dipilih
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button 
                        onClick={handlePrintSelected}
                        className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
                      >
                        <Printer size={15} />
                        <span>Cetak {selectedIds.size} Kartu</span>
                      </button>
                      <button 
                        onClick={handleDeleteSelected}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600/90 hover:bg-red-600 text-white rounded-2xl text-xs font-bold transition-all"
                      >
                        <Trash2 size={15} />
                        <span>Hapus</span>
                      </button>
                      <button 
                        onClick={() => setSelectedIds(new Set())}
                        className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors"
                        title="Batal Pilih"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 3. Main Data View (Cards or Table) */}
                {filteredUmats.length > 0 ? (
                  viewMode === 'cards' ? (
                    /* CARDS GRID VIEW */
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {filteredUmats.map((u) => {
                        const isSelected = selectedIds.has(u.id);
                        return (
                          <motion.div 
                            key={u.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={cn(
                              "bg-white rounded-3xl border p-5 transition-all relative flex flex-col justify-between gap-4 shadow-sm hover:shadow-md",
                              isSelected 
                                ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5" 
                                : "border-stone-200/80 hover:border-amber-300"
                            )}
                          >
                            <div className="space-y-3">
                              {/* Card Header: Selection & Names */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3.5 min-w-0">
                                  <button
                                    onClick={() => toggleSelectUmat(u.id)}
                                    className={cn(
                                      "mt-0.5 w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all shrink-0",
                                      isSelected 
                                        ? "bg-amber-500 border-amber-500 text-stone-950" 
                                        : "border-stone-300 text-transparent hover:border-amber-400"
                                    )}
                                  >
                                    <CheckCircle2 size={14} />
                                  </button>

                                  <div className="min-w-0">
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                      <h4 className="text-xl font-bold font-serif text-stone-900 tracking-wide">
                                        {u.nama}
                                      </h4>
                                      {u.namaPinyin && (
                                        <span className="text-xs font-bold text-amber-800/80 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                                          {u.namaPinyin}
                                        </span>
                                      )}
                                    </div>

                                    {u.namaIndonesia && (
                                      <p className="text-xs font-bold text-stone-600 uppercase mt-0.5">
                                        {u.namaIndonesia}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Status Print Badge */}
                                {u.lastPrintedAt && (
                                  <span className="shrink-0 px-2.5 py-1 bg-stone-100 border border-stone-200 text-[10px] font-bold text-stone-600 rounded-xl flex items-center gap-1">
                                    <Printer size={11} className="text-stone-500" />
                                    <span>Tercetak: {format(new Date(u.lastPrintedAt), 'dd/MM/yy')}</span>
                                  </span>
                                )}
                              </div>

                              {/* Badges Row */}
                              <div className="flex items-center gap-2 flex-wrap pt-1">
                                <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-extrabold rounded-xl border border-amber-200">
                                  {u.jabatanSuci || 'Umat'}
                                </span>
                                {u.vihara && (
                                  <span className="px-2.5 py-1 bg-stone-100 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200 flex items-center gap-1">
                                    <MapPin size={12} className="text-stone-400" />
                                    <span>{u.vihara}</span>
                                  </span>
                                )}
                                <span className="px-2.5 py-1 bg-stone-100 text-stone-600 text-xs font-mono font-bold rounded-xl border border-stone-200">
                                  ID: {u.noId}
                                </span>
                              </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="flex items-center justify-between border-t border-stone-100 pt-3 mt-1">
                              <span className="text-[10px] text-stone-400 font-medium">EDM Samarinda</span>

                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => setSelectedUmat(u)}
                                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-bold transition-all shadow-sm"
                                >
                                  <IdCardIcon size={14} />
                                  <span>ID Card</span>
                                </button>
                                <button 
                                  onClick={() => {
                                    setEditingUmat(u);
                                    setActiveTab('input');
                                  }}
                                  className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors border border-stone-200"
                                  title="Edit Data Umat"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteUmat(u.id)}
                                  className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-stone-200"
                                  title="Hapus Data"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    /* TABLE VIEW */
                    <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-stone-100/80 text-stone-600 border-b border-stone-200 font-bold uppercase tracking-wider text-[10px]">
                              <th className="p-3.5 pl-4 w-10">#</th>
                              <th className="p-3.5">Nama Umat</th>
                              <th className="p-3.5">No. ID</th>
                              <th className="p-3.5">Jabatan</th>
                              <th className="p-3.5">Vihara</th>
                              <th className="p-3.5 text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                            {filteredUmats.map((u) => {
                              const isSelected = selectedIds.has(u.id);
                              return (
                                <tr 
                                  key={u.id}
                                  className={cn(
                                    "hover:bg-amber-50/50 transition-colors",
                                    isSelected && "bg-amber-50"
                                  )}
                                >
                                  <td className="p-3.5 pl-4">
                                    <button
                                      onClick={() => toggleSelectUmat(u.id)}
                                      className={cn(
                                        "w-5 h-5 rounded-lg border flex items-center justify-center transition-all",
                                        isSelected 
                                          ? "bg-amber-500 border-amber-500 text-stone-950" 
                                          : "border-stone-300 text-transparent hover:border-amber-400"
                                      )}
                                    >
                                      <CheckCircle2 size={12} />
                                    </button>
                                  </td>
                                  <td className="p-3.5">
                                    <div className="font-serif font-bold text-sm text-stone-900">{u.nama}</div>
                                    {u.namaPinyin && <div className="text-[10px] font-bold text-stone-400 uppercase">{u.namaPinyin}</div>}
                                    {u.namaIndonesia && <div className="text-[11px] font-semibold text-rose-600/80 uppercase">{u.namaIndonesia}</div>}
                                  </td>
                                  <td className="p-3.5 font-mono font-bold text-stone-600">{u.noId}</td>
                                  <td className="p-3.5">
                                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[11px] font-bold rounded-lg border border-amber-200">
                                      {u.jabatanSuci || 'Umat'}
                                    </span>
                                  </td>
                                  <td className="p-3.5 font-medium text-stone-700">{u.vihara || '-'}</td>
                                  <td className="p-3.5">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => setSelectedUmat(u)}
                                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-xs"
                                        title="Cetak ID Card"
                                      >
                                        <IdCardIcon size={12} />
                                        <span>Card</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingUmat(u);
                                          setActiveTab('input');
                                        }}
                                        className="p-1.5 text-stone-600 hover:bg-stone-200 rounded-lg transition-colors"
                                        title="Edit"
                                      >
                                        <Pencil size={14} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteUmat(u.id)}
                                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Hapus"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="bg-white rounded-3xl border border-stone-200 border-dashed py-16 px-8 text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-50 rounded-full text-stone-300">
                      <Users size={32} />
                    </div>
                    <div className="space-y-1">
                      <p className="font-serif text-lg font-bold text-stone-700">Tidak ada data umat ditemukan</p>
                      <p className="text-xs text-stone-400">Silakan ubah kata kunci pencarian atau tambah data umat baru.</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingUmat(null);
                        setActiveTab('input');
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      <Plus size={14} />
                      <span>Input Umat Baru</span>
                    </button>
                  </div>
                )}
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
            ) : activeTab === 'master' ? (
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
            ) : (
              <motion.div
                key="users-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <UserManagement 
                  users={appUsers}
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                  currentUser={currentUser}
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
                    disabled={!(taoMapping.nama || taoMapping.namaIndonesia)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all",
                      (taoMapping.nama || taoMapping.namaIndonesia)
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
                    Jumlah: <span className="font-bold text-amber-400">{selectedIds.size}</span> Kartu | Estimasi: <span className="font-bold text-amber-400">{Math.ceil(selectedIds.size / 10)}</span> Lembar {printPaperSize === '200x300' ? '200x300mm' : 'A4'} (Bolak-Balik)
                  </p>
                </div>
              </div>

              {/* Layout & Spacing Selectors wrapper */}
              <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center">
                {/* Paper Size Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold shrink-0">Ukuran Kertas:</span>
                  <div className="flex flex-wrap gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
                    <button
                      onClick={() => setPrintPaperSize('a4')}
                      title="Ukuran kertas standar A4 (210 x 297 mm)"
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                        printPaperSize === 'a4'
                          ? "bg-amber-500 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      )}
                    >
                      A4 (210 x 297 mm)
                    </button>
                    <button
                      onClick={() => setPrintPaperSize('200x300')}
                      title="Ukuran kertas khusus 200 x 300 mm"
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                        printPaperSize === '200x300'
                          ? "bg-amber-500 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      )}
                    >
                      200 x 300 mm
                    </button>
                  </div>
                </div>

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

                {/* Print Scale Selector (Anti-Cutoff / Exact Size) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold shrink-0 flex items-center gap-1">
                    Skala Ukuran Kartu:
                  </span>
                  <div className="flex flex-wrap gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
                    <button
                      onClick={() => setPrintScale(100)}
                      title="Skala 100% Presisi Ukuran Standar CR80 (85.6 mm x 54 mm)"
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                        printScale === 100
                          ? "bg-amber-500 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      )}
                    >
                      100% (Presisi 85.6 x 54 mm)
                    </button>
                    <button
                      onClick={() => setPrintScale(98)}
                      title="Skala 98% memberikan marjin aman jika printer memotong tepi kertas"
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                        printScale === 98
                          ? "bg-amber-500 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      )}
                    >
                      98% (SaranPrinterTepi)
                    </button>
                    <button
                      onClick={() => setPrintScale(95)}
                      title="Skala 95% memberikan marjin ekstra lebar"
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                        printScale === 95
                          ? "bg-amber-500 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      )}
                    >
                      95% (Marjin Lebar)
                    </button>
                  </div>
                </div>

                {/* Page Margin Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold shrink-0">Marjin Halaman:</span>
                  <div className="flex flex-wrap gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
                    <button
                      onClick={() => setPrintMargin(5)}
                      title="Marjin 5mm atas/bawah paling cocok untuk printer inkjet (Epson/Canon/HP)"
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                        printMargin === 5
                          ? "bg-amber-500 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      )}
                    >
                      5mm (Aman)
                    </button>
                    <button
                      onClick={() => setPrintMargin(7)}
                      title="Marjin 7mm ekstra lebar untuk printer dengan batas cetak besar"
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                        printMargin === 7
                          ? "bg-amber-500 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      )}
                    >
                      7mm (Ekstra Aman)
                    </button>
                    <button
                      onClick={() => setPrintMargin(3)}
                      title="Marjin 3mm minimal"
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                        printMargin === 3
                          ? "bg-amber-500 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      )}
                    >
                      3mm (Minimal)
                    </button>
                    <button
                      onClick={() => setPrintMargin(0)}
                      title="Tanpa marjin halaman"
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                        printMargin === 0
                          ? "bg-amber-500 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      )}
                    >
                      0mm
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
                      0mm (Rapat)
                    </button>
                    <button
                      onClick={() => setPrintGap(1)}
                      title="Jarak tipis 1mm"
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                        printGap === 1
                          ? "bg-amber-500 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      )}
                    >
                      1mm
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
                      onClick={() => setPrintGap(3)}
                      title="Jarak 3mm"
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                        printGap === 3
                          ? "bg-amber-500 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      )}
                    >
                      3mm
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
                  </div>
                </div>

                {/* Back Side Rotation Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold shrink-0">Rotasi Belakang:</span>
                  <div className="flex flex-wrap gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
                    <button
                      onClick={() => setPrintBackRotation('-90')}
                      title="Sisi belakang diputar -90 derajat (Saran untuk cetak duplex bolak-balik standard)"
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1",
                        printBackRotation === '-90'
                          ? "bg-amber-500 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      )}
                    >
                      -90° (Standard)
                    </button>
                    <button
                      onClick={() => setPrintBackRotation('90')}
                      title="Sisi belakang diputar +90 derajat (Jika hasil cetak terbalik)"
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1",
                        printBackRotation === '90'
                          ? "bg-amber-500 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      )}
                    >
                      90° (Terbalik)
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
                  <strong>Tips Cetak Presisi 85.6 mm x 54 mm (Standard CR80):</strong> Pilihan Skala telah diset ke <strong>100% (Presisi)</strong>. Pada dialog cetak browser (Ctrl+P / Cmd+P), pastikan atur <strong>Margin: "None" (Tanpa Margin)</strong> dan <strong>Scale: 100% / Default (Tanpa Fit to Printable Area / Sesuaikan Halaman)</strong> agar fisik kartu tercetak tepat 85.6 mm x 54 mm.
                </span>
              </div>
              <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded whitespace-nowrap shrink-0">Mirroring Baris Diaktifkan</span>
            </div>

            {/* Print Document Container */}
            <div ref={printContainerRef} className="py-8 print:py-0 w-full flex justify-center">
              <PrintingView umats={umats.filter(u => selectedIds.has(u.id))} layoutMode={printLayoutMode} gap={printGap} backRotation={printBackRotation} pageMargin={printMargin} printScale={printScale} paperSize={printPaperSize} />
            </div>
          </div>
        )}
      </main>

      {/* Modal Konfirmasi Logout */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsLogoutModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-stone-200 text-center space-y-5 relative overflow-hidden"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl mx-auto flex items-center justify-center border border-red-100 shadow-sm">
                <LogOut size={30} />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-serif font-bold text-stone-900">Konfirmasi Keluar</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Apakah Anda yakin ingin keluar dari sistem Eka Dharma Manggala?
                </p>
              </div>

              {currentUser && (
                <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 flex items-center justify-between text-left">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-stone-800 truncate">{currentUser.name || currentUser.username}</p>
                    <p className="text-[10px] text-stone-400 font-medium">Username: @{currentUser.username}</p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0",
                    currentUser.level === 'admin' ? "bg-amber-100 text-amber-900 border border-amber-200" : "bg-blue-100 text-blue-900 border border-blue-200"
                  )}>
                    {currentUser.level}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-2xl text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmLogout}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-xs shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <LogOut size={14} />
                  Ya, Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Printing View Component ---
function PrintingView({ 
  umats, 
  layoutMode = 'all-fronts-first', 
  gap = 2, 
  backRotation = '-90',
  pageMargin = 5,
  printScale = 100,
  paperSize = 'a4'
}: { 
  umats: Umat[], 
  layoutMode?: 'all-fronts-first' | 'interleaved', 
  gap?: number, 
  backRotation?: '-90' | '90',
  pageMargin?: number,
  printScale?: number,
  paperSize?: 'a4' | '200x300'
}) {
  // Page dimensions (A4: 210x297mm vs 200x300mm)
  const pWidth = paperSize === '200x300' ? 200 : 210;
  const pHeight = paperSize === '200x300' ? 300 : 297;
  const halfWidth = pWidth / 2;

  // Items per page (e.g., 2 columns x 5 rows = 10 ID cards)
  const batchSize = 10;
  const batches: Umat[][] = [];
  for (let i = 0; i < umats.length; i += batchSize) {
    batches.push(umats.slice(i, i + batchSize));
  }

  // Helper to pad any batch to exactly 10 items
  const getPaddedBatch = (batch: Umat[]) => {
    const padded = [...batch];
    while (padded.length < 10) {
      padded.push(null as any);
    }
    return padded;
  };

  // Helper to mirror back grid items horizontally so that they align exactly when printed double-sided in a 2x5 grid
  const getMirroredBackBatch = (paddedBatch: (Umat | null)[]) => {
    return [
      paddedBatch[1], paddedBatch[0], // Row 1 horizontally mirrored
      paddedBatch[3], paddedBatch[2], // Row 2 horizontally mirrored
      paddedBatch[5], paddedBatch[4], // Row 3 horizontally mirrored
      paddedBatch[7], paddedBatch[6], // Row 4 horizontally mirrored
      paddedBatch[9], paddedBatch[8]  // Row 5 horizontally mirrored
    ];
  };

  // Safe vertical gap math ensuring top/bottom pageMargin are strictly respected
  // Total page height = pHeight mm. Card grid height = 270mm (5 * 54mm).
  const maxGap = Math.max(0, (pHeight - 270 - (2 * pageMargin)) / 4);
  const safeGap = Math.min(gap, maxGap);

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

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: ${pWidth}mm !important;
            height: ${pHeight}mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
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
          @page { size: ${paperSize === '200x300' ? '200mm 300mm' : 'A4 portrait'}; margin: 0; }
        }
        
        .a4-page {
          width: ${pWidth}mm;
          height: ${pHeight}mm;
          margin: 0 auto 20mm;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          page-break-after: always;
          break-after: page;
          page-break-inside: avoid;
          break-inside: avoid;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-sizing: border-box;
          position: relative;
        }

        .a4-grid {
          display: grid;
          width: ${pWidth}mm;
          grid-template-columns: ${halfWidth}mm ${halfWidth}mm;
          grid-template-rows: repeat(5, 54mm);
          row-gap: ${safeGap}mm;
          column-gap: 0mm;
          justify-items: center;
          align-content: center;
          transform: scale(${printScale / 100});
          transform-origin: center center;
          box-sizing: border-box;
          position: relative;
        }

        .a4-grid::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: ${halfWidth}mm;
          width: 0;
          border-left: 1px dashed rgba(0, 0, 0, 0.15);
          pointer-events: none;
        }

        @media print {
          .a4-page { 
            margin: 0 !important; 
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important; 
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            width: ${pWidth}mm !important;
            height: ${pHeight}mm !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-sizing: border-box !important;
          }

          .a4-grid {
            width: ${pWidth}mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      {layoutMode === 'all-fronts-first' ? (
        <>
          {/* Bagian Pertama: Semua Sisi Depan Terlebih Dahulu */}
          {batches.map((batch, bIndex) => (
            <div key={`front-page-${bIndex}`} className="a4-page">
              <div className="a4-grid">
                {getPaddedBatch(batch).map((u, idx) => {
                  if (!u) {
                    return <div key={`empty-front-${idx}`} className="w-[85.6mm] h-[54mm] opacity-0" />;
                  }
                  return (
                    <div key={`front-${u.id}`} className="flex items-center justify-center relative w-[85.6mm] h-[54mm] overflow-hidden">
                      <div 
                        className="absolute"
                        style={{
                          width: '54mm',
                          height: '85.6mm',
                          left: '15.8mm',
                          top: '-15.8mm',
                          transform: 'rotate(90deg)',
                          transformOrigin: 'center center'
                        }}
                      >
                        <IdCard data={u} isFrontOnly forceSmall />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Bagian Kedua: Semua Sisi Belakang Sesuai Urutan (Mirrored Horizontally) */}
          {batches.map((batch, bIndex) => (
            <div key={`back-page-${bIndex}`} className="a4-page">
              <div className="a4-grid">
                {getMirroredBackBatch(getPaddedBatch(batch)).map((u, idx) => {
                  if (!u) {
                    return <div key={`empty-back-${idx}`} className="w-[85.6mm] h-[54mm] opacity-0" />;
                  }
                  return (
                    <div key={`back-${u.id}`} className="flex items-center justify-center relative w-[85.6mm] h-[54mm] overflow-hidden">
                      <div 
                        className="absolute"
                        style={{
                          width: '54mm',
                          height: '85.6mm',
                          left: '15.8mm',
                          top: '-15.8mm',
                          transform: `rotate(${backRotation === '90' ? '90' : '-90'}deg)`,
                          transformOrigin: 'center center'
                        }}
                      >
                        <IdCard data={u} isBackOnly forceSmall />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      ) : (
        /* Sisi Depan & Belakang Bergantian per Lembar (Mirrored Horizontally on Back Side) */
        batches.map((batch, bIndex) => (
          <React.Fragment key={bIndex}>
            {/* Halaman Depan Batch Ini */}
            <div className="a4-page">
              <div className="a4-grid">
                {getPaddedBatch(batch).map((u, idx) => {
                  if (!u) {
                    return <div key={`empty-front-${idx}`} className="w-[85.6mm] h-[54mm] opacity-0" />;
                  }
                  return (
                    <div key={`front-${u.id}`} className="flex items-center justify-center relative w-[85.6mm] h-[54mm] overflow-hidden">
                      <div 
                        className="absolute"
                        style={{
                          width: '54mm',
                          height: '85.6mm',
                          left: '15.8mm',
                          top: '-15.8mm',
                          transform: 'rotate(90deg)',
                          transformOrigin: 'center center'
                        }}
                      >
                        <IdCard data={u} isFrontOnly forceSmall />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Halaman Belakang Batch Ini */}
            <div className="a4-page">
              <div className="a4-grid">
                {getMirroredBackBatch(getPaddedBatch(batch)).map((u, idx) => {
                  if (!u) {
                    return <div key={`empty-back-${idx}`} className="w-[85.6mm] h-[54mm] opacity-0" />;
                  }
                  return (
                    <div key={`back-${u.id}`} className="flex items-center justify-center relative w-[85.6mm] h-[54mm] overflow-hidden">
                      <div 
                        className="absolute"
                        style={{
                          width: '54mm',
                          height: '85.6mm',
                          left: '15.8mm',
                          top: '-15.8mm',
                          transform: `rotate(${backRotation === '90' ? '90' : '-90'}deg)`,
                          transformOrigin: 'center center'
                        }}
                      >
                        <IdCard data={u} isBackOnly forceSmall />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </React.Fragment>
        ))
      )}
    </div>
  );
}

// --- Landing Page Component ---
function LandingPage({ 
  onNavigate, 
  currentUser, 
  onLogout 
}: { 
  onNavigate: (tab: 'list' | 'input' | 'design' | 'master' | 'relations' | 'users' | 'edit-all') => void;
  currentUser?: AppUser | null;
  onLogout?: () => void;
}) {
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

      {/* Top Header Bar */}
      <div className="absolute top-0 inset-x-0 z-20 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-stone-200/80 shadow-sm">
          <img src="/images/front_logo.png" alt="Logo" className="w-6 h-6 object-contain" />
          <span className="font-serif font-bold text-stone-800 text-xs sm:text-sm">Eka Dharma Manggala</span>
        </div>

        {currentUser && (
          <div className="flex items-center gap-2">
            <div className="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-stone-200/80 shadow-sm flex items-center gap-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px]",
                currentUser.level === 'admin' ? "bg-amber-100 text-amber-900 border border-amber-200" : "bg-blue-100 text-blue-900 border border-blue-200"
              )}>
                {currentUser.level === 'admin' ? <Shield size={12} /> : <UserCheck size={12} />}
              </div>
              <span className="text-xs font-bold text-stone-800 hidden sm:inline">{currentUser.name || currentUser.username}</span>
              <span className="text-[10px] bg-stone-100 text-stone-500 font-semibold px-2 py-0.5 rounded-full capitalize">{currentUser.level}</span>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2.5 bg-white/90 hover:bg-red-50 text-stone-500 hover:text-red-600 rounded-full border border-stone-200/80 shadow-sm transition-all flex items-center justify-center shrink-0"
                title="Keluar / Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        )}
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
            className={cn(
              "grid gap-6 mt-16 max-w-6xl mx-auto w-full",
              currentUser?.level === 'admin' ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2 max-w-2xl"
            )}
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

            {currentUser?.level === 'admin' && (
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
            )}
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
          acc[key as keyof UmatInput] = formatPanditaName(cleaned);
        } else if (key === 'panditaPinyin') {
          const cleaned = trimmed.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
          acc[key as keyof UmatInput] = formatPanditaPinyin(cleaned);
        } else {
          acc[key as keyof UmatInput] = trimmed.toUpperCase();
        }
      } else {
        acc[key as keyof UmatInput] = val;
      }
      return acc;
    }, {} as UmatInput);

    // Autofill / format Pandita Pinyin if found in the system
    if (capitalizedData.pandita) {
      const p = capitalizedData.panditaPinyin || findPinyinMatch(capitalizedData.pandita);
      capitalizedData.panditaPinyin = formatPanditaPinyin(p);
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
            <label className="text-xs font-medium text-stone-500 uppercase tracking-wider pl-1 font-sans">
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
            <label className="text-xs font-medium text-stone-500 uppercase tracking-wider pl-1 font-sans">
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
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wider pl-1 font-sans">
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
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wider pl-1 font-sans">
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
      <label htmlFor={id} className="text-xs font-medium text-stone-500 uppercase tracking-wider pl-1 font-sans flex items-center gap-1">
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

  // Edit states for Vihara
  const [editingVIndex, setEditingVIndex] = useState<number | null>(null);
  const [editVName, setEditVName] = useState('');
  const [editVPinyin, setEditVPinyin] = useState('');

  // Edit states for Pandita
  const [editingPIndex, setEditingPIndex] = useState<number | null>(null);
  const [editPName, setEditPName] = useState('');
  const [editPPinyin, setEditPPinyin] = useState('');

  const addVihara = () => {
    if (!vName) return;
    const cleaned = vName.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    setViharas([...viharas, { name: cleaned.toUpperCase(), pinyin: (vPinyin || '').toUpperCase() }]);
    setVName('');
    setVPinyin('');
  };

  const startEditVihara = (index: number) => {
    setEditingVIndex(index);
    setEditVName(viharas[index].name);
    setEditVPinyin(viharas[index].pinyin || '');
  };

  const saveEditVihara = (index: number) => {
    if (!editVName) return;
    const cleaned = editVName.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    const newList = [...viharas];
    newList[index] = { name: cleaned.toUpperCase(), pinyin: (editVPinyin || '').toUpperCase() };
    setViharas(newList);
    setEditingVIndex(null);
  };

  const removeVihara = (index: number) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus Vihara ${viharas[index].name}?`)) {
      const newList = [...viharas];
      newList.splice(index, 1);
      setViharas(newList);
      if (editingVIndex === index) setEditingVIndex(null);
    }
  };

  const addPandita = () => {
    if (!pName) return;
    const cleaned = pName.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    const formatted = formatPanditaName(cleaned);
    const formattedPinyin = formatPanditaPinyin(pPinyin || '');
    setPanditas([...panditas, { name: formatted, pinyin: formattedPinyin }]);
    setPName('');
    setPPinyin('');
  };

  const startEditPandita = (index: number) => {
    setEditingPIndex(index);
    setEditPName(panditas[index].name);
    setEditPPinyin(panditas[index].pinyin || '');
  };

  const saveEditPandita = (index: number) => {
    if (!editPName) return;
    const cleaned = editPName.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    const formatted = formatPanditaName(cleaned);
    const formattedPinyin = formatPanditaPinyin(editPPinyin || '');
    const newList = [...panditas];
    newList[index] = { name: formatted, pinyin: formattedPinyin };
    setPanditas(newList);
    setEditingPIndex(null);
  };

  const removePandita = (index: number) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus Pandita ${panditas[index].name}?`)) {
      const newList = [...panditas];
      newList.splice(index, 1);
      setPanditas(newList);
      if (editingPIndex === index) setEditingPIndex(null);
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
                {editingVIndex === i ? (
                  <div className="flex-1 flex flex-col sm:flex-row items-center gap-2 mr-2">
                    <input 
                      value={editVName}
                      onChange={e => setEditVName(e.target.value)}
                      placeholder="Nama Vihara"
                      className="w-full sm:w-1/2 bg-stone-50 border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-amber-500"
                    />
                    <input 
                      value={editVPinyin}
                      onChange={e => setEditVPinyin(e.target.value)}
                      placeholder="Pinyin Vihara"
                      className="w-full sm:w-1/2 bg-stone-50 border border-amber-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => saveEditVihara(i)} 
                        className="p-1.5 bg-amber-500 text-stone-950 rounded-lg hover:bg-amber-600 transition-colors"
                        title="Simpan"
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        onClick={() => setEditingVIndex(null)} 
                        className="p-1.5 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition-colors"
                        title="Batal"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-bold text-stone-800 text-sm">{v.name}</p>
                      {v.pinyin && <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{v.pinyin}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => startEditVihara(i)} 
                        className="text-stone-400 hover:text-amber-600 p-2 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-amber-50"
                        title="Edit Vihara"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => removeVihara(i)} 
                        className="text-stone-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                        title="Hapus Vihara"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
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
                {editingPIndex === i ? (
                  <div className="flex-1 flex flex-col sm:flex-row items-center gap-2 mr-2">
                    <input 
                      value={editPName}
                      onChange={e => setEditPName(e.target.value)}
                      placeholder="Nama Pandita"
                      className="w-full sm:w-1/2 bg-stone-50 border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-amber-500"
                    />
                    <input 
                      value={editPPinyin}
                      onChange={e => setEditPPinyin(e.target.value)}
                      placeholder="Pinyin Pandita"
                      className="w-full sm:w-1/2 bg-stone-50 border border-amber-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => saveEditPandita(i)} 
                        className="p-1.5 bg-amber-500 text-stone-950 rounded-lg hover:bg-amber-600 transition-colors"
                        title="Simpan"
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        onClick={() => setEditingPIndex(null)} 
                        className="p-1.5 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition-colors"
                        title="Batal"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-bold text-stone-800 text-sm">{p.name}</p>
                      {p.pinyin && <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{p.pinyin}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => startEditPandita(i)} 
                        className="text-stone-400 hover:text-amber-600 p-2 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-amber-50"
                        title="Edit Pandita"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => removePandita(i)} 
                        className="text-stone-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                        title="Hapus Pandita"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
