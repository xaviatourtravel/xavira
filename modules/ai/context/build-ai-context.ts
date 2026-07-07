import {
  buildBusinessBrainContext,
  type BuildBusinessBrainContextInput,
  type BusinessBrainContextSlice,
} from "@/modules/ai/context/business-brain/build-business-brain-context";
import {
  buildConversationContext,
  type BuildConversationContextInput,
  type ConversationContext,
} from "@/modules/ai/context/conversation/build-conversation-context";
import {
  buildCrmContext,
  type BuildCrmContextInput,
  type CrmContext,
} from "@/modules/ai/context/crm/build-crm-context";
import {
  buildCustomerContext,
  type BuildCustomerContextInput,
  type CustomerContext,
} from "@/modules/ai/context/customer/build-customer-context";
import {
  buildProductContext,
  type BuildProductContextInput,
  type ProductContext,
} from "@/modules/ai/context/product/build-product-context";
import {
  buildRuntimeContext,
  type BuildRuntimeContextInput,
  type RuntimeContext,
} from "@/modules/ai/context/runtime/build-runtime-context";
import {
  buildWorkspaceContext,
  type BuildWorkspaceContextInput,
  type WorkspaceContext,
} from "@/modules/ai/context/workspace/build-workspace-context";

export type BuildAIContextInput = {
  runtime?: BuildRuntimeContextInput;
  workspace?: BuildWorkspaceContextInput;
  customer?: BuildCustomerContextInput;
  crm?: BuildCrmContextInput;
  product?: BuildProductContextInput;
  conversation?: BuildConversationContextInput;
  businessBrain?: BuildBusinessBrainContextInput;
};

export type AIContext = {
  runtime: RuntimeContext;
  workspace: WorkspaceContext;
  customer: CustomerContext;
  crm: CrmContext;
  product: ProductContext;
  conversation: ConversationContext;
  businessBrain: BusinessBrainContextSlice;
};

export function buildAIContext(input?: BuildAIContextInput): AIContext {
  return {
    runtime: buildRuntimeContext(input?.runtime),
    workspace: buildWorkspaceContext(input?.workspace),
    customer: buildCustomerContext(input?.customer),
    crm: buildCrmContext(input?.crm),
    product: buildProductContext(input?.product),
    conversation: buildConversationContext(input?.conversation),
    businessBrain: buildBusinessBrainContext(input?.businessBrain),
  };
}

export type {
  BuildBusinessBrainContextInput,
  BuildConversationContextInput,
  BuildCrmContextInput,
  BuildCustomerContextInput,
  BuildProductContextInput,
  BuildRuntimeContextInput,
  BuildWorkspaceContextInput,
  BusinessBrainContextSlice,
  ConversationContext,
  CrmContext,
  CustomerContext,
  ProductContext,
  RuntimeContext,
  WorkspaceContext,
};
