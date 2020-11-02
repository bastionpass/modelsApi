"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zeroPadNumber = void 0;
function zeroPadNumber(value, pads) {
    const s = ('0'.repeat(pads) + String(value));
    return s.substr(s.length - pads);
}
exports.zeroPadNumber = zeroPadNumber;
