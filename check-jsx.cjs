const fs = require("fs");
const code = fs.readFileSync("components/BusinessPortal.tsx", "utf8");
const lines = code.split("\n");

let jsxDepth = 0;
let inString = false;
let stringChar = "";
let inComment = false;
let commentType = "";
let inExpr = false; // inside { }
let exprDepth = 0;

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

    if (!inExpr) {
      if (ch === "<" && next !== " ") {
        // JSX tag start
        if (line.slice(i).match(/^<\//)) {
          jsxDepth--;
          if (jsxDepth < 0) {
            console.log("Unbalanced JSX closing tag at line", li + 1);
            process.exit(1);
          }
        } else if (!line.slice(i).match(/^<\s/)) {
          // self-closing check later
        }
      }
      if (ch === ">" && line.slice(0, i).match(/\/$/)) {
        // self-closing tag
        // don't change depth
      } else if (ch === ">" && line.slice(i-1, i+1) !== "=>") {
        // end of opening tag
      }
    }

    if (ch === "{") {
      if (!inExpr) {
        inExpr = true;
        exprDepth = 1;
      } else {
        exprDepth++;
      }
    }
    if (ch === "}") {
      if (inExpr) {
        exprDepth--;
        if (exprDepth === 0) inExpr = false;
      }
    }
  }
}
