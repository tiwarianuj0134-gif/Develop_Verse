/**
 * YouTube utility functions for converting URLs to embed format
 */

/**
 * Extracts video ID from various YouTube URL formats
 * @param url - YouTube URL (watch, live, or youtu.be format)
 * @returns Video ID or null if invalid
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Converts YouTube URL to embed format
 * @param url - YouTube URL
 * @returns Embed URL or null if invalid
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    return null;
  }

  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * YouTube video mapping from local paths to YouTube URLs
 */
export const videoMappings = {
  // JEE MAINS & ADVANCED
  "/JEE_Physics_Videos/1.mp4": "https://www.youtube.com/live/BxML7V2GG4c?si=qlw-4-tCiPgjRFT_",
  "/JEE_Physical_Videos/1.mp4": "https://www.youtube.com/live/lN27tr0vCyY?si=mreA6uBs5oTQVvJN",
  "/JEE_Inorganic_Videos/1.mp4": "https://www.youtube.com/live/XNejTlN9Lc4?si=Hi9LAPWBuQ5N2NkQ",
  "/JEE_Organin_Videos/1.mp4": "https://www.youtube.com/live/LmdwWl85Ulw?si=hrYtPLEvF4rtIaKI",
  "/JEE_Maths_Videos/1.mp4": "https://www.youtube.com/live/I3O9dzuHZw8?si=13HtLHo0epcltEyX",
  
  // UPSC
  "/UPSC_History_Videos/1.mp4": "https://youtu.be/mjPM5zGiFQg",
  "/UPSC_Culture_Videos/1.mp4": "https://youtu.be/VxG4MgN7P7k",
  "/UPSC_Economy_Videos/1.mp4": "https://youtu.be/BMORCGp_83A",
  "/UPSC_Constitution_Videos/1.mp4": "https://youtu.be/jxMMdnA_d0Q",
  
  // NDA
  "/NDA_Maths_Videos/1.mp4": "https://www.youtube.com/live/9YYOndvZbMU",
  "/NDA_GAT_Videos/1.mp4": "https://www.youtube.com/live/OEVz_Vgx7-Y",
  
  // CUET
  "/CUET_Accountancy_Videos/1.mp4": "https://www.youtube.com/live/X4hOrpf0H4c",
  "/CUET_Chemistry_Videos/1.mp4": "https://www.youtube.com/live/wEI8mOhsYjI",
  "/CUET_English_Videos/1.mp4": "https://www.youtube.com/live/neCmhR-nIZI",
  "/CUET_History_Videos/1.mp4": "https://youtu.be/2FiU7Uc5VDw",
  "/CUET_Physics_Videos/1.mp4": "https://www.youtube.com/live/S6vQPKaTyYA",
  
  // NEET
  "/NEET_Physics_Videos/1.mp4": "https://www.youtube.com/live/d3OF8LVLpak",
  "/NEET_Chemistry_Videos/1.mp4": "https://www.youtube.com/live/M5C3q6ioDr0",
  "/NEET_Biology_Videos/1.mp4": "https://www.youtube.com/live/LuYg6L4pNnE",
};

/**
 * Gets YouTube embed URL from local video path
 * @param localPath - Local video file path
 * @returns YouTube embed URL or null if not found
 */
export function getEmbedUrlFromLocalPath(localPath: string): string | null {
  const youtubeUrl = videoMappings[localPath as keyof typeof videoMappings];
  if (!youtubeUrl) {
    return null;
  }
  
  return getYouTubeEmbedUrl(youtubeUrl);
}