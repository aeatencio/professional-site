export interface CvPdfAsset {
  format: 'a4' | 'letter';
  href: string;
  download: string;
  publicPath: string;
  distPath: string;
  route: string;
  paper: {
    widthMm: number;
    heightMm: number;
    widthIn: number;
    heightIn: number;
  };
}

export const CV_PDF: {
  a4: CvPdfAsset;
  letter: CvPdfAsset;
};

export const CV_PDF_FINGERPRINT_PATH: string;
export const PUBLIC_SITE_ORIGIN: string;

export const CV_PRINT_TO_PDF_BASE: {
  landscape: false;
  displayHeaderFooter: false;
  printBackground: true;
  preferCSSPageSize: true;
  marginTop: 0;
  marginBottom: 0;
  marginLeft: 0;
  marginRight: 0;
};

export function printToPdfParams(pdf: CvPdfAsset): {
  landscape: false;
  displayHeaderFooter: false;
  printBackground: true;
  preferCSSPageSize: true;
  paperWidth: number;
  paperHeight: number;
  marginTop: 0;
  marginBottom: 0;
  marginLeft: 0;
  marginRight: 0;
};

export function repoPath(...parts: string[]): string;
export function sha256(buffer: Uint8Array): string;
export function inspectPdf(buffer: Uint8Array): {
  bytes: number;
  pageCount: number;
  mediaBox: { width: number; height: number };
};
export function verifyCvPdfs(options?: { dist?: boolean }): Promise<void>;
