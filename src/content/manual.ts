import chapters from './user-manual.json';

export interface ManualChapter {
  slug: string;
  title: string;
  group: string;
  content: string;
}

export const manualChapters: ManualChapter[] = chapters;
