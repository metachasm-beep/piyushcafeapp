/**
 * Google Apps Script for The Golden Fork contact form.
 *
 * Setup:
 * 1. Open https://docs.google.com/spreadsheets/d/1pFmx1KgschefrHU0tgIoh4quSAbyH8NKxkwFtyPJ8bA
 * 2. Extensions → Apps Script
 * 3. Paste this file, Save
 * 4. Run ensureHeaders once (authorize when prompted)
 * 5. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the Web app URL into CONTACT_SHEETS_WEBHOOK_URL
 */

var HEADER_ROW = [
	'Timestamp',
	'Name',
	'Email',
	'Phone',
	'Restaurant',
	'City',
	'Interest',
	'Message'
];

function ensureHeaders() {
	var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
	if (sheet.getLastRow() === 0) {
		sheet.appendRow(HEADER_ROW);
		sheet.getRange(1, 1, 1, HEADER_ROW.length).setFontWeight('bold');
	}
}

function doPost(e) {
	try {
		var data = JSON.parse(e.postData.contents);
		ensureHeaders();
		var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
		sheet.appendRow([
			data.timestamp || new Date().toISOString(),
			data.name || '',
			data.email || '',
			data.phone || '',
			data.restaurant || '',
			data.city || '',
			data.interest || '',
			data.message || ''
		]);
		return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
			ContentService.MimeType.JSON
		);
	} catch (err) {
		return ContentService.createTextOutput(
			JSON.stringify({ ok: false, error: String(err) })
		).setMimeType(ContentService.MimeType.JSON);
	}
}

function doGet() {
	return ContentService.createTextOutput(
		JSON.stringify({ ok: true, service: 'golden-fork-contact' })
	).setMimeType(ContentService.MimeType.JSON);
}
