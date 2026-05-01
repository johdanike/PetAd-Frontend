import { apiClient } from "../lib/api-client";
import { useApiQuery } from "./useApiQuery";
import type { NotificationPreferences } from "../types/notifications";

export const useNotificationPreferences = () => {
  return useApiQuery<NotificationPreferences>(
    ["notificationPreferences"],
    () => apiClient.get<NotificationPreferences>("/notifications/preferences"),
  );
};
