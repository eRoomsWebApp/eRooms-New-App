
/**
 * Transforms a Google Drive share link into a direct image URL.
 * Supports various formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 */
export const transformDriveUrl = (url: string | undefined | null): string | null => {
  if (!url) return null;
  
  // If it's already a direct link or not a drive link, return as is
  if (!url.includes('drive.google.com')) return url;

  try {
    let fileId = '';
    
    // Pattern 1: /file/d/FILE_ID/
    const fileDMatch = url.match(/\/file\/d\/([^/?]+)/);
    if (fileDMatch && fileDMatch[1]) {
      fileId = fileDMatch[1];
    } 
    // Pattern 2: ?id=FILE_ID
    else {
      const urlObj = new URL(url);
      fileId = urlObj.searchParams.get('id') || '';
    }

    if (fileId) {
      // Using the lh3.googleusercontent.com format which is more reliable for direct embedding
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  } catch (e) {
    console.error('Error parsing Drive URL:', e);
  }

  return url;
};
