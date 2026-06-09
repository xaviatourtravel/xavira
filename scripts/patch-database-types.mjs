import fs from "node:fs";

const path = "types/database.ts";
let t = fs.readFileSync(path, "utf8");

if (!t.includes("budget: number")) {
  t = t.replace(
    /        Row: \{\r?\n          campaign_type: Database\["public"\]\["Enums"\]\["campaign_type"\]/,
    `        Row: {
          budget: number
          campaign_type: Database["public"]["Enums"]["campaign_type"]`,
  );

  t = t.replace(
    /          name: string\r?\n          organization_id: string\r?\n          start_date: string \| null\r?\n          status: Database\["public"\]\["Enums"\]\["campaign_status"\]\r?\n          target_interest: Database\["public"\]\["Enums"\]\["interest_type"\]\r?\n          updated_at: string\r?\n        \}\r?\n        Insert: \{\r?\n          campaign_type\?: Database\["public"\]\["Enums"\]\["campaign_type"\]/,
    `          name: string
          notes: string | null
          organization_id: string
          source: Database["public"]["Enums"]["lead_source"] | null
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          target_interest: Database["public"]["Enums"]["interest_type"]
          updated_at: string
        }
        Insert: {
          budget?: number
          campaign_type?: Database["public"]["Enums"]["campaign_type"]`,
  );

  t = t.replace(
    /          name: string\r?\n          organization_id: string\r?\n          start_date\?: string \| null\r?\n          status\?: Database\["public"\]\["Enums"\]\["campaign_status"\]\r?\n          target_interest\?: Database\["public"\]\["Enums"\]\["interest_type"\]\r?\n          updated_at\?: string\r?\n        \}\r?\n        Update: \{\r?\n          campaign_type\?: Database\["public"\]\["Enums"\]\["campaign_type"\]/,
    `          name: string
          notes?: string | null
          organization_id: string
          source?: Database["public"]["Enums"]["lead_source"] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_interest?: Database["public"]["Enums"]["interest_type"]
          updated_at?: string
        }
        Update: {
          budget?: number
          campaign_type?: Database["public"]["Enums"]["campaign_type"]`,
  );

  t = t.replace(
    /          name\?: string\r?\n          organization_id\?: string\r?\n          start_date\?: string \| null\r?\n          status\?: Database\["public"\]\["Enums"\]\["campaign_status"\]\r?\n          target_interest\?: Database\["public"\]\["Enums"\]\["interest_type"\]\r?\n          updated_at\?: string\r?\n        \}\r?\n        Relationships: \[\r?\n          \{\r?\n            foreignKeyName: "campaigns_created_by_fkey"/,
    `          name?: string
          notes?: string | null
          organization_id?: string
          source?: Database["public"]["Enums"]["lead_source"] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_interest?: Database["public"]["Enums"]["interest_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_created_by_fkey"`,
  );
}

if (!t.includes("campaign_id: string | null")) {
  t = t.replace(
    /          budget_idr: number \| null\r?\n          converted_at: string \| null/,
    `          budget_idr: number | null
          campaign_id: string | null
          converted_at: string | null`,
  );

  t = t.replace(
    /          budget_idr\?: number \| null\r?\n          converted_at\?: string \| null\r?\n          created_at\?: string\r?\n          deleted_at\?: string \| null\r?\n          email\?: string \| null\r?\n          full_name: string\r?\n          id\?: string/,
    `          budget_idr?: number | null
          campaign_id?: string | null
          converted_at?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name: string
          id?: string`,
  );

  t = t.replace(
    /          budget_idr\?: number \| null\r?\n          converted_at\?: string \| null\r?\n          created_at\?: string\r?\n          deleted_at\?: string \| null\r?\n          email\?: string \| null\r?\n          full_name\?: string/,
    `          budget_idr?: number | null
          campaign_id?: string | null
          converted_at?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string`,
  );

  if (!t.includes("leads_campaign_id_fkey")) {
    t = t.replace(
      /foreignKeyName: "leads_assigned_to_fkey"\r?\n            columns: \["assigned_to"\]\r?\n            isOneToOne: false\r?\n            referencedRelation: "profiles"\r?\n            referencedColumns: \["id"\]\r?\n          \},/,
      `foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },`,
    );
  }
}

if (!t.includes("contents: {")) {
  const contentsBlock = `      contents: {
        Row: {
          assigned_to: string | null
          campaign_id: string | null
          caption: string | null
          content_type: string
          created_at: string
          cta: string | null
          drive_url: string | null
          id: string
          notes: string | null
          organization_id: string
          platform: string
          publish_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          campaign_id?: string | null
          caption?: string | null
          content_type: string
          created_at?: string
          cta?: string | null
          drive_url?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          platform: string
          publish_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          campaign_id?: string | null
          caption?: string | null
          content_type?: string
          created_at?: string
          cta?: string | null
          drive_url?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          platform?: string
          publish_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
`;

  t = t.replace(
    /      \}\r?\n      dashboard_snapshots: \{/,
    `      }\r\n${contentsBlock}      dashboard_snapshots: {`,
  );
}

t = t.replace(/\}        Relationships: \[/g, "}\r\n        Relationships: [");

fs.writeFileSync(path, t, "utf8");
console.log("patched", path);
