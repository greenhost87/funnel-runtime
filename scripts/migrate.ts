import { runDatabaseMigrations } from "@/system/database/migrate";

runDatabaseMigrations();
console.log("Migrations applied");
