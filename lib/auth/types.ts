export type ActionResult<T = undefined> =
  | { success: true; message?: string; data?: T }
  | { success: false; error: string };

export type AuthFormState = ActionResult | null;
