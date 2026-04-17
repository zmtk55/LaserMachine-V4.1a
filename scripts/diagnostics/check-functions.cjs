const fs = require("fs");
const code = fs.readFileSync("components/BusinessPortal.tsx", "utf8");
const lines = code.split("\n");

function countBraces(text) {
  let depth = 0;
  let inString = false;
  let stringChar = "";
  let inComment = false;
  let commentType = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i+1];
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
    if (ch === "}") depth--;
  }
  return depth;
}

// Find top-level const/function declarations
const declRegex = /^(const|function|interface)\s+([A-Za-z0-9_]+)/;
let current = { name: "preamble", start: 0 };
const sections = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const m = line.match(declRegex);
  if (m && !line.startsWith(" ") && !line.startsWith("\t")) {
    if (current) {
      current.end = i;
      sections.push(current);
    }
    current = { name: m[2], start: i };
  }
}
if (current) {
  current.end = lines.length;
  sections.push(current);
}

for (const sec of sections) {
  const text = lines.slice(sec.start, sec.end).join("\n");
  const d = countBraces(text);
  if (d !== 0) {
    console.log(`Section "${sec.name}" (lines ${sec.start + 1}-${sec.end}) has brace imbalance: ${d}`);
  }
}
