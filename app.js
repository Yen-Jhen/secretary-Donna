"use strict";

function inline(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function markdown(source) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const output = [];
  let list = null;
  let code = false;
  let codeLines = [];
  const closeList = () => {
    if (list) output.push(`</${list}>`);
    list = null;
  };
  const cells = line => line.trim().replace(/^\||\|$/g, "").split("|").map(cell => cell.trim());

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      closeList();
      if (code) {
        output.push(`<pre><code>${inline(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
      }
      code = !code;
      continue;
    }
    if (code) { codeLines.push(line); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      output.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }
    if (line.trim().startsWith("|") && i + 1 < lines.length &&
        /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      closeList();
      const header = cells(line).map(cell => `<th scope="col">${inline(cell)}</th>`).join("");
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(`<tr>${cells(lines[i]).map(cell => `<td>${inline(cell)}</td>`).join("")}</tr>`);
        i++;
      }
      i--;
      output.push(`<div class="table-wrap"><table><thead><tr>${header}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`);
      continue;
    }
    const item = line.match(/^\s*(?:([-*])\s+|(\d+)\.\s+)(.+)/);
    if (item) {
      const type = item[2] ? "ol" : "ul";
      if (list !== type) { closeList(); output.push(`<${type}>`); list = type; }
      output.push(`<li>${inline(item[3])}</li>`);
      continue;
    }
    closeList();
    if (line.trim()) output.push(`<p>${inline(line.trim())}</p>`);
  }
  closeList();
  return output.join("\n");
}

async function loadDocument(name) {
  const target = document.getElementById(`${name}-content`);
  try {
    const response = await fetch(`./data/${name}.txt`, {cache: "no-store"});
    if (!response.ok) throw new Error("Unable to load document");
    target.innerHTML = markdown(await response.text());
  } catch {
    target.textContent = "無法載入資料，請稍後重新整理頁面。";
  }
}

["schedule", "reading"].forEach(loadDocument);
