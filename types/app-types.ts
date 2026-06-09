import type { Enums, Tables } from "./database";

export type Profile = Tables<"profiles">;
export type UserRole = Enums<"user_role">;
export type BusinessType = Enums<"business_type">;
export type Subscription = Tables<"subscriptions">;
