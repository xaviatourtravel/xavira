import { InboxPageSkeleton } from "@/components/omnichannel-inbox/inbox-page-skeleton";

export default function InboxLoading() {
  return (
    <div className="h-full min-h-0">
      <InboxPageSkeleton />
    </div>
  );
}
