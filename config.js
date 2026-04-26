// ============================================================
// config.js — Business owner configuration for the pizza menu
// ============================================================
//
// ⚠️  SECURITY WARNING ⚠️
// NEVER commit OAuth tokens, service account keys, or any write-access credentials.
// ============================================================

const PIZZA_CONFIG = {
  // Google Drive folder ID from: https://drive.google.com/drive/folders/<ID>
  // Share the folder as "Anyone with the link" → Viewer role.
  folderID: "1OwnFAYaGxLnuhXaCNL2kq4On0z68_hfC",

  // Drive API v3 key — restrict to HTTP referrer https://pochoramirez.github.io/*
  // and to Google Drive API only in Google Cloud Console.
  apiKey: "AIzaSyD61kFV8uMrE46CrtNIIWIwkLrMI0G8Hys",

  // Name shown in the page header.
  placeName: "Que Pizzas!!",

  // Optional https:// URL to a logo image. Leave "" for no logo.
  logoURL: "https://pochoramirez.github.io/PizzasQR/web.png",
};
