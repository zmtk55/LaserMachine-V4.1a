const fs = require("fs");
const code = fs.readFileSync("components/BusinessPortal.tsx", "utf8");
const lines = code.split("\n");

const start = 1190; // return (
const end = lines.length;

let jsxDepth = 0;
let exprDepth = 0;
let inString = false;
let stringChar = "";
let inComment = false;
let commentType = "";
let inExpr = false;

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

    if (!inExpr) {
      // JSX tag tracking
      if (ch === "<") {
        const rest = line.slice(i);
        if (rest.startsWith("</")) {
          jsxDepth--;
          if (jsxDepth < 0) {
            console.log(`Unbalanced JSX close at line ${li+1}`);
            process.exit(1);
          }
        } else if (!rest.match(/^<\s/) && !rest.startsWith("<>") && !rest.startsWith("</")) {
          // opening tag - check if self-closing on same line
          const selfClose = rest.match(/^<[^>]+\/>/);
          if (!selfClose) {
            jsxDepth++;
          }
        } else if (rest.startsWith("<>")) {
          jsxDepth++;
        } else if (rest.startsWith("</>")) {
          jsxDepth--;
        }
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

console.log("JSX depth:", jsxDepth, "Expr in progress:", inExpr, "Expr depth:", exprDepth);
