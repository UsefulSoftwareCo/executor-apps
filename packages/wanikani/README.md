# WaniKani

Study data for WaniKani, the Japanese radical, kanji and vocabulary learning platform: the user profile and preferences, subjects, assignments (including starting lessons), review submission, review statistics, study materials, level progressions, resets, spaced repetition systems, voice actors and the lessons/reviews summary.

**Interface:** hand-written tools over the REST API v2 (`https://api.wanikani.com/v2`), documented at https://docs.api.wanikani.com/20170710/. WaniKani publishes no OpenAPI document, so each endpoint is declared by hand (23 tools). Requests send `Wanikani-Revision: 20170710`. Collection filters go in a `query` object; mutations require approval.

**Auth:** API token only (WaniKani offers no OAuth). Create one at https://www.wanikani.com/settings/personal_access_tokens; tick the permissions you need (read-only tokens cannot start assignments, submit reviews or edit study materials).

**Known gaps:** the deprecated `GET /reviews` endpoints are omitted. Pagination is manual through `page_after_id` / `page_before_id`. Rate limit is 60 requests per minute.

## Verification notes

Checked against https://docs.api.wanikani.com/20170710/: the user resource attribute table has no `id` (only the example JSON does), so health uses `username` as the account id. `GET /level_progressions`, `/resets` and `/spaced_repetition_systems` take exactly `ids` and `updated_after`. Updatable preferences are `extra_study_autoplay_audio`, `lessons_autoplay_audio`, `lessons_batch_size` (no documented range), `reviews_autoplay_audio`, `reviews_display_srs_indicator` and `reviews_presentation_order` (`shuffled` or `lower_levels_first`). `reviews.create` rejects a call with neither or both of `assignment_id` and `subject_id` before it reaches the API.
