# PizzasQR — Pizza Menu via QR Code

A lightweight static web app that displays your pizza menu to customers via QR code.
Menu images live in Google Drive — update them anytime without touching code or redeploying.
Hosted for free on GitHub Pages.

**How it works:**
1. Upload menu images to a Google Drive folder
2. Customers scan a QR code → land on your GitHub Pages menu
3. The page fetches and displays your images automatically
4. Update the menu by swapping images in Drive — no code changes needed

---

## Folder Structure

```
PizzasQR/
├── index.html              # Menu page (customers see this)
├── style.css               # Styles and theme (edit CSS variables to retheme)
├── config.js               # YOUR configuration — edit this file
├── app.js                  # App logic and startup wiring
├── modules/
│   ├── DriveClient.js      # Fetches image list from Google Drive API
│   ├── ImageSorter.js      # Sorts images by filename prefix
│   ├── GalleryRenderer.js  # Renders the image grid in the DOM
│   └── RefreshController.js# Refresh button and pull-to-refresh
├── generate_qr.py          # Python QR generator (Option B)
├── qr_generator.html       # Browser QR generator (Option C)
├── requirements.txt        # Python dependencies
├── .github/workflows/pages.yml
├── CNAME
└── README.md
```

---

## One-Time Setup

### 1. Google Drive Folder

1. Open your Google Drive folder with the pizza images
2. Right-click → **Share** → **Anyone with the link** → set role to **Viewer**
3. Copy the folder ID from the URL:
   ```
   https://drive.google.com/drive/folders/1-VFkMuDiEcEH0P_3xXGjbRcEantbn6lA
                                           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                           this is your folder ID
   ```

### 2. Google API Key

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create a project
2. **APIs & Services → Library** → search **Google Drive API** → Enable
3. **APIs & Services → Credentials → Create Credentials → API key**
4. Edit the key → **Application restrictions: HTTP referrers** → add `https://pochoramirez.github.io/*`
5. **API restrictions** → Restrict to **Google Drive API** only → Save
6. Copy the key

### 3. Edit config.js

```js
const PIZZA_CONFIG = {
  folderID:  "1-VFkMuDiEcEH0P_3xXGjbRcEantbn6lA", // already set
  apiKey:    "REPLACE_WITH_YOUR_API_KEY",           // paste your key here
  placeName: "Pizzeria Bella Napoli",               // change to your name
  logoURL:   "",                                    // optional https:// logo URL
};
```

---

## Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/PochoRamirez/pizza-menu-qr.git
git push -u origin main
```

Then in the repo: **Settings → Pages → Source: GitHub Actions**

Your menu will be live at: **https://pochoramirez.github.io/pizza-menu-qr/**

---

## Generate Your QR Code

### Option A — Online (no install)
Go to [qr-code-generator.com](https://www.qr-code-generator.com), paste your URL, download PNG at 1000×1000 px.

### Option B — Python script
```bash
pip install qrcode[pil] Pillow
python generate_qr.py --url https://pochoramirez.github.io/pizza-menu-qr/ --output menu_qr.png

# With logo:
python generate_qr.py --url https://pochoramirez.github.io/pizza-menu-qr/ --logo logo.png --output menu_qr.png
```

### Option C — Browser page (no install)
Open `qr_generator.html` in any browser, paste the URL, click **Generate QR**, click **Download**.

---

## Updating the Menu

No code changes needed — just manage files in Google Drive:
- **Add:** upload a new image to the folder
- **Remove:** delete the image from the folder
- **Replace:** upload a new file (delete the old one first if keeping the same name)

**Naming convention for display order:**
```
01_margherita.jpg       ← appears first
02_pepperoni.jpg        ← appears second
03_quattro_formaggi.jpg
unprefixed.jpg          ← appears last, alphabetically
```

---

## Changing the Theme

Edit the `:root` variables in `style.css` — no JS changes needed:
```css
:root {
  --color-bg:      #FDF6EC;  /* page background */
  --color-primary: #C0392B;  /* header and buttons */
  --color-text:    #2C2C2C;  /* body text */
}
```
To change fonts, update the Google Fonts link in `index.html` and `font-family` in `style.css`.

---

## Security Notes

- The API key is **read-only** and restricted to your GitHub Pages domain — safe to commit
- It can only list files in your public folder; it cannot write or delete anything
- **NEVER commit** OAuth tokens, service account keys, or any write-access credentials
- Keep your Google Drive folder set to **Viewer** only — never Editor
