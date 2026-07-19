import "server-only";

import { cache } from "react";
import { getNotificationCenterSnapshot } from "@/services/notifications-service";

export const getInitialNotificationSnapshot = cache(() =>
  getNotificationCenterSnapshot(6),
);
