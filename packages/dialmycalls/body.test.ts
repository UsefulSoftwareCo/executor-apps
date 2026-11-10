import assert from "node:assert/strict";
import { test } from "node:test";
import { basicAuth, body } from "./body.ts";

test("call body is snake_case", () => {
  assert.deepEqual(
    body({ name: "n", calleridId: "1", recordingId: "2", machineRecordingId: "3", sendImmediately: true, sendAt: undefined, useAmd: true, sendEmail: false, accessaccountId: "4", contacts: [{ phone: "1" }] }),
    { name: "n", callerid_id: "1", recording_id: "2", machine_recording_id: "3", send_immediately: true, use_amd: true, send_email: false, accessaccount_id: "4", contacts: [{ phone: "1" }] },
  );
});
test("text body is snake_case", () => {
  assert.deepEqual(body({ keywordId: "k", shortcodeId: "s", concatenateSms: true, sendAt: "x" }), { keyword_id: "k", shortcode_id: "s", concatenate_sms: true, send_at: "x" });
});
test("vanity body keeps call_options object", () => {
  assert.deepEqual(body({ callOptions: { voicemail: true }, recordingSource: "specific", specificRecordingId: "r", playCta: true, pttNumberId: "p" }), {
    call_options: { voicemail: true }, recording_source: "specific", specific_recording_id: "r", play_cta: true, ptt_number_id: "p",
  });
});
test("basic auth uses key as username", () => {
  assert.equal(basicAuth("abc"), `Basic ${btoa("abc:")}`);
});
