/// <reference path="../pb_data/types.d.ts" />

onRecordCreate(function (e) {
  var normalized = String(e.record.get("message") || "").toLowerCase();
  var category = normalized.indexOf("привет") !== -1 ? 1 : 2;

  e.record.set("category", category);
  e.next();
}, "requests");

onRecordUpdate(function (e) {
  var normalized = String(e.record.get("message") || "").toLowerCase();
  var category = normalized.indexOf("привет") !== -1 ? 1 : 2;

  e.record.set("category", category);
  e.next();
}, "requests");
