const fs = require("fs");
const code = fs.readFileSync("components/BusinessPortal.tsx", "utf8");
const lines = code.split("\n");

const start = 1038; // line 1039
const end = lines.length;

let depth = 0;
let inString = false;
let stringChar = "";
let inComment = false;
let commentType = "";

for (let li = start; li < end; li++) {
  const line = lines[li];
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i+1];

    if (inComment) {
      if (commentType === "//" && ch === "\n") inComment = false;
      if (commentType === "/*" && ch === "*" && next === "/") { inComment = false; i++; }
      continue;
    }

    if (inString) {
      if (ch === "\\") { i++; continue; }
      if (ch === stringChar) inString = false;
      continue;
    }

    if (ch === "/" && next === "/") { inComment = true; commentType = "//"; i++; continue; }
    if (ch === "/" && next === "*") { inComment = true; commentType = "/*"; i++; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { inString = true; stringChar = ch; continue; }

    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth < 0) {
        console.log("UNBALANCED } at line", li+1);
        process.exit(1);
      }
    }
  }
}
console.log("Final depth:", depth);
