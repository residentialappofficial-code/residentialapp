/**
 * Finance utilities for HABITIX
 */

/**
 * Calculates financial obligation and payments for a resident
 * @param {Object} warga - Warga object containing handover date and ID
 * @param {Object} iuranConfig - Configuration containing base tariff
 * @param {Array} allBills - List of all bills/payments
 * @param {Date} now - Current date for calculation (useful for testing)
 * @returns {Object|null} - Finance data or null if invalid
 */
export const calculateFinance = (warga, iuranConfig, allBills, now = new Date()) => {
  if (!iuranConfig || !warga) return null;
  
  // Priority: 1. Official column, 2. Block info, 3. Creation date
  let tglSerahTerimaRaw = warga.tgl_serah_terima || warga.blok_info?.tgl_serah_terima || warga.created_at;
  
  if (!tglSerahTerimaRaw) return null;

  const tglSerahTerima = new Date(tglSerahTerimaRaw);
  if (isNaN(tglSerahTerima.getTime())) return null;

  // Rumus: (Selisih Tahun * 12) + Selisih Bulan + 1 (Bulan ini dihitung penuh)
  const totalMonths = (now.getFullYear() - tglSerahTerima.getFullYear()) * 12 + (now.getMonth() - tglSerahTerima.getMonth()) + 1;
  
  let nominalBulanan = iuranConfig.iuran_bulanan || iuranConfig.tarif_dasar || 0;
  if (iuranConfig.hitung_per_m2) {
    const luasTanah = warga.blok?.luas_tanah || warga.luas_tanah || 0;
    nominalBulanan = nominalBulanan * luasTanah;
  }

  const totalObligation = Math.max(0, totalMonths) * nominalBulanan;
  
  const totalPaid = (allBills || [])
    .filter(b => b.warga_id === warga.id && b.status === 'Paid')
    .reduce((sum, b) => sum + Number(b.jumlah || 0), 0);
  
  const diff = totalPaid - totalObligation;
  
  return {
    tglSerahTerima,
    totalMonths: Math.max(0, totalMonths),
    nominalBulanan,
    totalObligation,
    totalPaid,
    diff,
    kurang: diff < 0 ? Math.abs(diff) : 0,
    lebih: diff > 0 ? diff : 0
  };
};

/**
 * Formats currency to Indonesian Rupiah (without prefix)
 * @param {number} amount 
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID').format(amount || 0);
};

/**
 * Formats date to Indonesian locale (Day Month Year)
 * @param {Date|string} date 
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};
