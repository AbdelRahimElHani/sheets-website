// Google Sheets -> Read-only API -> JavaScript -> Website
//
// The data comes from Google's read-only endpoint for shared sheets.
// It needs no API key and no login, and it can only read, never write.
//
// SETUP
// 1. In Google Sheets: Share -> General access -> "Anyone with the link" -> Viewer.
// 2. Copy the ID from the sheet's address:
//    https://docs.google.com/spreadsheets/d/THIS_PART_IS_THE_ID/edit
// 3. Paste it below. SHEET_NAME is the name of the tab at the bottom of the sheet.

const SHEET_ID = "PASTE_YOUR_SHEET_ID_HERE";
const SHEET_NAME = "Sheet1";

// How often the page checks the sheet for changes (in seconds). 0 = only on load.
const REFRESH_SECONDS = 60;

// ---------------------------------------------------------------------------

const statusEl = document.getElementById("status");
const tableWrap = document.getElementById("tableWrap");
const tableEl = document.getElementById("table");
const refreshButton = document.getElementById("refreshButton");

refreshButton.addEventListener("click", loadData);

loadData();
if (REFRESH_SECONDS > 0) {
  setInterval(loadData, REFRESH_SECONDS * 1000);
}

async function loadData() {
  if (SHEET_ID === "PASTE_YOUR_SHEET_ID_HERE" || SHEET_ID.trim() === "") {
    showError("No Google Sheet is connected yet. Open script.js and paste your sheet ID into SHEET_ID.");
    return;
  }

  const url =
    "https://docs.google.com/spreadsheets/d/" + encodeURIComponent(SHEET_ID) +
    "/gviz/tq?tqx=out:json&headers=1&sheet=" + encodeURIComponent(SHEET_NAME);

  refreshButton.disabled = true;

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Google answered with HTTP " + response.status + ".");
    }

    const text = await response.text();
    const data = parseResponse(text);

    if (data.status === "error") {
      const detail = data.errors && data.errors[0];
      throw new Error((detail && (detail.detailed_message || detail.message)) || "Google reported an error.");
    }

    const { columns, rows } = readTable(data.table);

    if (columns.length === 0 || rows.length === 0) {
      showError("The sheet \"" + SHEET_NAME + "\" has no data yet.");
      return;
    }

    renderTable(columns, rows);
    statusEl.classList.remove("error");
    statusEl.textContent =
      rows.length + (rows.length === 1 ? " row" : " rows") +
      " · last updated " + new Date().toLocaleTimeString();
  } catch (error) {
    showError(
      "The Google Sheet could not be loaded. Check that the sheet ID and tab name in script.js are correct " +
      "and that the sheet is shared as \"Anyone with the link – Viewer\". (" + error.message + ")"
    );
  } finally {
    refreshButton.disabled = false;
  }
}

// Google wraps the JSON in a function call:
//   google.visualization.Query.setResponse({ ... });
// so we cut out the part between the first "{" and the last "}".
function parseResponse(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("The answer was not data. The sheet is probably not shared publicly.");
  }
  return JSON.parse(text.slice(start, end + 1));
}

// Turns Google's table format into simple column names and rows of text.
function readTable(table) {
  const used = []; // positions of columns that are actually in use
  const columns = [];

  table.cols.forEach((col, index) => {
    const label = (col.label || "").trim();
    const hasData = table.rows.some((row) => cellText(row.c[index]) !== "");
    if (label === "" && !hasData) return; // skip completely empty columns
    used.push(index);
    columns.push(label || "Column " + (index + 1));
  });

  const rows = table.rows
    .map((row) => used.map((index) => cellText(row.c[index])))
    .filter((row) => row.some((value) => value !== "")); // skip empty rows

  return { columns, rows };
}

// "f" is the value as formatted in the sheet (dates, currency, ...), "v" the raw value.
function cellText(cell) {
  if (!cell) return "";
  if (cell.f !== undefined && cell.f !== null) return String(cell.f);
  if (cell.v !== undefined && cell.v !== null) return String(cell.v);
  return "";
}

function renderTable(columns, rows) {
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  columns.forEach((column) => {
    const th = document.createElement("th");
    th.textContent = column;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  const tbody = document.createElement("tbody");
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  tableEl.innerHTML = "";
  tableEl.appendChild(thead);
  tableEl.appendChild(tbody);
  tableWrap.hidden = false;
}

function showError(message) {
  statusEl.textContent = message;
  statusEl.classList.add("error");
  tableWrap.hidden = true;
}
