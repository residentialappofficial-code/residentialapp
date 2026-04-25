export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // 1. Ambil data dari request (Multipart form data)
    const formData = await request.formData();
    const file = formData.get('file');
    const fileName = formData.get('fileName');

    if (!file || !fileName) {
      return new Response(JSON.stringify({ error: 'File atau FileName tidak ditemukan' }), { status: 400 });
    }

    // 2. Upload ke R2 menggunakan Binding
    // Menggunakan nama 'residentialapp' sesuai yang Anda set di dashboard
    const bucket = env.R2_BUCKET || env.residentialapp;

    if (!bucket) {
      return new Response(JSON.stringify({ error: 'R2 Bucket binding tidak ditemukan.' }), { status: 500 });
    }

    await bucket.put(fileName, file, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // 3. Kembalikan respons sukses
    // Ganti dengan domain publik R2 Anda jika sudah di-set (Custom Domain)
    // Jika belum, kita gunakan format URL default R2
    const publicUrl = `https://residential-assets.200885ebf70581b1a4e2aa0dc3a46148.r2.cloudflarestorage.com/${fileName}`;

    return new Response(JSON.stringify({ 
      success: true, 
      url: publicUrl 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
