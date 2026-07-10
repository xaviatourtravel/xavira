"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { ComposerSuggestion } from "./composer-suggestion";
import { QuickActionRow } from "./quick-action-row";
import { RewriteMenu } from "./rewrite-menu";
import { SlashCommandMenu } from "./slash-command-menu";
import { TemplatePicker } from "./template-picker";
import { TranslateMenu } from "./translate-menu";
import { buildMockSmartReplyConfig } from "./mock-smart-reply";
import type {
  SlashCommand,
  SmartReplyConfig,
  SmartReplyLabels,
  TemplateItem,
} from "./types";

const AI_PANEL_QUICK_ACTION_IDS = new Set(["template", "rewrite", "translate"]);

type SmartReplySlots = {
  suggestionSlot: ReactNode;
  quickActionsSlot: ReactNode;
};

type SmartReplyComposerProps = {
  messageText: string;
  labels: SmartReplyLabels;
  config?: SmartReplyConfig;
  aiOpen?: boolean;
  onAiOpenChange?: (open: boolean) => void;
  onInsert: (text: string) => void;
  onClearInput?: () => void;
  children: (slots: SmartReplySlots) => ReactNode;
};

export function SmartReplyComposer({
  messageText,
  labels,
  config: configProp,
  aiOpen: aiOpenProp,
  onAiOpenChange,
  onInsert,
  onClearInput,
  children,
}: SmartReplyComposerProps) {
  const config = useMemo(
    () => configProp ?? buildMockSmartReplyConfig(),
    [configProp],
  );

  const [aiOpenInternal, setAiOpenInternal] = useState(false);
  const aiOpen = aiOpenProp ?? aiOpenInternal;
  const setAiOpen = onAiOpenChange ?? setAiOpenInternal;

  const [suggestionVisible, setSuggestionVisible] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [rewriteMenuOpen, setRewriteMenuOpen] = useState(false);
  const [translateMenuOpen, setTranslateMenuOpen] = useState(false);

  const slashMenuOpen = messageText.trimStart().startsWith("/");

  const closeMenus = useCallback(() => {
    setTemplatePickerOpen(false);
    setRewriteMenuOpen(false);
    setTranslateMenuOpen(false);
  }, []);

  useEffect(() => {
    if (aiOpen && config.suggestion) {
      setSuggestionVisible(true);
      return;
    }

    setSuggestionVisible(false);
    closeMenus();
  }, [aiOpen, closeMenus, config.suggestion]);

  const handleQuickAction = useCallback(
    (actionId: string) => {
      closeMenus();

      if (actionId === "template" || actionId === "package" || actionId === "quotation") {
        setTemplatePickerOpen(true);
        return;
      }

      if (actionId === "rewrite") {
        setRewriteMenuOpen(true);
        return;
      }

      if (actionId === "translate") {
        setTranslateMenuOpen(true);
        return;
      }
    },
    [closeMenus],
  );

  const handleSlashSelect = useCallback(
    (command: SlashCommand) => {
      onClearInput?.();

      if (command.id === "template" || command.id === "package" || command.id === "quotation") {
        setTemplatePickerOpen(true);
        return;
      }

      if (command.id === "rewrite") {
        setRewriteMenuOpen(true);
        return;
      }

      if (command.id === "translate") {
        setTranslateMenuOpen(true);
        return;
      }

      const template = config.templates.find((item) => item.id === command.id);
      if (template?.preview) {
        onInsert(template.preview);
      }
    },
    [config.templates, onClearInput, onInsert],
  );

  const handleTemplateSelect = useCallback(
    (template: TemplateItem) => {
      if (template.preview) {
        onInsert(template.preview);
      }
      setTemplatePickerOpen(false);
    },
    [onInsert],
  );

  const handleRewriteSelect = useCallback(() => {
    setRewriteMenuOpen(false);
  }, []);

  const handleTranslateSelect = useCallback(() => {
    setTranslateMenuOpen(false);
  }, []);

  const handleDismissSuggestion = useCallback(() => {
    setSuggestionVisible(false);
    setAiOpen(false);
  }, [setAiOpen]);

  const visibleQuickActions = useMemo(
    () => config.quickActions.filter((action) => AI_PANEL_QUICK_ACTION_IDS.has(action.id)),
    [config.quickActions],
  );

  const suggestionSlot =
    aiOpen && suggestionVisible && config.suggestion ? (
      <ComposerSuggestion
        suggestion={config.suggestion}
        labels={{
          suggestedReply: labels.suggestedReply,
          copy: labels.copy,
          insert: labels.insert,
          regenerate: labels.regenerate,
          dismiss: labels.dismiss,
        }}
        onInsert={() => {
          onInsert(config.suggestion!.preview);
          handleDismissSuggestion();
        }}
        onDismiss={handleDismissSuggestion}
      />
    ) : null;

  const quickActionsSlot =
    aiOpen && visibleQuickActions.length > 0 ? (
      <QuickActionRow actions={visibleQuickActions} onAction={handleQuickAction} />
    ) : null;

  return (
    <div className="relative">
      {slashMenuOpen ? (
        <SlashCommandMenu commands={config.commands} onSelect={handleSlashSelect} />
      ) : null}

      <RewriteMenu
        open={rewriteMenuOpen}
        options={config.rewriteOptions}
        title={labels.rewriteMenuTitle}
        onSelect={handleRewriteSelect}
      />

      <TranslateMenu
        open={translateMenuOpen}
        options={config.translationOptions}
        title={labels.translateMenuTitle}
        onSelect={handleTranslateSelect}
      />

      <TemplatePicker
        open={templatePickerOpen}
        templates={config.templates}
        labels={{
          templatePickerTitle: labels.templatePickerTitle,
          templateSearchPlaceholder: labels.templateSearchPlaceholder,
        }}
        onClose={() => setTemplatePickerOpen(false)}
        onSelect={handleTemplateSelect}
      />

      {children({ suggestionSlot, quickActionsSlot })}
    </div>
  );
}
