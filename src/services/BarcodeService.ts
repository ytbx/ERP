import JsBarcode from 'jsbarcode';

export const BarcodeService = {
  generateBarcode(sku: string): string {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, sku, {
      format: "CODE128",
      width: 2,
      height: 100,
      displayValue: true,
      fontSize: 20,
      margin: 10
    });
    return canvas.toDataURL("image/png");
  }
};
