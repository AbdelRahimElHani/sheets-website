# sheets-website

A web page that shows the live contents of a Google Sheet as a table. Edit the sheet and the page picks up the change, with no redeploy needed.

It reads the sheet through Google's read-only endpoint for shared sheets. No API key or login is needed, and the page can only read, never write.

## Setup

1. In Google Sheets, click **Share**, set **General access** to **Anyone with the link**, and the role to **Viewer**.
2. Copy the sheet ID from its address:
   `https://docs.google.com/spreadsheets/d/THIS_PART_IS_THE_ID/edit`
3. Open `script.js` and set the two values at the top:

   ```js
   const SHEET_ID = "your-sheet-id";
   const SHEET_NAME = "Sheet1"; // the tab name at the bottom of the sheet
   ```

4. Optionally change `REFRESH_SECONDS` (default `60`, and `0` means only refresh on load).

Until `SHEET_ID` is set, the page shows a message asking you to connect a sheet.

## Running it

No build step is needed. Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server
```

Then open http://localhost:8000.

## Features

- Shows the first row of the sheet as column headings
- Refreshes automatically, and has a **Refresh** button
- Shows the row count and the time of the last update
- Shows a helpful error if the sheet is not shared or the ID or tab name is wrong

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page layout |
| `script.js` | Fetches the sheet and renders the table |
| `style.css` | Styling |

## Note

Anyone with the link to the Google Sheet can view it, so don't put private data in it.
