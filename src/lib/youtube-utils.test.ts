import { describe, it, expect } from 'vitest';
import { extractYouTubeVideoId, getYouTubeEmbedUrl, getEmbedUrlFromLocalPath } from './youtube-utils';

describe('YouTube Utils', () => {
  describe('extractYouTubeVideoId', () => {
    it('should extract video ID from watch URL', () => {
      const url = 'https://www.youtube.com/watch?v=BxML7V2GG4c';
      expect(extractYouTubeVideoId(url)).toBe('BxML7V2GG4c');
    });

    it('should extract video ID from live URL', () => {
      const url = 'https://www.youtube.com/live/BxML7V2GG4c?si=qlw-4-tCiPgjRFT_';
      expect(extractYouTubeVideoId(url)).toBe('BxML7V2GG4c');
    });

    it('should extract video ID from youtu.be URL', () => {
      const url = 'https://youtu.be/mjPM5zGiFQg';
      expect(extractYouTubeVideoId(url)).toBe('mjPM5zGiFQg');
    });

    it('should return null for invalid URL', () => {
      const url = 'https://example.com/invalid';
      expect(extractYouTubeVideoId(url)).toBeNull();
    });
  });

  describe('getYouTubeEmbedUrl', () => {
    it('should convert YouTube URL to embed format', () => {
      const url = 'https://www.youtube.com/live/BxML7V2GG4c?si=qlw-4-tCiPgjRFT_';
      expect(getYouTubeEmbedUrl(url)).toBe('https://www.youtube.com/embed/BxML7V2GG4c');
    });

    it('should return null for invalid URL', () => {
      const url = 'https://example.com/invalid';
      expect(getYouTubeEmbedUrl(url)).toBeNull();
    });
  });

  describe('getEmbedUrlFromLocalPath', () => {
    it('should convert local path to YouTube embed URL', () => {
      const localPath = '/JEE_Physics_Videos/1.mp4';
      expect(getEmbedUrlFromLocalPath(localPath)).toBe('https://www.youtube.com/embed/BxML7V2GG4c');
    });

    it('should return null for unmapped local path', () => {
      const localPath = '/unknown/path.mp4';
      expect(getEmbedUrlFromLocalPath(localPath)).toBeNull();
    });
  });
});