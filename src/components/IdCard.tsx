import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { IdCard as IdIcon, Calendar, MapPin, User, ShieldCheck, X, RefreshCw, Layers, MessageSquare, Download, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { Umat } from '../types';
import { cn } from '../lib/utils';
import { useDesign, CardDesignSettings } from '../contexts/DesignContext';
import { Solar } from 'lunar-javascript';
import { pinyin } from 'pinyin-pro';
import { safeBtoa } from '../App';

interface IdCardProps {
  data: Umat;
  onClose?: () => void;
  isFrontOnly?: boolean;
  isBackOnly?: boolean;
  forceSmall?: boolean;
  designSettings?: CardDesignSettings;
}

const theme = {
  primaryColor: '#5d4037', // temple-wood
  accentColor: '#c5a059',  // temple-gold
  textColor: '#1c1917',    // stone-900
  backgroundColor: '#ffffff',
  fontFamily: 'serif',
  pattern: 'circles'
};

function ChineseCorner({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  return (
    <div className={cn(
      "absolute w-4 h-4 border-rose-400 z-20",
      position === 'top-left' && "top-0 left-0 border-t-2 border-l-2",
      position === 'top-right' && "top-0 right-0 border-t-2 border-r-2",
      position === 'bottom-left' && "bottom-0 left-0 border-b-2 border-l-2",
      position === 'bottom-right' && "bottom-0 right-0 border-b-2 border-r-2",
    )}>
      <div className={cn(
        "absolute w-2 h-2 border-rose-300",
        position === 'top-left' && "top-0.5 left-0.5 border-t border-l",
        position === 'top-right' && "top-0.5 right-0.5 border-t border-r",
        position === 'bottom-left' && "bottom-0.5 left-0.5 border-b border-l",
        position === 'bottom-right' && "bottom-0.5 right-0.5 border-b border-r",
      )} />
      <div className={cn(
        "absolute w-1 h-1 border-rose-200",
        position === 'top-left' && "top-1 left-1 border-t border-l",
        position === 'top-right' && "top-1 right-1 border-t border-r",
        position === 'bottom-left' && "bottom-1 left-1 border-b border-l",
        position === 'bottom-right' && "bottom-1 right-1 border-b border-r",
      )} />
    </div>
  );
}

const indonesianMonths = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const formatGregorianDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const cleanStr = dateStr.trim().replace(/\//g, '-');
    const parts = cleanStr.split('-');
    if (parts.length !== 3) return dateStr;
    
    let day = NaN;
    let month = NaN;
    let year = NaN;
    
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    }
    
    if (isNaN(day) || isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      return dateStr;
    }
    
    return `${day} ${indonesianMonths[month - 1]} ${year}`;
  } catch (e) {
    console.error("Error formatting Gregorian date:", e);
    return dateStr;
  }
};

const formatLunarNumbers = (str: string): string => {
  if (!str) return '';
  return str.replace(/(?<!\d)\d(?!\d)/g, '0$&');
};

const getLunarDateFallback = (masehi: string, lunarDate?: string, waktu?: string) => {
  if (lunarDate && /[\u4e00-\u9fa5]/.test(lunarDate)) {
    return formatLunarNumbers(lunarDate).replace(/时/g, '時');
  }
  if (!masehi) return formatLunarNumbers((lunarDate || '').replace(/时/g, '時'));
  try {
    const parts = masehi.split("-");
    if (parts.length !== 3) return formatLunarNumbers((lunarDate || '').replace(/时/g, '時'));
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return formatLunarNumbers((lunarDate || '').replace(/时/g, '時'));
    
    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();
    
    let res = `${lunar.getYearInGanZhi()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
    
    if (waktu) {
      const match = waktu.match(/\((.*?)\)/);
      if (match && match[1]) {
        res += ` ${match[1]}`;
      }
    }
    return formatLunarNumbers(res.replace(/时/g, '時'));
  } catch (e) {
    console.error("Lunar conversion error in IdCard:", e);
    return formatLunarNumbers((lunarDate || '').replace(/时/g, '時'));
  }
};

const getPinyinFallback = (mandarinText: string, currentPinyin: string | undefined): string => {
  if (currentPinyin && currentPinyin.trim()) {
    return currentPinyin.trim().toUpperCase();
  }
  if (!mandarinText) return '';
  const hasChinese = /[\u4e00-\u9fa5]/.test(mandarinText);
  if (hasChinese) {
    try {
      const py = pinyin(mandarinText, { toneType: 'none' });
      if (py) {
        return py.toUpperCase();
      }
    } catch (e) {
      console.error("Auto pinyin generation failed in IdCard for", mandarinText, e);
    }
  }
  return (currentPinyin || '').trim().toUpperCase();
};

const FrontSide = ({ data, forceSmall, innerRef, settings }: { data: Umat, forceSmall?: boolean, innerRef?: React.RefObject<HTMLDivElement | null>, settings: CardDesignSettings }) => (
  <div
    ref={innerRef}
    style={{ 
      width: '56mm', 
      height: '87mm',
      backgroundImage: `url(${settings.frontBg})`,
      backgroundSize: '95%',
      backgroundPosition: 'center 55%',
      backgroundRepeat: 'no-repeat',
      colorScheme: 'light',
      boxSizing: 'border-box',
      imageRendering: 'high-quality',
      borderRadius: '3.18mm', // CR-80 standard rounded corners (approx R3)
    }}
    className={cn(
      "relative bg-[#fff1f2] overflow-hidden border-[1px] border-rose-200 text-slate-900 select-none box-border id-card-output",
      !forceSmall && "shadow-md"
    )}
  >
    {/* Elegant Rose Overlay for readability */}
    <div 
      className="absolute inset-0 z-0" 
      style={{ 
        background: 'linear-gradient(to bottom, rgba(255, 241, 242, 0.75), rgba(255, 241, 242, 0.90))',
        borderRadius: '3.18mm',
      }}
    />

    <div 
      className={cn(
        "h-full flex flex-col relative z-20",
        "p-1.5"
      )}
      style={{ borderRadius: '3mm' }}
    >
      
      {/* Header */}
      <div className={cn(
        "flex items-center relative h-[48px] px-1 bg-white/30 backdrop-blur-[1px] rounded-t-sm border-b border-rose-200/40"
      )}>
        {/* Logo container aligned with Label column (30%) */}
        <div className="w-[30%] flex items-center justify-center h-full">
          <img src="/images/front_logo.png" alt="Logo" className="w-[42px] h-[42px] object-contain opacity-95" />
        </div>
        {/* Text container aligned with Value column (70%) */}
        <div className="flex-1 flex flex-col items-center justify-center h-full text-center py-0.5">
          <div className="flex items-baseline justify-center gap-1 whitespace-nowrap">
            <p className="font-dfkai font-bold text-rose-950 leading-none text-[21px] tracking-wide">發 一 崇 德</p>
          </div>
          <h2 className="font-black text-rose-900 tracking-[0.1em] font-sans leading-none uppercase mt-1 text-[11px] whitespace-nowrap">FA YI CHONG DE</h2>
      
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 flex flex-col mt-1 bg-white/20 backdrop-blur-[1px] rounded-b-sm overflow-hidden border border-rose-100/50">
        {settings.fields.filter(f => f.show).sort((a, b) => a.order - b.order).map((field, idx, arr) => {
          let value = '';
          let subValue = '';
          
          if (field.key === 'custom') {
            value = field.customValue || '';
          } else if (field.key) {
            value = String(data[field.key as keyof Umat] || '');
            
            // Special handling for sub-values based on field ID or key
            if (field.id === 'date') {
              const lunarFull = getLunarDateFallback(data.tanggalMasehi, data.tanggalLunar, data.waktu);
              const formattedMasehi = formatGregorianDate(data.tanggalMasehi);
              value = `${lunarFull}${formattedMasehi ? `\n${formattedMasehi}` : ''}`;
            } else if (field.id === 'pandita') {
              subValue = getPinyinFallback(data.pandita, data.panditaPinyin);
            } else if (field.id === 'pengajak') {
              subValue = getPinyinFallback(data.pengajak, data.pengajakPinyin);
            } else if (field.id === 'penanggung') {
              subValue = getPinyinFallback(data.penanggung, data.penanggungPinyin);
            } else if (field.id === 'vihara') {
              subValue = getPinyinFallback(data.vihara, data.viharaPinyin);
            } else if (field.id === 'nama') {
              subValue = getPinyinFallback(data.nama, data.namaPinyin);
            }
          }

          const { id: fieldId, label: fieldLabel, chLabel: fieldChLabel, isLarge: fieldIsLarge } = field;

          return (
            <TraditionalRow 
              key={fieldId}
              label={fieldLabel} 
              chLabel={fieldChLabel} 
              value={value}
              subValue={subValue}
              isLarge={!!fieldIsLarge}
              isCentered
              isMasehi={fieldId === 'date'}
              isLast={idx === arr.length - 1}
              forceSmall={true}
              isSingleLineOnly={fieldId !== 'date'}
            />
          );
        })}
      </div>
    </div>
  </div>
);

const getDynamicIdFontSize = (idStr: string) => {
  const len = idStr ? idStr.length : 0;
  if (len <= 6) return '10.6px';
  if (len <= 9) return '9.2px';
  if (len <= 12) return '8.0px';
  if (len <= 15) return '6.6px';
  return '6.0px';
};

const BackSide = ({ data, forceSmall, innerRef, settings }: { data: Umat, forceSmall?: boolean, innerRef?: React.RefObject<HTMLDivElement | null>, settings: CardDesignSettings }) => (
  <div
    ref={innerRef}
    style={{ 
      width: '56mm', 
      height: '87mm',
      colorScheme: 'light',
      boxSizing: 'border-box',
      imageRendering: 'high-quality',
      borderRadius: '3.18mm', // CR-80 standard rounded corners (approx R3)
    }}
    className={cn(
      "relative bg-[#fff1f2] overflow-hidden border-[1px] border-rose-200 text-slate-900 select-none box-border id-card-output",
      !forceSmall && "shadow-md"
    )}
  >
    {/* Elegant Rose Overlay for consistency and readability */}
    <div 
      className="absolute inset-0 z-0" 
      style={{ 
        background: 'linear-gradient(to bottom, rgba(255, 241, 242, 0.5), rgba(255, 241, 242, 0.7))',
        borderRadius: '3.18mm',
      }}
    />

    <div 
      className={cn(
        "h-full flex flex-col relative z-20",
        "p-1.5"
      )}
      style={{ borderRadius: '3mm' }}
    >
      <div 
        className="absolute inset-0 -z-20 bg-[#fff1f2]"
        style={{
          backgroundImage: `url(${settings.backBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.85,
          filter: forceSmall ? 'none' : 'saturate(0.7) contrast(1.05) brightness(1.05)',
          imageRendering: 'high-quality',
        }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/20 via-transparent to-white/30" />

      {/* Dynamic Name on Back if enabled */}
      {settings.showNameOnBack && (
        <div className={cn(
          "absolute left-0 right-0 z-30 flex justify-center px-4",
          "top-[1%]"
        )}>
          <div className={cn(
            "flex items-center gap-2 bg-white/60 backdrop-blur-[1px] rounded border border-white/40 whitespace-nowrap px-1.5 py-0.5"
          )}>
            <p 
              className={cn(
                "leading-none",
                (/[\u4e00-\u9fa5]/.test(data.nama || data.namaIndonesia || '')) ? "font-dfkai font-bold" : "font-sans font-black"
              )}
              style={{ 
                fontSize: (data.nama || data.namaIndonesia).length > 20 ? '10px' : 
                          (data.nama || data.namaIndonesia).length > 15 ? '12px' : 
                          (data.nama || data.namaIndonesia).length > 10 ? '14px' : '16px',
                fontWeight: (/[\u4e00-\u9fa5]/.test(data.nama || data.namaIndonesia || '')) ? 700 : 900
              }}
            >
              {data.nama || data.namaIndonesia}
            </p>
            {data.nama && data.namaPinyin && (
              <>
                <div className="w-[1px] h-3 bg-rose-300/40" />
                <p 
                  className="font-black text-black uppercase font-sans tracking-tight"
                  style={{ 
                    fontSize: data.namaPinyin.length > 25 ? '7px' : 
                              data.namaPinyin.length > 20 ? '8px' : '10px',
                    fontWeight: 900
                  }}
                >
                  {data.namaPinyin}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Info and QR Code Positioned dynamically */}
      <div className={cn(
        "absolute z-30 bg-white/70 backdrop-blur-[1px] rounded-md flex flex-col items-center gap-0.5 p-0.5 w-[55px] overflow-hidden",
        settings.qrPosition === 'bottom-right' && "bottom-1.5 right-1.5",
        settings.qrPosition === 'bottom-left' && "bottom-1.5 left-1.5",
        settings.qrPosition === 'top-left' && "top-1.5 left-1.5",
        settings.qrPosition === 'top-right' && "top-1.5 right-1.5",
        settings.qrPosition === 'bottom-center' && "bottom-1.5 left-1/2 -translate-x-1/2"
      )}>
        <div className="flex items-center justify-center">
          <QRCodeSVG value={data.noId} size={51} fgColor="#000000" />
        </div>
        <div className="w-[51px] select-all overflow-hidden flex items-center justify-between">
          {Array.from(data.noId || '').map((char, idx) => (
            <span 
              key={idx}
              className="font-black text-black font-mono leading-none"
              style={{ 
                fontSize: getDynamicIdFontSize(data.noId),
                fontWeight: 900
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-end rounded-sm p-4">
        <div className="text-center w-full">
          <div className="h-4" />
        </div>
      </div>
    </div>
  </div>
);

export const IdCard: React.FC<IdCardProps> = ({ data, onClose, isFrontOnly, isBackOnly, forceSmall, designSettings }) => {
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const { settings: contextSettings } = useDesign();
  
  const settings = designSettings || contextSettings;

  // If we only need one side (for printing), we render just that
  if (isFrontOnly) {
    return <FrontSide data={data} forceSmall={forceSmall} innerRef={frontRef as any} settings={settings} />;
  }

  if (isBackOnly) {
    return <BackSide data={data} forceSmall={forceSmall} innerRef={backRef as any} settings={settings} />;
  }

  const captureCard = async (ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return null;
    try {
      // Small delay to ensure everything is rendered
      await new Promise(r => setTimeout(r, 100));
      return await toPng(ref.current, { 
        cacheBust: true,
        backgroundColor: '#ffffff',
        fontEmbedCSS: '', // Disable embedding fonts to prevent slow/stalling downloads and CORS errors
        pixelRatio: 2
      });
    } catch (err) {
      console.error('Failed to capture card', err);
      return null;
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCapturing(true);
    
    const frontImg = await captureCard(frontRef);
    const backImg = await captureCard(backRef);

    if (frontImg) {
      const link = document.createElement('a');
      link.download = `ID_DEPAN_${data.nama}.png`;
      link.href = frontImg;
      link.click();
    }
    
    if (backImg) {
      const link = document.createElement('a');
      link.download = `ID_BELAKANG_${data.nama}.png`;
      link.href = backImg;
      link.click();
    }
    
    setIsCapturing(false);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCapturing(true);

    try {
      const frontImg = await captureCard(frontRef);
      const backImg = await captureCard(backRef);

      const files: File[] = [];

      if (frontImg) {
        const response = await fetch(frontImg);
        const blob = await response.blob();
        files.push(new File([blob], `ID_DEPAN_${data.nama}.png`, { type: 'image/png' }));
      }

      if (backImg) {
        const response = await fetch(backImg);
        const blob = await response.blob();
        files.push(new File([blob], `ID_BELAKANG_${data.nama}.png`, { type: 'image/png' }));
      }

      const shareData = {
        title: `KARTU IDENTITAS UMAT - ${data.nama}`,
        text: `KARTU IDENTITAS UMAT\nNama: ${data.nama}\nNo ID: ${data.noId}\n\n_Data dikirim melalui Aplikasi EDM_`,
        files: files
      };

      if (navigator.share && navigator.canShare && navigator.canShare({ files })) {
        await navigator.share(shareData);
      } else {
        // Fallback to text WhatsApp
        handleWA(e);
        // Also trigger download so user can attach manually
        handleDownload(e);
        alert('Fitur share file tidak didukung browser ini. Gambar telah didownload secara otomatis, silahkan lampirkan secara manual di WhatsApp.');
      }
    } catch (err: any) {
      const isCancel = err?.name === 'AbortError' || 
                        err?.name === 'NotAllowedError' || 
                        (err?.message && (
                          err.message.toLowerCase().includes('cancel') || 
                          err.message.toLowerCase().includes('abort')
                        ));
      if (isCancel) {
        console.log('Share was canceled by the user.');
      } else {
        console.error('Share failed', err);
        handleWA(e);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handleWA = (e: React.MouseEvent) => {
    e.stopPropagation();
    const encodedData = safeBtoa(JSON.stringify(data));
    const shareUrl = `${window.location.origin}${window.location.pathname}?view=${encodedData}`;
    
    const text = `*KARTU IDENTITAS UMAT*\n*Vihara Eka Dharma Manggala*\n\n------------------------------\n*Data Umat*\n------------------------------\nNama: ${data.nama}\nNo ID: ${data.noId}\nJabatan: ${data.jabatanSuci || '-'}\nVihara: ${data.vihara}\n\nLihat Kartu Identitas Digital:\n${shareUrl}\n\n------------------------------\n_Data dikirim melalui Aplikasi EDM_`;
    
    const phone = data.phone ? data.phone.replace(/[^0-9+]/g, '') : '';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex flex-col items-center gap-8 max-w-6xl w-full py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl justify-items-center">
          {/* Front Side */}
          <div className="space-y-4 w-full flex flex-col items-center">
            <span className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold">Halaman Depan</span>
            <div onClick={(e) => e.stopPropagation()}>
              <FrontSide data={data} innerRef={frontRef} settings={settings} />
            </div>
          </div>

          {/* Back Side */}
          <div className="space-y-4 w-full flex flex-col items-center">
            <span className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold">Halaman Belakang</span>
            <div onClick={(e) => e.stopPropagation()}>
              <BackSide data={data} innerRef={backRef} settings={settings} />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 mt-4">
          <button 
            disabled={isCapturing}
            onClick={handleShare}
            className="flex items-center gap-3 px-8 py-4 bg-green-600 text-white rounded-full font-bold shadow-2xl hover:bg-green-700 transition-all hover:scale-105 active:scale-95 group disabled:opacity-50 disabled:scale-100"
          >
            {isCapturing ? (
              <RefreshCw size={20} className="animate-spin" />
            ) : (
              <Share2 size={20} className="group-hover:rotate-12 transition-transform" />
            )}
            Kirim Gambar via WhatsApp
          </button>

          <button 
            disabled={isCapturing}
            onClick={handleDownload}
            className="flex items-center gap-3 px-8 py-4 bg-white/10 text-white border border-white/20 rounded-full font-bold shadow-2xl hover:bg-white/20 transition-all hover:scale-105 active:scale-95 group disabled:opacity-50"
          >
            <Download size={20} />
            Download Gambar
          </button>
        </div>

        <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">
          Klik di luar kartu atau tombol silang untuk menutup
        </p>
      </div>

      <button 
        onClick={onClose}
        className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
      >
        <X size={24} />
      </button>
    </motion.div>
  );
};

interface TraditionalRowProps {
  label: string; 
  chLabel: string; 
  value: string; 
  subValue?: string;
  isLast?: boolean;
  isCentered?: boolean;
  isLarge?: boolean;
  isMasehi?: boolean;
  forceSmall?: boolean;
  isSingleLineOnly?: boolean;
}

const TraditionalRow: React.FC<TraditionalRowProps> = ({ 
  label, chLabel, value, subValue, isLast = false, isCentered = false, isLarge = false, isMasehi = false, forceSmall = false, isSingleLineOnly = false 
}) => {
  const isDate = isMasehi; 
  const valLen = value ? value.length : 0;
  const subValLen = subValue ? subValue.length : 0;

  // Determine dynamic font size for the value - optimized for clear vector print readability (increased by ~15%)
  let dynamicValueFontSize = '13.5px';
  if (isSingleLineOnly || isLarge) {
    // Specifically for Nama, Vihara, or other prominent fields
    if (valLen <= 3) {
      dynamicValueFontSize = forceSmall ? '18.5px' : '19.5px';
    } else if (valLen <= 6) {
      dynamicValueFontSize = forceSmall ? '16.5px' : '17.5px';
    } else if (valLen <= 10) {
      dynamicValueFontSize = forceSmall ? '14.8px' : '15.8px';
    } else if (valLen <= 15) {
      dynamicValueFontSize = forceSmall ? '13.2px' : '14.2px';
    } else if (valLen <= 20) {
      dynamicValueFontSize = forceSmall ? '11.5px' : '12.5px';
    } else if (valLen <= 25) {
      dynamicValueFontSize = forceSmall ? '10.0px' : '11.0px';
    } else if (valLen <= 30) {
      dynamicValueFontSize = forceSmall ? '8.8px' : '9.8px';
    } else {
      dynamicValueFontSize = forceSmall ? '7.8px' : '8.8px';
    }
  } else if (isDate) {
    const lines = value ? value.split('\n') : [];
    const maxLineLen = lines.reduce((max, line) => Math.max(max, line.length), 0);
    if (maxLineLen > 25) {
      dynamicValueFontSize = forceSmall ? '9.2px' : '10.2px';
    } else if (maxLineLen > 18) {
      dynamicValueFontSize = forceSmall ? '10.8px' : '11.8px';
    } else if (maxLineLen > 12) {
      dynamicValueFontSize = forceSmall ? '12.0px' : '13.0px';
    } else {
      dynamicValueFontSize = forceSmall ? '13.0px' : '14.0px';
    }
  } else {
    // Other smaller fields
    if (valLen <= 4) {
      dynamicValueFontSize = forceSmall ? '15.0px' : '16.0px';
    } else if (valLen <= 8) {
      dynamicValueFontSize = forceSmall ? '13.8px' : '14.8px';
    } else if (valLen <= 14) {
      dynamicValueFontSize = forceSmall ? '12.5px' : '13.5px';
    } else if (valLen <= 20) {
      dynamicValueFontSize = forceSmall ? '11.0px' : '12.0px';
    } else {
      dynamicValueFontSize = forceSmall ? '9.5px' : '10.5px';
    }
  }

  // Determine dynamic font size for the subValue (usually Chinese block/pinyin text) - increased for print readability
  let dynamicSubValueFontSize = '11px';
  if (subValue) {
    if (isSingleLineOnly || isLarge) {
      if (subValLen <= 4) {
        dynamicSubValueFontSize = forceSmall ? '14.0px' : '15.0px';
      } else if (subValLen <= 8) {
        dynamicSubValueFontSize = forceSmall ? '12.5px' : '13.5px';
      } else if (subValLen <= 14) {
        dynamicSubValueFontSize = forceSmall ? '11.0px' : '12.0px';
      } else if (subValLen <= 20) {
        dynamicSubValueFontSize = forceSmall ? '10.0px' : '11.0px';
      } else if (subValLen <= 28) {
        dynamicSubValueFontSize = forceSmall ? '8.8px' : '9.8px';
      } else {
        dynamicSubValueFontSize = forceSmall ? '7.8px' : '8.8px';
      }
    } else {
      if (subValLen <= 6) {
        dynamicSubValueFontSize = forceSmall ? '11.5px' : '12.5px';
      } else if (subValLen <= 12) {
        dynamicSubValueFontSize = forceSmall ? '10.5px' : '11.5px';
      } else if (subValLen <= 18) {
        dynamicSubValueFontSize = forceSmall ? '9.2px' : '10.2px';
      } else {
        dynamicSubValueFontSize = forceSmall ? '8.2px' : '9.2px';
      }
    }
  }

  const hasChineseValue = value ? /[\u4e00-\u9fa5]/.test(value) : false;
  const hasChineseSubValue = subValue ? /[\u4e00-\u9fa5]/.test(subValue) : false;

  return (
    <div className={cn(
      "flex flex-1 items-stretch min-h-0",
      !isLast && "border-b-[1px] border-rose-200"
    )}>
      {/* Label Box */}
      <div className={cn(
        "w-[30%] border-r-[1px] border-rose-200 flex flex-col items-center justify-center text-center bg-rose-50/40",
        forceSmall ? "p-0.5" : "p-1"
      )}>
        {chLabel && (
          <span 
            className={cn("font-dfkai font-bold text-rose-950 leading-none mb-0.5", forceSmall ? "text-[12.5px]" : "text-[14.5px]")}
          >
            {chLabel}
          </span>
        )}
        <span 
          className="font-black text-rose-950 leading-none whitespace-nowrap" // Avoid semi-transparent text colors for small labels to ensure sharp vector printing (halftone prevention)
          style={{
            fontSize: label.length > 9 
              ? (forceSmall ? '6.8px' : '7.8px')
              : label.length > 7
              ? (forceSmall ? '7.6px' : '8.6px')
              : label.length > 5
              ? (forceSmall ? '8.3px' : '9.3px')
              : (forceSmall ? '9.2px' : '10.2px'),
            letterSpacing: label.length > 7 ? '-0.04em' : '-0.01em'
          }}
        >
          {label}
        </span>
      </div>
      
      {/* Value Box */}
      <div className={cn("flex-1 flex flex-col justify-center min-w-0 bg-white/10", forceSmall ? "px-1 py-0" : "px-1.5 py-0.5")}>
        <p 
          className={cn(
            "text-black leading-tight uppercase animate-fade-in",
            hasChineseValue ? "font-dfkai font-bold" : "font-sans font-black",
            isCentered && "text-center",
            isSingleLineOnly ? "whitespace-nowrap overflow-hidden text-ellipsis" : "whitespace-pre-wrap"
          )}
          style={{ 
            fontSize: dynamicValueFontSize, 
            fontWeight: hasChineseValue ? 700 : 900 
          }}
        >
          {value || '-'}
        </p>
        {subValue && (
          <p 
            className={cn(
              "text-black leading-tight uppercase animate-fade-in",
              hasChineseSubValue ? "font-dfkai font-bold" : "font-sans font-black",
              isCentered && "text-center",
              isSingleLineOnly ? "whitespace-nowrap overflow-hidden text-ellipsis" : "whitespace-pre-wrap",
              forceSmall ? "mt-0" : "mt-0.5"
            )}
            style={{ 
              fontSize: dynamicSubValueFontSize, 
              fontWeight: hasChineseSubValue ? 700 : 900 
            }}
          >
            {subValue}
          </p>
        )}
      </div>
    </div>
  );
}
