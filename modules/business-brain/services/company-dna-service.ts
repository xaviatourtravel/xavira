import {
  companyDnaFormSchema,
  type CompanyDnaFormInput,
} from "@/modules/business-brain/schemas/company-dna";
import {
  ensureBusinessBrain,
  findBusinessBrainByOrganizationId,
  touchBusinessBrainDraftForOrganization,
} from "@/modules/business-brain/repositories/business-brain-repository";
import {
  findCompanyDnaByBusinessBrainId,
  mapCompanyDnaRow,
  upsertCompanyDna,
} from "@/modules/business-brain/repositories/company-dna-repository";
import {
  DEFAULT_COMPANY_DNA_FORM,
  type CompanyDnaRecord,
} from "@/modules/business-brain/types/company-dna";

export type CompanyDnaLoadResult = {
  record: CompanyDnaRecord | null;
  defaults: typeof DEFAULT_COMPANY_DNA_FORM;
};

function toRecord(
  row: ReturnType<typeof mapCompanyDnaRow>,
): CompanyDnaRecord {
  return {
    id: row.id,
    businessBrainId: row.businessBrainId,
    updatedAt: row.updatedAt,
    companyName: row.companyName,
    industry: row.industry,
    website: row.website,
    about: row.about,
    brandPersonality: row.brandPersonality,
    communicationStyle: row.communicationStyle,
    salesStyle: row.salesStyle,
    aiGoals: row.aiGoals,
    neverRules: row.neverRules,
  };
}

export async function getCompanyDNA(
  organizationId: string,
): Promise<CompanyDnaLoadResult> {
  const businessBrain = await findBusinessBrainByOrganizationId(organizationId);

  if (!businessBrain) {
    return {
      record: null,
      defaults: DEFAULT_COMPANY_DNA_FORM,
    };
  }

  const row = await findCompanyDnaByBusinessBrainId(businessBrain.id);

  if (!row) {
    return {
      record: null,
      defaults: DEFAULT_COMPANY_DNA_FORM,
    };
  }

  return {
    record: toRecord(mapCompanyDnaRow(row)),
    defaults: DEFAULT_COMPANY_DNA_FORM,
  };
}

export async function saveDraft(
  organizationId: string,
  input: CompanyDnaFormInput,
): Promise<CompanyDnaRecord> {
  const parsed = companyDnaFormSchema.parse(input);
  const businessBrain = await ensureBusinessBrain(organizationId);
  const row = await upsertCompanyDna(businessBrain.id, parsed);
  await touchBusinessBrainDraftForOrganization(organizationId);
  return toRecord(mapCompanyDnaRow(row));
}

export async function updateCompanyDNA(
  organizationId: string,
  input: CompanyDnaFormInput,
): Promise<CompanyDnaRecord> {
  return saveDraft(organizationId, input);
}
