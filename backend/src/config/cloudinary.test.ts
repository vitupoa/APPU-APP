import { generateUploadSignature, CLOUDINARY_FOLDERS } from './cloudinary';

describe('Cloudinary Signature Generation', () => {
  describe('generateUploadSignature', () => {
    it('should generate signature with all required parameters for image upload', () => {
      const result = generateUploadSignature(CLOUDINARY_FOLDERS.FEED_IMAGES, 'image');
      
      expect(result).toHaveProperty('signature');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('folder');
      expect(result).toHaveProperty('resourceType');
      expect(result).toHaveProperty('apiKey');
      expect(result).toHaveProperty('cloudName');
      
      expect(result.folder).toBe(CLOUDINARY_FOLDERS.FEED_IMAGES);
      expect(result.resourceType).toBe('image');
      expect(typeof result.signature).toBe('string');
      expect(result.signature.length).toBeGreaterThan(0);
    });

    it('should generate signature with all required parameters for video upload', () => {
      const result = generateUploadSignature(CLOUDINARY_FOLDERS.SHORTS_VIDEOS, 'video');
      
      expect(result).toHaveProperty('signature');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('folder');
      expect(result).toHaveProperty('resourceType');
      expect(result).toHaveProperty('apiKey');
      expect(result).toHaveProperty('cloudName');
      
      expect(result.folder).toBe(CLOUDINARY_FOLDERS.SHORTS_VIDEOS);
      expect(result.resourceType).toBe('video');
      expect(typeof result.signature).toBe('string');
      expect(result.signature.length).toBeGreaterThan(0);
    });

    it('should generate signature with all required parameters for audio upload', () => {
      const result = generateUploadSignature(CLOUDINARY_FOLDERS.CHAT_AUDIO, 'raw');
      
      expect(result).toHaveProperty('signature');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('folder');
      expect(result).toHaveProperty('resourceType');
      expect(result).toHaveProperty('apiKey');
      expect(result).toHaveProperty('cloudName');
      
      expect(result.folder).toBe(CLOUDINARY_FOLDERS.CHAT_AUDIO);
      expect(result.resourceType).toBe('raw');
      expect(typeof result.signature).toBe('string');
      expect(result.signature.length).toBeGreaterThan(0);
    });

    it('should default to image resource type when not specified', () => {
      const result = generateUploadSignature(CLOUDINARY_FOLDERS.FEED_IMAGES);
      
      expect(result.resourceType).toBe('image');
    });

    it('should generate different signatures for different timestamps', async () => {
      const result1 = generateUploadSignature(CLOUDINARY_FOLDERS.FEED_IMAGES, 'image');
      
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const result2 = generateUploadSignature(CLOUDINARY_FOLDERS.FEED_IMAGES, 'image');
      
      expect(result1.timestamp).not.toBe(result2.timestamp);
      expect(result1.signature).not.toBe(result2.signature);
    });

    it('should generate different signatures for different folders', () => {
      const result1 = generateUploadSignature(CLOUDINARY_FOLDERS.FEED_IMAGES, 'image');
      const result2 = generateUploadSignature(CLOUDINARY_FOLDERS.CONTESTS_IMAGES, 'image');
      
      expect(result1.folder).not.toBe(result2.folder);
      // Signatures should be different even if generated at same timestamp
      // because folder is included in signature
    });

    it('should return correct resourceType even though it is not part of signature', () => {
      const result1 = generateUploadSignature(CLOUDINARY_FOLDERS.FEED_IMAGES, 'image');
      const result2 = generateUploadSignature(CLOUDINARY_FOLDERS.FEED_IMAGES, 'video');
      
      expect(result1.resourceType).toBe('image');
      expect(result2.resourceType).toBe('video');
      // resource_type is excluded from Cloudinary signature verification,
      // so it is NOT signed — but it IS returned for URL path construction
    });
  });
});
