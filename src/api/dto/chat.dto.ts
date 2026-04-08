import { z } from "zod";

export const ChatRequestSchema = z.object({
  tenantId: z.string().min(1),
  query: z.string().min(1),
  fileIds: z.array(z.string()).optional(),
});

export type ChatRequestDto = z.infer<typeof ChatRequestSchema>;
