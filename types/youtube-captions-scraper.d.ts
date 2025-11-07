declare module 'youtube-captions-scraper' {
  export interface SubtitleOptions {
    videoID: string;
    lang?: string;
  }

  export interface Subtitle {
    text: string;
    dur: number;
    start: number;
  }

  export function getSubtitles(options: SubtitleOptions): Promise<Subtitle[]>;
}
