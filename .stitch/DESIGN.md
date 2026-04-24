# ZID Parcel Import Low-Fidelity

## Intent
Desktop-first, Polish-language GIS storyboard for importing parcel identifiers from SAP HANA Excel files into the ZID draft workspace.

This is a low-fidelity workflow artifact for business and UX review. It must explain the process clearly, not imitate a polished production UI.

## Visual System
- Neutral light palette with muted slate surfaces.
- Compact enterprise density similar to GIS, CAD, and Office-class desktop tools.
- Minimal accent usage only for process states: warning, error, success, and active step.
- No hero sections, glossy cards, decorative charts, marketing copy, or mobile composition.
- Use schematic map placeholders, parcel polygons, tables, counters, progress rows, and issue lists.

## Layout Rules
- Left column: process steps, territorial context, and source data panel.
- Center: large map preview with parcel polygons and a data table below.
- Right column: layer summary, counters, and validation/conflict list.
- Bottom: fixed action bar for analysis, report download, save to draft, and cancel.
- The active process step must always be visible.
- Map, table, and validation panel must remain visibly connected.

## Process Rules
- Source data is an Excel file exported from SAP HANA.
- The system verifies file format, required parcel identifier field, and road number consistency.
- Geometry and descriptive parcel data come from GUGiK.
- Parcels outside the file but within the same territorial unit may also be added from GUGiK.
- The process ends in draft or obszar roboczy, never in direct publication.
- Statuses must communicate import result, ownership recognition, and relation to the road corridor.

## Tone
- Professional, administrative, and operational.
- Polish labels only.
- Easy to review by analysts and business owners without additional annotations.
