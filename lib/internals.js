"use strict";
/*
  This file is to avoid typescript nightmare, when instead of normal import in .d.ts files it redeclare
  imported types in-place.
  Mangling exports in this file magically helps.
*/
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./coreError"));
__export(require("./utils/misc"));
__export(require("./utils/bindFunc"));
__export(require("./utils/makeRef"));
__export(require("./inject/inject"));
__export(require("./log/log"));
__export(require("./repositories/loadState"));
__export(require("./repositories/unknownModelTypeError"));
__export(require("./repositories/mainRepository"));
__export(require("./repositories/modelList"));
__export(require("./repositories/modelRepository"));
__export(require("./repositories/customRepository"));
__export(require("./repositories/optionalModel/optionalTypes"));
__export(require("./repositories/optionalModel/staticOptionalModel"));
__export(require("./repositories/optionalModel/ObservableOptionalModel"));
__export(require("./repositories/observableModel"));
