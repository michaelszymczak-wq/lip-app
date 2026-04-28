// Lazy-loads pdfmake + vfs_fonts once, then caches the result.
//
// pdfmake 0.3.x notes:
//   - package.json "browser" field points to build/pdfmake.js
//   - vfs_fonts exports flat { 'Roboto-Regular.ttf': base64, ... }
//   - pdfMake.addVirtualFileSystem(vfs) writes fonts to the internal VFS singleton
//     (pdfMake.vfs = vfs does NOT work — it only sets a plain property)
//   - Roboto font-name→filename mapping is already the default; no fonts= needed
//   - createPdf().download() is async — callers must await it

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _pdfMake: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPdfMake(): Promise<any> {
  if (_pdfMake) return _pdfMake;

  // Import bare 'pdfmake' so Vite's browser-field resolution picks build/pdfmake.js
  // vfs_fonts must still come from the explicit build path
  const [pdfMakeModule, pdfFontsModule] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (pdfMakeModule as any).default ?? pdfMakeModule;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vfs = (pdfFontsModule as any).default ?? pdfFontsModule;

  // Load font file data into the internal VirtualFileSystem singleton.
  // In pdfmake 0.3.x, assigning pdfMake.vfs = vfs does NOT write to the VFS;
  // addVirtualFileSystem() iterates the object and calls virtualfs.writeFileSync()
  // for each entry, which is what makes the fonts resolvable at render time.
  pdfMake.addVirtualFileSystem(vfs);

  // The Roboto font-name → filename mapping is already registered by default
  // in the browser bundle constructor, so no explicit pdfMake.fonts assignment
  // is needed.

  _pdfMake = pdfMake;
  return _pdfMake;
}
