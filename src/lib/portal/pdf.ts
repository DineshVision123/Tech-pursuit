"use client";

/**
 * Client-side PDF export — there's no server-side PDF generation (Phase-1
 * POC), so this rasterizes the invoice document DOM node and embeds it in a
 * PDF, then triggers a direct file download. No browser print dialog, no
 * intermediate page — `jsPDF.save()` downloads immediately.
 */

// Wider than the on-screen element usually is (e.g. squeezed into a
// side-by-side review layout) — gives table cells room to lay out on one
// line instead of wrapping, before the whole thing gets scaled down to fit
// the page.
const CAPTURE_WIDTH_PX = 900;
const PAGE_MARGIN_PT = 24;

export async function downloadElementAsPdf(element: HTMLElement, filename: string): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas-pro"),
  ]);

  // html2canvas rasterizes exactly what's on screen — it doesn't honor
  // `@media print`, so anything marked `.no-print` (helper captions, action
  // rows) would otherwise ride along into the exported image. Hide those
  // descendants for the capture, then restore them immediately after.
  const hidden = Array.from(element.querySelectorAll<HTMLElement>(".no-print"));
  const previousDisplay = hidden.map((el) => el.style.display);
  hidden.forEach((el) => {
    el.style.display = "none";
  });

  // Temporarily widen the element itself so its content lays out at a
  // print-friendly width (fewer wrapped cells/lines) rather than whatever
  // narrow column it happens to occupy on screen.
  const previousWidth = element.style.width;
  const previousMaxWidth = element.style.maxWidth;
  element.style.width = `${CAPTURE_WIDTH_PX}px`;
  element.style.maxWidth = `${CAPTURE_WIDTH_PX}px`;

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: CAPTURE_WIDTH_PX,
    });
  } finally {
    element.style.width = previousWidth;
    element.style.maxWidth = previousMaxWidth;
    hidden.forEach((el, i) => {
      el.style.display = previousDisplay[i] ?? "";
    });
  }

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const maxWidth = pageWidth - PAGE_MARGIN_PT * 2;
  const maxHeight = pageHeight - PAGE_MARGIN_PT * 2;

  // Shrink-to-fit on a single page — this is what guarantees nothing is
  // ever cut off: try the content at full available width first, and if
  // that would run taller than one page, fit to the page's height instead
  // (shrinking width along with it, proportionally).
  const aspectRatio = canvas.height / canvas.width;
  let imgWidth = maxWidth;
  let imgHeight = maxWidth * aspectRatio;
  if (imgHeight > maxHeight) {
    imgHeight = maxHeight;
    imgWidth = maxHeight / aspectRatio;
  }

  const x = (pageWidth - imgWidth) / 2;
  const y = PAGE_MARGIN_PT;

  const imgData = canvas.toDataURL("image/png");
  pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
  pdf.save(filename);
}
