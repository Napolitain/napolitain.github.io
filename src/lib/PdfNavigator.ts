import * as pdfjsLib from 'pdfjs-dist';

// Use CDN worker to avoid bundling issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export class PdfNavigator {
  private docs: pdfjsLib.PDFDocumentProxy[] = [];
  private flatPages: { docIndex: number; pageNum: number }[] = [];
  private currentIndex = 0;

  async loadFiles(files: File[]): Promise<{ name: string; pageCount: number }[]> {
    const results: { name: string; pageCount: number }[] = [];

    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
      const docIndex = this.docs.length;
      this.docs.push(doc);

      for (let p = 1; p <= doc.numPages; p++) {
        this.flatPages.push({ docIndex, pageNum: p });
      }

      results.push({ name: file.name, pageCount: doc.numPages });
    }

    return results;
  }

  get totalPages(): number {
    return this.flatPages.length;
  }

  get currentPage(): number {
    return this.currentIndex;
  }

  async renderPage(canvas: HTMLCanvasElement): Promise<void> {
    if (this.currentIndex >= this.flatPages.length) return;

    const { docIndex, pageNum } = this.flatPages[this.currentIndex];
    const page = await this.docs[docIndex].getPage(pageNum);

    const viewport = page.getViewport({ scale: 1 });
    const scaleX = canvas.width / viewport.width;
    const scaleY = canvas.height / viewport.height;
    const scale = Math.min(scaleX, scaleY);
    const scaledViewport = page.getViewport({ scale });

    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Center the page
    const offsetX = (canvas.width - scaledViewport.width) / 2;
    const offsetY = (canvas.height - scaledViewport.height) / 2;
    ctx.save();
    ctx.translate(offsetX, offsetY);

    await page.render({
      canvasContext: ctx,
      viewport: scaledViewport,
    }).promise;

    ctx.restore();
  }

  next(): boolean {
    if (this.currentIndex < this.flatPages.length - 1) {
      this.currentIndex++;
      return true;
    }
    return false;
  }

  getPageInfo(): { page: number; total: number } {
    return { page: this.currentIndex + 1, total: this.flatPages.length };
  }
}
