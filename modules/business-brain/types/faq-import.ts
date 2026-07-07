export type ParsedFaqImportItem = {
  id?: string;
  importedFaqId?: string;
  productId?: string;
  question: string;
  triggerPhrases: string[];
  answer: string;
  nextStep?: string;
  rawText: string;
};

export type ParsedFaqImport = {
  faqs: ParsedFaqImportItem[];
  warnings: string[];
  ignoredSections: string[];
};

export type FaqImportApplyItem = {
  question: string;
  content: string;
};

export type FaqImportApplyResult = {
  created: number;
  skippedDuplicates: number;
  skippedInvalid: number;
  duplicateQuestions: string[];
};
