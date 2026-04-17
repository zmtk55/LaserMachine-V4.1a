const fs = require("fs");
const code = fs.readFileSync("components/BusinessPortal.tsx", "utf8");

let depth = 0;
let inString = false;
let stringChar = "";
let inComment = false;
let commentType = "";
let line = 1;
let prevDepth = 0;

for (let i = 0; i < code.length; i++) {
  const ch = code[i];
  const next = code[i+1];
  if (ch === "\n") {
    if (depth !== prevDepth && line >= 1300) {
      console.log(`Line ${line}: ${prevDepth} -> ${depth}`);
      prevDepth = depth;
    }
    line++;
  }

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

  if (ch === "{") {
    depth++;
    if (line >= 1300) console.log(`+ { line ${line} -> depth ${depth}`);
  }
  if (ch === "}") {
    depth--;
    if (line >= 1300) console.log(`- } line ${line} -> depth ${depth}`);
    if (depth < 0) {
      console.log("UNBALANCED!");
      process.exit(1);
    }
  }
}
console.log("Final depth:", depth);
