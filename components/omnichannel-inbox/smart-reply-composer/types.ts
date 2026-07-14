import type { LucideIcon } from "lucide-react";

export type SmartReplyIconId =
  | "sparkles"
  | "file-text"
  | "package"
  | "calendar"
  | "wallet"
  | "languages"
  | "pen-line"
  | "notebook-pen"
  | "tag"
  | "message-square";

export type ComposerSuggestion = {
  preview: string;
};

export type QuickAction = {
  id: string;
  label: string;
  emoji?: string;
};

export type SlashCommand = {
  id: string;
  command: string;
  icon: SmartReplyIconId;
  title: string;
  description: string;
  keyboardHint?: string;
};

export type TemplateItem = {
  id: string;
  title: string;
  preview?: string;
};

export type RewriteOption = {
  id: string;
  label: string;
};

export type TranslationOption = {
  id: string;
  language: string;
};

/** Future-ready smart reply payload — mirrors upcoming assistant API. */
export type SmartReplyConfig = {
  suggestion: ComposerSuggestion | null;
  suggestionAvailable: boolean;
  quickActions: QuickAction[];
  commands: SlashCommand[];
  templates: TemplateItem[];
  rewriteOptions: RewriteOption[];
  translationOptions: TranslationOption[];
};

export type SmartReplyLabels = {
  suggestedReply: string;
  copy: string;
  insert: string;
  regenerate: string;
  dismiss: string;
  templatePickerTitle: string;
  templateSearchPlaceholder: string;
  rewriteMenuTitle: string;
  translateMenuTitle: string;
};

export type SmartReplyIconResolver = (iconId: SmartReplyIconId) => LucideIcon;
