"use client";

import {
  Archive,
  ArrowRightLeft,
  Copy,
  MailOpen,
  Pin,
  Trash2,
  User,
  UserCog,
} from "lucide-react";

import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";

import {
  ConversationActionMenuItem,
} from "./conversation-action-menu-item";

type ConversationActionItemProps = {
  onSelect: () => void;
  itemRef?: React.Ref<HTMLButtonElement>;
  tabIndex?: number;
};

export function MarkUnreadAction({
  itemRef,
  ...props
}: ConversationActionItemProps) {
  const { ti } = useInboxTranslation();

  return (
    <ConversationActionMenuItem
      ref={itemRef}
      icon={<MailOpen className="h-4 w-4" />}
      label={ti("markUnread")}
      shortcut="⌘U"
      {...props}
    />
  );
}

export function ArchiveConversationAction({
  itemRef,
  ...props
}: ConversationActionItemProps) {
  const { ti } = useInboxTranslation();

  return (
    <ConversationActionMenuItem
      ref={itemRef}
      icon={<Archive className="h-4 w-4" />}
      label={ti("archiveConversation")}
      shortcut="⌘A"
      {...props}
    />
  );
}

export function PinConversationAction({
  itemRef,
  ...props
}: ConversationActionItemProps) {
  const { ti } = useInboxTranslation();

  return (
    <ConversationActionMenuItem
      ref={itemRef}
      icon={<Pin className="h-4 w-4" />}
      label={ti("pinConversation")}
      shortcut="⌘P"
      {...props}
    />
  );
}

export function AssignOwnerAction({
  itemRef,
  ...props
}: ConversationActionItemProps) {
  const { ti } = useInboxTranslation();

  return (
    <ConversationActionMenuItem
      ref={itemRef}
      icon={<UserCog className="h-4 w-4" />}
      label={ti("assignOwner")}
      shortcut="⌘⇧O"
      {...props}
    />
  );
}

export function TransferConversationAction({
  itemRef,
  ...props
}: ConversationActionItemProps) {
  const { ti } = useInboxTranslation();

  return (
    <ConversationActionMenuItem
      ref={itemRef}
      icon={<ArrowRightLeft className="h-4 w-4" />}
      label={ti("transferConversation")}
      shortcut="⌘T"
      {...props}
    />
  );
}

export function OpenCustomerProfileAction({
  itemRef,
  ...props
}: ConversationActionItemProps) {
  const { ti } = useInboxTranslation();

  return (
    <ConversationActionMenuItem
      ref={itemRef}
      icon={<User className="h-4 w-4" />}
      label={ti("openCustomerProfile")}
      shortcut="⌘⇧P"
      {...props}
    />
  );
}

export function CopyPhoneNumberAction({
  itemRef,
  ...props
}: ConversationActionItemProps) {
  const { ti } = useInboxTranslation();

  return (
    <ConversationActionMenuItem
      ref={itemRef}
      icon={<Copy className="h-4 w-4" />}
      label={ti("copyPhoneNumber")}
      shortcut="⌘⇧C"
      {...props}
    />
  );
}

export function DeleteConversationAction({
  itemRef,
  ...props
}: ConversationActionItemProps) {
  const { ti } = useInboxTranslation();

  return (
    <ConversationActionMenuItem
      ref={itemRef}
      icon={<Trash2 className="h-4 w-4" />}
      label={ti("deleteConversation")}
      shortcut="⌘⌫"
      destructive
      {...props}
    />
  );
}
