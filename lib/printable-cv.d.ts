export function printableCvFingerprint(): Promise<string>;
export function collectCvPrintInputs(): Promise<CvPrintInputs>;
export function digestCvPrintInputs(inputs: CvPrintInputs): string;
export function stylesheetHrefsFromHtml(html: string): string[];
export function localAssetPathsFromHtml(html: string): string[];
export function localUrlsFromCss(css: string): string[];
export function resolveLocalAssetPath(stylesheetHref: string, cssUrl: string): string | null;

interface CvPrintInputs {
  site: string;
  astroSite: string | undefined;
  documents: Array<{
    format: string;
    route: string;
    paper: object;
    printToPDF: object;
    html: string;
    stylesheets: Array<{ href: string; css: string }>;
    assets: Array<{ path: string; bytes: Uint8Array }>;
  }>;
}
