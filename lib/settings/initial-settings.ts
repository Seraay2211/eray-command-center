import "server-only";

import { cache } from "react";
import { getOrCreateUserSettings } from "@/services/settings-service";

export const getInitialUserSettings = cache(() => getOrCreateUserSettings());
