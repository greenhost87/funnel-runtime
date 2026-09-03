import { handleAdvanceMutation } from "@/system/http/funnel-api.helpers";
import { createFunnelMutationPost } from "@/app/api/funnel/create-mutation-post";

export const POST = createFunnelMutationPost(handleAdvanceMutation);
