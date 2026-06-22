export interface Umat {
  id?: string;
  tanggalMasehi: string; // Format dd-mm-yyyy or ISO
  tanggalLunar: string; // Manual text lunar date
  pandita: string;
  panditaPinyin?: string;
  pengajak: string;
  pengajakPinyin?: string;
  penanggung: string;
  penanggungPinyin?: string;
  vihara: string;
  viharaPinyin?: string;
  nama: string;
  namaPinyin?: string;
  namaIndonesia: string;
  jabatanSuci: string;
  noId: string;
  phone: string;
  waktu?: string;
  lastPrintedAt?: string;
  createdAt: string;
}

export type UmatInput = Omit<Umat, 'id' | 'createdAt'>;
