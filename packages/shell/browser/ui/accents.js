// Shared accent palette for Luma Browser.
// Used by both the Electron main process (CommonJS require) and renderer pages
// (loaded as a plain <script> exposing the global ACCENTS).
(function (root, factory) {
  const accents = factory()
  if (typeof module !== 'undefined' && module.exports) module.exports = accents
  if (root) root.ACCENTS = accents
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    indigo: '#5b5bd6',
    blue: '#2f7cf6',
    teal: '#0e9488',
    green: '#22a06b',
    orange: '#e8790f',
    rose: '#d6336c',
  }
})
