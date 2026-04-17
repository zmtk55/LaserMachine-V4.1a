const fs = require("fs");
const code = fs.readFileSync("components/BusinessPortal.tsx", "utf8");
const lines = code.split("\n");
let depth = 0;
let inString = false;
let stringChar = "";
let inComment = false;
let commentType = "";

for (let li = 0; li < lines.length; li++) {
  const line = lines[li];
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i+1];

    if (inComment) {
      if (commentType === "//") { inComment = false; continue; }
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
        console.log("Unbalanced } at line", li + 1, "col", i + 1);
        process.exit(1);
      }
    }
  }
  // end of line
}
console.log("Final depth:", depth);
console.log("File has", lines.length, "lines");
