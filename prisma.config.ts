import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
		seed: "npx tsx prisma/seed.ts",
	},
	datasource: {
		url: process.env.DATABASE_URL,
		// Only needed for `prisma migrate diff --from-migrations` (baselining a
		// database that had tables added outside the migration history, e.g.
		// via `db push`) and for `prisma migrate dev`'s drift detection.
		// Optional in every other workflow.
		shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
	},
});
