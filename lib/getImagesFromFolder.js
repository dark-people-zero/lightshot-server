// file: lib/getImagesFromFolder.js
const fs = require("fs");
const path = require("path");
const { formatToJakarta } = require("./formatDate");

const uploadsDir = path.join(process.cwd(), "upload");

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp)$/i;

// helper: parse tanggal string `YYYY-MM-DD` ke Date (UTC, tapi dianggap +7)
function parseDateRange(start, end) {
    let startDate = null;
    let endDate = null;

    if (start) {
        // jam 00:00:00 di zona +7
        startDate = new Date(`${start}T00:00:00+07:00`);
    }
    if (end) {
        // jam 23:59:59 di zona +7
        endDate = new Date(`${end}T23:59:59+07:00`);
    }

    return { startDate, endDate };
}

// helper: cek apakah date berada dalam range (kalau start/end ada)
function isWithinRange(date, startDate, endDate) {
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
}

/**
 * Ambil list gambar dari folder dengan:
 * - pagination
 * - search (nama file / url path)
 * - filter tanggal (start, end) format YYYY-MM-DD (zona +7)
 *
 * @param {object} options
 *  page: nomor halaman (1-based)
 *  limit: item per halaman
 *  q: keyword search
 *  start: tanggal mulai (YYYY-MM-DD)
 *  end: tanggal akhir (YYYY-MM-DD)
 */
function getImagesFromFolder(options = {}) {
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;
    const q = (options.q || "").trim().toLowerCase();
    const start = options.start || "";
    const end = options.end || "";

    const { startDate, endDate } = parseDateRange(start, end);

    // baca semua file
    const allFiles = fs.readdirSync(uploadsDir);

    // filter hanya image
    const imageFiles = allFiles.filter((file) => IMAGE_EXT.test(file));

    // mapping ke objek dengan stat
    let items = imageFiles.map((file) => {
        const fullPath = path.join(uploadsDir, file);
        const stat = fs.statSync(fullPath);
        const uploadedAt = stat.birthtime || stat.mtime;

        return {
            name: file,
            // URL relatif seperti contoh: /i/04362f97.png
            url: `/i/${file}`,
            uploadedAt,
            uploadedAtFormatted: formatToJakarta(uploadedAt),
        };
    });

    // --- FILTER PENCARIAN (nama / url) ---
    if (q) {
        items = items.filter((item) => {
            const name = item.name.toLowerCase();
            const url = item.url.toLowerCase();

            // supaya bisa search pakai:
            // - nama file: "04362f97.png"
            // - path url: "/i/04362f97.png"
            // - bahkan full url "http://127.0.0.1:12345/i/04362f97.png"
            return (
                name.includes(q) ||
                url.includes(q) ||
                q.includes(name) ||
                q.includes(url)
            );
        });
    }

    // --- FILTER TANGGAL ---
    if (startDate || endDate) {
        items = items.filter((item) =>
            isWithinRange(item.uploadedAt, startDate, endDate)
        );
    }

    // opsional: sort by tanggal terbaru dulu
    items.sort((a, b) => b.uploadedAt - a.uploadedAt);

    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(Math.max(page, 1), totalPages);

    const startIndex = (safePage - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedItems = items.slice(startIndex, endIndex);

    return {
        images: paginatedItems,
        page: safePage,
        limit,
        totalItems,
        totalPages,
    };
}

module.exports = { getImagesFromFolder };
