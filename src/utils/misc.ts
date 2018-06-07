export function zeroPadNumber(value: number, pads: number) {
  const s = ('0'.repeat(pads) + String(value));
  return s.substr(s.length - pads);
}
