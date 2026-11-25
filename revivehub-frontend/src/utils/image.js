// Shrinks a photo so it fits in browser storage (photos are stored with the listing for now; later they can go to Cloudinary).
// The real backend will upload the original file to storage (for example
// Cloudinary or S3) and save just the image URL in MongoDB.

const MAX_WIDTH = 700;

export function resizeImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error(`"${file.name}" is not an image.`));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_WIDTH / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read "${file.name}".`));
    };
    img.src = url;
  });
}
