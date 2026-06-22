import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Palette, 
  Image as ImageIcon, 
  Move, 
  Trash2, 
  RotateCcw, 
  Layout, 
  Check,
  ChevronRight,
  Eye,
  Plus,
  Upload,
  Save
} from 'lucide-react';
import { useDesign, QRCodePosition } from '../contexts/DesignContext';
import { IdCard } from './IdCard';
import { cn } from '../lib/utils';
import { Umat } from '../types';

const SAMPLE_DATA: Umat = {
  id: 'preview',
  noId: 'EDM-PREVIEW',
  nama: '求道人',
  namaPinyin: 'NAMA PINYIN',
  namaIndonesia: 'NAMA INDONESIA',
  tanggalMasehi: '14-05-2024',
  tanggalLunar: '甲辰年四月初七',
  pandita: '林點傳師碧蓮',
  panditaPinyin: 'PANDITA LIM PI LIEN',
  pengajak: 'Pengajak',
  pengajakPinyin: 'PENGAJAK',
  penanggung: 'Penanggung',
  penanggungPinyin: 'PENANGGUNG',
  vihara: '崇慧佛院',
  viharaPinyin: 'CHONG HUI FO YEN',
  jabatanSuci: '道親 - UMAT',
  phone: '628123456789',
  createdAt: new Date().toISOString()
};

const BACK_IMAGES = [
  { id: 'jigong-12', url: '/images/JiGong-12.jpeg', label: 'Ji Gong 12' },
  { id: 'jigong-11', url: '/images/JiGong-11.jpeg', label: 'Ji Gong 11' },
  { id: 'jigong-10', url: '/images/JiGong-10.jpeg', label: 'Ji Gong 10' },
  { id: 'jigong-9', url: '/images/JiGong_9.jpeg', label: 'Ji Gong 9' },
  { id: 'jigong-8', url: '/images/JiGong-8.jpeg', label: 'Ji Gong 8' },
  { id: 'jigong-7', url: '/images/JiGong-7.jpeg', label: 'Ji Gong 7' },
  { id: 'jigong-6', url: '/images/JiGong-6.jpeg', label: 'Ji Gong 6' },
  { id: 'jigong-4', url: '/images/JiGong_4-1.jpeg', label: 'Ji Gong 4' },
  { id: 'jigong-5', url: '/images/Jigong_5.jpeg', label: 'Ji Gong 5' },
];

const QR_POSITIONS: { value: QRCodePosition; label: string }[] = [
  { value: 'top-left', label: 'Pojok Kiri Atas' },
  { value: 'top-right', label: 'Pojok Kanan Atas' },
  { value: 'bottom-left', label: 'Pojok Kiri Bawah' },
  { value: 'bottom-right', label: 'Pojok Kanan Bawah' },
  { value: 'bottom-center', label: 'Bawah Tengah' },
];

export function DesignerPage() {
  const { settings, updateSettings, resetSettings } = useDesign();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = () => {
    // Settings are already saved to localStorage via Context on change, 
    // this provides explicit user feedback.
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateSettings({ backBg: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="font-serif text-4xl font-bold text-stone-800 tracking-tight">Desain ID Card</h2>
          <p className="text-stone-500 max-w-lg">
            Sesuaikan tampilan kartu identitas sesuai keinginan Anda. Perubahan akan disimpan secara otomatis.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={resetSettings}
            className="flex items-center gap-2 px-4 py-2 text-stone-500 hover:text-stone-700 transition-colors text-sm font-bold bg-white rounded-xl border border-stone-200 shadow-sm"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          
          <button
            onClick={handleSave}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold shadow-lg transition-all",
              isSaving 
                ? "bg-green-500 text-white shadow-green-100" 
                : "bg-temple-gold text-white shadow-temple-gold/20 hover:shadow-temple-gold/40 hover:-translate-y-0.5"
            )}
          >
            {isSaving ? <Check size={16} /> : <Save size={16} />}
            {isSaving ? "Berhasil Disimpan!" : "Simpan Desain"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Settings Panel */}
        <div className="space-y-10">
          {/* Front Background Selection */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-800 font-bold uppercase tracking-widest text-xs">
                <ImageIcon size={16} className="text-temple-gold" />
                Latar Belakang Halaman Depan
              </div>
              
              <div className="flex items-center gap-2">
                {settings.frontBg.startsWith('data:image') && (
                  <button
                    onClick={() => updateSettings({ frontBg: '/images/front_logo.png' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors border border-red-100"
                  >
                    <Trash2 size={14} />
                    Hapus Foto
                  </button>
                )}
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => updateSettings({ frontBg: reader.result as string });
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition-colors border border-rose-100"
                >
                  <Upload size={14} />
                  Upload Foto
                </button>
              </div>
            </div>
            
            {settings.frontBg.startsWith('data:image') ? (
              <div className="w-16 h-20 rounded-xl overflow-hidden border-2 border-temple-gold shadow-lg shadow-temple-gold/10">
                <img src={settings.frontBg} alt="Front Background" className="w-full h-full object-cover" />
              </div>
            ) : (
              <p className="text-[10px] text-stone-400 italic">Menggunakan logo default sebagai latar belakang</p>
            )}
          </section>

          {/* Background Selection */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-800 font-bold uppercase tracking-widest text-xs">
                <ImageIcon size={16} className="text-temple-gold" />
                Latar Belakang Halaman Belakang
              </div>
              
              <div className="flex items-center gap-2">
                {settings.backBg.startsWith('data:image') && (
                  <button
                    onClick={() => updateSettings({ backBg: BACK_IMAGES[0].url })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors border border-red-100"
                  >
                    <Trash2 size={14} />
                    Hapus
                  </button>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition-colors border border-rose-100"
                >
                  <Upload size={14} />
                  Upload Foto Custom
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*" 
              />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {/* Custom Image Preview if present and not in default list */}
              {settings.backBg.startsWith('data:image') && (
                <button
                  onClick={() => updateSettings({ backBg: settings.backBg })}
                  className={cn(
                    "group relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all",
                    "border-temple-gold ring-4 ring-temple-gold/10"
                  )}
                >
                  <img src={settings.backBg} alt="Custom Upload" className="w-full h-full object-cover" />
                  <div className="absolute top-1 right-1 w-5 h-5 bg-temple-gold rounded-full flex items-center justify-center text-white shadow-lg">
                    <Check size={12} />
                  </div>
                </button>
              )}
              {BACK_IMAGES.map((img) => (
                <button
                  key={img.id}
                  onClick={() => updateSettings({ backBg: img.url })}
                  className={cn(
                    "group relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all",
                    settings.backBg === img.url 
                      ? "border-temple-gold ring-4 ring-temple-gold/10" 
                      : "border-transparent hover:border-stone-300"
                  )}
                >
                  <img src={img.url} alt={img.label} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  <div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/50 backdrop-blur-sm text-[8px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    {img.label}
                  </div>
                  {settings.backBg === img.url && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-temple-gold rounded-full flex items-center justify-center text-white shadow-lg">
                      <Check size={12} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* QR Code Position */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-stone-800 font-bold uppercase tracking-widest text-xs">
              <Move size={16} className="text-temple-gold" />
              Posisi QR Code & No ID
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QR_POSITIONS.map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => updateSettings({ qrPosition: pos.value })}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all bg-white font-bold text-sm",
                    settings.qrPosition === pos.value
                      ? "border-temple-gold text-stone-800 shadow-md"
                      : "border-stone-100 text-stone-400 hover:border-stone-200"
                  )}
                >
                  {pos.label}
                  {settings.qrPosition === pos.value && <Check size={16} className="text-temple-gold" />}
                </button>
              ))}
            </div>
          </section>

          {/* Fields Management */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-800 font-bold uppercase tracking-widest text-xs">
                <Layout size={16} className="text-temple-gold" />
                Pengaturan Elemen Kartu
              </div>
              <button 
                onClick={() => {
                  const newField = {
                    id: `field-${Date.now()}`,
                    label: 'BARU',
                    chLabel: '新項',
                    key: 'custom' as const,
                    customValue: '',
                    show: true,
                    order: settings.fields.length
                  };
                  updateSettings({ fields: [...settings.fields, newField] });
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-temple-gold/10 text-temple-gold rounded-lg text-[10px] font-bold hover:bg-temple-gold/20 transition-colors"
              >
                <Plus size={14} />
                Tambah Baris
              </button>
            </div>
            
            <div className="space-y-3">
              {settings.fields.sort((a, b) => a.order - b.order).map((field, idx) => (
                <div key={field.id} className="bg-white rounded-2xl border border-stone-100 p-4 shadow-sm space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex flex-col gap-1">
                        <button 
                          disabled={idx === 0}
                          onClick={() => {
                            const newFields = [...settings.fields];
                            const prevIdx = newFields.findIndex(f => f.order === field.order - 1);
                            if (prevIdx !== -1) {
                              newFields[prevIdx].order++;
                              field.order--;
                              updateSettings({ fields: newFields });
                            }
                          }}
                          className="p-1 hover:bg-stone-100 rounded disabled:opacity-30"
                        >
                          <ChevronRight size={14} className="-rotate-90" />
                        </button>
                        <button 
                          disabled={idx === settings.fields.length - 1}
                          onClick={() => {
                            const newFields = [...settings.fields];
                            const nextIdx = newFields.findIndex(f => f.order === field.order + 1);
                            if (nextIdx !== -1) {
                              newFields[nextIdx].order--;
                              field.order++;
                              updateSettings({ fields: newFields });
                            }
                          }}
                          className="p-1 hover:bg-stone-100 rounded disabled:opacity-30"
                        >
                          <ChevronRight size={14} className="rotate-90" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 flex-1">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase">Label Indo</label>
                          <input 
                            value={field.label}
                            onChange={(e) => {
                              const newFields = settings.fields.map(f => f.id === field.id ? { ...f, label: e.target.value } : f);
                              updateSettings({ fields: newFields });
                            }}
                            className="w-full px-2 py-1 text-xs font-bold border border-stone-200 rounded-lg focus:outline-none focus:border-temple-gold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase">Label Mandarin</label>
                          <input 
                            value={field.chLabel}
                            onChange={(e) => {
                              const newFields = settings.fields.map(f => f.id === field.id ? { ...f, chLabel: e.target.value } : f);
                              updateSettings({ fields: newFields });
                            }}
                            className="w-full px-2 py-1 text-xs font-dfkai border border-stone-200 rounded-lg focus:outline-none focus:border-temple-gold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newFields = settings.fields.map(f => f.id === field.id ? { ...f, show: !f.show } : f);
                          updateSettings({ fields: newFields });
                        }}
                        className={cn(
                          "w-10 h-5 rounded-full relative transition-colors",
                          field.show ? "bg-green-500" : "bg-stone-200"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                          field.show ? "left-6" : "left-1"
                        )} />
                      </button>
                      <button 
                        onClick={() => {
                          updateSettings({ fields: settings.fields.filter(f => f.id !== field.id).map((f, i) => ({ ...f, order: i })) });
                        }}
                        className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">Input Data</label>
                      <select 
                        value={field.key}
                        onChange={(e) => {
                          const newFields = settings.fields.map(f => f.id === field.id ? { ...f, key: e.target.value as any } : f);
                          updateSettings({ fields: newFields });
                        }}
                        className="w-full px-2 py-1 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-temple-gold"
                      >
                        <option value="custom">Teks Kustom</option>
                        <option value="tanggalMasehi">Tanggal</option>
                        <option value="pandita">Pandita</option>
                        <option value="pengajak">Pengajak</option>
                        <option value="penanggung">Penanggung</option>
                        <option value="vihara">Vihara</option>
                        <option value="nama">Nama</option>
                        <option value="namaIndonesia">Nama Indonesia</option>
                        <option value="jabatanSuci">Jabatan Suci</option>
                        <option value="phone">No. HP</option>
                        <option value="noId">No. ID</option>
                      </select>
                    </div>
                    {field.key === 'custom' && (
                       <div className="flex-[2] space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Isi Teks</label>
                        <input 
                          value={field.customValue || ''}
                          onChange={(e) => {
                            const newFields = settings.fields.map(f => f.id === field.id ? { ...f, customValue: e.target.value } : f);
                            updateSettings({ fields: newFields });
                          }}
                          className="w-full px-2 py-1 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-temple-gold"
                          placeholder="Masukkan teks kustom..."
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-4">
                      <input 
                        type="checkbox" 
                        checked={field.isLarge} 
                        onChange={(e) => {
                          const newFields = settings.fields.map(f => f.id === field.id ? { ...f, isLarge: e.target.checked } : f);
                          updateSettings({ fields: newFields });
                        }}
                        id={`large-${field.id}`}
                      />
                      <label htmlFor={`large-${field.id}`} className="text-[10px] font-bold text-stone-500 uppercase cursor-pointer">Besar</label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Additional Options */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-stone-800 font-bold uppercase tracking-widest text-xs">
              <Layout size={16} className="text-temple-gold" />
              Opsi Tambahan
            </div>
            <div className="bg-white rounded-3xl border border-stone-100 p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-bold text-stone-800">Tampilkan Nama di Belakang</p>
                  <p className="text-xs text-stone-400">Menambahkan kotak nama di bagian atas halaman belakang</p>
                </div>
                <button
                  onClick={() => updateSettings({ showNameOnBack: !settings.showNameOnBack })}
                  className={cn(
                    "w-12 h-6 rounded-full relative transition-colors",
                    settings.showNameOnBack ? "bg-temple-gold" : "bg-stone-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                    settings.showNameOnBack ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Preview Panel */}
        <div className="sticky top-24 space-y-6">
          <div className="flex items-center gap-2 text-stone-800 font-bold uppercase tracking-widest text-xs">
            <Eye size={16} className="text-temple-gold" />
            Live Preview
          </div>
          
          <div className="bg-white/40 backdrop-blur-md rounded-[40px] border border-white/50 p-8 flex flex-col items-center gap-12 shadow-inner">
            <div className="space-y-4 w-full flex flex-col items-center">
              <span className="text-stone-400 text-[10px] uppercase tracking-[0.3em] font-bold">Halaman Depan</span>
              <div className="shadow-2xl rounded-sm overflow-hidden scale-90 sm:scale-100 origin-top">
                <IdCard data={SAMPLE_DATA} isFrontOnly forceSmall={false} />
              </div>
            </div>

            <div className="space-y-4 w-full flex flex-col items-center">
              <span className="text-stone-400 text-[10px] uppercase tracking-[0.3em] font-bold">Halaman Belakang</span>
              <div className="shadow-2xl rounded-sm overflow-hidden scale-90 sm:scale-100 origin-top">
                <IdCard data={SAMPLE_DATA} isBackOnly forceSmall={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
