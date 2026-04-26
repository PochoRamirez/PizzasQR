# Requirements Document

## Introduction

A lightweight web application that allows a pizza business to display their menu to customers via QR code scanning. Menu images (showing pizza varieties and prices) are stored and managed in Google Drive. A static web page hosted on GitHub Pages fetches and displays those images. The business owner can update the menu by replacing images in Google Drive without touching any code. QR codes printed on physical materials (menus, tables, flyers) redirect customers to this page.

## Glossary

- **Menu_Page**: The static HTML/CSS/JS web page hosted on GitHub Pages that customers see after scanning a QR code.
- **Menu_Image**: A photo or graphic stored in Google Drive that shows pizza varieties and prices.
- **QR_Code**: A scannable image that encodes the URL of the Menu_Page, intended for printing on physical materials.
- **Google_Drive_Folder**: The designated Google Drive folder where the business owner uploads and manages Menu_Images.
- **QR_Generator**: The tool, script, or browser-based page that produces printable QR_Code images from the Menu_Page URL.
- **Business_Owner**: The person responsible for managing menu content and printing QR codes.
- **Customer**: A person who scans the QR_Code to view the pizza menu.
- **Filename_Prefix**: A numeric prefix at the start of a Menu_Image filename (e.g., `01_`, `02_`) used to control display order.
- **Branded_Header**: A visible section at the top of the Menu_Page showing the pizza place name and an optional logo.
- **Work_Folder**: The local directory `C:\proyectos\PizzasQR` where all project files and documentation are stored.

---

## Requirements

### Requirement 1: Display Menu Images to Customers

**User Story:** As a Customer, I want to see the pizza menu after scanning a QR code, so that I can browse available pizzas and their prices.

#### Acceptance Criteria

1. WHEN a Customer scans the QR_Code, THE Menu_Page SHALL load and display all Menu_Images from the configured Google_Drive_Folder.
2. THE Menu_Page SHALL display each Menu_Image at a readable size suitable for mobile screens.
3. WHILE Menu_Images are loading, THE Menu_Page SHALL display a loading indicator to the Customer.
4. IF no Menu_Images are found in the Google_Drive_Folder, THEN THE Menu_Page SHALL display a message informing the Customer that the menu is currently unavailable.
5. IF a Menu_Image fails to load, THEN THE Menu_Page SHALL skip that image and continue displaying the remaining Menu_Images.

---

### Requirement 2: Google Drive Integration

**User Story:** As a Business_Owner, I want to store menu images in Google Drive, so that I can update the menu without modifying any code or redeploying the website.

#### Acceptance Criteria

1. THE Menu_Page SHALL retrieve Menu_Images from a publicly accessible Google_Drive_Folder using the Google Drive API or a public sharing link.
2. WHEN the Business_Owner adds, removes, or replaces a Menu_Image in the Google_Drive_Folder, THE Menu_Page SHALL reflect the updated images on the next page load without requiring a code change or redeployment.
3. THE Menu_Page SHALL support Menu_Images in JPEG, PNG, and WebP formats.
4. IF the Google_Drive_Folder is inaccessible due to a network error, THEN THE Menu_Page SHALL display an error message to the Customer indicating the menu cannot be loaded at this time.

---

### Requirement 3: Mobile-Friendly Responsive Layout

**User Story:** As a Customer, I want the menu page to be easy to read on my phone, so that I can comfortably browse the menu after scanning the QR code.

#### Acceptance Criteria

1. THE Menu_Page SHALL use a responsive layout that adapts to screen widths from 320px to 1920px.
2. THE Menu_Page SHALL display Menu_Images in a single-column layout on screens narrower than 768px.
3. THE Menu_Page SHALL display Menu_Images in a multi-column grid layout on screens 768px wide or wider.
4. THE Menu_Page SHALL render without horizontal scrolling on screens 320px wide or wider.

---

### Requirement 4: QR Code Generation

**User Story:** As a Business_Owner, I want to generate a printable QR code that links to the menu page, so that I can place it on tables, flyers, and printed menus.

#### Acceptance Criteria

1. THE QR_Generator SHALL produce a QR_Code image that encodes the GitHub Pages URL of the Menu_Page.
2. THE QR_Generator SHALL output the QR_Code as a PNG image file at a minimum resolution of 1000x1000 pixels.
3. THE QR_Code SHALL be scannable by standard smartphone camera apps without requiring a dedicated QR reader application.
4. WHERE a Business_Owner provides a custom logo or label, THE QR_Generator SHALL embed it in the center of the QR_Code image.
5. THE QR_Generator SHALL be available in three options so the Business_Owner can choose the method that best fits their setup:
   - **Option A (Online tool):** THE Business_Owner SHALL be able to generate a QR_Code by pasting the Menu_Page URL into a free online QR generation service and downloading the result as a PNG at minimum 1000x1000 pixels, with no software installation required.
   - **Option B (Python script):** THE QR_Generator SHALL include a Python script using the `qrcode` library that runs locally, accepts the Menu_Page URL as input, and outputs a PNG QR_Code at minimum 1000x1000 pixels; WHERE a Business_Owner provides a logo image, THE script SHALL embed it in the center of the QR_Code.
   - **Option C (In-repo HTML page):** THE QR_Generator SHALL include a self-contained HTML file stored in the Work_Folder that runs in a browser without any installation, accepts the Menu_Page URL as input, and allows the Business_Owner to download the resulting QR_Code as a PNG at minimum 1000x1000 pixels.

---

### Requirement 5: GitHub Pages Hosting

**User Story:** As a Business_Owner, I want the menu page hosted on GitHub Pages, so that I have a free, reliable, and publicly accessible URL to encode in the QR code.

#### Acceptance Criteria

1. THE Menu_Page SHALL be deployable as a static site on GitHub Pages with no server-side runtime required.
2. THE Menu_Page SHALL be accessible via a stable HTTPS URL provided by GitHub Pages.
3. WHEN the Business_Owner pushes an update to the repository's main branch, THE Menu_Page SHALL reflect the update within 5 minutes.

---

### Requirement 6: Page Performance

**User Story:** As a Customer, I want the menu page to load quickly after scanning the QR code, so that I don't have to wait long to see the menu.

#### Acceptance Criteria

1. THE Menu_Page SHALL display the first Menu_Image within 3 seconds on a 4G mobile connection under normal network conditions.
2. THE Menu_Page SHALL lazy-load Menu_Images that are below the visible viewport so that initial page load time is minimized.
3. THE Menu_Page SHALL have a total initial HTML/CSS/JS payload of 200KB or less, excluding Menu_Image content.

---

### Requirement 7: Image Display Order

**User Story:** As a Business_Owner, I want menu images to appear in a specific sequence, so that I can control the order in which pizzas are presented to customers.

#### Acceptance Criteria

1. THE Menu_Page SHALL sort Menu_Images by their Filename_Prefix in ascending numeric order before rendering them (e.g., `01_margherita.jpg` appears before `02_pepperoni.jpg`).
2. WHEN two Menu_Images share the same Filename_Prefix, THE Menu_Page SHALL sort those images alphabetically by their full filename as a tiebreaker.
3. IF a Menu_Image filename has no numeric Filename_Prefix, THEN THE Menu_Page SHALL display that image after all prefixed images, sorted alphabetically among unprefixed images.
4. THE Menu_Page SHALL apply this ordering on every page load and refresh without requiring a code change.

---

### Requirement 8: Branded Header

**User Story:** As a Business_Owner, I want the menu page to show my pizza place name and logo at the top, so that the page looks professional and customers immediately know whose menu they are viewing.

#### Acceptance Criteria

1. THE Menu_Page SHALL display a Branded_Header at the top of the page containing the configured pizza place name as visible text.
2. WHERE a Business_Owner provides a logo image, THE Menu_Page SHALL display the logo inside the Branded_Header alongside the pizza place name.
3. THE Branded_Header SHALL remain visible at the top of the page on all screen widths from 320px to 1920px.
4. THE Menu_Page SHALL allow the Business_Owner to configure the pizza place name and optional logo URL without modifying the core HTML structure (e.g., via a configuration variable in the JS file).

---

### Requirement 9: Manual Menu Refresh

**User Story:** As a Customer, I want to refresh the menu images without closing and reopening the page, so that I can see the latest menu if it has been updated while I am viewing it.

#### Acceptance Criteria

1. THE Menu_Page SHALL provide a visible refresh button that, when activated by a Customer, re-fetches all Menu_Images from the Google_Drive_Folder and updates the display.
2. WHEN a Customer performs a pull-to-refresh gesture on a mobile device, THE Menu_Page SHALL re-fetch and redisplay all Menu_Images.
3. WHILE a refresh is in progress, THE Menu_Page SHALL display a loading indicator and disable the refresh button to prevent duplicate requests.
4. IF the refresh request fails, THEN THE Menu_Page SHALL display an error message to the Customer and restore the previously loaded Menu_Images.

---

### Requirement 10: Work Folder

**User Story:** As a Business_Owner, I want all project files stored in a single known location on my computer, so that I can easily find, back up, and manage the project.

#### Acceptance Criteria

1. THE Business_Owner SHALL store all project files, scripts, generated assets, and documentation in the Work_Folder at `C:\proyectos\PizzasQR`.
2. THE Work_Folder SHALL contain at minimum: the Menu_Page source files, the QR_Generator Option B Python script, the QR_Generator Option C HTML file, and this requirements document.
3. THE Work_Folder structure SHALL be documented in the project README so the Business_Owner can reproduce it on a new machine.
