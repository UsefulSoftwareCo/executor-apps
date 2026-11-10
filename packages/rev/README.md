# Rev AI

Rev AI speech-to-text: asynchronous transcription jobs, transcripts, captions, summaries and translations, plus the custom vocabulary, topic extraction, sentiment analysis, language identification and forced alignment APIs. 34 tools in total (mounted as `transcription`, `customVocabulary`, `topicExtraction`, `sentimentAnalysis`, `languageIdentification`, `alignment`).

**Interface:** OpenAPI. The six official specs are published by Rev AI at `https://docs.rev.ai/_bundle/api/<name>/reference.json?download` (asynchronous, custom-vocabulary, topic-extraction, sentiment-analysis, language-identification, alignment), all served from `https://api.rev.ai`. The custom-vocabulary spec declares a bare `https://api.rev.ai` server but the routes live under `/speechtotext/v1`, so it is mounted with `pathPrefix: "/speechtotext/v1"`. Each of the six specs was compiled and its 34 operations counted individually.

**Auth:** access token (`apiKey`). Create one under Access Token in the Rev AI dashboard (https://www.rev.ai/access_token); it is sent as a Bearer token. Rev AI offers no user-created OAuth apps.

**Icon:** Rev AI's official 256px app icon (webclip) from rev.ai; Rev publishes no SVG of the standalone mark.

**Known gaps:** the streaming speech-to-text API is a WebSocket (`wss://api.rev.ai/speechtotext/v1/stream`) and is not exposed. Rev.com's separate human transcription ordering API is not covered.
