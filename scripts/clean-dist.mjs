import { rmSync } from "node:fs";

rmSync(".next-build", { recursive: true, force: true });
