/// <reference path="../pb_data/types.d.ts" />

function resolveCategory(message) {
  var normalized = String(message || "").toLowerCase();
  return normalized.indexOf("привет") !== -1 ? 1 : 2;
}

onRecordCreate(function (e) {
  e.record.set("category", resolveCategory(e.record.get("message")));
  e.next();
}, "requests");

onRecordUpdate(function (e) {
  e.record.set("category", resolveCategory(e.record.get("message")));
  e.next();
}, "requests");
