// Generated from the function reference at https://procfu.com/scripts/ (one page per function).
export type Arg = { readonly name: string; readonly type: "string" | "number" | "boolean" | "json"; readonly doc: string };
export type Fn = {
  readonly name: string;
  readonly title: string;
  readonly doc: string;
  readonly returns: string;
  readonly kind: "query" | "mutation";
  readonly args: readonly Arg[];
};

export const functions: readonly Fn[] = [
 {
  "name": "account_get_usage",
  "title": "Get Account Usage",
  "doc": "Get current ProcFu account usage and limits.",
  "returns": "",
  "kind": "query",
  "args": []
 },
 {
  "name": "account_last_error",
  "title": "PF Last Error",
  "doc": "Return last ProcFu Error",
  "returns": "Error text or blank if none",
  "kind": "mutation",
  "args": [
   {
    "name": "scriptId",
    "type": "string",
    "doc": "optional name of pf function, eg get_var.pf"
   },
   {
    "name": "since",
    "type": "number",
    "doc": "number of seconds to look back into - default 30 seconds"
   }
  ]
 },
 {
  "name": "account_logger_log",
  "title": "PF Logger Log",
  "doc": "Add something to your PF logs",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "message",
    "type": "string",
    "doc": "message to log"
   },
   {
    "name": "var",
    "type": "json",
    "doc": "optional string, array, object, etc"
   }
  ]
 },
 {
  "name": "api_request_send",
  "title": "API Make Request",
  "doc": "Make an API request for a user via an API and capture the response",
  "returns": "whatever the API returns - or false",
  "kind": "mutation",
  "args": [
   {
    "name": "api_service",
    "type": "string",
    "doc": "API service name as you called it when adding it to ProcFu on the account page"
   },
   {
    "name": "user_id",
    "type": "string",
    "doc": "some internal reference for the user that you'll use in future calls for this user"
   },
   {
    "name": "request_url",
    "type": "string",
    "doc": "url of endpoint to call"
   },
   {
    "name": "method",
    "type": "string",
    "doc": "GET, POST, etc"
   },
   {
    "name": "headers",
    "type": "string",
    "doc": "optional headers to send - comma-separated for multiple (if blank, defaults to Content-type: application/json,Accept: application/json)"
   },
   {
    "name": "body",
    "type": "string",
    "doc": "optional JSON body for requests"
   }
  ]
 },
 {
  "name": "api_user_get",
  "title": "API Get User Info",
  "doc": "Get the details of a user via an API",
  "returns": "JSON payload from API or false",
  "kind": "query",
  "args": [
   {
    "name": "api_service",
    "type": "string",
    "doc": "API service name as you called it when adding it to ProcFu on the account page"
   },
   {
    "name": "user_id",
    "type": "string",
    "doc": "some internal reference for the user that you'll use in future calls for this user"
   }
  ]
 },
 {
  "name": "api_user_login_link_get",
  "title": "API Get Login Link",
  "doc": "Get the login link for a user to authenticate to an API",
  "returns": "https link for the user to authenticate to the API service",
  "kind": "mutation",
  "args": [
   {
    "name": "api_service",
    "type": "string",
    "doc": "API service name as you called it when adding it to ProcFu on the account page"
   },
   {
    "name": "user_id",
    "type": "string",
    "doc": "some internal reference for the user that you'll use in future calls for this user"
   }
  ]
 },
 {
  "name": "api_user_token_status",
  "title": "API User Token Status",
  "doc": "Get the details of a user's auth status",
  "returns": "JSON object with auth_token (true/false) and last_save (date of last refresh)",
  "kind": "mutation",
  "args": [
   {
    "name": "api_service",
    "type": "string",
    "doc": "API service name as you called it when adding it to ProcFu on the account page"
   },
   {
    "name": "user_id",
    "type": "string",
    "doc": "some internal reference for the user that you'll use in future calls for this user"
   }
  ]
 },
 {
  "name": "api_user_urls_set",
  "title": "API User Urls Set",
  "doc": "Set override success and fail login urls for a particular user",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "api_service",
    "type": "string",
    "doc": "API service name as you called it when adding it to ProcFu on the account page"
   },
   {
    "name": "user_id",
    "type": "string",
    "doc": "some internal reference for the user that you'll use in future calls for this user"
   },
   {
    "name": "success_url",
    "type": "string",
    "doc": "override redirect url after successful authentication from login link"
   },
   {
    "name": "fail_url",
    "type": "string",
    "doc": "override redirect url after failed authentication from login link"
   }
  ]
 },
 {
  "name": "api_users_list",
  "title": "API Users List",
  "doc": "Get the list of authenticated users for an API integration",
  "returns": "JSON array of user ID's that have authorized the API",
  "kind": "query",
  "args": [
   {
    "name": "api_service",
    "type": "string",
    "doc": "API service name as you called it when adding it to ProcFu on the account page"
   }
  ]
 },
 {
  "name": "array_diff_del",
  "title": "Array Diff Del",
  "doc": "Given 2 JSON arrays, returns an array of items that were removed",
  "returns": "JSON array of additions, eg: given [1,3,4] and [1,3,6] will return [4]",
  "kind": "query",
  "args": [
   {
    "name": "json_array_a",
    "type": "string",
    "doc": ""
   },
   {
    "name": "json_array_b",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "array_diff_new",
  "title": "Array Diff New",
  "doc": "Given 2 JSON arrays, returns an array of items that were added",
  "returns": "JSON array of additions, eg: given [1,3,4] and [1,3,6] will return [6]",
  "kind": "query",
  "args": [
   {
    "name": "json_array_a",
    "type": "string",
    "doc": ""
   },
   {
    "name": "json_array_b",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "array_diff_same",
  "title": "Array Diff Same",
  "doc": "Given 2 JSON arrays, returns an array of items that are in both",
  "returns": "JSON array of the intersect, eg: given [1,3,4] and [1,2,3,6] will return [1,3]",
  "kind": "query",
  "args": [
   {
    "name": "json_array_a",
    "type": "string",
    "doc": ""
   },
   {
    "name": "json_array_b",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "array_key_sort",
  "title": "Array Key Sort",
  "doc": "Given an array of JSON objects, returns an array of the items sorted by key",
  "returns": "JSON array, eg given [{\"a\":\"v\", \"b\":43},{\"a\":\"g\", \"b\":33},{\"a\":\"f\", \"b\":56}] sorted on \"b\" returns [{\"a\":\"g\",\"b\":33},{\"a\":\"v\",\"b\":43},{\"a\":\"f\",\"b\":56}]",
  "kind": "query",
  "args": [
   {
    "name": "json_array",
    "type": "string",
    "doc": ""
   },
   {
    "name": "key",
    "type": "string",
    "doc": "key to sort on"
   },
   {
    "name": "reverse",
    "type": "boolean",
    "doc": "True for descending sorting, False for ascending - default is ascending"
   }
  ]
 },
 {
  "name": "array_sort",
  "title": "Array Sort",
  "doc": "Given a JSON array, returns an array of the items sorted",
  "returns": "JSON array, eg: given [3,1,2] will return [1,2,3]",
  "kind": "query",
  "args": [
   {
    "name": "json_array",
    "type": "string",
    "doc": ""
   },
   {
    "name": "reverse",
    "type": "boolean",
    "doc": "True for descending sorting, False for ascending - default is ascending"
   }
  ]
 },
 {
  "name": "base64_encode",
  "title": "Base 64 Encode",
  "doc": "Convert text to base64 - great for making JSON safe to use in GF vars",
  "returns": "",
  "kind": "query",
  "args": [
   {
    "name": "something",
    "type": "string",
    "doc": ""
   },
   {
    "name": "preserve_arrays",
    "type": "boolean",
    "doc": "true or false whether to preserve the array if passed an array and encode it's parts instead - default false"
   },
   {
    "name": "strip_tags",
    "type": "number",
    "doc": "1 to first strip tags and trim before encoding"
   }
  ]
 },
 {
  "name": "call_procscript",
  "title": "Call Procscript",
  "doc": "Run a ProcScript code block and return a result.",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "scriptname",
    "type": "string",
    "doc": "File Name of the ProcScript code to run"
   },
   {
    "name": "payload",
    "type": "string",
    "doc": "JSON object to pass to code in variable array called payload"
   }
  ]
 },
 {
  "name": "call_procscript_bg",
  "title": "Call Procscript Background",
  "doc": "Run a ProcScript code block in the background. Note that max runtime is limited to 2 hours. If you want to call a GF webhook on completion, simply use the remote_curl function in your script.",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "scriptname",
    "type": "string",
    "doc": "File Name of the ProcScript code to run"
   },
   {
    "name": "payload",
    "type": "string",
    "doc": "JSON object to pass to code in variable array called payload"
   }
  ]
 },
 {
  "name": "call_user_function",
  "title": "Call User Function",
  "doc": "Run a Code Block you previously created from the Code Editor (https://procfu.com/code.php)",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "code_block_name",
    "type": "string",
    "doc": ""
   },
   {
    "name": "payload",
    "type": "string",
    "doc": "payload to pass to the function, eg JSON arrays or text or whatever"
   }
  ]
 },
 {
  "name": "datetime_convert",
  "title": "Convert a datetime from one timezone to another",
  "doc": "Convert a datetime from one timezone to another",
  "returns": "string - datetime in format YYYY-MM-DD HH:MM:SS",
  "kind": "query",
  "args": [
   {
    "name": "datetime",
    "type": "string",
    "doc": "datetime in format YYYY-MM-DD HH:MM:SS"
   },
   {
    "name": "tz_from",
    "type": "string",
    "doc": ""
   },
   {
    "name": "tz_to",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "distance_between_addresses",
  "title": "Distance between Addresses",
  "doc": "Get the distance in meters between 2 addresses",
  "returns": "distance beween address1 and address2 in meters",
  "kind": "query",
  "args": [
   {
    "name": "address1",
    "type": "string",
    "doc": ""
   },
   {
    "name": "address2",
    "type": "string",
    "doc": ""
   },
   {
    "name": "google_maps_api_key",
    "type": "string",
    "doc": "your Google Maps API Key. Get one here"
   }
  ]
 },
 {
  "name": "distance_straight_line",
  "title": "Distance Straight Line",
  "doc": "Get the striaght line distance between 2 lat / long co-ordinates",
  "returns": "distance beween the 2 co-ordinates in kilometers",
  "kind": "query",
  "args": [
   {
    "name": "lat1",
    "type": "string",
    "doc": ""
   },
   {
    "name": "long1",
    "type": "string",
    "doc": ""
   },
   {
    "name": "lat2",
    "type": "string",
    "doc": ""
   },
   {
    "name": "long2",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "dummy_data",
  "title": "Dummy Data",
  "doc": "Generate random email addresses, text, numbers, etc.",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "type",
    "type": "string",
    "doc": "one of [base] int, price, decimal2, date, dateTime, or [text] word, title, sentence, paragraph, text, loremText, html, loremHtml, or [person] name, firstName, lastName, or [company] company, jobTitle, catchPhrase, bullShit, or [phone] phoneNumber, tollFree, or [address] address, streetAddress, city, state, zip, country, lat, long, or [internet] email, username, password, domain, url, ipv4, ipv6, or [payment] cardNumber, cardExp, iban, swift, or [image] image, portrait, landscape, smallImage, avatar, userFace"
   }
  ]
 },
 {
  "name": "email_send_conn",
  "title": "Send Email Connected SMTP",
  "doc": "Send an email using an SMTP server connected to your account.",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "conn_name",
    "type": "string",
    "doc": "connection name of SMTP server"
   },
   {
    "name": "email_to",
    "type": "string",
    "doc": "recipient for email"
   },
   {
    "name": "email_subject",
    "type": "string",
    "doc": "subject for email"
   },
   {
    "name": "email_body",
    "type": "string",
    "doc": "html body of email"
   },
   {
    "name": "opt_headers",
    "type": "string",
    "doc": "optional headers to send - comma-separated for multiple"
   },
   {
    "name": "email_from",
    "type": "string",
    "doc": "optional sender of email"
   },
   {
    "name": "email_cc",
    "type": "string",
    "doc": "optional addresses to cc on email"
   },
   {
    "name": "attachments",
    "type": "string",
    "doc": "optional JSON array of filename and base64data, eg [{\"filename\":\"document.pdf\",\"base64data\":\"aGVsbG8gd2..9ybGQ=\"}]"
   },
   {
    "name": "email_bcc",
    "type": "string",
    "doc": "optional addresses to bcc on email"
   }
  ]
 },
 {
  "name": "email_send_smtp",
  "title": "Send Email Smtp",
  "doc": "Send an email using your SMTP server. Don't have an SMTP server? Try mailgun.com or sendgrid.com.",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "smtp_server",
    "type": "string",
    "doc": "server to use"
   },
   {
    "name": "smtp_user",
    "type": "string",
    "doc": "username for server"
   },
   {
    "name": "smtp_pass",
    "type": "string",
    "doc": "password for user"
   },
   {
    "name": "smtp_port",
    "type": "number",
    "doc": "port to send through - usually 25 or 465 for ssl"
   },
   {
    "name": "smtp_security",
    "type": "string",
    "doc": "blank, tls, or ssl"
   },
   {
    "name": "email_to",
    "type": "string",
    "doc": "recipient for email"
   },
   {
    "name": "email_cc",
    "type": "string",
    "doc": "option addresses to cc on email"
   },
   {
    "name": "email_bcc",
    "type": "string",
    "doc": "option addresses to bcc on email"
   },
   {
    "name": "email_from",
    "type": "string",
    "doc": "sender of email"
   },
   {
    "name": "email_subject",
    "type": "string",
    "doc": "subject for email"
   },
   {
    "name": "email_body",
    "type": "string",
    "doc": "html body of email"
   },
   {
    "name": "opt_headers",
    "type": "string",
    "doc": "optional headers to send - comma-separated for multiple"
   },
   {
    "name": "attachments",
    "type": "string",
    "doc": "optional JSON array of filename and base64data, eg [{\"filename\":\"document.pdf\",\"base64data\":\"aGVsbG8gd2..9ybGQ=\"}]"
   }
  ]
 },
 {
  "name": "emogrify_html",
  "title": "Emogrify HTML",
  "doc": "Convert HTML styles to inline. Useful for sending emails.",
  "returns": "HTML with inline styles",
  "kind": "mutation",
  "args": [
   {
    "name": "html",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "find_in_json",
  "title": "Find in JSON",
  "doc": "Finds a key in JSON encoded text",
  "returns": "",
  "kind": "query",
  "args": [
   {
    "name": "json",
    "type": "string",
    "doc": ""
   },
   {
    "name": "key",
    "type": "string",
    "doc": "key to find"
   }
  ]
 },
 {
  "name": "flow_app_filter",
  "title": "Flow App Filter (Podio)",
  "doc": "Filter items in a Podio App and return in simplified flow format",
  "returns": "Array of simplified item objects as per flow_item_get",
  "kind": "query",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "filter",
    "type": "string",
    "doc": "JSON object of filters, eg {\"category\":\"Double\"} or {\"field-1\":\"value\",\"field-2\":[\"val1\",\"val2\"]}"
   },
   {
    "name": "limit",
    "type": "number",
    "doc": "(optional, default 100, max 1000)"
   }
  ]
 },
 {
  "name": "flow_app_search",
  "title": "Flow App Search (Podio)",
  "doc": "Search items in a Podio App by field value and return in simplified flow format",
  "returns": "Array of simplified item objects as per flow_item_get",
  "kind": "query",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "field_id",
    "type": "string",
    "doc": "external_id or field_id of field to search"
   },
   {
    "name": "search_val",
    "type": "string",
    "doc": "text to search for"
   },
   {
    "name": "condition",
    "type": "string",
    "doc": "E for equals, C for contains"
   },
   {
    "name": "limit",
    "type": "number",
    "doc": "(optional, default 100, max 1000)"
   }
  ]
 },
 {
  "name": "flow_item_comments_fetch",
  "title": "Flow Item Comments Fetch (Podio)",
  "doc": "Get comments for a Podio item in simplified flow format",
  "returns": "Array of simplified comment objects, eg: [ { 'comment_id': 123456789, 'created_by': \"jane.doe@domain.com\", 'value': \"This is a comment\", '_files': [ { 'file_id': 5678, 'name': \"attachment.pdf\", }, ], }, ... ]",
  "kind": "query",
  "args": [
   {
    "name": "item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "limit",
    "type": "number",
    "doc": "(optional, default 100, max 1000)"
   }
  ]
 },
 {
  "name": "flow_item_get",
  "title": "Flow Item get (Podio)",
  "doc": "Get the simplified field values of a Podio Item as a JSON object",
  "returns": "simplified JSON object with all item details, eg: { \"item_id\": 123456789, \"app_id\": 98765432, \"my-text-field\": \"Some text\", \"my-number-field\": 42, \"my-date-field\": \"2024-06-10\", \"my-date-field_end\": \"2024-06-15\", \"my-single-category-field\": \"Option 1\", \"my-multi-category-field\": [\"Option 1\", \"Option 3\"], \"my-email-field\": [\"john.smith@domain.com\"], \"my-phone-field\": [\"+1 555 123 4567\"], \"my-link-field\": [\"https://example.com\"], \"my-progress-field\": 75, \"my-money-field\": { \"amount\": 199.99, \"currency\": \"USD\" }, \"my-embed-field\": [\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\"], \"my-address-field\": \"123 Main St, Anytown, USA\", \"my-user-field\": [ { \"user_id\": 13579246, \"name\": \"Jane Doe\", \"email\": \"jane.doe@domain.com\", }, ], \"my-calculation-field\": 84, \"my-text-calculation-field\": \"Calculated Result\", \"my-image-field\": [ { \"file_id\": 5678, \"name\": \"image.jpg\", }, ], \"my-relation-field\": [ { \"item_id\": 11223344, \"app_id\": 55667788, \"title\": \"Related Item Title\" }, { \"item_id\": 55667788, \"app_id\": 99887766, \"title\": \"Another Related Item\" } ], \"_files\": [ { \"file_id\": 1234, \"name\": \"document.pdf\", }, ... }",
  "kind": "query",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "flow_related_fetch",
  "title": "Flow Related Fetch (Podio)",
  "doc": "Get related items to a Podio Item in the simplified flow format",
  "returns": "Array of simplified item objects as per flow_item_get",
  "kind": "query",
  "args": [
   {
    "name": "item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "limit",
    "type": "number",
    "doc": "(optional, default 100, max 1000)"
   },
   {
    "name": "app_id",
    "type": "number",
    "doc": "(optional - filter by app)"
   },
   {
    "name": "field_id",
    "type": "number",
    "doc": "(optional - filter by field, requires app_id)"
   }
  ]
 },
 {
  "name": "flow_view_fetch",
  "title": "Flow View Fetch (Podio)",
  "doc": "Get items from a Podio View in the simplified flow format",
  "returns": "Array of simplified item objects as per flow_item_get",
  "kind": "query",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "view_id",
    "type": "number",
    "doc": "(0 for all items)"
   },
   {
    "name": "limit",
    "type": "number",
    "doc": "(optional, default 100, max 1000)"
   }
  ]
 },
 {
  "name": "ftp_mkdir",
  "title": "FTP mkdir",
  "doc": "Create a directory on an FTP server",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "conn_name",
    "type": "string",
    "doc": "name of (s)ftp connection"
   },
   {
    "name": "directory",
    "type": "string",
    "doc": "directory to create"
   }
  ]
 },
 {
  "name": "ftp_rename",
  "title": "FTP rename",
  "doc": "Rename a file on an FTP server",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "conn_name",
    "type": "string",
    "doc": "name of (s)ftp connection"
   },
   {
    "name": "filename",
    "type": "string",
    "doc": "file to rename"
   },
   {
    "name": "newname",
    "type": "string",
    "doc": "new name for file"
   }
  ]
 },
 {
  "name": "ftp_rmdir",
  "title": "FTP rmdir",
  "doc": "Delete a directory on an FTP server",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "conn_name",
    "type": "string",
    "doc": "name of (s)ftp connection"
   },
   {
    "name": "directory",
    "type": "string",
    "doc": "directory to delete"
   }
  ]
 },
 {
  "name": "ftp_scandir",
  "title": "FTP scandir",
  "doc": "Get the directory listing from an FTP server",
  "returns": "JSON array of files",
  "kind": "mutation",
  "args": [
   {
    "name": "conn_name",
    "type": "string",
    "doc": "name of (s)ftp connection"
   },
   {
    "name": "directory",
    "type": "string",
    "doc": "directory to list"
   }
  ]
 },
 {
  "name": "google_doc_create",
  "title": "Google Docs Create",
  "doc": "Create a new Google Docs Document, Sheet, etc",
  "returns": "JSON encoded http link to file",
  "kind": "mutation",
  "args": [
   {
    "name": "filename",
    "type": "string",
    "doc": ""
   },
   {
    "name": "folder_id",
    "type": "string",
    "doc": "optional ID of the Google Drive folder"
   },
   {
    "name": "type",
    "type": "string",
    "doc": "document or spreadsheet"
   },
   {
    "name": "shared",
    "type": "boolean",
    "doc": ""
   }
  ]
 },
 {
  "name": "google_drive_delete",
  "title": "Google Drive Delete",
  "doc": "Delete a Google Drive document or folder",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "google_id",
    "type": "string",
    "doc": "ID of the Google Drive file or folder"
   }
  ]
 },
 {
  "name": "google_drive_folder_create",
  "title": "Google New Folder",
  "doc": "Create a new Google Drive Folder",
  "returns": "folder ID",
  "kind": "mutation",
  "args": [
   {
    "name": "folder_name",
    "type": "string",
    "doc": ""
   },
   {
    "name": "parent_folder_id",
    "type": "string",
    "doc": "optional ID of the Google Drive parent folder to create this folder in"
   },
   {
    "name": "shared",
    "type": "boolean",
    "doc": ""
   }
  ]
 },
 {
  "name": "google_drive_list",
  "title": "Google Drive List",
  "doc": "List the contents of a Google Drive folder",
  "returns": "",
  "kind": "query",
  "args": [
   {
    "name": "folder_id",
    "type": "string",
    "doc": "ID of folder to list"
   }
  ]
 },
 {
  "name": "google_drive_move",
  "title": "Google Drive Move",
  "doc": "Move a Google Doc or Folder",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "file_or_folder_id",
    "type": "string",
    "doc": "ID of file or folder to move"
   },
   {
    "name": "new_folder_id",
    "type": "string",
    "doc": "ID of the Google Drive parent folder to move the item to"
   }
  ]
 },
 {
  "name": "google_drive_pdf_to_html",
  "title": "Google Drive PDF to HTML",
  "doc": "Get the HTML version of a Google Drive PDF file (note: creates a temporary Google Docs file)",
  "returns": "HTML version of the PDF",
  "kind": "mutation",
  "args": [
   {
    "name": "google_file_id",
    "type": "string",
    "doc": "ID of the Google Drive file"
   }
  ]
 },
 {
  "name": "google_drive_rename",
  "title": "Google Drive Rename",
  "doc": "Rename a Google Doc or Folder",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "file_or_folder_id",
    "type": "string",
    "doc": "ID of file or folder to move"
   },
   {
    "name": "new_filename",
    "type": "string",
    "doc": "new file or folder name to rename the item to"
   }
  ]
 },
 {
  "name": "google_team_drive_delete",
  "title": "Google Team Drive Delete",
  "doc": "Delete a Google Team Drive document or folder",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "google_id",
    "type": "string",
    "doc": "ID of the Google Drive file or folder"
   },
   {
    "name": "team_drive_id",
    "type": "string",
    "doc": "ID of the Google Team Drive parent folder to create this folder in"
   }
  ]
 },
 {
  "name": "google_team_drive_folder_create",
  "title": "Google New Team Folder",
  "doc": "Create a new Google Team Drive Folder",
  "returns": "folder ID",
  "kind": "mutation",
  "args": [
   {
    "name": "folder_name",
    "type": "string",
    "doc": ""
   },
   {
    "name": "team_drive_id",
    "type": "string",
    "doc": "ID of the Google Team Drive parent folder to create this folder in"
   },
   {
    "name": "parent_folder_id",
    "type": "string",
    "doc": "optional ID of the Google Drive parent folder to create this folder in"
   }
  ]
 },
 {
  "name": "google_team_drive_list",
  "title": "Google Drive List",
  "doc": "List the contents of a Google Drive folder",
  "returns": "",
  "kind": "query",
  "args": [
   {
    "name": "team_drive_id",
    "type": "string",
    "doc": "ID of the Google Team Drive parent folder to create this folder in"
   },
   {
    "name": "folder_id",
    "type": "string",
    "doc": "ID of folder to list"
   }
  ]
 },
 {
  "name": "google_team_drive_move",
  "title": "Google Team Drive Move",
  "doc": "Move a Google Doc or Folder in a Google Team Drive",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "team_drive_id",
    "type": "string",
    "doc": "ID of the Google Team Drive parent folder to create this folder in"
   },
   {
    "name": "file_or_folder_id",
    "type": "string",
    "doc": "ID of file or folder to move"
   },
   {
    "name": "new_folder_id",
    "type": "string",
    "doc": "ID of the Google Drive parent folder to move the item to"
   }
  ]
 },
 {
  "name": "google_team_drive_rename",
  "title": "Google Team Drive Rename",
  "doc": "Rename a Google Team Drive Doc or Folder",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "file_or_folder_id",
    "type": "string",
    "doc": "ID of file or folder to move"
   },
   {
    "name": "team_drive_id",
    "type": "string",
    "doc": "ID of the Google Team Drive parent folder to create this folder in"
   },
   {
    "name": "new_filename",
    "type": "string",
    "doc": "new file or folder name to rename the item to"
   }
  ]
 },
 {
  "name": "hello_world",
  "title": "Hello World",
  "doc": "The most basic example of a script. Given a name, it will simply greet the person with Hello.",
  "returns": "string - greeting to person",
  "kind": "query",
  "args": [
   {
    "name": "name",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "html_to_markdown",
  "title": "HTML to Markdown",
  "doc": "Convert HTML to MarkDown (not an exact science - use with simple html for best results)",
  "returns": "markdown text",
  "kind": "mutation",
  "args": [
   {
    "name": "html",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "infolobby_api_raw_curl",
  "title": "InfoLobby Raw Curl",
  "doc": "Remote curl to any InfoLobby API endpoint using POST PUT PATCH DELETE etc",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "url",
    "type": "string",
    "doc": "eg /table/ID/get"
   },
   {
    "name": "method",
    "type": "string",
    "doc": "GET, POST, PUT, PATCH, or DELETE"
   },
   {
    "name": "payload",
    "type": "string",
    "doc": "in JSON format"
   }
  ]
 },
 {
  "name": "infolobby_file_from_google",
  "title": "Google File to InfoLobby",
  "doc": "Copy a file from Google Drive to an InfoLobby record",
  "returns": "JSON response from InfoLobby",
  "kind": "mutation",
  "args": [
   {
    "name": "google_file_id",
    "type": "string",
    "doc": "ID of the Google Drive file"
   },
   {
    "name": "table_id",
    "type": "number",
    "doc": "ID of the InfoLobby table"
   },
   {
    "name": "record_id",
    "type": "number",
    "doc": "ID of the InfoLobby record"
   },
   {
    "name": "field_id",
    "type": "string",
    "doc": "ID of the file/image field"
   }
  ]
 },
 {
  "name": "infolobby_report_execute",
  "title": "InfoLobby Report Execute",
  "doc": "Execute an InfoLobby Report Tile and return computed values",
  "returns": "JSON object with report results (varies by type: scalar, group, columns+rows)",
  "kind": "mutation",
  "args": [
   {
    "name": "table_id",
    "type": "number",
    "doc": "ID of the table the report belongs to"
   },
   {
    "name": "report_id",
    "type": "number",
    "doc": "ID of the report tile to execute"
   }
  ]
 },
 {
  "name": "infolobby_table_query",
  "title": "InfoLobby Table Query",
  "doc": "Query an InfoLobby Table with filter and sort",
  "returns": "JSON object with array of table data",
  "kind": "mutation",
  "args": [
   {
    "name": "table_id",
    "type": "number",
    "doc": "ID of table"
   },
   {
    "name": "filters",
    "type": "string",
    "doc": "JSON filter conditions array as per API, eg: [{\"field\":\"status\",\"compare\":\"C\",\"value\":\"foo\"}]"
   },
   {
    "name": "fields",
    "type": "string",
    "doc": "JSON array of fields to return, eg: [\"title\",\"status\"]"
   },
   {
    "name": "sort",
    "type": "string",
    "doc": "field ID to sort by, eg \"title\""
   },
   {
    "name": "sort_dir",
    "type": "string",
    "doc": "sort direction, either \"asc\" or \"desc\""
   },
   {
    "name": "limit",
    "type": "number",
    "doc": "number of rows to return"
   },
   {
    "name": "offset",
    "type": "number",
    "doc": "offset to start from"
   },
   {
    "name": "view_id",
    "type": "number",
    "doc": "optional view ID to filter by (0 = no view)"
   }
  ]
 },
 {
  "name": "infolobby_table_row_create",
  "title": "InfoLobby Table Row Create",
  "doc": "Create an InfoLobby table record",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "table_id",
    "type": "number",
    "doc": "ID of table"
   },
   {
    "name": "data",
    "type": "string",
    "doc": "JSON object with table row data"
   }
  ]
 },
 {
  "name": "infolobby_table_row_delete",
  "title": "InfoLobby Table Row Delete",
  "doc": "Delete an InfoLobby table row",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "table_id",
    "type": "number",
    "doc": "ID of table"
   },
   {
    "name": "item_id",
    "type": "number",
    "doc": "ID of table row"
   }
  ]
 },
 {
  "name": "infolobby_table_row_get",
  "title": "InfoLobby Table Row Get",
  "doc": "Get a InfoLobby table row as a JSON object",
  "returns": "array of table row data",
  "kind": "query",
  "args": [
   {
    "name": "table_id",
    "type": "number",
    "doc": "ID of table"
   },
   {
    "name": "item_id",
    "type": "number",
    "doc": "ID of table row"
   }
  ]
 },
 {
  "name": "infolobby_table_row_update",
  "title": "InfoLobby Table Row Update",
  "doc": "Update an InfoLobby table row",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "table_id",
    "type": "number",
    "doc": "ID of table"
   },
   {
    "name": "item_id",
    "type": "number",
    "doc": "ID of table row"
   },
   {
    "name": "data",
    "type": "string",
    "doc": "JSON object with table row data"
   }
  ]
 },
 {
  "name": "infolobby_table_search",
  "title": "InfoLobby Table Search",
  "doc": "Search an InfoLobby Table for a substring",
  "returns": "JSON object with array of table data",
  "kind": "query",
  "args": [
   {
    "name": "table_id",
    "type": "number",
    "doc": "ID of table"
   },
   {
    "name": "search",
    "type": "string",
    "doc": "substring to search for"
   },
   {
    "name": "fields",
    "type": "string",
    "doc": "JSON array of fields to return, eg: [\"title\",\"status\"]"
   },
   {
    "name": "sort",
    "type": "string",
    "doc": "field ID to sort by, eg \"title\""
   },
   {
    "name": "sort_dir",
    "type": "string",
    "doc": "sort direction, either \"asc\" or \"desc\""
   },
   {
    "name": "limit",
    "type": "number",
    "doc": "number of rows to return"
   },
   {
    "name": "offset",
    "type": "number",
    "doc": "offset to start from"
   },
   {
    "name": "view_id",
    "type": "number",
    "doc": "optional view ID to filter by (0 = no view)"
   }
  ]
 },
 {
  "name": "jev_choice",
  "title": "JEV Choice (Pick from Options)",
  "doc": "Pick from a list of options using TypeSafe JEV. Returns the chosen label. Uses 1 action.",
  "returns": "string label (or JSON object if detail=true)",
  "kind": "mutation",
  "args": [
   {
    "name": "instructions",
    "type": "string",
    "doc": "what to decide"
   },
   {
    "name": "criteria",
    "type": "json",
    "doc": "options map {\"label\":\"description\",...} (max 255)"
   },
   {
    "name": "state",
    "type": "string",
    "doc": "the content to evaluate (optional)"
   },
   {
    "name": "detail",
    "type": "boolean",
    "doc": "return full JSON with probabilities and confidence (optional, default=false)"
   }
  ]
 },
 {
  "name": "jev_noul",
  "title": "JEV Noul (True/False)",
  "doc": "Make a true/false judgment using TypeSafe JEV. Returns a float 0-1 (1=strong yes, 0=strong no). Uses 1 action.",
  "returns": "float 0-1 (or JSON object if detail=true)",
  "kind": "mutation",
  "args": [
   {
    "name": "instructions",
    "type": "string",
    "doc": "the yes/no question to judge"
   },
   {
    "name": "state",
    "type": "string",
    "doc": "the content to evaluate (optional)"
   },
   {
    "name": "detail",
    "type": "boolean",
    "doc": "return full JSON with probabilities (optional, default=false)"
   }
  ]
 },
 {
  "name": "jev_score",
  "title": "JEV Score (Numeric Rating)",
  "doc": "Rate on a numeric spectrum using TypeSafe JEV. Returns a numeric score. Uses 1 action.",
  "returns": "numeric score (or JSON object if detail=true)",
  "kind": "mutation",
  "args": [
   {
    "name": "instructions",
    "type": "string",
    "doc": "what to rate"
   },
   {
    "name": "criteria",
    "type": "json",
    "doc": "ordered array of 2-10 level descriptions [\"low\",\"mid\",\"high\"]"
   },
   {
    "name": "state",
    "type": "string",
    "doc": "the content to evaluate (optional)"
   },
   {
    "name": "detail",
    "type": "boolean",
    "doc": "return full JSON with legend, probabilities and confidence (optional, default=false)"
   }
  ]
 },
 {
  "name": "json_key_get",
  "title": "JSON Get Key",
  "doc": "Finds a key in a JSON array",
  "returns": "JSON object or JSON array of matching key value, or NULL if not found",
  "kind": "query",
  "args": [
   {
    "name": "json",
    "type": "string",
    "doc": ""
   },
   {
    "name": "key",
    "type": "string",
    "doc": "key to find separated by . (eg order.name or orders.*.sku where * returns an array of all)"
   }
  ]
 },
 {
  "name": "json_key_set",
  "title": "JSON Set Key",
  "doc": "Sets a key or keys to a value in a JSON array",
  "returns": "JSON object with altered keys",
  "kind": "mutation",
  "args": [
   {
    "name": "json",
    "type": "string",
    "doc": ""
   },
   {
    "name": "key",
    "type": "string",
    "doc": "key to find separated by . (eg order.name or orders.*.sku where * indicates all)"
   },
   {
    "name": "value",
    "type": "string",
    "doc": "JSON value to assign to the above key or keys"
   }
  ]
 },
 {
  "name": "markdown_to_html",
  "title": "Markdown to HTML",
  "doc": "Converts markdown formatted text to html",
  "returns": "html of provided markdown",
  "kind": "mutation",
  "args": [
   {
    "name": "markdown",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "mysql_array",
  "title": "MySQL Array",
  "doc": "Return a multi-row result from MySQL",
  "returns": "JSON array of results, eg: [{\"id\":\"1\",\"title\":\"lorem ipsum\"},{\"id\":\"2\",\"title\":\"amet qui\"}]",
  "kind": "mutation",
  "args": [
   {
    "name": "sql",
    "type": "string",
    "doc": "sql query with ? for placeholders, eg: SELECT * FROM mytable WHERE status=?"
   },
   {
    "name": "params",
    "type": "string",
    "doc": "JSON array of parameters in order as required by query, eg: [\"foo\"]"
   },
   {
    "name": "conn_name",
    "type": "string",
    "doc": "optional connection name if you have more than 1 mysql connection configured"
   }
  ]
 },
 {
  "name": "mysql_command",
  "title": "MySQL Command",
  "doc": "Perform a MySQL command",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "sql",
    "type": "string",
    "doc": "sql command with ? for placeholders, eg: INSERT INTO mytable (title, status) VALUES (?, ?)"
   },
   {
    "name": "params",
    "type": "string",
    "doc": "JSON array of parameters in order as required by query, eg: [\"lorem ipsum\", \"baz\"]"
   },
   {
    "name": "conn_name",
    "type": "string",
    "doc": "optional connection name if you have more than 1 mysql connection configured"
   }
  ]
 },
 {
  "name": "mysql_query",
  "title": "MySQL Query",
  "doc": "Return a single query result from MySQL",
  "returns": "JSON array of results, eg: {\"count\":12}",
  "kind": "mutation",
  "args": [
   {
    "name": "sql",
    "type": "string",
    "doc": "sql query with ? for placeholders, eg: SELECT COUNT(*) AS count FROM mytable WHERE status=?"
   },
   {
    "name": "params",
    "type": "string",
    "doc": "JSON array of parameters in order as required by query, eg: [\"foo\"]"
   },
   {
    "name": "conn_name",
    "type": "string",
    "doc": "optional connection name if you have more than 1 mysql connection configured"
   }
  ]
 },
 {
  "name": "notion_api_raw_curl",
  "title": "Notion (Official) Raw Curl",
  "doc": "Remote curl to any Notion API endpoint using POST PUT PATCH DELETE etc",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "url",
    "type": "string",
    "doc": "eg /databases"
   },
   {
    "name": "method",
    "type": "string",
    "doc": "GET, POST, PUT, PATCH, or DELETE"
   },
   {
    "name": "payload",
    "type": "string",
    "doc": "in JSON format"
   }
  ]
 },
 {
  "name": "notion_block_children",
  "title": "Notion Block Get Children",
  "doc": "Get the Children of a Notion block",
  "returns": "JSON array of child blocks",
  "kind": "mutation",
  "args": [
   {
    "name": "block_id",
    "type": "string",
    "doc": "URL of page or data-block-id of block"
   }
  ]
 },
 {
  "name": "notion_block_create",
  "title": "Notion Block Create",
  "doc": "Create a block on a Notion page or block",
  "returns": "string data-block-id of new block",
  "kind": "mutation",
  "args": [
   {
    "name": "type",
    "type": "string",
    "doc": "type of block, eg \"paragraph\", \"to_do\", etc"
   },
   {
    "name": "text",
    "type": "string",
    "doc": "string for new content for block as paragraph, or json object for complex blocks"
   },
   {
    "name": "parent_id",
    "type": "string",
    "doc": "URL of page or data-block-id of block"
   }
  ]
 },
 {
  "name": "notion_block_get",
  "title": "Notion Block Get",
  "doc": "Get a Notion block",
  "returns": "JSON data of block",
  "kind": "query",
  "args": [
   {
    "name": "block_id",
    "type": "string",
    "doc": "URL of page or data-block-id of block"
   }
  ]
 },
 {
  "name": "notion_block_remove",
  "title": "Notion Block Remove",
  "doc": "Delete a block on a Notion page or block",
  "returns": "string data-block-id of new record",
  "kind": "mutation",
  "args": [
   {
    "name": "block_id",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "notion_block_update",
  "title": "Notion Block Update",
  "doc": "Update a block on a Notion page or block",
  "returns": "string data-block-id of new record",
  "kind": "mutation",
  "args": [
   {
    "name": "block_id",
    "type": "string",
    "doc": "URL of page or data-block-id of block"
   },
   {
    "name": "text",
    "type": "string",
    "doc": "string for new content for block as paragraph, or json object for complex blocks"
   }
  ]
 },
 {
  "name": "notion_page_create",
  "title": "Notion Page Create",
  "doc": "Create a new Child Page in Notion",
  "returns": "string data-block-id of new page",
  "kind": "mutation",
  "args": [
   {
    "name": "parent_id",
    "type": "string",
    "doc": "URL of parent page or page ID"
   },
   {
    "name": "title",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "notion_page_get",
  "title": "Notion Page Get",
  "doc": "Get a Notion page as Markdown",
  "returns": "markdown text of page",
  "kind": "query",
  "args": [
   {
    "name": "block_id",
    "type": "string",
    "doc": "URL of page or data-block-id of block"
   }
  ]
 },
 {
  "name": "notion_search",
  "title": "Notion Search",
  "doc": "Search Notion pages and databases by text query",
  "returns": "JSON array of results in format [{id:name},...]",
  "kind": "query",
  "args": [
   {
    "name": "query",
    "type": "string",
    "doc": ""
   },
   {
    "name": "type",
    "type": "string",
    "doc": "optional: page or database"
   }
  ]
 },
 {
  "name": "notion_table_def",
  "title": "Notion Table Def",
  "doc": "Get a Notion table definition",
  "returns": "array of table data",
  "kind": "mutation",
  "args": [
   {
    "name": "block_id",
    "type": "string",
    "doc": "URL of page or data-block-id of table"
   }
  ]
 },
 {
  "name": "notion_table_get",
  "title": "Notion Table Get",
  "doc": "Get a Notion table block as an associative array",
  "returns": "array of table data",
  "kind": "query",
  "args": [
   {
    "name": "block_id",
    "type": "string",
    "doc": "URL of page or data-block-id of table"
   }
  ]
 },
 {
  "name": "notion_table_get_csv",
  "title": "Notion Table Get CSV",
  "doc": "Get a Notion table block as comma-separated text",
  "returns": "CSV text",
  "kind": "query",
  "args": [
   {
    "name": "block_id",
    "type": "string",
    "doc": "URL of page or data-block-id of table"
   }
  ]
 },
 {
  "name": "notion_table_query",
  "title": "Notion Table Query",
  "doc": "Query a Notion database with filter and sort",
  "returns": "JSON object with array of table data in format: {\"count\":COUNT_OF_ITEMS,\"cursor\":NEXT_PAGE_ID,\"results\"[{BLOCK_ID:{COLUMN:VALUE,...}]}",
  "kind": "mutation",
  "args": [
   {
    "name": "block_id",
    "type": "string",
    "doc": "URL of page or data-block-id of table"
   },
   {
    "name": "filter",
    "type": "string",
    "doc": "JSON filter conditions as per API, eg: {\"property\":\"Status\",\"select\":{\"equals\":\"Closed\"}}"
   },
   {
    "name": "sort",
    "type": "string",
    "doc": "JSON sort order as per API, eg: [{\"timestamp\":\"last_edited_time\",\"direction\":\"descending\"}]"
   },
   {
    "name": "limit",
    "type": "number",
    "doc": "number of rows to return"
   },
   {
    "name": "cursor",
    "type": "string",
    "doc": "start cursor (optional - returned from previous call)"
   }
  ]
 },
 {
  "name": "notion_table_row_add",
  "title": "Notion Table Row Add",
  "doc": "Add a record to a Notion table",
  "returns": "string data-block-id of new record",
  "kind": "mutation",
  "args": [
   {
    "name": "parent_id",
    "type": "string",
    "doc": "URL of page or collection_id of database table"
   },
   {
    "name": "fields",
    "type": "string",
    "doc": "field values in JSON, eg {\"Name\":\"lorem ipsum\",\"Status\":\"in progress\"}"
   }
  ]
 },
 {
  "name": "notion_table_row_delete",
  "title": "Notion Table Row Delete",
  "doc": "Delete a record from a Notion table",
  "returns": "string data-block-id of new record",
  "kind": "mutation",
  "args": [
   {
    "name": "parent_id",
    "type": "string",
    "doc": "URL of page or collection_id of database table"
   },
   {
    "name": "block_id",
    "type": "string",
    "doc": "block_id of the table row"
   }
  ]
 },
 {
  "name": "notion_table_row_get",
  "title": "Notion Table Row Get",
  "doc": "Get a Notion table row as a JSON object",
  "returns": "array of table row data",
  "kind": "query",
  "args": [
   {
    "name": "table_block_id",
    "type": "string",
    "doc": "URL of page or data-block-id of table collection"
   },
   {
    "name": "record_block_id",
    "type": "string",
    "doc": "URL of page or data-block-id of table row"
   }
  ]
 },
 {
  "name": "notion_table_row_update",
  "title": "Notion Table Row Update",
  "doc": "Update a record in a Notion table",
  "returns": "string data-block-id of new record",
  "kind": "mutation",
  "args": [
   {
    "name": "parent_id",
    "type": "string",
    "doc": "URL of page or collection_id of database table"
   },
   {
    "name": "block_id",
    "type": "string",
    "doc": "block_id of the table row"
   },
   {
    "name": "fields",
    "type": "string",
    "doc": "field values in JSON, eg {\"Name\":\"lorem ipsum\",\"Status\":\"in progress\"}"
   }
  ]
 },
 {
  "name": "notion_whoami",
  "title": "Notion Who Am I",
  "doc": "Find out who you are connected as in connected Notion account (Legacy only)",
  "returns": "string - who you are logged in as",
  "kind": "query",
  "args": []
 },
 {
  "name": "open_ai_assistant",
  "title": "OpenAI Assistant",
  "doc": "Ask a question to a specialized OpenAI Assistant (similar to custom GPT)",
  "returns": "text response",
  "kind": "mutation",
  "args": [
   {
    "name": "assistant_id",
    "type": "string",
    "doc": "assistant ID (from OpenAI dashboard)"
   },
   {
    "name": "prompt",
    "type": "string",
    "doc": "prompt for GPT"
   }
  ]
 },
 {
  "name": "open_ai_gpt",
  "title": "OpenAI GPT",
  "doc": "Ask a question to OpenAI (GPT)",
  "returns": "text response",
  "kind": "mutation",
  "args": [
   {
    "name": "prompt",
    "type": "string",
    "doc": "prompt for GPT"
   },
   {
    "name": "model",
    "type": "string",
    "doc": "model to use - default=gpt-4o-mini"
   }
  ]
 },
 {
  "name": "open_ai_image",
  "title": "OpenAI Image",
  "doc": "Ask OpenAI (GPT) to create an image",
  "returns": "text - base64 data of raw image",
  "kind": "mutation",
  "args": [
   {
    "name": "prompt",
    "type": "string",
    "doc": "prompt for GPT"
   },
   {
    "name": "orientation",
    "type": "string",
    "doc": "square, portrait, or landscape"
   }
  ]
 },
 {
  "name": "podio_ai_ask_general",
  "title": "Podio AI Ask General",
  "doc": "Ask a question to a general AI agent on a Podio Item (including comments, related items, and some files). Note this uses our model and usage is charged at 1 action per 250 tokens.",
  "returns": "text response",
  "kind": "mutation",
  "args": [
   {
    "name": "prompt",
    "type": "string",
    "doc": "prompt for GPT"
   },
   {
    "name": "item_id",
    "type": "number",
    "doc": "Podio item ID of item to include in payload (optional)"
   },
   {
    "name": "app_id",
    "type": "number",
    "doc": "Podio app ID of app to include in payload (optional - requires data sync)"
   },
   {
    "name": "custom_tools",
    "type": "string",
    "doc": "comma-separated list of ProcScript block names to use as AI tools (optional)"
   },
   {
    "name": "builtin_tools",
    "type": "string",
    "doc": "comma-separated built-in tools to enable: create,update,delete,task,comment,file or 'all' (optional)"
   }
  ]
 },
 {
  "name": "podio_ai_ask_trained",
  "title": "Podio AI Ask Trained",
  "doc": "Ask a question to a specialized trained AI agent on a Podio Item (including comments, related items, and some files). See Account -> Podio Trained AIs. Note this uses our model and usage is charged at 1 action per 250 tokens.",
  "returns": "text response",
  "kind": "mutation",
  "args": [
   {
    "name": "ai_name",
    "type": "string",
    "doc": "name given to AI"
   },
   {
    "name": "prompt",
    "type": "string",
    "doc": "prompt for GPT"
   },
   {
    "name": "item_id",
    "type": "number",
    "doc": "Podio item ID of item to include in payload (optional)"
   },
   {
    "name": "custom_tools",
    "type": "string",
    "doc": "comma-separated list of ProcScript block names to use as AI tools (optional)"
   },
   {
    "name": "builtin_tools",
    "type": "string",
    "doc": "comma-separated built-in tools to enable: create,update,delete,task,comment,file or 'all' (optional)"
   }
  ]
 },
 {
  "name": "podio_api_raw_curl",
  "title": "Podio Raw Curl",
  "doc": "Remote curl to any Podio API endpoint using POST PUT PATCH DELETE etc",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "url",
    "type": "string",
    "doc": "eg /item"
   },
   {
    "name": "method",
    "type": "string",
    "doc": "GET, POST, PUT, PATCH, or DELETE"
   },
   {
    "name": "options",
    "type": "string",
    "doc": "in JSON format"
   },
   {
    "name": "attributes",
    "type": "string",
    "doc": "in JSON format"
   }
  ]
 },
 {
  "name": "podio_app_activity_recent",
  "title": "Podio App Activity Recent",
  "doc": "Get Recently active Item IDs for a Podio App",
  "returns": "JSON Array of item_id, title, and last_event_on",
  "kind": "query",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "since_date",
    "type": "string",
    "doc": "optional date to stop at in format YYYY-MM-DD or YYYY-MM-DD hh:mm:ss"
   }
  ]
 },
 {
  "name": "podio_app_archive",
  "title": "Archive App",
  "doc": "Archive a Podio app",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_app_create",
  "title": "Podio App Create",
  "doc": "Create a new Podio App as per https://developers.podio.com/doc/applications/add-new-app-22351",
  "returns": "app_id of new app",
  "kind": "mutation",
  "args": [
   {
    "name": "attributes",
    "type": "string",
    "doc": "JSON attributes as per documentation at https://developers.podio.com/doc/applications/add-new-app-22351"
   }
  ]
 },
 {
  "name": "podio_app_field_ensure_category",
  "title": "Podio App Ensure Category",
  "doc": "Make sure that a category value exists in a Podio App category Field - will be added if not an option already",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "field_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "value",
    "type": "string",
    "doc": "either a single value or a comma-separated list of values"
   }
  ]
 },
 {
  "name": "podio_app_field_get_categories",
  "title": "Podio App Get Categories",
  "doc": "Get all category values in a Podio App category Field",
  "returns": "JSON array of values",
  "kind": "query",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "field_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_app_field_get_category_id",
  "title": "Podio App Get Category ID",
  "doc": "Get the ID of a category value in a Podio App category Field",
  "returns": "integer of category value id",
  "kind": "query",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "field_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "field_text",
    "type": "string",
    "doc": "text value of the category to get"
   }
  ]
 },
 {
  "name": "podio_app_get_by_label",
  "title": "App get by Label",
  "doc": "Get a Podio App given the space and app label",
  "returns": "JSON object with all app details",
  "kind": "query",
  "args": [
   {
    "name": "space_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "url_label",
    "type": "string",
    "doc": "label in the url for this app"
   }
  ]
 },
 {
  "name": "podio_app_get_raw",
  "title": "Podio App get RAW",
  "doc": "Get the full payload of a Podio App as a JSON object",
  "returns": "JSON object with all app details",
  "kind": "query",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_app_install",
  "title": "Install App",
  "doc": "Install App or App Pack from App Market into a Workspace",
  "returns": "comma-separated list of app ids",
  "kind": "mutation",
  "args": [
   {
    "name": "share_id",
    "type": "number",
    "doc": "ID of the share in the app market"
   },
   {
    "name": "space_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_app_item_get_raw",
  "title": "Podio App Item get RAW",
  "doc": "Get the full payload of a Podio Item as a JSON object by app_item_id",
  "returns": "JSON object with all item details",
  "kind": "query",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "app_item_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_app_items_export",
  "title": "Export App Items",
  "doc": "Exports the given Podio app to an xls or xlsx file",
  "returns": "Batch ID",
  "kind": "mutation",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "extension",
    "type": "string",
    "doc": "xls or xlsx"
   },
   {
    "name": "attributes",
    "type": "string",
    "doc": "in JSON format for field attributes of data as per https://developers.podio.com/doc/items/export-items-4235696"
   }
  ]
 },
 {
  "name": "podio_app_search",
  "title": "Podio Search App",
  "doc": "Search a Podio App for matching Items by field",
  "returns": "Array of JSON item objects",
  "kind": "query",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "field_id",
    "type": "number",
    "doc": "or string - field to search in"
   },
   {
    "name": "search_val",
    "type": "string",
    "doc": "text to match in above field"
   },
   {
    "name": "condition",
    "type": "string",
    "doc": "search condition - E for equals, or C for contains"
   },
   {
    "name": "max_results",
    "type": "number",
    "doc": "max number of items to return up to 20"
   },
   {
    "name": "simplified",
    "type": "number",
    "doc": "1 for a simpler values (eg contact name only)"
   }
  ]
 },
 {
  "name": "podio_app_search_all",
  "title": "PFUI Podio Search App - Special version for PFUI only",
  "doc": "Search a Podio App for matching Items",
  "returns": "Array of JSON item objects",
  "kind": "query",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "search_val",
    "type": "string",
    "doc": "text to match in above field"
   },
   {
    "name": "condition",
    "type": "string",
    "doc": "search condition - E for equals, or C for contains"
   },
   {
    "name": "max_results",
    "type": "number",
    "doc": "max number of items to return up to 20"
   },
   {
    "name": "offset",
    "type": "number",
    "doc": "optional start position - default 0"
   }
  ]
 },
 {
  "name": "podio_app_update",
  "title": "Podio App Update",
  "doc": "Update a Podio App as per https://developers.podio.com/doc/applications/update-app-v2-144091799",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "attributes",
    "type": "string",
    "doc": "JSON attributes as per documentation at https://developers.podio.com/doc/applications/update-app-v2-144091799"
   }
  ]
 },
 {
  "name": "podio_comment_copy",
  "title": "Podio Copy Comment",
  "doc": "Copy a comment to another Podio Item",
  "returns": "comment_id of created comment",
  "kind": "mutation",
  "args": [
   {
    "name": "comment_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "to_podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "add_headers",
    "type": "number",
    "doc": "1 if you want the new comments to include the date and creator name of the source comment"
   },
   {
    "name": "include_files",
    "type": "number",
    "doc": "1 if you want to copy files as well"
   },
   {
    "name": "hook",
    "type": "boolean",
    "doc": "true or false whether to create a hook event in Podio"
   },
   {
    "name": "silent",
    "type": "boolean",
    "doc": "true or false whether to include the silent flag"
   }
  ]
 },
 {
  "name": "podio_comment_create",
  "title": "Podio Create Comment",
  "doc": "Create a comment on a Podio item",
  "returns": "comment_id (integer) of created comment",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "value",
    "type": "string",
    "doc": ""
   },
   {
    "name": "hook",
    "type": "boolean",
    "doc": "true or false whether to create a hook event in Podio"
   },
   {
    "name": "silent",
    "type": "boolean",
    "doc": "true or false whether to include the silent flag"
   }
  ]
 },
 {
  "name": "podio_comment_create_silent",
  "title": "Create Comment Silent",
  "doc": "Create a comment on an item silently",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "value",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_comment_delete",
  "title": "Podio Comment Delete",
  "doc": "Delete a comment on a Podio item",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_comment_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "hook",
    "type": "boolean",
    "doc": "true or false whether to create a hook event in Podio"
   },
   {
    "name": "silent",
    "type": "boolean",
    "doc": "true or false whether to include the silent flag"
   }
  ]
 },
 {
  "name": "podio_comment_file_from_base64",
  "title": "Podio Comment File from Base64",
  "doc": "Make a file from provided base64 text and attach it to a Podio Comment.",
  "returns": "file ID of created file",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_comment_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "filename",
    "type": "string",
    "doc": ""
   },
   {
    "name": "base64_data",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_comment_files_to_item",
  "title": "Comment Files to Item",
  "doc": "Copy all files from a Podio Comment to the Item",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "comment_id",
    "type": "number",
    "doc": "if omitted will use most recent comment"
   }
  ]
 },
 {
  "name": "podio_comment_get_raw",
  "title": "Podio Comment get RAW",
  "doc": "Get the full raw payload of a Podio comment as a JSON object",
  "returns": "JSON object with all comment details",
  "kind": "query",
  "args": [
   {
    "name": "comment_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_comment_update",
  "title": "Podio Update Comment",
  "doc": "Update a comment on a Podio item",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "comment_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "value",
    "type": "string",
    "doc": ""
   },
   {
    "name": "hook",
    "type": "boolean",
    "doc": "true or false whether to create a hook event in Podio"
   },
   {
    "name": "silent",
    "type": "boolean",
    "doc": "true or false whether to include the silent flag"
   }
  ]
 },
 {
  "name": "podio_data_prep_for_app",
  "title": "Podio Data Prep For App",
  "doc": "Given a data array of field values, prepare them for Podio. Explodes Category values by comma. Adds currency to money fields. Fixes dates and times. Creates embeds for links. Defaults email and phone types. Uploads url images as files.",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "values",
    "type": "string",
    "doc": "in JSON format external_id:value, eg {\"title\":\"foo bar\",\"category\":\"Closed\"}"
   },
   {
    "name": "defaults",
    "type": "string",
    "doc": "in JSON format for currency, email_type, and phone_type, eg {\"currency\":\"USD\",\"email_type\":\"work\"}"
   }
  ]
 },
 {
  "name": "podio_file_copy",
  "title": "Podio File Copy",
  "doc": "Make a copy of a Podio file",
  "returns": "ID of new file",
  "kind": "mutation",
  "args": [
   {
    "name": "file_id",
    "type": "number",
    "doc": "id of the file in Podio"
   }
  ]
 },
 {
  "name": "podio_file_csv_from_array",
  "title": "Array to Podio CSV",
  "doc": "Create a CSV file from a multi-dimensional array and attach it to a Podio Item",
  "returns": "file ID",
  "kind": "mutation",
  "args": [
   {
    "name": "data",
    "type": "string",
    "doc": "JSON associative array of values, eg [{\"title\":\"foo\",\"number\":42},{\"title\":\"bar\",\"number\":3}]"
   },
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "file_name",
    "type": "string",
    "doc": ""
   },
   {
    "name": "delimiter",
    "type": "string",
    "doc": "comma by default"
   }
  ]
 },
 {
  "name": "podio_file_csv_parse",
  "title": "Podio CSV Parse",
  "doc": "Get a Podio Item's CSV file and return it as a JSON array",
  "returns": "Json array",
  "kind": "query",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "podio_file_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "csv_delimiter",
    "type": "string",
    "doc": "optional delimiter - comma is default"
   }
  ]
 },
 {
  "name": "podio_file_csv_regex_replace",
  "title": "CSV Preg Replace",
  "doc": "Perform regular expression replacments in columns of a CSV file",
  "returns": "New file ID",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "podio_file_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "column_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "regex_match",
    "type": "string",
    "doc": "regular expression to match (or json encoded arrays of expressions)"
   },
   {
    "name": "regex_replace",
    "type": "string",
    "doc": "regex pattern to replace matches with (or json encoded arrays of patterns)"
   },
   {
    "name": "new_file_name",
    "type": "string",
    "doc": "name for new file"
   }
  ]
 },
 {
  "name": "podio_file_delete_by_id",
  "title": "Podio File Delete by ID",
  "doc": "Delete a Podio file by it's ID",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "file_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_file_from_base64",
  "title": "Base64 to Item File",
  "doc": "Make a file from provided base64 text and attach it to a Podio Item.",
  "returns": "file ID of created file",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "filename",
    "type": "string",
    "doc": ""
   },
   {
    "name": "base64_data",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_file_from_google",
  "title": "Google File to Podio",
  "doc": "Copy a file from Google Drive to a Podio Item",
  "returns": "file ID",
  "kind": "mutation",
  "args": [
   {
    "name": "google_file_id",
    "type": "string",
    "doc": "ID of the Google Drive file"
   },
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "linked",
    "type": "boolean",
    "doc": "true to link from google, false to completely copy - default false"
   }
  ]
 },
 {
  "name": "podio_file_get_base64",
  "title": "Podio File Get Base64",
  "doc": "Get a Podio File as Base64 encoded text",
  "returns": "",
  "kind": "query",
  "args": [
   {
    "name": "file_id",
    "type": "number",
    "doc": "id of the file in Podio"
   }
  ]
 },
 {
  "name": "podio_file_ical_parse",
  "title": "Podio ICAL Parse",
  "doc": "Get a Podio Item's ICAL or ICS file and return it's events as a JSON array",
  "returns": "Json array",
  "kind": "query",
  "args": [
   {
    "name": "podio_file_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_file_text_create",
  "title": "Text File Create",
  "doc": "Create a new text file and attach it to a Podio item",
  "returns": "ID of created file",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "file_name",
    "type": "string",
    "doc": ""
   },
   {
    "name": "content",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_file_text_read",
  "title": "Text File Read",
  "doc": "Read the contents of a text file on a Podio item",
  "returns": "Text content of file",
  "kind": "query",
  "args": [
   {
    "name": "podio_file_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "force_utf8",
    "type": "string",
    "doc": "1 if you want the file to be encoded to utf8 else 0 to leave it as is"
   }
  ]
 },
 {
  "name": "podio_file_upload",
  "title": "Podio File Upload",
  "doc": "Upload an existing Podio file to another Podio item",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "file_id",
    "type": "number",
    "doc": "id of the file in Podio"
   },
   {
    "name": "hook",
    "type": "boolean",
    "doc": "true or false whether to create a hook event in Podio"
   },
   {
    "name": "silent",
    "type": "boolean",
    "doc": "true or false whether to include the silent flag"
   }
  ]
 },
 {
  "name": "podio_file_upload_unlinked",
  "title": "File Upload",
  "doc": "Upload a remote file by url to Podio without linking it to anything",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "file_url",
    "type": "string",
    "doc": ""
   },
   {
    "name": "file_name",
    "type": "string",
    "doc": "optional name to give the file in Podio"
   }
  ]
 },
 {
  "name": "podio_file_xls_from_array",
  "title": "Array to Podio Excel File",
  "doc": "Create an Excel file from a multi-dimensional array and attach it to a Podio Item",
  "returns": "ID of created file",
  "kind": "mutation",
  "args": [
   {
    "name": "data",
    "type": "string",
    "doc": "multi-dimensional JSON array of data, eg: [{\"id\":\"1\",\"title\":\"lorem ipsum\"},{\"id\":\"2\",\"title\":\"amet qui\"}]"
   },
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "file_name",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_file_xls_parse",
  "title": "Podio XLS Parse",
  "doc": "Get a Podio Item's XLS file and return it as a JSON array",
  "returns": "Json array",
  "kind": "query",
  "args": [
   {
    "name": "podio_file_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "sheet_index",
    "type": "number",
    "doc": "(optional, default 0)"
   }
  ]
 },
 {
  "name": "podio_file_xls_to_csv",
  "title": "Podio XLS to CSV",
  "doc": "Convert Podio XLS or XLSX files to CSV",
  "returns": "JSON array of file ID's",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "pattern",
    "type": "string",
    "doc": "file pattern to match on like *.xls"
   }
  ]
 },
 {
  "name": "podio_files_delete",
  "title": "Podio Files Delete",
  "doc": "Delete Podio files matching pattern from a Podio Item",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "pattern",
    "type": "string",
    "doc": "file pattern to match on like *.pdf"
   }
  ]
 },
 {
  "name": "podio_files_from_ftp",
  "title": "FTP Files to Podio",
  "doc": "Copy files matching pattern from an FTP server to a Podio Item",
  "returns": "JSON array of file IDs => names copied",
  "kind": "mutation",
  "args": [
   {
    "name": "conn_name",
    "type": "string",
    "doc": "name of (s)ftp connection"
   },
   {
    "name": "directory",
    "type": "string",
    "doc": "directory to copy files to"
   },
   {
    "name": "pattern",
    "type": "string",
    "doc": "file pattern to match on like *.pdf"
   },
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_files_pdf_combine",
  "title": "Podio PDF Combine",
  "doc": "Get a Podio Item's PDF files and combine them into on single PDF",
  "returns": "file id of new pdf",
  "kind": "mutation",
  "args": [
   {
    "name": "item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "new_file_name",
    "type": "string",
    "doc": "filename of new combined PDF"
   },
   {
    "name": "file_names",
    "type": "string",
    "doc": "comma-separated list of PDF filenames to combine"
   },
   {
    "name": "to_item_id",
    "type": "number",
    "doc": "optional if to save to different item"
   }
  ]
 },
 {
  "name": "podio_files_pdf_combine_by_ids",
  "title": "Podio PDF Combine IDs",
  "doc": "Get multiple PDF files from Podio and combine them",
  "returns": "file id of new pdf",
  "kind": "mutation",
  "args": [
   {
    "name": "file_ids",
    "type": "string",
    "doc": "comma-separated list of file IDs"
   },
   {
    "name": "to_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "new_file_name",
    "type": "string",
    "doc": "filename of new combined PDF"
   }
  ]
 },
 {
  "name": "podio_files_to_ftp",
  "title": "Podio Files to FTP",
  "doc": "Copy files matching pattern from a Podio Item to an FTP server",
  "returns": "JSON array of file names copied",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "pattern",
    "type": "string",
    "doc": "file pattern to match on like *.pdf"
   },
   {
    "name": "conn_name",
    "type": "string",
    "doc": "name of (s)ftp connection"
   },
   {
    "name": "directory",
    "type": "string",
    "doc": "directory to copy files to"
   }
  ]
 },
 {
  "name": "podio_files_to_google",
  "title": "Podio Files to Google",
  "doc": "Copy files matching pattern from a Podio Item to Google Drive. Warning: replace will not work if existing file is not within first 1000 items in GD folder.",
  "returns": "JSON array of file ID's",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "pattern",
    "type": "string",
    "doc": "file pattern to match on like *.pdf"
   },
   {
    "name": "folder_id",
    "type": "string",
    "doc": "optional ID of the Google Drive folder"
   },
   {
    "name": "team_drive_id",
    "type": "string",
    "doc": "optional drive ID if Google Team Drive"
   },
   {
    "name": "replace",
    "type": "boolean",
    "doc": "true or false whether to overwrite existing file(s) - default false"
   },
   {
    "name": "to_podio",
    "type": "boolean",
    "doc": "true or false whether to attach Google file to Podio item - default true"
   }
  ]
 },
 {
  "name": "podio_files_to_sharefile",
  "title": "Podio Files to ShareFile",
  "doc": "Copy files matching pattern from a Podio Item to ShareFile.",
  "returns": "JSON array of file ID's",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "pattern",
    "type": "string",
    "doc": "file pattern to match on like *.pdf"
   },
   {
    "name": "folder_id",
    "type": "string",
    "doc": "optional ID of the ShareFile folder"
   },
   {
    "name": "link_to_item",
    "type": "boolean",
    "doc": "true or false whether to link the file to the Podio Item again - default true"
   }
  ]
 },
 {
  "name": "podio_files_zip",
  "title": "Podio Files ZIP",
  "doc": "Create a zip archive of files matching pattern from a Podio Item",
  "returns": "File ID of new ZIP file",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "pattern",
    "type": "string",
    "doc": "file pattern to match on like *.pdf"
   },
   {
    "name": "file_name",
    "type": "string",
    "doc": "name of zip file"
   }
  ]
 },
 {
  "name": "podio_google_doc_getas_html",
  "title": "Google Doc Get As HTML",
  "doc": "Get the HTML version of a Google Docs Doc on an Item (not sheet etc)",
  "returns": "HTML version of the doc",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "filename",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_google_files_share",
  "title": "Item Google Files Share",
  "doc": "Publicly share an Item's file(s) hosted in Google Drive and get their links",
  "returns": "comma-separated list of http links to shared file(s)",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "pattern",
    "type": "string",
    "doc": "file pattern to match on like *.pdf"
   }
  ]
 },
 {
  "name": "podio_home_widget_create",
  "title": "Home Widget Create",
  "doc": "Create a new text Widget / Tile on your Home stream",
  "returns": "Returns the widget_id of the new widget",
  "kind": "mutation",
  "args": [
   {
    "name": "title",
    "type": "string",
    "doc": ""
   },
   {
    "name": "value",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_hooks_get_raw",
  "title": "Podio Hooks get RAW",
  "doc": "Get the hooks on a Podio App or Space as a JSON object",
  "returns": "JSON object with all hook details",
  "kind": "query",
  "args": [
   {
    "name": "ref_type",
    "type": "string",
    "doc": "app or space"
   },
   {
    "name": "ref_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_html_to_item_field",
  "title": "Podio Html to Item Field",
  "doc": "Update a text field with HTML trying to preserve as much formatting as possible (ie: images are uploaded to Podio, styles are enhanced, tasks can be extracted)",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "text_field_id",
    "type": "number",
    "doc": "or string for internal_id of multi-line text field"
   },
   {
    "name": "image_field_id",
    "type": "number",
    "doc": "or string for internal_id optional image field for images - if omitted, images will be added as files"
   },
   {
    "name": "html",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_ical_invite_create",
  "title": "ICAL Invite Create",
  "doc": "Create a new ICAL invitation from a Podio Item and attach it as a file",
  "returns": "ID of created file",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "date_field_id",
    "type": "number",
    "doc": "or string"
   },
   {
    "name": "summary_field_id",
    "type": "number",
    "doc": "or string"
   },
   {
    "name": "details_field_id",
    "type": "number",
    "doc": "or string - optional field to use for details"
   },
   {
    "name": "location_field_id",
    "type": "number",
    "doc": "or string - optional field to use for location"
   },
   {
    "name": "organizer_name",
    "type": "string",
    "doc": "optional name of organizer"
   },
   {
    "name": "organizer_email",
    "type": "string",
    "doc": "optional email address of organizer"
   },
   {
    "name": "file_name",
    "type": "string",
    "doc": "optional filename - defaults to invite.ics"
   }
  ]
 },
 {
  "name": "podio_image_files_to_image_field",
  "title": "Image Files to Image Field",
  "doc": "Copy images attached as files to a Podio Item to an image field on that Item",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "image_field_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_image_from_base64",
  "title": "Base64 to Item Image",
  "doc": "Make an image from provided base64 text and attach it to a Podio Item's image field.",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "image_field_id",
    "type": "string",
    "doc": "external ID of image field"
   },
   {
    "name": "filename",
    "type": "string",
    "doc": ""
   },
   {
    "name": "base64_data",
    "type": "string",
    "doc": ""
   },
   {
    "name": "hook",
    "type": "boolean",
    "doc": "optional true or false whether to create a hook event in Podio"
   },
   {
    "name": "silent",
    "type": "boolean",
    "doc": "optional true or false whether to include the silent flag"
   }
  ]
 },
 {
  "name": "podio_images_replace_in_html",
  "title": "HTML Replace Podio Images",
  "doc": "Replace all images with Podio file sources with base64 data for insertion into PDFs etc",
  "returns": "html with img src=data instead of img src=files.podio.com",
  "kind": "mutation",
  "args": [
   {
    "name": "html",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_import_app_items",
  "title": "Importer Import App Items",
  "doc": "Imports the file into the given Podio app",
  "returns": "Batch ID",
  "kind": "mutation",
  "args": [
   {
    "name": "file_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "attributes",
    "type": "string",
    "doc": "in JSON format for field attributes of data as per https://developers.podio.com/doc/importer/import-app-items-212899"
   }
  ]
 },
 {
  "name": "podio_import_batch_callback",
  "title": "Callback Batch Import",
  "doc": "Wait for a importer batch to finish and trigger a manual GF Flow",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "batch_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "webhook_ok",
    "type": "string",
    "doc": "ID of GlobiFlow webhook on successful completion"
   },
   {
    "name": "webhook_fail",
    "type": "string",
    "doc": "ID of GlobiFlow webhook on failure"
   }
  ]
 },
 {
  "name": "podio_importer_file_get_info",
  "title": "Importer File Get Info",
  "doc": "Return the importer information about an XLS or CSV file",
  "returns": "JSON object of file details as per Podio API",
  "kind": "query",
  "args": [
   {
    "name": "file_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_importer_file_get_preview",
  "title": "Importer File Get Preview",
  "doc": "Return the importer preview of an XLS or CSV file",
  "returns": "JSON object of row preivew as per Podio API https://developers.podio.com/doc/importer/get-preview-5936702",
  "kind": "query",
  "args": [
   {
    "name": "file_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "attributes",
    "type": "string",
    "doc": "in JSON format for field attributes of data as per https://developers.podio.com/doc/importer/import-app-items-212899"
   },
   {
    "name": "row",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_item_clone",
  "title": "Clone Item",
  "doc": "Clone (make a copy of) a Podio Item",
  "returns": "item id of newly created item",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_item_comments_copy",
  "title": "Podio Item Copy Comments",
  "doc": "Copy all comments from one Podio Item to another",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "from_podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "to_podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "add_headers",
    "type": "number",
    "doc": "1 if you want the new comments to include the date and creator name of the source comment"
   },
   {
    "name": "include_files",
    "type": "number",
    "doc": "1 if you want to copy files as well"
   },
   {
    "name": "hook",
    "type": "boolean",
    "doc": "true or false whether to create a hook event in Podio"
   },
   {
    "name": "silent",
    "type": "boolean",
    "doc": "true or false whether to include the silent flag"
   }
  ]
 },
 {
  "name": "podio_item_comments_delete",
  "title": "Podio Item Comments Delete",
  "doc": "Try to delete all comments on a Podio Item",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "hook",
    "type": "boolean",
    "doc": "true or false whether to create a hook event in Podio"
   },
   {
    "name": "silent",
    "type": "boolean",
    "doc": "true or false whether to include the silent flag"
   }
  ]
 },
 {
  "name": "podio_item_comments_most_recent",
  "title": "Item most recent Comment",
  "doc": "Get the text of the most recent comment on a Podio Item",
  "returns": "text of most recent comment",
  "kind": "query",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "raw",
    "type": "number",
    "doc": "optional 1 if you want the raw output for the comment as JSON"
   }
  ]
 },
 {
  "name": "podio_item_create",
  "title": "Podio Item Create",
  "doc": "Create a new Item in a Podio App",
  "returns": "ID of created item",
  "kind": "mutation",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "fields",
    "type": "string",
    "doc": "field values in JSON format external_id:value, eg {\"title\":\"foo bar\",\"category\":\"Closed\"}"
   },
   {
    "name": "hook",
    "type": "boolean",
    "doc": "true or false whether to create a hook event in Podio"
   },
   {
    "name": "silent",
    "type": "boolean",
    "doc": "true or false whether to include the silent flag"
   }
  ]
 },
 {
  "name": "podio_item_delete",
  "title": "Podio Item Delete",
  "doc": "Delete a Podio Item",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_item_field_get",
  "title": "Podio Item Field Get",
  "doc": "Get the value of one field of a Podio Item",
  "returns": "value of the field",
  "kind": "query",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "field_id",
    "type": "number",
    "doc": "or string"
   },
   {
    "name": "raw",
    "type": "string",
    "doc": "1 if you want the raw output else 0 for a simplified value"
   }
  ]
 },
 {
  "name": "podio_item_fields_copy",
  "title": "Item Fields Copy",
  "doc": "Copy field values from one Podio item to another, matching on field labels",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "from_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "to_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "field_list",
    "type": "string",
    "doc": "optional JSON array of field labels to use - if omitted all fields are used"
   },
   {
    "name": "hook",
    "type": "boolean",
    "doc": "true or false whether to create a hook event in Podio"
   },
   {
    "name": "silent",
    "type": "boolean",
    "doc": "true or false whether to include the silent flag"
   },
   {
    "name": "include_empty",
    "type": "boolean",
    "doc": "true or false whether to include empty (null) field values"
   }
  ]
 },
 {
  "name": "podio_item_fields_get",
  "title": "Podio Item Fields Get",
  "doc": "Get the fields of a Podio Item as a JSON object",
  "returns": "JSON object of fields & values",
  "kind": "query",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "raw",
    "type": "string",
    "doc": "1 if you want the raw output else 0 for a simplified object"
   }
  ]
 },
 {
  "name": "podio_item_fields_update",
  "title": "Podio Item Fields Update",
  "doc": "Update the fields of a Podio Item given a JSON object of internal_id:value pairs",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "values",
    "type": "string",
    "doc": "in JSON format external_id:value, eg {\"title\":\"foo bar\",\"category\":\"Closed\"}"
   },
   {
    "name": "hook",
    "type": "boolean",
    "doc": "true or false whether to create a hook event in Podio"
   },
   {
    "name": "silent",
    "type": "boolean",
    "doc": "true or false whether to include the silent flag"
   }
  ]
 },
 {
  "name": "podio_item_file_upload",
  "title": "File Upload",
  "doc": "Upload a remote file by url to a Podio item",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "file_url",
    "type": "string",
    "doc": ""
   },
   {
    "name": "headers",
    "type": "string",
    "doc": "optional headers to send - comma-separated for multiple"
   },
   {
    "name": "file_name",
    "type": "string",
    "doc": "optional name to give the file in Podio"
   },
   {
    "name": "hook",
    "type": "boolean",
    "doc": "optional true or false whether to create a hook event in Podio"
   },
   {
    "name": "silent",
    "type": "boolean",
    "doc": "optional true or false whether to include the silent flag"
   }
  ]
 },
 {
  "name": "podio_item_files_copy",
  "title": "Podio Item Files Copy",
  "doc": "Copy files matching pattern from one Podio Item to another Podio Item. Note that files already existing on the destination item will not be copied again.",
  "returns": "JSON array of file ID's",
  "kind": "mutation",
  "args": [
   {
    "name": "from_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "to_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "pattern",
    "type": "string",
    "doc": "file pattern to match on like *.pdf"
   },
   {
    "name": "hook",
    "type": "boolean",
    "doc": "true or false whether to create a hook event in Podio"
   },
   {
    "name": "silent",
    "type": "boolean",
    "doc": "true or false whether to include the silent flag"
   }
  ]
 },
 {
  "name": "podio_item_files_search",
  "title": "Search Item Files",
  "doc": "Find all files on a Podio item matching a search pattern",
  "returns": "JSON array of file names and file id's",
  "kind": "query",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "pattern",
    "type": "string",
    "doc": "file pattern to match on like *.pdf"
   }
  ]
 },
 {
  "name": "podio_item_filter",
  "title": "Podio Item Filter",
  "doc": "Filter Podio Items as per API",
  "returns": "JSON result - see https://developers.podio.com/doc/items/filter-items-4496747",
  "kind": "query",
  "args": [
   {
    "name": "podio_app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "filter",
    "type": "string",
    "doc": "attributes in JSON format, eg '{\"filters\":{\"175338100\":[907248748],\"175338101\":[2]}}' - see https://developers.podio.com/doc/filters"
   }
  ]
 },
 {
  "name": "podio_item_for_llm",
  "title": "Podio Item get for LLM",
  "doc": "Get a simplified view of a Podio Item for a LLM AI model, including optional related items",
  "returns": "JSON object with all item details",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "include_related",
    "type": "boolean",
    "doc": "true or false whether to include related items (1 level only - false by default)"
   }
  ]
 },
 {
  "name": "podio_item_get",
  "title": "Podio Item get RAW",
  "doc": "Get the simplified field values of a Podio Item as a JSON object",
  "returns": "JSON object with all item details",
  "kind": "query",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_item_get_creator",
  "title": "Podio Item get Creator",
  "doc": "Get the creator of a Podio Item",
  "returns": "JSON object with revisor type and id - ie app and app_id or user and user_id",
  "kind": "query",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_item_get_ids",
  "title": "Podio Item get IDs",
  "doc": "Get the Workspace ID and App ID of a given Podio Item",
  "returns": "JSON object with space_id and app_id",
  "kind": "query",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_item_get_raw",
  "title": "Podio Item get RAW",
  "doc": "Get the full payload of a Podio Item as a JSON object",
  "returns": "JSON object with all item details",
  "kind": "query",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_item_get_referenced",
  "title": "Item get References",
  "doc": "Get all referenced items to a given Podio item",
  "returns": "JSON object with all reference details as per https://developers.podio.com/doc/items/get-item-references-22439",
  "kind": "query",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_item_get_revision_count",
  "title": "Podio Item get Revision Count",
  "doc": "Get the number of revisions on a Podio Item",
  "returns": "integer - number of revisions",
  "kind": "query",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_item_get_revisor",
  "title": "Podio Item get Revisor",
  "doc": "Get the last creator of the most recent Podio Item revision",
  "returns": "JSON object with revisor type and id - ie app and app_id or user and user_id",
  "kind": "query",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_item_image_upload",
  "title": "Podio Image Upload",
  "doc": "Upload a remote file by url to a Podio item image field",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "image_field_id",
    "type": "string",
    "doc": "external ID of image field"
   },
   {
    "name": "file_url",
    "type": "string",
    "doc": ""
   },
   {
    "name": "headers",
    "type": "string",
    "doc": "optional headers to send - comma-separated for multiple"
   },
   {
    "name": "hook",
    "type": "boolean",
    "doc": "optional true or false whether to create a hook event in Podio"
   },
   {
    "name": "silent",
    "type": "boolean",
    "doc": "optional true or false whether to include the silent flag"
   }
  ]
 },
 {
  "name": "podio_item_images_to_google",
  "title": "Item Images to Google",
  "doc": "Copy images from a Podio Item to Google Drive.",
  "returns": "JSON array of new Google file ID's",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "field_id",
    "type": "number",
    "doc": "or string"
   },
   {
    "name": "folder_id",
    "type": "string",
    "doc": "optional ID of the Google Drive folder"
   },
   {
    "name": "team_drive_id",
    "type": "string",
    "doc": "optional drive ID if Google Team Drive"
   },
   {
    "name": "replace",
    "type": "boolean",
    "doc": "true or false whether to overwrite existing file(s) - default false - warning: only works with folders with <1000 items"
   }
  ]
 },
 {
  "name": "podio_item_pdf_to_text",
  "title": "Podio Item PDF to Text",
  "doc": "Get a Podio Item's PDF file and convert it to plain text",
  "returns": "Text content of PDF",
  "kind": "mutation",
  "args": [
   {
    "name": "item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "file_name",
    "type": "string",
    "doc": "filename of PDF"
   }
  ]
 },
 {
  "name": "podio_item_recent_diff",
  "title": "Get Item Recent Diff",
  "doc": "Get the changes in the most recent revision of a Podio Item",
  "returns": "JSON array of fields & values before and after",
  "kind": "query",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_item_revision_diff",
  "title": "Item get Revision Diff",
  "doc": "Get the diff between 2 item revisions",
  "returns": "JSON object with all revision differences details",
  "kind": "query",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "revision_from",
    "type": "number",
    "doc": "revision ID to compare from"
   },
   {
    "name": "revision_to",
    "type": "number",
    "doc": "revision ID to compare to"
   }
  ]
 },
 {
  "name": "podio_item_revision_get",
  "title": "Item get Revision",
  "doc": "Get details of an item revision",
  "returns": "JSON object with all revision details",
  "kind": "query",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "revision_id",
    "type": "number",
    "doc": "revision ID"
   }
  ]
 },
 {
  "name": "podio_item_share",
  "title": "Podio Item Share",
  "doc": "Share a Podio Item with an external user",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "email_address",
    "type": "string",
    "doc": ""
   },
   {
    "name": "access_level",
    "type": "string",
    "doc": "edit or view"
   },
   {
    "name": "message",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_item_tags_get",
  "title": "Podio Item get Tags",
  "doc": "Get the tags on a Podio Item",
  "returns": "JSON array of tags",
  "kind": "query",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_item_tags_set",
  "title": "Podio Item set Tags",
  "doc": "Set the tags on a Podio Item",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "tags",
    "type": "string",
    "doc": "comma-separated list of tags"
   }
  ]
 },
 {
  "name": "podio_item_task_create",
  "title": "Podio Item Task Create",
  "doc": "Create a Task on a Podio Item",
  "returns": "task ID",
  "kind": "mutation",
  "args": [
   {
    "name": "item_id",
    "type": "number",
    "doc": "ID of the item to create the task on"
   },
   {
    "name": "task_name",
    "type": "string",
    "doc": "name of the task"
   },
   {
    "name": "task_details",
    "type": "string",
    "doc": "optional details for the task"
   },
   {
    "name": "responsible",
    "type": "string",
    "doc": "email address of person to assign task to"
   },
   {
    "name": "due_date",
    "type": "string",
    "doc": "optional due date"
   },
   {
    "name": "due_time",
    "type": "string",
    "doc": "optional due time"
   },
   {
    "name": "hook",
    "type": "boolean",
    "doc": "optional true or false whether to create a hook event in Podio"
   },
   {
    "name": "silent",
    "type": "boolean",
    "doc": "optional true or false whether to include the silent flag"
   }
  ]
 },
 {
  "name": "podio_item_task_user_profile",
  "title": "Get Item Task User Profile",
  "doc": "Get the Podio profile data of an Item's Task's assigned-to user",
  "returns": "JSON object with user_id, profile_id, etc",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "contact_name",
    "type": "string",
    "doc": "name of the assigned-to on a task"
   }
  ]
 },
 {
  "name": "podio_item_tasks_get",
  "title": "Podio Item Tasks Get",
  "doc": "Get all Tasks on a Podio item",
  "returns": "JSON array of task objects",
  "kind": "query",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "only_open",
    "type": "boolean",
    "doc": "true or false whether to return only open tasks or include completed tasks - default false"
   }
  ]
 },
 {
  "name": "podio_item_unshare",
  "title": "Podio Item UnShare",
  "doc": "UnShare a Podio Item with an external user",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "email_address",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_item_user_profile",
  "title": "Get Item User Profile",
  "doc": "Get the Podio profile data of an Item's contact",
  "returns": "JSON object with user_id, profile_id, etc",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "contact_name",
    "type": "string",
    "doc": "name of the contact to find on the item, or \"item_creator\" or \"revision_creator\" for item creator profile or most recent revision creator profile data."
   }
  ]
 },
 {
  "name": "podio_linked_file_to_item",
  "title": "Linked File to Item",
  "doc": "Add an external linked service file/folder to a Podio Item",
  "returns": "Podio file ID",
  "kind": "mutation",
  "args": [
   {
    "name": "linked_account_id",
    "type": "number",
    "doc": "id of linked account (get it here: https://developers.podio.com/doc/linked-accounts/get-linked-accounts-4498556)"
   },
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "external_file_id",
    "type": "string",
    "doc": "file id on external account"
   }
  ]
 },
 {
  "name": "podio_org_get_spaces",
  "title": "Podio Org Get Spaces",
  "doc": "Get all Workspaces of a Podio Org as a JSON object",
  "returns": "JSON array with all spaces",
  "kind": "query",
  "args": [
   {
    "name": "org_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_org_remove_user",
  "title": "Podio Org Remove User",
  "doc": "Remove a user from a Podio organization",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "org_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "user_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_orgs_get_raw",
  "title": "Podio Organizations get RAW",
  "doc": "Get the full payload of your Podio Organizations and Workspace summary as a JSON object",
  "returns": "JSON object with all Organization details",
  "kind": "query",
  "args": []
 },
 {
  "name": "podio_personal_tasks_get",
  "title": "Podio Personal Tasks Get",
  "doc": "Get the current users Personal Tasks (max 50)",
  "returns": "JSON array of task objects",
  "kind": "query",
  "args": []
 },
 {
  "name": "podio_raw_curl_as_app",
  "title": "Podio Raw Curl as App",
  "doc": "Remote curl to any Podio API endpoint using POST PUT PATCH DELETE etc, authenticated as an app",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": "app_id of app to authenticate as"
   },
   {
    "name": "url",
    "type": "string",
    "doc": "eg /item"
   },
   {
    "name": "method",
    "type": "string",
    "doc": "GET, POST, PUT, PATCH, or DELETE"
   },
   {
    "name": "options",
    "type": "string",
    "doc": "in JSON format"
   },
   {
    "name": "attributes",
    "type": "string",
    "doc": "in JSON format"
   }
  ]
 },
 {
  "name": "podio_report_get_detail",
  "title": "Report Get Detail",
  "doc": "Get the values of a table-style report tile",
  "returns": "JSON array of values in the report",
  "kind": "query",
  "args": [
   {
    "name": "widget_id",
    "type": "number",
    "doc": "you can inspect the report in the browser to find it's ID"
   }
  ]
 },
 {
  "name": "podio_report_get_single",
  "title": "Report Get Single",
  "doc": "Get the value of a single-value report tile (like sum or total).",
  "returns": "",
  "kind": "query",
  "args": [
   {
    "name": "widget_id",
    "type": "number",
    "doc": "you can inspect the report in the browser to find it's ID"
   }
  ]
 },
 {
  "name": "podio_space_create",
  "title": "Create Workspace",
  "doc": "Create a new Workspace in a Podio Org",
  "returns": "ID of created workspace",
  "kind": "mutation",
  "args": [
   {
    "name": "org_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "name",
    "type": "string",
    "doc": "name of workspace"
   },
   {
    "name": "privacy",
    "type": "string",
    "doc": "open or closed"
   },
   {
    "name": "auto_join",
    "type": "string",
    "doc": "true or false"
   }
  ]
 },
 {
  "name": "podio_space_delete",
  "title": "Podio Space Delete",
  "doc": "Delete a Podio Workspace",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "space_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_space_get_apps",
  "title": "Podio Space Get Apps",
  "doc": "Get all Apps of a Podio Space as a JSON object",
  "returns": "JSON array with all apps",
  "kind": "query",
  "args": [
   {
    "name": "space_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_space_get_by_url",
  "title": "Podio Space get by URL",
  "doc": "Get the Podio Workspace from it's URL",
  "returns": "JSON object with Workspace details",
  "kind": "query",
  "args": [
   {
    "name": "url",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_space_get_raw",
  "title": "Podio Space get RAW",
  "doc": "Get the full payload of a Podio Workspace as a JSON object",
  "returns": "JSON object with all Workspace details",
  "kind": "query",
  "args": [
   {
    "name": "space_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_space_task_create",
  "title": "Podio Space Task Create",
  "doc": "Create a Task on a Podio Workspace",
  "returns": "task ID",
  "kind": "mutation",
  "args": [
   {
    "name": "space_id",
    "type": "number",
    "doc": "ID of the Workspace to create the task on"
   },
   {
    "name": "task_name",
    "type": "string",
    "doc": "name of the task"
   },
   {
    "name": "task_details",
    "type": "string",
    "doc": "optional details for the task"
   },
   {
    "name": "responsible",
    "type": "string",
    "doc": "email address of person to assign task to"
   },
   {
    "name": "due_date",
    "type": "string",
    "doc": "optional due date"
   },
   {
    "name": "due_time",
    "type": "string",
    "doc": "optional due time"
   },
   {
    "name": "hook",
    "type": "boolean",
    "doc": "optional true or false whether to create a hook event in Podio"
   },
   {
    "name": "silent",
    "type": "boolean",
    "doc": "optional true or false whether to include the silent flag"
   }
  ]
 },
 {
  "name": "podio_sub_create",
  "title": "Podio Sub Create",
  "doc": "Create a subscription on / follow a Podio Item/App/Space",
  "returns": "subscription id",
  "kind": "mutation",
  "args": [
   {
    "name": "ref_type",
    "type": "string",
    "doc": "item app or space"
   },
   {
    "name": "ref_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_sub_delete",
  "title": "Podio Sub Delete",
  "doc": "Delete a subscription on / unfollow a Podio Item/App/Space",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "ref_type",
    "type": "string",
    "doc": "item app or space"
   },
   {
    "name": "ref_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_subs_get_by_ref",
  "title": "Podio Subs Get by Ref",
  "doc": "Get all subscriptions for the current user on a Podio Item/App/Space",
  "returns": "JSON object with all details",
  "kind": "query",
  "args": [
   {
    "name": "ref_type",
    "type": "string",
    "doc": "item app or space"
   },
   {
    "name": "ref_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_task_complete",
  "title": "Podio Task Complete",
  "doc": "Mark a Podio task as Complete",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "task_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "hook",
    "type": "boolean",
    "doc": "optional true or false whether to create a hook event in Podio"
   },
   {
    "name": "silent",
    "type": "boolean",
    "doc": "optional true or false whether to include the silent flag"
   }
  ]
 },
 {
  "name": "podio_task_create",
  "title": "Podio Task Create",
  "doc": "Create a Podio Task",
  "returns": "task ID",
  "kind": "mutation",
  "args": [
   {
    "name": "task_name",
    "type": "string",
    "doc": "name of the task"
   },
   {
    "name": "task_details",
    "type": "string",
    "doc": "optional details for the task"
   },
   {
    "name": "responsible",
    "type": "string",
    "doc": "email address of person to assign task to"
   },
   {
    "name": "due_date",
    "type": "string",
    "doc": "optional due date"
   },
   {
    "name": "due_time",
    "type": "string",
    "doc": "optional due time"
   },
   {
    "name": "hook",
    "type": "boolean",
    "doc": "optional true or false whether to create a hook event in Podio"
   },
   {
    "name": "silent",
    "type": "boolean",
    "doc": "optional true or false whether to include the silent flag"
   }
  ]
 },
 {
  "name": "podio_task_delete",
  "title": "Podio Task Delete",
  "doc": "Delete a Podio Task",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "task_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "hook",
    "type": "boolean",
    "doc": "optional true or false whether to create a hook event in Podio"
   },
   {
    "name": "silent",
    "type": "boolean",
    "doc": "optional true or false whether to include the silent flag"
   }
  ]
 },
 {
  "name": "podio_task_get",
  "title": "Podio Task Get",
  "doc": "Get full details of a Podio task",
  "returns": "",
  "kind": "query",
  "args": [
   {
    "name": "task_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_task_update",
  "title": "Podio Task Update",
  "doc": "Update a Podio task",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "task_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "attributes",
    "type": "string",
    "doc": "JSON payload of changes as per https://developers.podio.com/doc/tasks/update-task-10583674"
   }
  ]
 },
 {
  "name": "podio_tasks_get_for_user",
  "title": "Podio Tasks Get For User",
  "doc": "Get the Tasks currently assigned to a particular user",
  "returns": "JSON array of task objects",
  "kind": "query",
  "args": [
   {
    "name": "podio_org_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "podio_user_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_tasks_get_summary",
  "title": "Podio Tasks Get Summary",
  "doc": "Get the current users Tasks Summary",
  "returns": "JSON array of task objects",
  "kind": "query",
  "args": []
 },
 {
  "name": "podio_user_get",
  "title": "Get User",
  "doc": "Get details of a Podio user",
  "returns": "JSON object of user data with user_id, etc",
  "kind": "query",
  "args": [
   {
    "name": "podio_user_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_user_get_by_email",
  "title": "Get User by Email",
  "doc": "Get details of a Podio user by email address",
  "returns": "JSON object of user data with user_id, etc",
  "kind": "mutation",
  "args": [
   {
    "name": "email_address",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_user_profile_get",
  "title": "Get User Profile",
  "doc": "Get the Podio profile data of a user",
  "returns": "JSON object of profile data with user_id, profile_id, etc",
  "kind": "query",
  "args": [
   {
    "name": "podio_user_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_view_create",
  "title": "Podio View Create",
  "doc": "Create a new Podio View as per https://developers.podio.com/doc/views/create-view-27453",
  "returns": "view_id of new view",
  "kind": "mutation",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "attributes",
    "type": "string",
    "doc": "JSON attributes as per documentation at https://developers.podio.com/doc/views/create-view-27453"
   }
  ]
 },
 {
  "name": "podio_view_delete",
  "title": "Podio View Delete",
  "doc": "Delete a given Podio View",
  "returns": "view_id of new view",
  "kind": "mutation",
  "args": [
   {
    "name": "view_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_view_get",
  "title": "Podio View Items Get",
  "doc": "Get all items in a Podio View",
  "returns": "JSON object with all items",
  "kind": "query",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "view_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "limit",
    "type": "number",
    "doc": "max number of items to retrieve - default 100"
   },
   {
    "name": "offset",
    "type": "number",
    "doc": "optional start position - default 0"
   },
   {
    "name": "raw",
    "type": "number",
    "doc": "1 if you want the raw output else 0 for a simplified array"
   }
  ]
 },
 {
  "name": "podio_view_total_get",
  "title": "App Get View Total",
  "doc": "Get number of items in a Podio App's View",
  "returns": "integer - number of items in the given view",
  "kind": "query",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "view_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_view_update",
  "title": "Podio View Update",
  "doc": "Create a new Podio View as per https://developers.podio.com/doc/views/create-view-27453",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "view_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "attributes",
    "type": "string",
    "doc": "JSON attributes as per documentation at https://developers.podio.com/doc/views/create-view-27453"
   }
  ]
 },
 {
  "name": "podio_widget_update",
  "title": "Update Widget",
  "doc": "Update a Podio text Widget / Tile (like on your home screen where GF has no access)",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "widget_id",
    "type": "number",
    "doc": "returned by home_widget_create.pf"
   },
   {
    "name": "value",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_widgets_get",
  "title": "Podio Widgets Get",
  "doc": "Get all widgets in a space or for a user's home screen, as per https://developers.podio.com/doc/widgets/get-widgets-22494",
  "returns": "JSON array of all widgets",
  "kind": "query",
  "args": [
   {
    "name": "ref_type",
    "type": "string",
    "doc": "user or space"
   },
   {
    "name": "ref_id",
    "type": "number",
    "doc": "user_id or space_id"
   }
  ]
 },
 {
  "name": "podio_zip_dir",
  "title": "Podio ZIP dir",
  "doc": "Get the directory listing of a zip archive in Podio",
  "returns": "Array of files and directories",
  "kind": "mutation",
  "args": [
   {
    "name": "podio_file_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "podio_zip_extract",
  "title": "Podio ZIP Extract",
  "doc": "Extract a single raw file from a zip archive in Podio",
  "returns": "Raw data of extracted file",
  "kind": "query",
  "args": [
   {
    "name": "podio_file_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "filename",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "pwa_data_json_to_xml",
  "title": "GlobiFlow JSON to XML",
  "doc": "Convert PF JSON version to PWA/GF import XML",
  "returns": "XML text",
  "kind": "mutation",
  "args": [
   {
    "name": "json",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "pwa_data_xml_to_json",
  "title": "GlobiFlow XML to JSON",
  "doc": "Convert exported XML to PF JSON version",
  "returns": "JSON text",
  "kind": "mutation",
  "args": [
   {
    "name": "xml",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "pwa_delayed_flow_triggers_clear",
  "title": "Clear Delayed Flow Triggers",
  "doc": "Clear all jobs previously set with trigger_flow_item_delayed.pf",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "flow_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": "optional - clears jobs for all items if omitted"
   }
  ]
 },
 {
  "name": "pwa_flow_create",
  "title": "GlobiFlow Create Flow",
  "doc": "Create a new flow in a PWA/GF account (counts as 10 actions)",
  "returns": "integer ID of new flow",
  "kind": "mutation",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "flow_data",
    "type": "string",
    "doc": "JSON payload of flow details. See gf_get_flow results for how to format"
   },
   {
    "name": "base64",
    "type": "number",
    "doc": "1 if you are providing base64 encoded JSON"
   }
  ]
 },
 {
  "name": "pwa_flow_delete",
  "title": "GlobiFlow Delete Flow",
  "doc": "Delete a flow from a PWA/GF account (counts as 10 actions)",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "flow_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "pwa_flow_get",
  "title": "GlobiFlow Get Flow",
  "doc": "Get details of a specific flow in a PWA/GF account",
  "returns": "JSON object of flow details",
  "kind": "query",
  "args": [
   {
    "name": "flow_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "base64",
    "type": "number",
    "doc": "1 if you want the JSON base64 encoded"
   }
  ]
 },
 {
  "name": "pwa_flow_logs_get",
  "title": "GlobiFlow Get Flow Logs",
  "doc": "Get the recent run logs of a PWA/GlobiFlow Flow",
  "returns": "text - logs of flow",
  "kind": "query",
  "args": [
   {
    "name": "flow_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "pwa_flow_save",
  "title": "GlobiFlow Save Flow",
  "doc": "Update an existing flow in a PWA/GF account (counts as 10 actions)",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "flow_data",
    "type": "string",
    "doc": "JSON payload of flow details. See gf_get_flow results for how to format"
   },
   {
    "name": "base64",
    "type": "number",
    "doc": "1 if you are providing base64 encoded JSON"
   }
  ]
 },
 {
  "name": "pwa_flow_toggle_active",
  "title": "GlobiFlow Toggle Active",
  "doc": "Change a PWA/GF flow from active to disabled or vice versa (counts as 10 actions)",
  "returns": "JSON object of flow details",
  "kind": "mutation",
  "args": [
   {
    "name": "flow_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "pwa_flows_get_for_space",
  "title": "GlobiFlow Get Flows For Space",
  "doc": "Get a list of all flows in a PWA/GF account for a given workspace",
  "returns": "JSON array of flows",
  "kind": "query",
  "args": [
   {
    "name": "space_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "pwa_flows_list",
  "title": "GlobiFlow Get Flows List",
  "doc": "Get a list of all flows in a PWA/GF account",
  "returns": "JSON array of flows",
  "kind": "query",
  "args": []
 },
 {
  "name": "pwa_flows_manual_for_item",
  "title": "GlobiFlow Get Manual Flows For Item",
  "doc": "Get a list of all manual flows in a GF account for the app of a given item",
  "returns": "JSON array of flows and IDs",
  "kind": "mutation",
  "args": [
   {
    "name": "item_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "pwa_get_p_value",
  "title": "GF Get p Value",
  "doc": "Get the PWA/GlobiFlow p value for a given flow from the apps hooks",
  "returns": "p value for the app",
  "kind": "query",
  "args": [
   {
    "name": "flow_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "c",
    "type": "number",
    "doc": "look at any app's webhooks for this value"
   }
  ]
 },
 {
  "name": "pwa_param_saften",
  "title": "GF Safen",
  "doc": "Make text safe for use in GF vars (experimental)",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "something",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "pwa_podio_app_mysql_structure",
  "title": "Podio App MySQL Structure",
  "doc": "Create SQL statement to create (or update) a MySQL table for GlobiFlow MySQL sync",
  "returns": "SQL statement to create or alter the table, or blank if no changes are needed",
  "kind": "mutation",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "include_calcs",
    "type": "boolean",
    "doc": "true or false whether to include calculation fields"
   },
   {
    "name": "conn_name",
    "type": "string",
    "doc": "optional connection name of your mysql connection"
   },
   {
    "name": "table_name",
    "type": "string",
    "doc": "optional name for table - defaults to name of app"
   }
  ]
 },
 {
  "name": "pwa_refresh_callback",
  "title": "Callback GF Refresh",
  "doc": "Start a GlobiFlow Refresh and trigger a manual GF Flow when it completes",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "webhook_ok",
    "type": "string",
    "doc": "ID of GlobiFlow webhook on successful completion"
   },
   {
    "name": "webhook_fail",
    "type": "string",
    "doc": "ID of GlobiFlow webhook on failure"
   }
  ]
 },
 {
  "name": "pwa_throttled_apps",
  "title": "GF Throttled Apps",
  "doc": "Get list of throttled apps from GF as JSON array",
  "returns": "JSON array like [{app:\"App One\", last:\"2021-02-21 12:32:00\", events:105, outstanding:12},{app:\"App Two\", ...}]",
  "kind": "mutation",
  "args": []
 },
 {
  "name": "pwa_throttled_apps_callback",
  "title": "Callback GF Throttled",
  "doc": "Get list of throttled apps from GF and trigger a manual GF Flow with the result",
  "returns": "Does not return anything, but passes the result to the given webhook as a JSON array like [{app:\"App One\", last:\"2021-02-21 12:32:00\", events:105, outstanding:12},{app:\"App Two\", ...}] but in base64 encoding in the throttles variable. <br>You need to decode it in GF to use the data: json_decode(base64_decode( [(webhook) throttles] ), true). <br>If there is an error, it will be in the \"err\" variable.",
  "kind": "mutation",
  "args": [
   {
    "name": "webhook_id",
    "type": "string",
    "doc": "ID of GlobiFlow webhook to pass return data to"
   }
  ]
 },
 {
  "name": "pwa_throw_error",
  "title": "Throw Error",
  "doc": "Causes an exception with the given error message. Useful if you want to force an error into the GF error logs.",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "error",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "pwa_tree_get",
  "title": "GlobiFlow Get Tree",
  "doc": "Get the known Podio Tree from a PWA/GF account",
  "returns": "JSON array of flows",
  "kind": "query",
  "args": []
 },
 {
  "name": "pwa_trigger_flow_item_delayed",
  "title": "Trigger Flow on Item Delayed",
  "doc": "Trigger a manual GF Flow on a specific Podio Item after a set time interval",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "flow_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "c",
    "type": "number",
    "doc": "look at your app's webhooks for this value"
   },
   {
    "name": "p",
    "type": "number",
    "doc": "look at your app's webhooks for this value"
   },
   {
    "name": "time_delay",
    "type": "string",
    "doc": "eg \"+10 minutes\", \"+3 days\", etc"
   }
  ]
 },
 {
  "name": "pwa_trigger_flow_on_item",
  "title": "Trigger Flow on Item",
  "doc": "Trigger a manual GF Flow on a specific Podio Item",
  "returns": "Returns the http code of the request. 200 if all went OK.",
  "kind": "mutation",
  "args": [
   {
    "name": "flow_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "podio_item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "c",
    "type": "number",
    "doc": "look at your app's webhooks for this value"
   },
   {
    "name": "p",
    "type": "number",
    "doc": "look at your app's webhooks for this value"
   }
  ]
 },
 {
  "name": "pwa_trigger_flow_on_items_multi",
  "title": "Trigger Flow on Items Multi",
  "doc": "Trigger a manual GF Flow on multiple Podio Items at once",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "flow_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "c",
    "type": "number",
    "doc": "look at your app's webhooks for this value"
   },
   {
    "name": "p",
    "type": "number",
    "doc": "look at your app's webhooks for this value"
   },
   {
    "name": "podio_item_ids",
    "type": "string",
    "doc": "comma-separated list of Podio Item ID's"
   }
  ]
 },
 {
  "name": "pwa_webhook_url_get",
  "title": "GlobiFlow Get Webhook Url",
  "doc": "Get the URL of a GlobiFlow Webhook Flow",
  "returns": "string - url of webhook",
  "kind": "query",
  "args": [
   {
    "name": "flow_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "pwa_whoami",
  "title": "GlobiFlow Who Am I",
  "doc": "Find out who you are connected as in connected GF account (prem)",
  "returns": "string - who you are logged in as",
  "kind": "query",
  "args": []
 },
 {
  "name": "remote_curl",
  "title": "Remote Curl",
  "doc": "Remote curl to server using POST PUT PATCH DELETE etc",
  "returns": "text body of the response, or if include_headers=1, headers and body",
  "kind": "mutation",
  "args": [
   {
    "name": "url",
    "type": "string",
    "doc": ""
   },
   {
    "name": "method",
    "type": "string",
    "doc": "GET, POST, PUT, PATCH, or DELETE"
   },
   {
    "name": "headers",
    "type": "string",
    "doc": "optional headers to send - comma-separated for multiple"
   },
   {
    "name": "values",
    "type": "string",
    "doc": "in JSON format of data to be curled, eg {\"foo\":\"bar\",\"baz\":1}"
   },
   {
    "name": "include_headers",
    "type": "number",
    "doc": "optional 1 if you want the headers included else 0 for just the body"
   },
   {
    "name": "timeout",
    "type": "number",
    "doc": "optional timeout in seconds (default 30, max 120)"
   }
  ]
 },
 {
  "name": "shared_var_get",
  "title": "Get Shared Variable",
  "doc": "Get a shared global variable value previously saved with set_shared_var.pf",
  "returns": "",
  "kind": "query",
  "args": [
   {
    "name": "varname",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "shared_var_set",
  "title": "Set Shared Variable",
  "doc": "Set a global variable to share with others using get_shared_var.pf Useful to keep global values. Can store text up to 64k in size. NB: This data can be retrieved by ANY Podio user!!! Only the person who created the variable can update it",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "varname",
    "type": "string",
    "doc": ""
   },
   {
    "name": "value",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "sharefile_api_curl_raw",
  "title": "ShareFile API Curl Raw",
  "doc": "Make a raw API (GET/POST/PUT/DELETE/etc) request to the ShareFile API as per the API reference. See: http://api.sharefile.com/rest/",
  "returns": "whatever the ShareFile API returns",
  "kind": "mutation",
  "args": [
   {
    "name": "url",
    "type": "string",
    "doc": "the URL to call, eg https://yoursubdomain.sf-api.com or https://api.sf-api.com"
   },
   {
    "name": "endpoint",
    "type": "string",
    "doc": "everything after https://yoursubdomain.sf-api.com, eg \"/sf/v3/Users\", etc"
   },
   {
    "name": "http_method",
    "type": "string",
    "doc": "GET, POST, PUT, PATCH, or DELETE"
   },
   {
    "name": "payload",
    "type": "string",
    "doc": "JSON encoded arguments to pass in POST or PUT etc"
   }
  ]
 },
 {
  "name": "sheets_append",
  "title": "Google Sheets Append",
  "doc": "Append a row of values to a Google Sheet",
  "returns": "Row number of appended row",
  "kind": "mutation",
  "args": [
   {
    "name": "sheet_id",
    "type": "string",
    "doc": ""
   },
   {
    "name": "range",
    "type": "string",
    "doc": "name of tab (sheet in sheet)"
   },
   {
    "name": "values",
    "type": "string",
    "doc": "JSON array of data in form {cell:value,...}, eg {\"A\":\"foo\",\"B\":\"bar\",\"C\":42}"
   }
  ]
 },
 {
  "name": "sheets_def",
  "title": "Google Sheets Def",
  "doc": "Get the header row of a Google Sheet",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "sheet_id",
    "type": "string",
    "doc": ""
   },
   {
    "name": "range",
    "type": "string",
    "doc": "name of tab (sheet in sheet)"
   }
  ]
 },
 {
  "name": "sheets_delete",
  "title": "Google Sheets Delete",
  "doc": "Delete a row in a Google Sheet",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "sheet_id",
    "type": "string",
    "doc": ""
   },
   {
    "name": "tab_id",
    "type": "number",
    "doc": "id of tab (sheet in sheet) - 0 for Sheet1"
   },
   {
    "name": "row",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "sheets_get",
  "title": "Google Sheets Get",
  "doc": "Get the contents of a Google Sheet as an associative array",
  "returns": "",
  "kind": "query",
  "args": [
   {
    "name": "sheet_id",
    "type": "string",
    "doc": ""
   },
   {
    "name": "range",
    "type": "string",
    "doc": "name of tab (sheet in sheet)"
   }
  ]
 },
 {
  "name": "sheets_search",
  "title": "Google Sheets Search",
  "doc": "Search for Google Sheets in Google Drive",
  "returns": "",
  "kind": "query",
  "args": [
   {
    "name": "query",
    "type": "string",
    "doc": "partial name to search for"
   }
  ]
 },
 {
  "name": "sheets_update",
  "title": "Google Sheets Update",
  "doc": "Update the values of a Google Sheet",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "sheet_id",
    "type": "string",
    "doc": ""
   },
   {
    "name": "range",
    "type": "string",
    "doc": "name of tab (sheet in sheet)"
   },
   {
    "name": "values",
    "type": "string",
    "doc": "JSON array of data in form {cell:value,...}, eg {\"A3\":\"foo\",\"C4\":\"bar\"}"
   }
  ]
 },
 {
  "name": "space_members_get",
  "title": "Podio Space get Members",
  "doc": "Get a list of all members in a Podio Workspace as a JSON array",
  "returns": "JSON object with all Workspace members",
  "kind": "query",
  "args": [
   {
    "name": "space_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "space_members_get_v2",
  "title": "Podio Space get Members v2",
  "doc": "Get a list of all members in a Podio Workspace as a JSON array",
  "returns": "JSON object with all Workspace members",
  "kind": "query",
  "args": [
   {
    "name": "space_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "space_settings_get",
  "title": "Space Settings Get",
  "doc": "Get the settings of a Workspace",
  "returns": "JSON object with the workspace settings",
  "kind": "query",
  "args": [
   {
    "name": "space_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "space_settings_set",
  "title": "Space Settings Set",
  "doc": "Change the settings of a Workspace",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "space_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "name",
    "type": "string",
    "doc": "optional - blank for no change"
   },
   {
    "name": "privacy",
    "type": "string",
    "doc": "optional - blank for no change - or \"open\" or \"closed\""
   },
   {
    "name": "auto_join",
    "type": "string",
    "doc": "optional - blank for no change - or \"true\" or \"false\""
   },
   {
    "name": "post_on_new_app",
    "type": "string",
    "doc": "optional - blank for no change - or \"true\" or \"false\""
   },
   {
    "name": "post_on_new_member",
    "type": "string",
    "doc": "optional - blank for no change - or \"true\" or \"false\""
   }
  ]
 },
 {
  "name": "space_status_add",
  "title": "Space Add Status",
  "doc": "Creates a new status message on a specific Podio space",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "space_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "value",
    "type": "string",
    "doc": "the text content of the status"
   }
  ]
 },
 {
  "name": "space_user_add",
  "title": "Add user to Space",
  "doc": "Add a new user to a Podio workspace",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "space_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "email_address",
    "type": "string",
    "doc": ""
   },
   {
    "name": "external",
    "type": "number",
    "doc": "1/0 - default 1"
   },
   {
    "name": "role",
    "type": "string",
    "doc": "light/regular/admin"
   },
   {
    "name": "message",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "space_user_remove",
  "title": "Remove user from space",
  "doc": "Remove a user from a Podio workspace",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "space_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "user_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "space_widget_create",
  "title": "Space Widget Create",
  "doc": "Create a new text Widget / Tile on any Space, including Employee Network spaces",
  "returns": "Returns the widget_id of the new widget",
  "kind": "mutation",
  "args": [
   {
    "name": "space_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "title",
    "type": "string",
    "doc": ""
   },
   {
    "name": "value",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "storage_file_delete",
  "title": "Storage File Delete",
  "doc": "Delete a storage file",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "conn_name",
    "type": "string",
    "doc": "s3 storage connection name as per settings page"
   },
   {
    "name": "filename",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "storage_file_from_base64",
  "title": "Base64 to Storage File",
  "doc": "Make a file from provided base64 text and save it in storage",
  "returns": "file ID of created file",
  "kind": "mutation",
  "args": [
   {
    "name": "conn_name",
    "type": "string",
    "doc": "s3 storage connection name as per settings page"
   },
   {
    "name": "filename",
    "type": "string",
    "doc": ""
   },
   {
    "name": "mimetype",
    "type": "string",
    "doc": ""
   },
   {
    "name": "base64_data",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "storage_file_get_base64",
  "title": "Storage File get Base64",
  "doc": "Get a storage File as Base64 encoded text",
  "returns": "",
  "kind": "query",
  "args": [
   {
    "name": "conn_name",
    "type": "string",
    "doc": "s3 storage connection name as per settings page"
   },
   {
    "name": "filename",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "storage_files_list",
  "title": "Storage Files List",
  "doc": "Get a directory listing of storage files",
  "returns": "JSON array of files with name, size and datetime",
  "kind": "query",
  "args": [
   {
    "name": "conn_name",
    "type": "string",
    "doc": "s3 storage connection name as per settings page"
   }
  ]
 },
 {
  "name": "stream_fetch",
  "title": "Stream Fetch",
  "doc": "Get the next n items from a previously created stream. Note that streams expire after 1 hour.",
  "returns": "JSON array of items or rows as defined in the stream. Returns FALSE when no more items are available.",
  "kind": "query",
  "args": [
   {
    "name": "stream_id",
    "type": "string",
    "doc": "ID of the stream"
   },
   {
    "name": "count",
    "type": "number",
    "doc": "number of items to fetch"
   }
  ]
 },
 {
  "name": "stream_http_csv",
  "title": "Stream MySQL Query",
  "doc": "Create a stream to return a csv file from a remote HTTP endpoint",
  "returns": "ID of the stream to use with stream_fetch",
  "kind": "mutation",
  "args": [
   {
    "name": "url",
    "type": "string",
    "doc": "URL of csv file"
   }
  ]
 },
 {
  "name": "stream_mysql_query",
  "title": "Stream MySQL Query",
  "doc": "Create a stream to return a multi-row result from a MySQL query",
  "returns": "ID of the stream to use with stream_fetch",
  "kind": "mutation",
  "args": [
   {
    "name": "conn",
    "type": "string",
    "doc": "mysql connection name"
   },
   {
    "name": "sql",
    "type": "string",
    "doc": "sql query with ? for placeholders, eg: SELECT * FROM mytable WHERE status=?"
   },
   {
    "name": "params",
    "type": "string",
    "doc": "JSON array of parameters in order as required by query, eg: [\"foo\"]"
   }
  ]
 },
 {
  "name": "stream_podio_app_comments_search",
  "title": "Podio Search App Comments",
  "doc": "Create a stream to search and fetch matching comments from a Podio App. Note that if the stream returns [] it does not mean the search is finished. Only when the stream returns FALSE is it complete. Also note that the count sent with stream_fetch may not be the count of comments you get back.",
  "returns": "ID of the stream to use with stream_fetch",
  "kind": "query",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "search_val",
    "type": "string",
    "doc": "text to match in each comment"
   }
  ]
 },
 {
  "name": "stream_podio_app_search",
  "title": "Podio Search App",
  "doc": "Create a stream to search and fetch matching items from a Podio App. Note that if the stream returns [] it does not mean the search is finished. Only when the stream returns FALSE is it complete.",
  "returns": "ID of the stream to use with stream_fetch",
  "kind": "query",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "field_id",
    "type": "number",
    "doc": "or string - field to search in"
   },
   {
    "name": "search_val",
    "type": "string",
    "doc": "text to match in above field"
   },
   {
    "name": "condition",
    "type": "string",
    "doc": "search condition - E for equals, or C for contains"
   },
   {
    "name": "raw",
    "type": "number",
    "doc": "1 if you want the raw output else 0 for a simplified array"
   }
  ]
 },
 {
  "name": "stream_podio_item_related",
  "title": "Stream Podio Item Related",
  "doc": "Create a stream to get all referenced items to a given Podio item",
  "returns": "ID of the stream to use with stream_fetch",
  "kind": "mutation",
  "args": [
   {
    "name": "item_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "app_id",
    "type": "number",
    "doc": "app from which to find items"
   },
   {
    "name": "raw",
    "type": "number",
    "doc": "1 if you want the raw output else 0 for a simplified array"
   }
  ]
 },
 {
  "name": "stream_podio_view",
  "title": "Stream Podio View",
  "doc": "Create a stream to fetch all items from a Podio View",
  "returns": "ID of the stream to use with stream_fetch",
  "kind": "mutation",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "view_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "raw",
    "type": "number",
    "doc": "1 if you want the raw output else 0 for a simplified array"
   }
  ]
 },
 {
  "name": "sync_create",
  "title": "PF Sync Create",
  "doc": "Create a ProcFu Data Sync for a Podio App to a MySQL database",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": "Podio App ID"
   },
   {
    "name": "conn_name",
    "type": "string",
    "doc": "mysql connection name as per PF settings screen"
   }
  ]
 },
 {
  "name": "sync_delete",
  "title": "PF Sync Delete",
  "doc": "Delete a ProcFu Data Sync",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "sync_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "sync_get_for_app",
  "title": "PF Sync Get For App",
  "doc": "Get a Data Sync for a Podio App",
  "returns": "array of details or false",
  "kind": "mutation",
  "args": [
   {
    "name": "src_type",
    "type": "string",
    "doc": "p for Podio, n for Notion, s for Google Sheets"
   },
   {
    "name": "src_id",
    "type": "string",
    "doc": "Podio App ID, or Notion DB ID, or Google Sheets ID"
   }
  ]
 },
 {
  "name": "sync_refresh",
  "title": "PF Sync Force Refresh",
  "doc": "Force a complete Refresh on a ProcFu Data Sync",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "sync_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "sync_refresh_item",
  "title": "PF Sync Force Refresh on Item",
  "doc": "Force a Refresh on a ProcFu Data Sync for a single Item",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "sync_id",
    "type": "number",
    "doc": ""
   },
   {
    "name": "item_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "sync_restart",
  "title": "PF Sync Restart",
  "doc": "Clear errors and re-start a ProcFu Data Sync",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "sync_id",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "tape_api_raw_curl",
  "title": "Tape API Raw Curl",
  "doc": "Remote curl to any Tape API endpoint using POST PUT PATCH DELETE etc",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "url",
    "type": "string",
    "doc": "eg /v1/app/1"
   },
   {
    "name": "method",
    "type": "string",
    "doc": "GET, POST, PUT, PATCH, or DELETE"
   },
   {
    "name": "parameters",
    "type": "string",
    "doc": "in JSON format"
   }
  ]
 },
 {
  "name": "tape_app_query",
  "title": "Tape App Query",
  "doc": "Query a Tape app with filter and sort",
  "returns": "JSON object with array of app record data",
  "kind": "mutation",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": "ID of app"
   },
   {
    "name": "filters",
    "type": "string",
    "doc": "optional JSON filter conditions array as per API. See https://developers.tapeapp.com/docs/api/resource/filter"
   },
   {
    "name": "sort_by",
    "type": "string",
    "doc": "optional external field ID to sort by, eg \"title\""
   },
   {
    "name": "sort_desc",
    "type": "boolean",
    "doc": "optional true to sort descending"
   },
   {
    "name": "limit",
    "type": "number",
    "doc": "number of rows to return"
   },
   {
    "name": "cursor",
    "type": "string",
    "doc": "optional cursor to continue from"
   }
  ]
 },
 {
  "name": "tape_app_record_create",
  "title": "Tape App Record Create",
  "doc": "Create a new Tape App Record",
  "returns": "array of record data",
  "kind": "mutation",
  "args": [
   {
    "name": "app_id",
    "type": "number",
    "doc": "ID of app"
   },
   {
    "name": "data",
    "type": "string",
    "doc": "JSON data to create record with, eg: {\"name\":\"John Smith\"}"
   }
  ]
 },
 {
  "name": "tape_app_record_delete",
  "title": "Tape App Record Delete",
  "doc": "Delete a Tape App Record",
  "returns": "array of record data",
  "kind": "mutation",
  "args": [
   {
    "name": "record_id",
    "type": "number",
    "doc": "ID of record"
   }
  ]
 },
 {
  "name": "tape_app_record_get",
  "title": "Tape App Record Get",
  "doc": "Get a Tape App Record as a JSON object",
  "returns": "array of record data",
  "kind": "query",
  "args": [
   {
    "name": "record_id",
    "type": "number",
    "doc": "ID of record"
   }
  ]
 },
 {
  "name": "tape_app_record_update",
  "title": "Tape App Record Update",
  "doc": "Update a Tape App Record",
  "returns": "array of record data",
  "kind": "mutation",
  "args": [
   {
    "name": "record_id",
    "type": "number",
    "doc": "ID of record"
   },
   {
    "name": "data",
    "type": "string",
    "doc": "JSON data to update record with, eg: {\"name\":\"John Smith\"}"
   }
  ]
 },
 {
  "name": "text_decrypt",
  "title": "Text Decrypt",
  "doc": "Decrypt some text with a given password (AES-256-CBC)",
  "returns": "decrypted text",
  "kind": "mutation",
  "args": [
   {
    "name": "text",
    "type": "string",
    "doc": "text to be decrypted"
   },
   {
    "name": "password",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "text_encrypt",
  "title": "Text Encrypt",
  "doc": "Encrypt some text with a given password (AES-256-CBC alogithm)",
  "returns": "encrypted text",
  "kind": "mutation",
  "args": [
   {
    "name": "text",
    "type": "string",
    "doc": "text to be encrypted"
   },
   {
    "name": "password",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "var_get",
  "title": "Get Variable",
  "doc": "Get a variable value previously saved with set_var.pf Useful to keep global values. Can store text up to 64k in size.",
  "returns": "",
  "kind": "query",
  "args": [
   {
    "name": "varname",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "var_inc",
  "title": "Increment Variable",
  "doc": "Increment a numeric variable to later fetch again with get_var.pf",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "varname",
    "type": "string",
    "doc": ""
   },
   {
    "name": "increment_by",
    "type": "number",
    "doc": ""
   }
  ]
 },
 {
  "name": "var_set",
  "title": "Set Variable",
  "doc": "Set a variable to later fetch again with get_var.pf Useful to keep global values. Can store text up to 64k in size.",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "varname",
    "type": "string",
    "doc": ""
   },
   {
    "name": "value",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "vars_list",
  "title": "List Variables",
  "doc": "Get a list of all variables and value hints previously saved with set_var.pf",
  "returns": "JSON array of name and first part of value",
  "kind": "query",
  "args": []
 },
 {
  "name": "webpage_get_chrome",
  "title": "Chrome Web Page Get",
  "doc": "Get the content of a web page using Chrome with javascript-enabled (counts as 10 actions)",
  "returns": "text - text or html of page",
  "kind": "mutation",
  "args": [
   {
    "name": "url",
    "type": "string",
    "doc": ""
   },
   {
    "name": "format",
    "type": "string",
    "doc": "text or html"
   },
   {
    "name": "domlevel",
    "type": "number",
    "doc": "1 domain loaded, 2 dom and all resources loaded, 3 page loaded and network idle"
   }
  ]
 },
 {
  "name": "webpage_html_regex",
  "title": "Webpage WGET as html w. Regex",
  "doc": "Gets a web page url as html, and then performs a given regex match. Very useful to grab just one element of a page, especially if you are monitoring a web page for changes. To view the full source, use a regex expression of (.*)",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "url",
    "type": "string",
    "doc": ""
   },
   {
    "name": "regex",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "webpage_text_regex",
  "title": "Webpage WGET as text w. Regex",
  "doc": "Gets a web page url, converts it to text, and then performs a given regex match. Very useful to grab just one element of a page, especially if you are monitoring a web page for changes. To view all of the page, use a regex expression of (.*)",
  "returns": "",
  "kind": "mutation",
  "args": [
   {
    "name": "url",
    "type": "string",
    "doc": ""
   },
   {
    "name": "regex",
    "type": "string",
    "doc": ""
   }
  ]
 },
 {
  "name": "whoami",
  "title": "Who Am I",
  "doc": "Returns your logged in user email address.",
  "returns": "string - logged in user email address",
  "kind": "query",
  "args": []
 },
 {
  "name": "xml_to_json",
  "title": "XML to JSON",
  "doc": "Converts an XML object to JSON",
  "returns": "JSON formatted object",
  "kind": "mutation",
  "args": [
   {
    "name": "xml",
    "type": "string",
    "doc": ""
   }
  ]
 }
];
