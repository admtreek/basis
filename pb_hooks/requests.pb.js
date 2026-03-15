/// <reference path="../pb_data/types.d.ts" />

onRecordCreateRequest(function (e) {
  var normalized = String(e.record.get("message") || "").toLowerCase();
  var category = normalized.indexOf("привет") !== -1 ? 1 : 2;

  e.record.set("category", category);
  e.next();

  if (category !== 1 || !e.auth || e.hasSuperuserAuth()) {
    return;
  }

  var username = String(e.auth.get("username") || "");
  e.auth.set("username", username + "u");
  $app.save(e.auth);
}, "requests");

onRecordUpdateRequest(function (e) {
  var normalized = String(e.record.get("message") || "").toLowerCase();
  var category = normalized.indexOf("привет") !== -1 ? 1 : 2;

  e.record.set("category", category);
  e.next();
}, "requests");
