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
    if (parts.length !== 3) {
      return dateStr.replace(/(?<!\d)(\d)(?!\d)/g, '0$1');
    }
    
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
      return dateStr.replace(/(?<!\d)(\d)(?!\d)/g, '0$1');
    }
    
    const formattedDay = String(day).padStart(2, '0');
    return `${formattedDay} ${indonesianMonths[month - 1]} ${year}`;
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
      } else if (waktu.trim()) {
        res += ` ${waktu.trim()}`;
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

const getFittedFontSize = (text: string, baseFontSize: number, maxSpaceWidth: number = 116, minFontSize: number = 4.8): { fontSize: string, letterSpacing: string } => {
  if (!text) return { fontSize: `${baseFontSize}px`, letterSpacing: 'normal' };

  let effectiveLen = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (/[\u4e00-\u9fa5]/.test(char)) {
      effectiveLen += 1.00; // Chinese character ~ 1.0em
    } else if (/[A-Z]/.test(char)) {
      effectiveLen += 0.68; // Uppercase Latin letter ~ 0.68em (prevents uppercase text like PANDITA from overflowing)
    } else if (/[a-z0-9]/.test(char)) {
      effectiveLen += 0.52; // Lowercase & digits ~ 0.52em
    } else {
      effectiveLen += 0.30; // Spaces, hyphens, punctuation ~ 0.30em
    }
  }

  if (effectiveLen <= 0) return { fontSize: `${baseFontSize}px`, letterSpacing: 'normal' };

  // Calculate estimated width at standard/base font size
  const estimatedWidth = effectiveLen * baseFontSize;

  // If text fits comfortably inside maxSpaceWidth, KEEP the base font size!
  if (estimatedWidth <= maxSpaceWidth) {
    return { fontSize: `${baseFontSize}px`, letterSpacing: 'normal' };
  }

  // Calculate reduced font size to fit inside maxSpaceWidth
  let letterSpacing = 'normal';
  let calculatedSize = maxSpaceWidth / effectiveLen;

  if (effectiveLen > 20) {
    letterSpacing = '-0.035em';
    calculatedSize = maxSpaceWidth / (effectiveLen * 0.93);
  } else if (effectiveLen > 14) {
    letterSpacing = '-0.025em';
    calculatedSize = maxSpaceWidth / (effectiveLen * 0.95);
  } else if (effectiveLen > 9) {
    letterSpacing = '-0.015em';
  }

  const finalSize = Math.max(minFontSize, Math.min(baseFontSize, calculatedSize));
  return {
    fontSize: `${finalSize.toFixed(1)}px`,
    letterSpacing
  };
};

const FrontSide = ({ data, forceSmall, innerRef, settings }: { data: Umat, forceSmall?: boolean, innerRef?: React.RefObject<HTMLDivElement | null>, settings: CardDesignSettings }) => (
  <div
    ref={innerRef}
    style={{ 
      width: '54mm', 
      height: '85.6mm',
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
        <div className="flex-1 flex items-center justify-center h-full px-1.5">
          <div className="w-full grid grid-cols-4 gap-0 text-center items-center">
            <div className="flex flex-col items-center justify-center">
              <span className="font-dfkai text-rose-950 text-[20px] leading-none font-normal">發</span>
              <span className="font-sans font-medium text-rose-900 text-[10.5px] leading-none uppercase mt-0.5 tracking-tight">FA</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="font-dfkai text-rose-950 text-[20px] leading-none font-normal">一</span>
              <span className="font-sans font-medium text-rose-900 text-[10.5px] leading-none uppercase mt-0.5 tracking-tight">YI</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="font-dfkai text-rose-950 text-[20px] leading-none font-normal">崇</span>
              <span className="font-sans font-medium text-rose-900 text-[10.5px] leading-none uppercase mt-0.5 tracking-tight">CHONG</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="font-dfkai text-rose-950 text-[20px] leading-none font-normal">德</span>
              <span className="font-sans font-medium text-rose-900 text-[10.5px] leading-none uppercase mt-0.5 tracking-tight">DE</span>
            </div>
          </div>
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
              const lunarFull = getLunarDateFallback(data.tanggalMasehi, data.tanggalLunar, data.waktu).replace(/[\r\n]+/g, ' ').trim();
              const formattedMasehi = formatGregorianDate(data.tanggalMasehi);
              value = lunarFull;
              subValue = formattedMasehi;
            } else if (field.id === 'pandita') {
              const cleanMandarin = (data.pandita || '').replace(/點傳師|点传师/g, '').replace(/\s+/g, ' ').trim();
              if (cleanMandarin) {
                value = cleanMandarin + '點傳師';
              }
              const rawPinyin = (data.panditaPinyin || '').trim()
                ? data.panditaPinyin
                : getPinyinFallback(cleanMandarin || data.pandita, data.panditaPinyin);
              const cleanPinyin = rawPinyin.replace(/\bPANDITA\b/gi, '').replace(/\s+/g, ' ').trim();
              subValue = cleanPinyin ? `PANDITA ${cleanPinyin}`.toUpperCase() : '';
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
              isSingleLineOnly={true}
            />
          );
        })}
      </div>
    </div>
  </div>
);

const getDynamicIdFontSize = (idStr: string) => {
  if (!idStr) return '9px';
  const cleanLen = idStr.replace(/\s+/g, '').length || idStr.length;
  if (cleanLen <= 6) return '9.5px';
  if (cleanLen <= 8) return '8.5px';
  if (cleanLen <= 10) return '7.5px';
  if (cleanLen <= 12) return '6.8px';
  if (cleanLen <= 15) return '6.0px';
  return '5.2px';
};

const BackSide = ({ data, forceSmall, innerRef, settings }: { data: Umat, forceSmall?: boolean, innerRef?: React.RefObject<HTMLDivElement | null>, settings: CardDesignSettings }) => (
  <div
    ref={innerRef}
    style={{ 
      width: '54mm', 
      height: '85.6mm',
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
                "leading-none font-normal",
                (/[\u4e00-\u9fa5]/.test(data.nama || data.namaIndonesia || '')) ? "font-dfkai" : "font-sans"
              )}
              style={{ 
                fontSize: (data.nama || data.namaIndonesia).length > 20 ? '11px' : 
                          (data.nama || data.namaIndonesia).length > 15 ? '13px' : 
                          (data.nama || data.namaIndonesia).length > 10 ? '15px' : '17px',
                fontWeight: 400
              }}
            >
              {data.nama || data.namaIndonesia}
            </p>
            {data.nama && data.namaPinyin && (
              <>
                <div className="w-[1px] h-3 bg-rose-300/40" />
                <p 
                  className="font-normal text-black uppercase font-sans tracking-tight"
                  style={{ 
                    fontSize: data.namaPinyin.length > 25 ? '8px' : 
                              data.namaPinyin.length > 20 ? '9px' : '11px',
                    fontWeight: 400
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
        "absolute z-30 bg-white/95 backdrop-blur-sm rounded-md flex flex-col items-center p-1 border border-stone-200/80 shadow-[0_1px_1px_rgba(0,0,0,0.03)] w-[56px] overflow-hidden",
        settings.qrPosition === 'bottom-right' && "bottom-3.5 right-3.5",
        settings.qrPosition === 'bottom-left' && "bottom-3.5 left-3.5",
        settings.qrPosition === 'top-left' && "top-3.5 left-3.5",
        settings.qrPosition === 'top-right' && "top-3.5 right-3.5",
        settings.qrPosition === 'bottom-center' && "bottom-3.5 left-1/2 -translate-x-1/2"
      )}>
        <div className="flex items-center justify-center">
          <QRCodeSVG value={data.noId || ''} size={48} fgColor="#000000" />
        </div>
        <div className={cn(
          "w-[48px] pt-1 flex-1 flex items-center select-all overflow-hidden leading-none",
          (data.noId || '').trim().length <= 1 ? "justify-center" : "justify-between"
        )}>
          {Array.from((data.noId || '').trim()).map((char, idx) => (
            <span 
              key={idx}
              className="font-mono font-semibold text-black text-center leading-none"
              style={{ 
                fontSize: getDynamicIdFontSize(data.noId)
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
  label, chLabel, value, subValue, isLast = false, isCentered = false, isLarge = false, isMasehi = false, forceSmall = false, isSingleLineOnly = true 
}) => {
  const valLen = value ? value.length : 0;
  const subValLen = subValue ? subValue.length : 0;

  const hasChineseValue = value ? /[\u4e00-\u9fa5]/.test(value) : false;
  const hasChineseSubValue = subValue ? /[\u4e00-\u9fa5]/.test(subValue) : false;

  // Dynamic font sizing: keep standard/large size when text fits, scale down ONLY when text exceeds available space (132px)
  let baseValueSize = 16.5;
  if (isMasehi) {
    baseValueSize = forceSmall ? 14.5 : 15.5;
  } else if (hasChineseValue) {
    baseValueSize = forceSmall ? 18.0 : 19.5;
  } else if (isSingleLineOnly || isLarge) {
    baseValueSize = forceSmall ? 17.5 : 18.5;
  } else {
    baseValueSize = forceSmall ? 16.0 : 17.0;
  }

  // Max safe width (px) inside Value box before text needs scaling down
  const maxSpaceWidth = forceSmall ? 116 : 124;

  const valueFitting = getFittedFontSize(value, baseValueSize, maxSpaceWidth, 4.8);
  const dynamicValueFontSize = valueFitting.fontSize;
  const dynamicValueLetterSpacing = valueFitting.letterSpacing;

  // Dynamic font sizing for subValue
  let baseSubValueSize = forceSmall ? 12.0 : 13.0;
  if (hasChineseSubValue) {
    baseSubValueSize = forceSmall ? 13.5 : 14.5;
  }

  const subValueFitting = getFittedFontSize(subValue || '', baseSubValueSize, maxSpaceWidth, 4.5);
  const dynamicSubValueFontSize = subValueFitting.fontSize;
  const dynamicSubValueLetterSpacing = subValueFitting.letterSpacing;

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
            "text-black leading-tight uppercase animate-fade-in font-normal whitespace-nowrap overflow-hidden",
            hasChineseValue ? "font-dfkai" : "font-sans",
            isCentered && "text-center"
          )}
          style={{ 
            fontSize: dynamicValueFontSize, 
            fontWeight: 400,
            letterSpacing: dynamicValueLetterSpacing !== 'normal' ? dynamicValueLetterSpacing : (isMasehi && valLen > 10 ? '-0.02em' : 'normal')
          }}
        >
          {value || '-'}
        </p>
        {subValue && (
          <p 
            className={cn(
              "text-black leading-tight uppercase animate-fade-in font-normal whitespace-nowrap overflow-hidden",
              hasChineseSubValue ? "font-dfkai" : "font-sans",
              isCentered && "text-center",
              forceSmall ? "mt-0" : "mt-0.5"
            )}
            style={{ 
              fontSize: dynamicSubValueFontSize, 
              fontWeight: 400,
              letterSpacing: dynamicSubValueLetterSpacing
            }}
          >
            {subValue}
          </p>
        )}
      </div>
    </div>
  );
}
