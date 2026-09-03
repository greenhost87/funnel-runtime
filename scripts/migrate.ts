import { runMigrations } from "@/system/database/migrate";

runMigrations();
console.log("Migrations applied");
