/**
 * Transforms a Google Drive share link into a direct image URL.
 * Supports optional width resizing (`=w400` for cards, `=w800` for profile pages).
 */
export const transformDriveUrl = (
  url: string | undefined | null,
  width?: 400 | 800 | number
): string => {
  if (!url) return '';

  let directUrl = url;

  if (url.includes('drive.google.com')) {
    try {
      let fileId = '';
      const fileDMatch = url.match(/\/file\/d\/([^/?]+)/);
      if (fileDMatch && fileDMatch[1]) {
        fileId = fileDMatch[1];
      } else {
        const urlObj = new URL(url);
        fileId = urlObj.searchParams.get('id') || '';
      }

      if (fileId) {
        directUrl = `https://lh3.googleusercontent.com/u/0/d/${fileId}`;
      }
    } catch {
      return url;
    }
  }

  if (width && directUrl.includes('googleusercontent.com')) {
    const cleaned = directUrl.replace(/=w\d+(-h\d+)?(-no)?$/, '');
    return `${cleaned}=w${width}`;
  }

  return directUrl;
};
