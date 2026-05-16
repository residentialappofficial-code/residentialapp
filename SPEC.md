# Spec: Global Design System Standardization (AI Trading Style)

## Objective
Mengekstrak gaya visual dari Dashboard yang baru (tema terang, border halus, desain minimalis premium) menjadi **Design System Utama** pada komponen dasar (`src/components/ui/`). Setelah itu, mengimplementasikan komponen-komponen baru ini secara konsisten di **seluruh halaman aplikasi** untuk menggantikan gaya desain yang lama.

## Assumptions I'm Making
1. **Definisi Gaya Baru**: Desain baru dicirikan oleh: latar belakang putih (`bg-white`), border abu-abu sangat tipis (`border-slate-100/200`), *shadow* yang sangat halus (`shadow-sm`) atau tanpa bayangan, sudut agak membulat (`rounded-xl` atau `rounded-2xl` untuk kartu utama), serta tipografi bersih (tidak berlebihan menggunakan `uppercase` atau `font-black`).
2. **Skala Pengerjaan**: Mengubah semua halaman sekaligus sangat berisiko memecahkan fungsionalitas. Oleh karena itu, pengerjaan harus dilakukan bertahap (Komponen UI dasar -> Halaman Utama -> Halaman Warga -> Sisanya).
3. **Komponen Inti**: `Card.jsx`, `Button.jsx`, `Input.jsx`, `Table.jsx`, `Select.jsx`, `Badge.jsx`, dan `Modal.jsx` akan direfaktor ulang secara total.
4. Fungsi bisnis (pemanggilan data Supabase, state management, form handlers) tidak boleh ada yang berubah di halaman manapun.
5. Jika ada komponen *Chakra UI* yang digunakan, akan diselaraskan gayanya agar terlihat sama persis dengan sistem Tailwind kita, atau diganti dengan komponen Tailwind murni agar 100% konsisten.

**→ Please correct any of these assumptions if they are wrong.**

## Tech Stack
- React + Vite
- Tailwind CSS (satu-satunya referensi sumber gaya / source of truth untuk komponen UI dasar)
- Lucide React (ikon)

## Commands
```bash
Dev: npm run dev
Build: npm run build
Lint: npm run lint
```

## Project Structure
File yang akan dimodifikasi:
```
src/components/ui/           → Semua file dasar (Button, Card, Input, Table, dll)
src/pages/                   → Refaktor kelas Tailwind pada semua halaman agar selaras
src/pages/warga/             → Refaktor halaman warga
```

## Code Style
```jsx
// Contoh Card Design System Baru
export const Card = ({ children, className = "", noPadding = false }) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 ${noPadding ? "" : "p-5"} ${className}`}>
      {children}
    </div>
  );
};

// Contoh Button Design System Baru
export const Button = ({ variant = "primary", ...props }) => {
  // primary: bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg
  // outline: border border-slate-200 text-slate-700 hover:bg-slate-50
  // ghost: text-slate-500 hover:bg-slate-50 hover:text-slate-900
};
```

## Testing Strategy
- **Visual Regression**: Membuka setiap rute secara manual untuk memastikan UI tidak rusak.
- **Form Testing**: Memastikan form input, select, dan modal masih bisa mengetik, menyimpan, dan berinteraksi.
- **Component Consistency**: Memastikan tidak ada lagi sisa komponen bergaya lama (misalnya tombol dengan gradien tebal, bayangan `shadow-2xl`, dll).

## Boundaries
- **Always do**: Gunakan komponen dari `src/components/ui/` di setiap halaman. Hapus kelas Tailwind *inline* yang memaksa gaya lama.
- **Ask first**: Jika sebuah halaman memiliki komponen khusus (seperti kanvas atau peta) yang sulit diselaraskan gayanya tanpa merusaknya.
- **Never do**: Menghapus logika state (`useState`, `useEffect`) atau fungsi *submit* di form saat mengganti elemen UI.

## Success Criteria
- Seluruh 17+ halaman aplikasi (Data Warga, Arus Kas, Tagihan, Forum, dll) menggunakan `Card` dan `Button` gaya baru yang konsisten.
- Tidak ada halaman yang terlihat kontras (gaya lama bercampur gaya baru).
- Seluruh form dan tabel terlihat seragam.

## Open Questions
1. **Eksekusi Bertahap**: Mengingat besarnya cakupan (seluruh aplikasi), apakah Anda setuju jika kita mengeksekusinya dalam beberapa fase terpisah? (Misal: Fase 1 = Komponen Dasar, Fase 2 = Semua Halaman Admin, Fase 3 = Halaman Warga).
2. **Penanganan Chakra UI**: Kita memiliki folder `src/components/ui/chakra`. Apakah komponen Chakra ini juga ingin direfaktor gaya CSS-nya (karena Chakra menggunakan sistem token bawaan), atau haruskah kita menggantinya murni ke versi Tailwind `components/ui/` saja demi keseragaman maksimal?
