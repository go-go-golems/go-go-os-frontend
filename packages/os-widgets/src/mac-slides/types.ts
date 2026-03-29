export type SlideAlignment = 'auto' | 'center' | 'left';

export interface SlideDirective {
  align: SlideAlignment;
}

export interface SlideDocument {
  raw: string;
  content: string;
  align: SlideAlignment;
}

export interface MacSlidesDeck {
  markdown: string;
  slides: SlideDocument[];
}
