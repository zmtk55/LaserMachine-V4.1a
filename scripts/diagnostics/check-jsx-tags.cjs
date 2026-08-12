const fs = require("fs");
const code = fs.readFileSync("components/BusinessPortal.tsx", "utf8");
const lines = code.split("\n");

const start = 1190; // return (
const end = lines.length;

let stack = [];
let inString = false;
let stringChar = "";
let inComment = false;
let commentType = "";
let inExpr = false;
let exprDepth = 0;

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

    if (ch === "{") {
      if (!inExpr) {
        inExpr = true;
        exprDepth = 1;
      } else {
        exprDepth++;
      }
      continue;
    }
    if (ch === "}") {
      if (inExpr) {
        exprDepth--;
        if (exprDepth === 0) inExpr = false;
      }
      continue;
    }

    if (!inExpr && ch === "<") {
      const rest = line.slice(i);
      if (rest.startsWith("</")) {
        // closing tag
        const m = rest.match(/^<\/([A-Za-z0-9_\-]+)>/);
        if (m) {
          const tagName = m[1];
          if (stack.length === 0 || stack[stack.length - 1] !== tagName) {
            console.log(`Mismatched closing tag </${tagName}> at line ${li+1}, col ${i+1}. Expected </${stack[stack.length - 1]}>`);
          } else {
            stack.pop();
          }
          i += m[0].length - 1;
        } else if (rest.startsWith("</>")) {
          stack.pop();
          i += 2;
        }
      } else if (rest.startsWith("<>")) {
        stack.push("<>");
        i += 1;
      } else {
        // opening tag or self-closing
        const m = rest.match(/^<([A-Za-z0-9_\-]+)([^>]*)\/>/);
        if (m) {
          // self-closing, no push
          i += m[0].length - 1;
        } else {
          const m2 = rest.match(/^<([A-Za-z0-9_\-]+)/);
          if (m2) {
            stack.push(m2[1]);
            i += m2[0].length - 1;
          }
        }
      }
    }
  }
}

console.log("Remaining JSX tags:", stack);
