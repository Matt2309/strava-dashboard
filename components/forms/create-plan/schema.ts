import type { z } from "zod";
import type { createPlanSchema } from "@/lib/schemas/engine-room.schema";

export type CreatePlanFormState = {
	values?: z.infer<typeof createPlanSchema>;
	errors: null | Partial<
		Record<keyof z.infer<typeof createPlanSchema>, string[]>
	>;
	success: boolean;
};
