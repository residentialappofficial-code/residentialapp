import { describe, it, expect } from 'vitest';
import { calculateFinance } from '../../utils/financeUtils';

describe('ResidentFees Calculation Logic', () => {
  const mockConfig = { tarif_dasar: 100000 };
  const now = new Date('2026-05-10');

  it('calculates obligation correctly for 5 months', () => {
    const warga = { 
        id: 'w1', 
        tgl_serah_terima: '2026-01-01' // Jan, Feb, Mar, Apr, May = 5 months
    };
    const bills = [
        { warga_id: 'w1', jumlah: 100000, status: 'Paid', bulan: 1, tahun: 2026 },
        { warga_id: 'w1', jumlah: 100000, status: 'Paid', bulan: 2, tahun: 2026 }
    ];

    const result = calculateFinance(warga, mockConfig, bills, now);

    expect(result.totalMonths).toBe(5);
    expect(result.totalObligation).toBe(500000);
    expect(result.totalPaid).toBe(200000);
    expect(result.kurang).toBe(300000);
    expect(result.lebih).toBe(0);
  });

  it('handles negative months (future handover) gracefully', () => {
    const warga = { 
        id: 'w2', 
        tgl_serah_terima: '2026-06-01' 
    };
    const result = calculateFinance(warga, mockConfig, [], now);
    
    // May - June = -1 month + 1 = 0 months of obligation
    expect(result.totalMonths).toBe(0);
    expect(result.totalObligation).toBe(0);
  });

  it('falls back to created_at if tgl_serah_terima is missing', () => {
    const warga = { 
        id: 'w3', 
        created_at: '2026-04-01' 
    };
    const result = calculateFinance(warga, mockConfig, [], now);
    
    // Apr, May = 2 months
    expect(result.totalMonths).toBe(2);
    expect(result.totalObligation).toBe(200000);
  });

  it('falls back to blok_info.tgl_serah_terima if warga.tgl_serah_terima is missing', () => {
    const warga = { 
        id: 'w5', 
        blok_info: { tgl_serah_terima: '2026-03-01' },
        created_at: '2026-04-01' 
    };
    const result = calculateFinance(warga, mockConfig, [], now);
    
    // Mar, Apr, May = 3 months
    expect(result.totalMonths).toBe(3);
    expect(result.totalObligation).toBe(300000);
  });

  it('calculates "Lebih" correctly when user overpays', () => {
    const warga = { id: 'w4', tgl_serah_terima: '2026-05-01' };
    const bills = [
        { warga_id: 'w4', jumlah: 300000, status: 'Paid', bulan: 5, tahun: 2026 }
    ];
    
    const result = calculateFinance(warga, mockConfig, bills, now);
    
    expect(result.totalMonths).toBe(1);
    expect(result.totalObligation).toBe(100000);
    expect(result.totalPaid).toBe(300000);
    expect(result.lebih).toBe(200000);
    expect(result.kurang).toBe(0);
  });
});
