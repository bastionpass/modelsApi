"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function zeroPadNumber(value, pads) {
    const s = ('0'.repeat(pads) + String(value));
    return s.substr(s.length - pads);
}
exports.zeroPadNumber = zeroPadNumber;
