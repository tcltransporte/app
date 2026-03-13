import { spawn } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT || 3000;

const child = spawn(
    "node",
    ["node_modules/next/dist/bin/next", "start", "-p", port],
    { stdio: "inherit" }
);

child.on("close", (code) => process.exit(code));