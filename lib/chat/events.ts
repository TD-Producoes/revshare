export const CHAT_DRAWER_OPEN_EVENT = "revshare:chat:open";

export type ChatDrawerOpenDetail = {
  requestId: number;
  projectId?: string;
  counterpartyId?: string;
};

export function openGlobalChatDrawer(
  detail?: Omit<ChatDrawerOpenDetail, "requestId">,
) {
  if (typeof window === "undefined") return;
  const payload: ChatDrawerOpenDetail = {
    requestId: Date.now(),
    ...detail,
  };
  window.dispatchEvent(
    new CustomEvent<ChatDrawerOpenDetail>(CHAT_DRAWER_OPEN_EVENT, {
      detail: payload,
    }),
  );
}
