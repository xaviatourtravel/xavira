"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { MoreVertical } from "lucide-react";

import {
  AURORA_CONVERSATION_ACTIONS_MENU,
  AURORA_CONVERSATION_ACTIONS_MENU_DIVIDER,
} from "@/components/workspace/aurora-tokens";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";

import { ConversationActionMenuSection } from "./conversation-action-menu-section";
import {
  ArchiveConversationAction,
  AssignOwnerAction,
  CopyPhoneNumberAction,
  DeleteConversationAction,
  MarkUnreadAction,
  OpenCustomerProfileAction,
  PinConversationAction,
  TransferConversationAction,
} from "./conversation-action-items";
import { ConversationHeaderActionButton } from "./conversation-header-action-button";

type ConversationActionsMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ConversationActionsMenu({
  open,
  onOpenChange,
}: ConversationActionsMenuProps) {
  const { ti } = useInboxTranslation();
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const closeMenu = useCallback(() => {
    onOpenChange(false);
    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }, [onOpenChange]);

  const handlePlaceholderSelect = useCallback(() => {
    closeMenu();
  }, [closeMenu]);

  const registerItemRef = useCallback((index: number, node: HTMLButtonElement | null) => {
    itemRefs.current[index] = node;
  }, []);

  const focusItem = useCallback((index: number) => {
    const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
    if (items.length === 0) {
      return;
    }

    const normalizedIndex = ((index % items.length) + items.length) % items.length;
    items[normalizedIndex]?.focus();
  }, []);

  const handleMenuKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
      const currentIndex = items.findIndex((item) => item === document.activeElement);

      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (items.length === 0) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusItem(currentIndex + 1);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        focusItem(currentIndex <= 0 ? items.length - 1 : currentIndex - 1);
      }
    },
    [closeMenu, focusItem],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    requestAnimationFrame(() => {
      const firstItem = itemRefs.current.find(Boolean);
      firstItem?.focus();
    });

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      closeMenu();
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [closeMenu, open]);

  let itemIndex = 0;

  function bindItem(index: number) {
    return {
      itemRef: (node: HTMLButtonElement | null) => registerItemRef(index, node),
      tabIndex: open && index === 0 ? 0 : -1,
      onSelect: handlePlaceholderSelect,
    };
  }

  const communicationStart = itemIndex;
  itemIndex += 3;
  const ownershipStart = itemIndex;
  itemIndex += 2;
  const customerStart = itemIndex;
  itemIndex += 2;
  const dangerStart = itemIndex;

  return (
    <div ref={menuRef} className="relative shrink-0">
      <ConversationHeaderActionButton
        buttonRef={triggerRef}
        label={ti("conversationMenu")}
        active={open}
        ariaExpanded={open}
        onClick={() => onOpenChange(!open)}
      >
        <MoreVertical className="h-4 w-4" />
      </ConversationHeaderActionButton>

      {open ? (
        <div
          role="menu"
          aria-label={ti("conversationMenu")}
          onKeyDown={handleMenuKeyDown}
          className={AURORA_CONVERSATION_ACTIONS_MENU}
        >
          <ConversationActionMenuSection label={ti("menuSectionCommunication")}>
            <MarkUnreadAction {...bindItem(communicationStart)} />
            <ArchiveConversationAction {...bindItem(communicationStart + 1)} />
            <PinConversationAction {...bindItem(communicationStart + 2)} />
          </ConversationActionMenuSection>

          <div className={AURORA_CONVERSATION_ACTIONS_MENU_DIVIDER} aria-hidden />

          <ConversationActionMenuSection label={ti("menuSectionOwnership")}>
            <AssignOwnerAction {...bindItem(ownershipStart)} />
            <TransferConversationAction {...bindItem(ownershipStart + 1)} />
          </ConversationActionMenuSection>

          <div className={AURORA_CONVERSATION_ACTIONS_MENU_DIVIDER} aria-hidden />

          <ConversationActionMenuSection label={ti("menuSectionCustomer")}>
            <OpenCustomerProfileAction {...bindItem(customerStart)} />
            <CopyPhoneNumberAction {...bindItem(customerStart + 1)} />
          </ConversationActionMenuSection>

          <div className={AURORA_CONVERSATION_ACTIONS_MENU_DIVIDER} aria-hidden />

          <ConversationActionMenuSection label={ti("menuSectionDanger")}>
            <DeleteConversationAction {...bindItem(dangerStart)} />
          </ConversationActionMenuSection>
        </div>
      ) : null}
    </div>
  );
}
