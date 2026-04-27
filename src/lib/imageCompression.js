/**
 * Mengompres gambar di sisi client menggunakan Canvas API
 * @param {File} file - File gambar asli
 * @param {Object} options - Opsi kompresi (maxWidth, quality)
 * @returns {Promise<Blob>} - Blob gambar yang sudah dikompres
 */
export const compressImage = (file, options = { maxWidth: 1024, quality: 0.6 }) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Hitung rasio untuk resize jika lebih lebar dari maxWidth
        if (width > options.maxWidth) {
          height = (options.maxWidth / width) * height;
          width = options.maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert ke blob dengan kualitas yang ditentukan
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          'image/jpeg',
          options.quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
