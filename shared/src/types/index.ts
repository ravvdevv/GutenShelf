export type Book = {
  id: number;
  title: string;
  authors: { name: string; birth_year: number; death_year: number }[];
  subjects: string[];
  bookshelves: string[];
  languages: string[];
  copyright: boolean;
  media_type: string;
  formats: { [key: string]: string };
  download_count: number;
};

export type ApiResponse = {
  message: string;
  success: boolean;
};

export type GutendexResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Book[];
};