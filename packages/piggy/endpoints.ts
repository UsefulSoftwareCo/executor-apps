// Generated from the Leat API reference (https://docs.leat.com/llms-full.txt); one entry per documented endpoint.
export type Field = readonly [name: string, type: "s" | "n" | "b" | "j", required: 0 | 1, description: string];
export type Endpoint = { readonly k: "query" | "mutation"; readonly m: "GET" | "POST" | "PUT" | "DELETE"; readonly p: string; readonly d: string; readonly f: readonly Field[] };
export const endpoints: Readonly<Record<string, { readonly title: string; readonly tools: Readonly<Record<string, Endpoint>> }>> = {
 "automations": {
  "title": "Automations",
  "tools": {
   "listAutomations": {
    "k": "query",
    "m": "GET",
    "p": "/automations",
    "d": "Get an overview of all created Automations for an account.",
    "f": []
   },
   "createAutomationRun": {
    "k": "mutation",
    "m": "POST",
    "p": "/automations/runs",
    "d": "This method triggers an Automation. Please note that only the Automation with the 'contact\\_updated' event can subsequently be used to create a run. This means that the `event` of the Automation that you provide should have a be of type 'contact\\_updated'. You can add an array at `data`, which can t",
    "f": [
     [
      "contact_uuid",
      "s",
      1,
      "Contact for whom the Automation is to be triggered."
     ],
     [
      "automation_uuid",
      "s",
      1,
      "Automation to be triggered."
     ],
     [
      "data",
      "j",
      0,
      "Data to be used in the Automation."
     ]
    ]
   }
  }
 },
 "bookingCategories": {
  "title": "Booking Categories",
  "tools": {
   "listCategories": {
    "k": "query",
    "m": "GET",
    "p": "/booking-product-categories",
    "d": "Lists all Booking Categories.",
    "f": [
     [
      "limit",
      "n",
      0,
      "The maximum number of Categories to return"
     ],
     [
      "page",
      "n",
      0,
      "The page number to return"
     ]
    ]
   },
   "createCategory": {
    "k": "mutation",
    "m": "POST",
    "p": "/booking-product-categories",
    "d": "Creates a new Booking Category and returns it.",
    "f": [
     [
      "external_identifier",
      "s",
      1,
      "A unique identifier from your system"
     ],
     [
      "name",
      "s",
      1,
      "The name of the Category"
     ]
    ]
   },
   "batchCreateCategories": {
    "k": "mutation",
    "m": "POST",
    "p": "/booking-product-categories/batch",
    "d": "Creates or updates a batch of Booking Categories, matched on their `external_identifier`. Accepts up to 250 Categories per request. The maximum allowed payload size is 1MB.",
    "f": [
     [
      "categories",
      "j",
      1,
      "List of Categories"
     ]
    ]
   },
   "getCategory": {
    "k": "query",
    "m": "GET",
    "p": "/booking-product-categories/{external_identifier}",
    "d": "Get a specific Booking Category by its external\\_identifier.",
    "f": []
   },
   "findCategory": {
    "k": "query",
    "m": "GET",
    "p": "/booking-product-categories/find",
    "d": "Use the `external_identifier` to find a Booking Category.",
    "f": [
     [
      "external_identifier",
      "s",
      1,
      "A unique identifier from your system"
     ]
    ]
   },
   "findOrCreateCategory": {
    "k": "mutation",
    "m": "POST",
    "p": "/booking-product-categories/find-or-create",
    "d": "Finds the Booking Category with the given `external_identifier`, or creates it, and returns it. The name is only used when the Category is created.",
    "f": [
     [
      "external_identifier",
      "s",
      1,
      "A unique identifier from your system"
     ],
     [
      "name",
      "s",
      1,
      "The name of the Category"
     ]
    ]
   },
   "updateCategory": {
    "k": "mutation",
    "m": "PUT",
    "p": "/booking-product-categories/{external_identifier}",
    "d": "Updates a Booking Category, addressed by its external\\_identifier, and returns it. The external\\_identifier itself cannot be changed.",
    "f": [
     [
      "name",
      "s",
      0,
      "The name of the Category"
     ]
    ]
   },
   "deleteCategory": {
    "k": "mutation",
    "m": "DELETE",
    "p": "/booking-product-categories/{external_identifier}",
    "d": "Deletes a Booking Category, addressed by its external\\_identifier. Its external\\_identifier can be used again afterwards.",
    "f": []
   }
  }
 },
 "bookingProducts": {
  "title": "Booking Products",
  "tools": {
   "listProducts": {
    "k": "query",
    "m": "GET",
    "p": "/booking-products",
    "d": "Lists all Booking Products.",
    "f": [
     [
      "limit",
      "n",
      0,
      "The maximum number of Products to return (max 100)"
     ],
     [
      "page",
      "n",
      0,
      "The page number to return"
     ]
    ]
   },
   "createProduct": {
    "k": "mutation",
    "m": "POST",
    "p": "/booking-products",
    "d": "Creates a new Booking Product and returns it.",
    "f": [
     [
      "external_identifier",
      "s",
      1,
      "A unique identifier from your system"
     ],
     [
      "name",
      "s",
      1,
      "The name of the Product"
     ],
     [
      "description",
      "s",
      0,
      "The description of the Product"
     ],
     [
      "categories",
      "j",
      0,
      "List of Categories that the Product belongs to, each referenced by its external_identifier"
     ]
    ]
   },
   "batchCreateProducts": {
    "k": "mutation",
    "m": "POST",
    "p": "/booking-products/batch",
    "d": "Creates or updates a batch of Booking Products, matched on their `external_identifier`. Accepts up to 100 Products per request. The maximum allowed payload size is 1MB. A Category that does not exist is skipped.",
    "f": [
     [
      "products",
      "j",
      1,
      "List of Products"
     ]
    ]
   },
   "getProduct": {
    "k": "query",
    "m": "GET",
    "p": "/booking-products/{external_identifier}",
    "d": "Get a specific Booking Product by its external\\_identifier.",
    "f": []
   },
   "findProduct": {
    "k": "query",
    "m": "GET",
    "p": "/booking-products/find",
    "d": "Use the `external_identifier` to find a Booking Product.",
    "f": [
     [
      "external_identifier",
      "s",
      1,
      "A unique identifier from your system"
     ]
    ]
   },
   "findOrCreateProduct": {
    "k": "mutation",
    "m": "POST",
    "p": "/booking-products/find-or-create",
    "d": "Finds the Booking Product with the given `external_identifier`, or creates it, and returns it. The other attributes are only used when the Product is created.",
    "f": [
     [
      "external_identifier",
      "s",
      1,
      "A unique identifier from your system"
     ],
     [
      "name",
      "s",
      1,
      "The name of the Product"
     ],
     [
      "description",
      "s",
      0,
      "The description of the Product"
     ],
     [
      "categories",
      "j",
      0,
      "List of Categories that the Product belongs to, each referenced by its external_identifier"
     ]
    ]
   },
   "updateProduct": {
    "k": "mutation",
    "m": "PUT",
    "p": "/booking-products/{external_identifier}",
    "d": "Updates a Booking Product, addressed by its external\\_identifier, and returns it. The external\\_identifier itself cannot be changed.",
    "f": [
     [
      "name",
      "s",
      0,
      "The name of the Product"
     ],
     [
      "description",
      "s",
      0,
      "The description of the Product"
     ],
     [
      "categories",
      "j",
      0,
      "List of Categories that the Product belongs to. When given, it replaces the Categories the Product has"
     ]
    ]
   },
   "deleteProduct": {
    "k": "mutation",
    "m": "DELETE",
    "p": "/booking-products/{external_identifier}",
    "d": "Deletes a Booking Product, addressed by its external\\_identifier. Its external\\_identifier can be used again afterwards.",
    "f": []
   }
  }
 },
 "bookings": {
  "title": "Bookings",
  "tools": {
   "createBooking": {
    "k": "mutation",
    "m": "POST",
    "p": "/bookings",
    "d": "Creates a new Booking. Note that all monetary amounts – like prepaid\\_amount – are to be given in the currency's lowest denomination (e.g. €34,50 -> 3450). When creating Bookings, the best practice is to create the Booking as completely as you can. This includes adding the Line Items of what was boo",
    "f": [
     [
      "shop_uuid",
      "s",
      1,
      "The UUID of the Shop the Booking was made at"
     ],
     [
      "contact_uuid",
      "s",
      1,
      "The UUID of the Contact who made the booking"
     ],
     [
      "external_id",
      "s",
      1,
      "An external identifier for the Booking, unique per Account. It cannot be changed afterwards"
     ],
     [
      "source",
      "s",
      0,
      "Source from where the Booking was created"
     ],
     [
      "starts_at",
      "s",
      0,
      "The start date and time of the Booking in ISO 8601 format"
     ],
     [
      "ends_at",
      "s",
      0,
      "The end date and time of the Booking in ISO 8601 format"
     ],
     [
      "checked_in_at",
      "s",
      0,
      "The date and time when the party checked into the booking in ISO 8601 format"
     ],
     [
      "number_of_people",
      "n",
      0,
      "The size of the party in the booking"
     ],
     [
      "company_name",
      "s",
      0,
      "The name of the company for which the booking was made"
     ],
     [
      "status",
      "s",
      0,
      "Status of the booking (e.g. created, in progress, canceled, completed)"
     ],
     [
      "type",
      "s",
      0,
      "Type of the Booking"
     ],
     [
      "prepaid_amount",
      "n",
      0,
      "(in cents) The amount that was paid prior to the start of the booking"
     ],
     [
      "currency",
      "s",
      0,
      "Booking currency in ISO 4217 format; defaults to Account's default currency"
     ],
     [
      "line_items",
      "j",
      0,
      "List of Products in this Booking"
     ]
    ]
   },
   "updateBooking": {
    "k": "mutation",
    "m": "PUT",
    "p": "/bookings/{external_id}",
    "d": "Updates the attributes of the Booking with the given `external_id`. The Shop and Contact cannot be updated. Neither can the `external_id`: sending a different one is rejected, while sending the one the Booking already has is fine. When `line_items` is given, it replaces the Line Items of the Booking",
    "f": [
     [
      "source",
      "s",
      0,
      "Source from where the Booking was created"
     ],
     [
      "starts_at",
      "s",
      0,
      "The start date and time of the Booking in ISO 8601 format"
     ],
     [
      "ends_at",
      "s",
      0,
      "The end date and time of the Booking in ISO 8601 format"
     ],
     [
      "checked_in_at",
      "s",
      0,
      "The date and time when the party checked into the booking in ISO 8601 format"
     ],
     [
      "number_of_people",
      "n",
      0,
      "The size of the party in the booking"
     ],
     [
      "company_name",
      "s",
      0,
      "The name of the company for which the booking was made"
     ],
     [
      "status",
      "s",
      0,
      "Status of the booking (e.g. created, in progress, canceled, completed)"
     ],
     [
      "type",
      "s",
      0,
      "Type of the Booking"
     ],
     [
      "prepaid_amount",
      "n",
      0,
      "(in cents) The amount that was paid prior to the start of the booking"
     ],
     [
      "currency",
      "s",
      0,
      "Booking currency in ISO 4217 format"
     ],
     [
      "line_items",
      "j",
      0,
      "List of Products in this Booking"
     ]
    ]
   }
  }
 },
 "brandKit": {
  "title": "Brand Kit",
  "tools": {
   "getBrandKit": {
    "k": "query",
    "m": "GET",
    "p": "/brand-kit",
    "d": "Retrieve the details of your account's Brand Kit with this call. It allows you to access all the branding elements associated with your account, including logos, color schemes, and font styles.",
    "f": []
   }
  }
 },
 "categories": {
  "title": "Categories",
  "tools": {
   "listCategories": {
    "k": "query",
    "m": "GET",
    "p": "/product-categories",
    "d": "Retrieve all Categories.",
    "f": []
   },
   "createCategory": {
    "k": "mutation",
    "m": "POST",
    "p": "/product-categories",
    "d": "Creates a new Category in the Leat system and returns the Category entity.",
    "f": [
     [
      "external_identifier",
      "s",
      1,
      "A unique identifier from your system"
     ],
     [
      "name",
      "s",
      1,
      "The name of the Category"
     ]
    ]
   },
   "batchCreateCategories": {
    "k": "mutation",
    "m": "POST",
    "p": "/product-categories/batch",
    "d": "Creates a batch of Categories in the Leat system. Accepts up to 250 Categories per request. The maximum allowed payload size is 1MB.",
    "f": [
     [
      "categories",
      "j",
      1,
      "List of Categories"
     ]
    ]
   },
   "getCategory": {
    "k": "query",
    "m": "GET",
    "p": "/product-categories/{uuid}",
    "d": "Get a specific Category in the Leat system.",
    "f": []
   },
   "findCategory": {
    "k": "query",
    "m": "GET",
    "p": "/product-categories/find",
    "d": "Use the `external_identifier` to find a Category.",
    "f": [
     [
      "external_identifier",
      "s",
      1,
      "A unique identifier from your system"
     ]
    ]
   },
   "findOrCreateCategory": {
    "k": "mutation",
    "m": "POST",
    "p": "/product-categories/find-or-create",
    "d": "Finds an existing Category or creates a new Category in the Leat system and returns the Category entity.",
    "f": [
     [
      "external_identifier",
      "s",
      1,
      "A unique identifier from your system"
     ],
     [
      "name",
      "s",
      0,
      "The name of the Category"
     ]
    ]
   },
   "updateCategory": {
    "k": "mutation",
    "m": "PUT",
    "p": "/product-categories/{uuid}",
    "d": "Updates a Category in the Leat system and returns the updated Category entity.",
    "f": [
     [
      "external_identifier",
      "s",
      0,
      "A unique identifier from your system"
     ],
     [
      "name",
      "s",
      0,
      "The name of the Category"
     ]
    ]
   },
   "deleteCategory": {
    "k": "mutation",
    "m": "DELETE",
    "p": "/product-categories/{uuid}",
    "d": "Delete a specific Category in the Leat system.",
    "f": []
   }
  }
 },
 "collectableRewards": {
  "title": "Collectable Rewards",
  "tools": {
   "listCollectableRewards": {
    "k": "query",
    "m": "GET",
    "p": "/collectable-rewards",
    "d": "Retrieve a collection of Physical Rewards that still need to be picked up at the Shop by the Contact that has claimed them remotely.",
    "f": [
     [
      "contact_uuid",
      "s",
      1,
      "Retrieve an overview of all uncollected rewards for the Contact using their UUID."
     ]
    ]
   },
   "redeemCollectableReward": {
    "k": "mutation",
    "m": "PUT",
    "p": "/collectable-rewards/collect/{loyalty_transaction_uuid}",
    "d": "To collect a Reward, the UUID of the Loyalty Transaction needs to be stated as query parameter inside the URI. It updates the existing Reward resource and sets the `has_been_collected`property to true.",
    "f": []
   },
   "reverseCollectableRewardRedemption": {
    "k": "mutation",
    "m": "POST",
    "p": "/collectable-rewards/{collectable_reward_redemption_uuid}/reverse",
    "d": "Reverses a previous Collectable Reward Redemption, in the event of an order return or some other cancellation.",
    "f": [
     [
      "uuid",
      "s",
      1,
      "The UUID of the Collectable Reward Redemption to be reversed"
     ]
    ]
   }
  }
 },
 "contactAttributes": {
  "title": "Contact Attributes",
  "tools": {
   "listContactAttributes": {
    "k": "query",
    "m": "GET",
    "p": "/contact-attributes",
    "d": "Display a list of Contact Attributes for your Account, including both the default ones and any Custom Attributes you've created.",
    "f": [
     [
      "entity",
      "s",
      1,
      "The type of Custom Attributes you want to retrieve."
     ]
    ]
   },
   "createContactAttribute": {
    "k": "mutation",
    "m": "POST",
    "p": "/contact-attributes",
    "d": "This method allows you to create your own custom Contact Attribute. After the request, you get the created attribute as a response.",
    "f": [
     [
      "name",
      "s",
      1,
      "The unique value for the Contact Attribute, used for internal purposes."
     ],
     [
      "label",
      "s",
      0,
      "The label for the attribute, which is outputted."
     ],
     [
      "data_type",
      "s",
      1,
      "The data type of the attribute, possible options: url, text, date, phone, float, color, email, number, select, boolean, rich_text, date_time, long_text, date_ra"
     ],
     [
      "description",
      "s",
      0,
      "A description for the attribute."
     ],
     [
      "options",
      "j",
      0,
      "Applicable for (multi)selects only. Array consisting of label and value arrays."
     ]
    ]
   }
  }
 },
 "contactIdentifiers": {
  "title": "Contact Identifiers",
  "tools": {
   "findContactIdentifier": {
    "k": "query",
    "m": "GET",
    "p": "/contact-identifiers/find",
    "d": "Finds the Contact Identifier. Returns `contact`as null if not yet linked to a Contact.",
    "f": [
     [
      "contact_identifier_value",
      "s",
      1,
      "The unique value for the Contact Identifier."
     ]
    ]
   },
   "createContactIdentifier": {
    "k": "mutation",
    "m": "POST",
    "p": "/contact-identifiers",
    "d": "Creates a Contact Identifier. You can link it directly to a Contact when you send a `contact_uuid` along.",
    "f": [
     [
      "contact_identifier_value",
      "s",
      1,
      "The unique value for the Contact Identifier, which will serve as the identifier."
     ],
     [
      "contact_uuid",
      "s",
      0,
      "The Contact's UUID for whom the identifier is to be created. If you want to link a contact later, you can leave this empty."
     ],
     [
      "contact_identifier_name",
      "s",
      0,
      "A name for the Contact Identifier. When left out, it receives the same value as contact_identifier_value."
     ]
    ]
   },
   "linkContactIdentifier": {
    "k": "mutation",
    "m": "PUT",
    "p": "/contact-identifiers/link",
    "d": "Links an existing, unlinked Contact Identifier to an existing Contact.",
    "f": [
     [
      "contact_identifier_value",
      "s",
      1,
      "The unique value of the Contact Identifier that you want to link to the Contact."
     ],
     [
      "contact_uuid",
      "s",
      1,
      "The Contact UUID that needs to be linked to the Contact Identifier."
     ]
    ]
   },
   "unlinkContactIdentifier": {
    "k": "mutation",
    "m": "PUT",
    "p": "/contact-identifiers/unlink",
    "d": "Removes a linked Contact from a Contact Identifier.",
    "f": [
     [
      "contact_identifier_value",
      "s",
      1,
      "The unique value of the Contact Identifier that you want to unlink the contact from."
     ]
    ]
   },
   "updateContactIdentifier": {
    "k": "mutation",
    "m": "PUT",
    "p": "/contact-identifiers",
    "d": "Updates a Contact Identifier. Note: only the identifier's `name` and `active` properties can be updated. The value cannot be updated.",
    "f": [
     [
      "contact_identifier_value",
      "s",
      1,
      "The unique value of the Contact Identifier."
     ],
     [
      "contact_identifier_name",
      "s",
      0,
      "A name for the Contact Identifier."
     ],
     [
      "contact_identifier_active",
      "b",
      0,
      "Active state of the contact identifier."
     ]
    ]
   },
   "deleteContactIdentifier": {
    "k": "mutation",
    "m": "DELETE",
    "p": "/contact-identifiers",
    "d": "Deletes an Contact Identifier.",
    "f": [
     [
      "contact_identifier_value",
      "s",
      1,
      "The unique value of the Contact Identifier that you want to delete."
     ]
    ]
   }
  }
 },
 "contactSessionTokens": {
  "title": "Contact Session Tokens",
  "tools": {
   "findContactSessionToken": {
    "k": "query",
    "m": "GET",
    "p": "/contact-session-tokens/{contact_session_token}",
    "d": "Find a Contact's Session Token to identify and validate them.",
    "f": []
   },
   "useContactSessionToken": {
    "k": "mutation",
    "m": "POST",
    "p": "/contact-session-tokens/{contact_session_token}/use",
    "d": "Mark a session token as used, making it invalid for next attempts.",
    "f": []
   }
  }
 },
 "contactSubscriptions": {
  "title": "Contact Subscriptions",
  "tools": {
   "listContactSubscriptions": {
    "k": "query",
    "m": "GET",
    "p": "/contact-subscriptions/{contact_uuid}",
    "d": "This function retrieves a comprehensive list of all subscriptions associated with a specific Contact, identified by their UUID. It provides an easy and efficient way to view the various subscriptions a Contact is enrolled in, ensuring you have up-to-date information on their engagement with your ser",
    "f": []
   },
   "subscribeContact": {
    "k": "mutation",
    "m": "PUT",
    "p": "/contact-subscriptions/{contact_uuid}/subscribe",
    "d": "This call enables the subscription of a specific Contact to a chosen Subscription Type. By providing the Contact's UUID and the desired Subscription Type's UUID, you can easily enroll a Contact in a particular subscription.",
    "f": [
     [
      "subscription_type_uuid",
      "s",
      1,
      "The Subscription Type's UUID."
     ]
    ]
   },
   "unsubscribeContactToSubscriptionType": {
    "k": "mutation",
    "m": "PUT",
    "p": "/contact-subscriptions/{contact_uuid}/unsubscribe",
    "d": "This function allows for the removal of a specific Contact from a particular Subscription Type. By specifying the Contact's UUID and the Subscription Type's UUID, you can easily manage the Contact's subscription status.",
    "f": [
     [
      "subscription_type_uuid",
      "s",
      1,
      "The Subscription Type's UUID."
     ]
    ]
   }
  }
 },
 "contactVerification": {
  "title": "Contact Verification",
  "tools": {
   "sendContactVerificationEmail": {
    "k": "mutation",
    "m": "POST",
    "p": "/contact-verification/send",
    "d": "This function triggers the sending of a verification email to a Contact, provided they exist in the system. Therefore, it requires the Contact's email address to proceed. When doing so, the process of verifying their identity through email validation is initiated. The system checks for the existence",
    "f": [
     [
      "email",
      "s",
      1,
      "The email address of the Contact to receive the email."
     ]
    ]
   },
   "verifyLoginCode": {
    "k": "mutation",
    "m": "POST",
    "p": "/contact-verification/verify",
    "d": "Validates the login code received by the Contact via email. This verification is a crucial step to ensure the Contact's identity and secure login. The function checks for the presence of the Contacts Portal and uses the provided code and email to complete the verification process.",
    "f": [
     [
      "code",
      "s",
      1,
      "The code sent by email."
     ],
     [
      "email",
      "s",
      1,
      "The Contact's email."
     ]
    ]
   },
   "getAuthToken": {
    "k": "query",
    "m": "GET",
    "p": "/contact-verification/auth-token/{contact_uuid}",
    "d": "Retrieves an authentication token for a specific Contact, identified by their UUID. Allowing verification of the Contact's identity and granting secure access.",
    "f": []
   }
  }
 },
 "contacts": {
  "title": "Contacts",
  "tools": {
   "listContacts": {
    "k": "query",
    "m": "GET",
    "p": "/contacts",
    "d": "Retrieve a list of Contacts with pagination. The pagination has default values, but you can alter those by supplying the `page`and `limit`parameters including values with the call. Filter on contact attributes with `attributes[name][operator]=value`, where name is the attribute's `name` from List Co",
    "f": [
     [
      "limit",
      "n",
      0,
      "Limit of records to retrieve. Default: 10, maximum: 100."
     ],
     [
      "page",
      "n",
      0,
      "Page to retrieve. Default: 1."
     ],
     [
      "sort",
      "s",
      0,
      "Sort by column. Ascending by default, prefix with a hyphen to sort descending (e.g. ?sort=-created_at)"
     ],
     [
      "created_at",
      "j",
      0,
      "Filter on creation date, can only be sent in as array. Date value must be in ISO8601 format. Combine to retrieve contacts created between two dates."
     ],
     [
      "attributes",
      "j",
      0,
      "Filter on contact attributes, keyed by attribute name: attributes[name][operator]=value. A value without an operator means eq. Combine filters to narrow the lis"
     ]
    ]
   },
   "createContact": {
    "k": "mutation",
    "m": "POST",
    "p": "/contacts",
    "d": "If a Contact needs to be created, only the email address is needed. To add any additional data to the Contact, a subsequent Update Contact API call can be used.",
    "f": [
     [
      "email",
      "s",
      1,
      "The email address of the Contact to be created."
     ],
     [
      "referral_code",
      "s",
      0,
      "A referral code used for Piggy's referral programme."
     ]
    ]
   },
   "createContactAsync": {
    "k": "mutation",
    "m": "POST",
    "p": "/contacts/async",
    "d": "If a Contact needs to be created *quickly* and any system values that are normally created upon creation aren't relevant, this function can be used. This API call is much faster than the 'regular' creation API call, focusing on basic Contact creation.",
    "f": [
     [
      "email",
      "s",
      1,
      "The email address of the Contact to be created."
     ],
     [
      "referral_code",
      "s",
      0,
      "A referral code used for Piggy's referral programme."
     ]
    ]
   },
   "createAnonymousContact": {
    "k": "mutation",
    "m": "POST",
    "p": "/contacts/anonymous",
    "d": "Creates an anonymous Contact with a fictitious email address. This can be used whenever a new Contact cannot (yet) be identified by their email address, but some actions are already desired (e.g. creation of Credit Receptions). The Contact in question can later create a Contact with their actual ema",
    "f": [
     [
      "contact_identifier_value",
      "s",
      0,
      "The unique value for the Contact Identifier, which will serve as the identifier"
     ]
    ]
   },
   "findContact": {
    "k": "query",
    "m": "GET",
    "p": "/contacts/find-one-by",
    "d": "Find a Contact by email address. To find a Contact using an identifier, see Contact Identifiers.",
    "f": [
     [
      "email",
      "s",
      1,
      "The Contact's email address"
     ]
    ]
   },
   "findOrCreateContact": {
    "k": "query",
    "m": "GET",
    "p": "/contacts/find-or-create",
    "d": "Find Contact by email address or – if no Contact exists yet for this email address – our API creates a new Contact for the email address you just supplied and returns the newly created Contact in the response.",
    "f": [
     [
      "email",
      "s",
      1,
      "The Contact's email address."
     ]
    ]
   },
   "findOrCreateContactAsync": {
    "k": "query",
    "m": "GET",
    "p": "/contacts/find-or-create/async",
    "d": "If a Contact needs to be retrieved or created *quickly* and any system values that are normally created upon contact creation aren't relevant, this can be used. This API call is much faster than the 'regular' find or create API call; only the Contact's UUID will be returned on the response in this i",
    "f": [
     [
      "email",
      "s",
      1,
      "The email address of the Contact to be created or to be found."
     ]
    ]
   },
   "getContact": {
    "k": "query",
    "m": "GET",
    "p": "/contacts/{contact_uuid}",
    "d": "Retrieve a specific Contact with the the using its UUID.",
    "f": []
   },
   "updateContact": {
    "k": "mutation",
    "m": "PUT",
    "p": "/contacts/{contact_uuid}",
    "d": "Contact's attributes. Please note that system values or system defined attributes, such as 'credit balance' or 'created at', cannot be updated. Example payload:",
    "f": [
     [
      "attributes",
      "j",
      1,
      "An array of the attributes to be updated."
     ]
    ]
   },
   "deleteContact": {
    "k": "mutation",
    "m": "POST",
    "p": "/contacts/{contact_uuid}/delete",
    "d": "Deletes a Contact. This action is irreversible, the Contact's Credit Balance and any relation to other entities within the system will be removed, although the entities themselves may remain. When using 'DEFAULT' as the deletion type, a log is created containing detailed information. If 'GDPR' is us",
    "f": [
     [
      "type",
      "s",
      1,
      "The deletion type. Options are DEFAULT and GDPR."
     ]
    ]
   },
   "claimAnonymousContact": {
    "k": "mutation",
    "m": "PUT",
    "p": "/contacts/{anonymous_contact_uuid}/claim",
    "d": "This function enables the conversion of an anonymous Contact (registered with a fictional email address) into a recognized Contact with a real email address. If a Contact already exists with the provided real email address, the anonymous and existing Contacts will be merged.",
    "f": [
     [
      "email",
      "s",
      0,
      "The real email address for the Contact that is about to be not anonymous anymore."
     ]
    ]
   },
   "mergeContact": {
    "k": "mutation",
    "m": "POST",
    "p": "/contacts/merge",
    "d": "Merges a 'source' Contact into a 'destination' Contact. The 'destination' Contact will be the resulting Contact, whilst the 'source' Contact will be removed. **Note:** This cannot be undone, so use with care. Only use after verifying the person in question has access to both email addresses. **Note:",
    "f": [
     [
      "source_contact_uuid",
      "s",
      1,
      "The UUID of the Source Contact which will cease to exist."
     ],
     [
      "destination_contact_uuid",
      "s",
      1,
      "The UUID of the Destination Contact which remain."
     ]
    ]
   },
   "getContactIdentifiers": {
    "k": "query",
    "m": "GET",
    "p": "/contacts/{contact_uuid}/contact-identifiers",
    "d": "Use this endpoint to retrieve a Contact's Contact Identifiers.",
    "f": []
   },
   "getCreditBalance": {
    "k": "query",
    "m": "GET",
    "p": "/contacts/{contact_uuid}/credit-balance",
    "d": "Retrieve the current Credit Balance of a specific Contact, identified through their UUID.",
    "f": []
   },
   "getPrepaidBalance": {
    "k": "query",
    "m": "GET",
    "p": "/contacts/{contact_uuid}/prepaid-balance",
    "d": "Use this function to retrieve the Prepaid Balance of a particular Contact, identified by their UUID.",
    "f": []
   },
   "getTier": {
    "k": "query",
    "m": "GET",
    "p": "/contacts/{contact_uuid}/tier",
    "d": "Use this endpoint to retrieve the current loyalty Tier of a specific Contact. It’s useful for understanding a Contact's loyalty status and offering them tailored Rewards based on their Tier.",
    "f": []
   }
  }
 },
 "contactsPortal": {
  "title": "Contacts Portal",
  "tools": {
   "getAuthenticatedUrl": {
    "k": "query",
    "m": "GET",
    "p": "/contacts-portal/auth-url",
    "d": "This function generates a secure, authenticated URL specifically for a given Contact, identified by their UUID. This URL grants the Contact access to the portal, ensuring a safe and personalized experience.",
    "f": [
     [
      "contact_uuid",
      "s",
      1,
      "The UUID of the Contact for whom the authenticated url is to be generated."
     ]
    ]
   }
  }
 },
 "creditReceptions": {
  "title": "Credit Receptions",
  "tools": {
   "createCreditReception": {
    "k": "mutation",
    "m": "POST",
    "p": "/credit-receptions",
    "d": "In creating a Credit Reception, you may either choose to set the `unit_value` alongside the relevant `unit_name`, or the `credits`, or both. In any case, one of either must be set. If only purchase amount is set, then the number of credits are determined by any Loyalty Rules set on the Loyalty Progr",
    "f": [
     [
      "shop_uuid",
      "s",
      1,
      "The UUID of the Shop you want to create the Reward Reception for."
     ],
     [
      "contact_uuid",
      "s",
      1,
      "The UUID of the Contact for whom the Credit Reception is to be created."
     ],
     [
      "credits",
      "n",
      0,
      "Number of Credits, required if unit_value is not set. Overrides any Loyalty Rules."
     ],
     [
      "unit_value",
      "n",
      0,
      "Value of the Unit to be given. This parameter is required if credits is not set. Subject to any Loyalty Rules."
     ],
     [
      "unit_name",
      "s",
      0,
      "Name of the Unit for the corresponding value. If both unit_name and credits are not set, then the default unit (purchase_amount) is used."
     ],
     [
      "contact_identifier_value",
      "s",
      0,
      "The value of the Contact Identifier linked to the Contact for whom the Credit Reception is to be created."
     ],
     [
      "pos_transaction_uuid",
      "s",
      0,
      "The UUID of the POS transaction that you want to link the Credit Reception to."
     ]
    ]
   },
   "reverseCreditReception": {
    "k": "mutation",
    "m": "POST",
    "p": "/credit-receptions/{credit_reception_uuid}/reverse",
    "d": "At times, an initial Credit Reception needs to be reversed, because of a refund for instance. This will create a new Credit Reception with the same data as initially used, but for the negative number of credits issued.",
    "f": []
   },
   "calculateCredits": {
    "k": "query",
    "m": "GET",
    "p": "/credit-receptions/calculate",
    "d": "Without actually creating a Credit Reception, this API call can be used to calculate how many credits would be issued if a Credit Reception was to be made with the given values. Please note, that there is a (small) possibility of a divergence in credits between the calculation and the actual Credit ",
    "f": [
     [
      "shop_uuid",
      "s",
      1,
      "The UUID of the Shop you want to create the Reward Reception for."
     ],
     [
      "contact_uuid",
      "s",
      0,
      "The UUID of the Contact for whom the credits are to be calculated."
     ],
     [
      "unit_value",
      "n",
      1,
      "Value for which credits are to be calculated. Subject to any Loyalty Rules."
     ],
     [
      "unit_name",
      "s",
      0,
      "Name of the unit for the corresponding value. If both unit_name and credits are not set, then the default unit (purchase_amount) is used."
     ]
    ]
   }
  }
 },
 "customAttributeGroups": {
  "title": "Custom Attribute Groups",
  "tools": {
   "listCustomAttributeGroups": {
    "k": "query",
    "m": "GET",
    "p": "/custom-attribute-groups",
    "d": "Retrieve all Custom Attribute Groups for a specific entity.",
    "f": [
     [
      "entity",
      "s",
      1,
      "Entity for which Custom Attribute Groups are to be retrieved"
     ]
    ]
   },
   "createCustomAttributeGroup": {
    "k": "mutation",
    "m": "POST",
    "p": "/custom-attribute-groups",
    "d": "Custom Attributes can be grouped, which can be helpful to identify those attributes that are associated to your integration.",
    "f": [
     [
      "name",
      "s",
      1,
      "A unique internal identifier for this group"
     ],
     [
      "label",
      "s",
      0,
      "Display value for this group"
     ],
     [
      "entity",
      "s",
      1,
      "Entity for which this Custom Attribute Group is to be created"
     ]
    ]
   }
  }
 },
 "customAttributes": {
  "title": "Custom Attributes",
  "tools": {
   "listCustomAttributes": {
    "k": "query",
    "m": "GET",
    "p": "/custom-attributes",
    "d": "Get a list of Custom Attributes for a specified entity.",
    "f": [
     [
      "entity",
      "s",
      1,
      "The entity of the Custom Attributes you want to retrieve."
     ]
    ]
   },
   "createCustomAttribute": {
    "k": "mutation",
    "m": "POST",
    "p": "/custom-attributes",
    "d": "Creates a new Custom Attribute for a specified entity. You need to provide essential details like the entity type, name, label, and data type of the attribute. There's also the option to add a description and, for select attributes, an array of options.",
    "f": [
     [
      "entity",
      "s",
      1,
      "The entity that you want to create the Custom Attributes for."
     ],
     [
      "name",
      "s",
      1,
      "The unique value for the Custom Attribute, used for internal purposes."
     ],
     [
      "label",
      "s",
      1,
      "The label for the attribute, which is outputted."
     ],
     [
      "type",
      "s",
      1,
      "The data type of the attribute, possible options: url, text, date, phone, float, color, email, number, select, boolean, rich_text, date_time, long_text, date_ra"
     ],
     [
      "options",
      "j",
      0,
      "Applicable for (multi)selects only. Array consisting of name and value arrays."
     ],
     [
      "description",
      "s",
      0,
      "A description for the attribute."
     ],
     [
      "group_name",
      "s",
      0,
      "Name of the Group to which the attribute belongs."
     ]
    ]
   },
   "updateCustomAttribute": {
    "k": "mutation",
    "m": "PUT",
    "p": "/custom-attributes/{custom_attribute_name}",
    "d": "Updates the properties of a Custom Attribute. Note that only the `label`, `description`, `options` for selects and multiselects, `group` can be updated. Attributes defined by the system cannot be updated.",
    "f": [
     [
      "entity",
      "s",
      1,
      "The entity that you want to create the Custom Attributes for."
     ],
     [
      "label",
      "s",
      0,
      "The label for the attribute, which is outputted."
     ],
     [
      "options",
      "j",
      0,
      "Applicable for (multi)selects only. Array consisting of name and value arrays."
     ],
     [
      "description",
      "s",
      0,
      "A description for the attribute."
     ],
     [
      "group_name",
      "s",
      0,
      "Name of the Group to which the attribute belongs."
     ]
    ]
   }
  }
 },
 "forms": {
  "title": "Forms",
  "tools": {
   "listForms": {
    "k": "query",
    "m": "GET",
    "p": "/forms",
    "d": "Retrieve of all Forms linked to an Account. It's possible to filter both on`status`and `type`",
    "f": [
     [
      "status",
      "s",
      0,
      "Status of Forms to be retrieved, possible values: PUBLISHED, DRAFT, BIN."
     ],
     [
      "type",
      "s",
      0,
      "Type of Forms to be retrieved, possible values: PUBLIC, PRIVATE."
     ]
    ]
   }
  }
 },
 "giftcardPrograms": {
  "title": "Giftcard Programs",
  "tools": {
   "listGiftcardPrograms": {
    "k": "query",
    "m": "GET",
    "p": "/giftcard-programs",
    "d": "Retrieve a list of your Giftcard Programs.",
    "f": []
   }
  }
 },
 "giftcardTransactions": {
  "title": "Giftcard Transactions",
  "tools": {
   "listGiftcardTransactions": {
    "k": "query",
    "m": "GET",
    "p": "/giftcard-transactions",
    "d": "This API call provides a list of all Giftcard Transactions. It offers filtering options based on per-page count, page number, Giftcard hash, Giftcard Program UUID, and Shop UUID.",
    "f": [
     [
      "perPage",
      "n",
      0,
      "Limit of records to retrieve. Default: 10; Maximum: 100."
     ],
     [
      "page",
      "n",
      0,
      "Page to retrieve. Default: 1."
     ],
     [
      "giftcard_hash",
      "s",
      0,
      "Retrieve transactions for a specific giftcard"
     ],
     [
      "giftcard_program_uuid",
      "s",
      0,
      "Retrieve transactions for a specific giftcard program"
     ],
     [
      "shop_uuid",
      "s",
      0,
      "Retrieve transactions performed at a specific Shop"
     ],
     [
      "sort",
      "s",
      0,
      "Sort by column. Ascending by default, prefix with a hyphen to sort descending (e.g. ?sort=-created_at)"
     ],
     [
      "created_at",
      "j",
      0,
      "Filter on creation date, can only be sent in as array. Date value must be in ISO8601 format. Combine to retrieve transactions between two dates."
     ]
    ]
   },
   "createGiftcardTransaction": {
    "k": "mutation",
    "m": "POST",
    "p": "/giftcard-transactions",
    "d": "This API call facilitates the creation of a transaction for a specific Giftcard. It handles both increment and decrement transactions. A negative amount will trigger a decrementation, adjusting the Giftcard's balance accordingly.",
    "f": [
     [
      "giftcard_uuid",
      "s",
      1,
      "The UUID of the Giftcard you want to create the transaction for."
     ],
     [
      "amount_in_cents",
      "n",
      1,
      "The amount in cents with which the Giftcard is to be incremented or decremented. Supply a negative amount for a decrementation."
     ],
     [
      "shop_uuid",
      "s",
      1,
      "UUID of the Shop where the Giftcard Transaction has taken place."
     ],
     [
      "custom_attributes",
      "j",
      0,
      "Additional Custom Attributes as a key-value array."
     ]
    ]
   },
   "getGiftcardTransaction": {
    "k": "query",
    "m": "GET",
    "p": "/giftcard-transactions/{giftcard_transaction_uuid}",
    "d": "Retrieve details of a specific Giftcard Transaction. By providing the transaction's UUID, you can access comprehensive information about individual transactions, allowing you to see and keep track of Giftcard Transactions, making it easier to manage Giftcards.",
    "f": []
   },
   "reverseGiftcardTransaction": {
    "k": "mutation",
    "m": "POST",
    "p": "/giftcard-transactions/{giftcard_transaction_uuid}/reverse",
    "d": "At times, an initial Giftcard Transaction needs to be reversed, because of a refund for instance. This will create a new Giftcard Transaction with the same data as initially used, but for the negative amount issued.",
    "f": []
   }
  }
 },
 "giftcards": {
  "title": "Giftcards",
  "tools": {
   "listGiftcards": {
    "k": "query",
    "m": "GET",
    "p": "/giftcards",
    "d": "Returns a paginated list of Giftcards.",
    "f": [
     [
      "giftcard_program_uuid",
      "s",
      0,
      "The UUID of the Giftcard Program for which you want to retrieve Giftcards."
     ],
     [
      "page",
      "n",
      0,
      "The page number."
     ],
     [
      "limit",
      "n",
      0,
      "The maximum number of Giftcards to retrieve (default: 30, max: 100)."
     ]
    ]
   },
   "getGiftcard": {
    "k": "query",
    "m": "GET",
    "p": "/giftcards/{giftcard_uuid}",
    "d": "Finds a Giftcard by its UUID.",
    "f": []
   },
   "findGiftcardByHash": {
    "k": "query",
    "m": "GET",
    "p": "/giftcards/find-one-by",
    "d": "Returns all relevant information for a Giftcard. Required for a create Giftcard Transaction call, as it provides all the necessary details.",
    "f": [
     [
      "hash",
      "s",
      1,
      "The Giftcard's unique hash or QR-code."
     ]
    ]
   },
   "createGiftcard": {
    "k": "mutation",
    "m": "POST",
    "p": "/giftcards",
    "d": "This API call allows creation of Digital Giftcards, as the creation of Physical Giftcards is currently not supported. To create a Digital Giftcard, use `type: 1` in your request.",
    "f": [
     [
      "type",
      "n",
      1,
      "Giftcard type - 0: Physical, 1: Digital. Only the creation of Digital Giftcards is supported at this time."
     ],
     [
      "giftcard_program_uuid",
      "s",
      1,
      "The UUID of the Giftcard Program to which the newly created Giftcard is to be linked."
     ]
    ]
   },
   "sendGiftcardByEmail": {
    "k": "mutation",
    "m": "POST",
    "p": "/giftcards/{uuid}/send-by-email",
    "d": "This API call sends out an email containing giftcard information. The email is to be preconfigured in the Account and adhere to the following requirements: (1) must be a valid Automated email, (2) must be of category 'Giftcard recipient', (3) subscription type must be configured and Contact must be ",
    "f": [
     [
      "contact_uuid",
      "s",
      1,
      "The Contact to whom the giftcard email is to be sent."
     ],
     [
      "email_uuid",
      "s",
      0,
      "The email that is to be used to send the giftcard. If none is given, the system will attempt to use any valid email in the account. Email must contain the 'gift"
     ],
     [
      "merge_tags",
      "j",
      0,
      "An associative array of custom merge tags, to replace those in the email. Keys must start with 'custom.' (Example: custom.message: 'Hello')"
     ]
    ]
   }
  }
 },
 "loyaltyProgram": {
  "title": "Loyalty Program",
  "tools": {
   "getLoyaltyProgram": {
    "k": "query",
    "m": "GET",
    "p": "/loyalty-program",
    "d": "This method allows you to retrieve detailed information about a specific Loyalty Program. It provides key details such as the program's ID, `name`, maximum credit amount, `custom_credit_name`, and `unit`settings. This API call is allows for understanding the details of the Loyalty Program for your A",
    "f": []
   }
  }
 },
 "loyaltyTokens": {
  "title": "Loyalty Tokens",
  "tools": {
   "createLoyaltyToken": {
    "k": "mutation",
    "m": "POST",
    "p": "/loyalty-tokens",
    "d": "Builds the Loyalty Token link for you, the same link the steps above produce, and returns its full URL. Send either `credits` or `unit_value` with its `unit_name`, not both. The timestamp is set by the server. Nothing is stored when the link is created: the Loyalty Token is saved the first time the ",
    "f": [
     [
      "version",
      "s",
      1,
      "The token version. Use v3: the link then carries the Shop's UUID. Any other value puts the Shop's id in the link instead."
     ],
     [
      "shop_id",
      "n",
      0,
      "The id of the Shop that is providing the credits."
     ],
     [
      "shop_uuid",
      "s",
      0,
      "The UUID of the Shop that is providing the credits."
     ],
     [
      "unique_id",
      "s",
      1,
      "A unique id from your system, e.g. the order ID. It must be unique within your loyalty program."
     ],
     [
      "credits",
      "n",
      0,
      "The number of credits (points) to issue, as an integer of at least 1."
     ],
     [
      "unit_value",
      "n",
      0,
      "The value points are calculated from with your earn rules, e.g. the order amount."
     ],
     [
      "unit_name",
      "s",
      0,
      "The name of the Unit that unit_value is in, e.g. purchase_amount."
     ]
    ]
   }
  }
 },
 "loyaltyTransactionAttributes": {
  "title": "Loyalty Transaction Attributes",
  "tools": {
   "listLoyaltyTransactionAttributes": {
    "k": "query",
    "m": "GET",
    "p": "/loyalty-transaction-attributes",
    "d": "Retrieve a list of all Loyalty Transaction Attributes associated with your Loyalty Program. It's a helpful tool to view both standard and Custom Attributes, allowing for better understanding and management of the data collected through loyalty transactions.",
    "f": []
   },
   "createLoyaltyTransactionAttribute": {
    "k": "mutation",
    "m": "POST",
    "p": "/loyalty-transaction-attributes",
    "d": "Creating a Loyalty Transaction Attribute allows you to add new Custom Attributes to your Loyalty Program. This feature is essential for tailoring the program to specific data collection needs, such as capturing unique customer preferences or transaction details. The creation process involves specify",
    "f": [
     [
      "name",
      "s",
      1,
      "The unique value for the Loyalty Transaction Attribute, used for internal purposes."
     ],
     [
      "data_type",
      "s",
      1,
      "The data type of the attribute, possible options: url, text, date, phone, float, color, email, number, select, boolean, rich_text, date_time, long_text, date_ra"
     ],
     [
      "label",
      "s",
      0,
      "The label for the attribute, which is outputted."
     ],
     [
      "description",
      "s",
      0,
      "A description for the attribute."
     ],
     [
      "options",
      "j",
      0,
      "Applicable for (multi)selects only. Array consisting of name and value arrays."
     ]
    ]
   }
  }
 },
 "loyaltyTransactions": {
  "title": "Loyalty Transactions",
  "tools": {
   "listLoyaltyTransactions": {
    "k": "query",
    "m": "GET",
    "p": "/loyalty-transactions",
    "d": "Returns transactions for a Loyalty Program. The results can be filtered by Contact, Shop and Loyalty Transaction `type`.",
    "f": [
     [
      "limit",
      "n",
      0,
      "Limit of records to retrieve. Default: 10; Maximum: 100."
     ],
     [
      "page",
      "n",
      0,
      "Page to retrieve. Default: 1."
     ],
     [
      "type",
      "s",
      0,
      "Type of Loyalty Transactions to be retrieved, options: 'credit_receptions' and 'reward_receptions'. If not set, loyalty transactions of all types are retrieved."
     ],
     [
      "shop_uuid",
      "s",
      0,
      "Retrieve transactions performed at a specific Shop/Business Profile"
     ],
     [
      "sort",
      "s",
      0,
      "Sort by column. Ascending by default, prefix with a hyphen to sort descending (e.g. ?sort=-created_at)"
     ],
     [
      "created_at",
      "j",
      0,
      "Filter on creation date, can only be sent in as array. Date value must be in ISO8601 format. Combine to retrieve transactions between two dates."
     ]
    ]
   }
  }
 },
 "orderReturns": {
  "title": "Order Returns",
  "tools": {
   "createAndProcessOrderReturn": {
    "k": "mutation",
    "m": "POST",
    "p": "/order-returns/create-and-process",
    "d": "Creates a new Order Return and processes it at once (i.e. handling corrections for the initial Order). It returns both the Order Return entity itself and a result object. If an Order Action was configured for the Account and the original Order triggered a Run, this is executed in sync and will popul",
    "f": [
     [
      "order",
      "j",
      1,
      "The corresponding original Order for this Order Return"
     ],
     [
      "external_identifier",
      "s",
      1,
      "A unique identifier from your system"
     ],
     [
      "status",
      "s",
      1,
      "Status of the order return"
     ],
     [
      "line_items",
      "j",
      0,
      "List of Line Items to be returned"
     ],
     [
      "sub_line_items",
      "j",
      0,
      "List of Sub Line Items that should be returned"
     ],
     [
      "applied_discounts",
      "j",
      0,
      "List of Discounts applied to this Order"
     ],
     [
      "charges",
      "j",
      0,
      "Any charges not included as line items. E.g. gratuity, service charges or shipping"
     ]
    ]
   }
  }
 },
 "orders": {
  "title": "Orders",
  "tools": {
   "createAndProcessOrder": {
    "k": "mutation",
    "m": "POST",
    "p": "/orders/create-and-process",
    "d": "RECOMMENDED Creates a new Order in the Leat system and directly processes it. Returns both the Order entity itself and a result object containing the result of the Order Action as configured by the Client. Currently, the only type of Order Action supported is the creation of a Points Transaction. Ho",
    "f": [
     [
      "external_identifier",
      "s",
      1,
      "A unique identifier from your system"
     ],
     [
      "reference",
      "s",
      0,
      "A human readable identifier from your system, for reference purposes only"
     ],
     [
      "status",
      "s",
      1,
      "Status of the order"
     ],
     [
      "payment_status",
      "s",
      1,
      "Status of the payment of the order"
     ],
     [
      "total_order_amount",
      "n",
      1,
      "Total order amount, including all discounts and charges, in the currency's lowest denomination."
     ],
     [
      "order_amount",
      "n",
      0,
      "Sum of total amounts of all (sub) line items – including item-based discounts – before order-based discounts and charges, in the currency's lowest denomination."
     ],
     [
      "total_discount_amount",
      "n",
      0,
      "Total discount amount, in the currency's lowest denomination"
     ],
     [
      "currency",
      "s",
      0,
      "Order currency in ISO 4217 format; defaults to Account's default currency"
     ],
     [
      "paid_at",
      "s",
      0,
      "The date and time this Order was paid, in ISO 8601 format"
     ],
     [
      "completed_at",
      "s",
      0,
      "The date and time this Order was completed, in ISO 8601 format"
     ],
     [
      "contact",
      "j",
      1,
      "Contact who made the Order"
     ],
     [
      "business_profile",
      "j",
      1,
      "Location where the Order took place"
     ],
     [
      "line_items",
      "j",
      1,
      "List of Products in this Order"
     ],
     [
      "applied_discounts",
      "j",
      0,
      "List of Discounts applied to this Order"
     ],
     [
      "charges",
      "j",
      0,
      "Any charges not included as line items. E.g. gratuity, service charges or shipping"
     ],
     [
      "payments",
      "j",
      0,
      "Any payments made for this Order using Leat objects. Note: currently accepts Giftcard Transactions and Prepaid Transactions only."
     ]
    ]
   },
   "createOrder": {
    "k": "mutation",
    "m": "POST",
    "p": "/orders",
    "d": "Creates a new Order in the Leat system. It does not yet process the Order, so no Points Transaction will be created just yet. Call the Process Order endpoint to convert the Order into a Points Transaction. Alternatively, use the Create and Process Order endpoint instead. Note that all monetary amoun",
    "f": [
     [
      "external_identifier",
      "s",
      1,
      "A unique identifier from your system"
     ],
     [
      "reference",
      "s",
      0,
      "A human readable identifier from your system, for reference purposes only"
     ],
     [
      "status",
      "s",
      1,
      "Status of the order"
     ],
     [
      "payment_status",
      "s",
      1,
      "Status of the payment of the order"
     ],
     [
      "total_order_amount",
      "n",
      1,
      "Total order amount, including all discounts and charges, in the currency's lowest denomination."
     ],
     [
      "order_amount",
      "n",
      0,
      "Sum of total amounts of all (sub) line items – including item-based discounts – before order-based discounts and charges, in the currency's lowest denomination."
     ],
     [
      "total_discount_amount",
      "n",
      0,
      "Total discount amount, in the currency's lowest denomination"
     ],
     [
      "currency",
      "s",
      0,
      "Order currency in ISO 4217 format; defaults to Account's default currency"
     ],
     [
      "paid_at",
      "s",
      0,
      "The date and time this Order was paid, in ISO 8601 format"
     ],
     [
      "completed_at",
      "s",
      0,
      "The date and time this Order was completed, in ISO 8601 format"
     ],
     [
      "contact",
      "j",
      1,
      "Contact who made the Order"
     ],
     [
      "business_profile",
      "j",
      1,
      "Location where the Order took place"
     ],
     [
      "line_items",
      "j",
      1,
      "List of Products in this Order"
     ],
     [
      "applied_discounts",
      "j",
      0,
      "List of Discounts applied to this Order"
     ],
     [
      "charges",
      "j",
      0,
      "Any charges not included as line items. E.g. gratuity, service charges or shipping"
     ],
     [
      "payments",
      "j",
      0,
      "Any payments made for this Order using Leat objects. Note: currently accepts Giftcard Transactions and Prepaid Transactions only."
     ]
    ]
   },
   "processOrder": {
    "k": "mutation",
    "m": "POST",
    "p": "/orders/{uuid}/process",
    "d": "Processes an existing Order in the Leat system and returns a result object. If an Order Action was configured for the Account, then this is executed in sync and will fill the result object. An example of such a result would be a transaction containing loyalty points.",
    "f": []
   },
   "findOrder": {
    "k": "query",
    "m": "GET",
    "p": "/orders/find",
    "d": "Use the `external_identifier` to find an Order.",
    "f": [
     [
      "external_identifier",
      "s",
      1,
      "A unique identifier from your system"
     ]
    ]
   },
   "listOrders": {
    "k": "query",
    "m": "GET",
    "p": "/orders",
    "d": "Retrieve a paginated list of Orders, ordered by most recent.",
    "f": [
     [
      "limit",
      "n",
      0,
      "Number of Orders to retrieve (max: 30, default: 30)"
     ],
     [
      "page",
      "n",
      0,
      "Page number to retrieve (default: 1)"
     ],
     [
      "contact_uuid",
      "s",
      0,
      "Retrieve Orders for a specific Contact"
     ],
     [
      "business_profile_uuid",
      "s",
      0,
      "Retrieve Orders for a specific Business Profile"
     ]
    ]
   },
   "updateOrder": {
    "k": "mutation",
    "m": "PUT",
    "p": "/orders/{uuid}",
    "d": "Use the `uuid` to update an existing Order.",
    "f": [
     [
      "status",
      "s",
      0,
      "Status of the order"
     ],
     [
      "payment_status",
      "s",
      0,
      "Status of the payment of the order"
     ]
    ]
   },
   "simulateOrderResult": {
    "k": "query",
    "m": "POST",
    "p": "/orders/simulate",
    "d": "Simulates the result of a new Order in the Leat system. Please note that the actual result may differ, as some time-based rules may be in place. Also, some rules may not be applied if the required information is missing from the payload (e.g. contact).",
    "f": [
     [
      "status",
      "s",
      0,
      "Status of the order"
     ],
     [
      "payment_status",
      "s",
      0,
      "Status of the payment of the order"
     ],
     [
      "total_order_amount",
      "n",
      1,
      "Total order amount, after discounts and other charges, in the currency's lowest denomination"
     ],
     [
      "order_amount",
      "n",
      0,
      "Total order amount, before discounts and other charges, in the currency's lowest denomination"
     ],
     [
      "total_discount_amount",
      "n",
      0,
      "Total discount amount, in the currency's lowest denomination"
     ],
     [
      "currency",
      "s",
      0,
      "Order currency in ISO 4217 format; defaults to Account's default currency"
     ],
     [
      "contact",
      "j",
      0,
      "The Contact for this Order. If not given, Contact-based rules cannot be applied"
     ],
     [
      "business_profile",
      "j",
      1,
      "Location where the Order takes place"
     ],
     [
      "line_items",
      "j",
      1,
      "List of Products in this Order"
     ],
     [
      "applied_discounts",
      "j",
      0,
      "List of Discounts applied to this Order"
     ],
     [
      "charges",
      "j",
      0,
      "Any charges not included as line items. E.g. gratuity, service charges or shipping"
     ]
    ]
   }
  }
 },
 "perks": {
  "title": "Perks",
  "tools": {
   "listPerks": {
    "k": "query",
    "m": "GET",
    "p": "/perks",
    "d": "This API call fetches a list of all Perks with their Perk Options.",
    "f": []
   },
   "createPerk": {
    "k": "mutation",
    "m": "POST",
    "p": "/perks",
    "d": "Creates a new Perk.",
    "f": [
     [
      "label",
      "s",
      1,
      "The label of the perk."
     ],
     [
      "name",
      "s",
      1,
      "The name of the perk (used internally)."
     ],
     [
      "data_type",
      "s",
      1,
      "The data type of the perk, available options: single_select or boolean."
     ],
     [
      "options",
      "j",
      1,
      "The options of the perk (should contain a label, value and default key with values). When data_type is boolean, only true and false values are allowed. A defaul"
     ]
    ]
   },
   "getPerk": {
    "k": "query",
    "m": "GET",
    "p": "/perks/{perk_uuid}",
    "d": "Retrieve a Perk with its Perk Options using its UUID.",
    "f": []
   },
   "updatePerk": {
    "k": "mutation",
    "m": "PUT",
    "p": "/perks/{perk_uuid}",
    "d": "Updates an existing Perk.",
    "f": [
     [
      "label",
      "s",
      1,
      "The label of the perk."
     ]
    ]
   }
  }
 },
 "portalSessions": {
  "title": "Portal Sessions",
  "tools": {
   "getPortalSession": {
    "k": "query",
    "m": "GET",
    "p": "/portal-sessions/{portal_session_uuid}",
    "d": "Retrieve a Portal Session by supplying its UUID.",
    "f": []
   },
   "createPortalSession": {
    "k": "mutation",
    "m": "POST",
    "p": "/portal-sessions",
    "d": "When creating a portal session, a valid `shop_uuid` specifying the shop for which the portal session is to be created must be provided. Optionally, a `contact_uuid` can be provided, which will pre-fill the contact's details in the portal session. If no contact UUID is provided, the contact can be ad",
    "f": [
     [
      "shop_uuid",
      "s",
      1,
      "A valid shop UUID for the portal session being created."
     ],
     [
      "contact_uuid",
      "s",
      0,
      "The UUID of the Contact for whom the portal session is to be created. This can also be set in the portal session itself."
     ],
     [
      "scanner_type",
      "s",
      0,
      "Specify the type of scanner that is being used. Option: 'camera' and 'hand_scanner'. If not set, defaults to 'camera'."
     ],
     [
      "enable_email_identification",
      "b",
      0,
      "Enable the option for contacts to use their email-address as identification. If not set, defaults to false."
     ],
     [
      "enable_registration",
      "b",
      0,
      "Enable the option to register new contacts. If not set, defaults to false."
     ],
     [
      "enable_on_screen_keyboard",
      "b",
      0,
      "Enable the on-screen keyboard. If not set, defaults to false."
     ],
     [
      "camera_service",
      "n",
      0,
      "Select which camera service to use. Options include 1, 2 or 3. Defaults to 3."
     ],
     [
      "facing_mode",
      "s",
      0,
      "MediaTrackConstraints facingMode. Specifies the default camera if applicable. Specify 'user' to use the front camera and 'environment' to use the back camera. D"
     ],
     [
      "primary_identification_method",
      "s",
      0,
      "Start the identification flow with either 'email' or 'identifier'. Defaults to 'identifier'."
     ]
    ]
   },
   "createCreditReceptionPortalSession": {
    "k": "mutation",
    "m": "POST",
    "p": "/portal-sessions/credit-reception",
    "d": "A portal session can also specifically be made for credit receptions. This is done by specifying the `credit-reception` endpoint. All other parameters are the same as when creating a regular portal session.",
    "f": [
     [
      "shop_uuid",
      "s",
      1,
      "A valid shop UUID for the portal session being created."
     ],
     [
      "contact_uuid",
      "s",
      0,
      "The UUID of the Contact for whom the portal session is to be created. This can also be set in the portal session itself."
     ],
     [
      "scanner_type",
      "s",
      0,
      "Specify the type of scanner that is being used. Option: 'camera' and 'hand_scanner'. If not set, defaults to 'camera'."
     ],
     [
      "enable_email_identification",
      "b",
      0,
      "Enable the option for contacts to use their email-address as identification. If not set, defaults to false."
     ],
     [
      "enable_registration",
      "b",
      0,
      "Enable the option to register new contacts. If not set, defaults to false."
     ],
     [
      "enable_on_screen_keyboard",
      "b",
      0,
      "Enable the on-screen keyboard. If not set, defaults to false."
     ],
     [
      "camera_service",
      "n",
      0,
      "Select which camera service to use. Options include 1, 2 or 3. Defaults to 3."
     ],
     [
      "facing_mode",
      "s",
      0,
      "MediaTrackConstraints facingMode. Specifies the default camera if applicable. Specify 'user' to use the front camera and 'environment' to use the back camera. D"
     ],
     [
      "primary_identification_method",
      "s",
      0,
      "Start the identification flow with either 'email' or 'identifier'. Defaults to 'identifier'."
     ]
    ]
   },
   "createRedeemGiftcardPortalSession": {
    "k": "mutation",
    "m": "POST",
    "p": "/portal-sessions/redeem-giftcards",
    "d": "A portal session can also specifically be made for redeeming giftcards. This is done by specifying the `redeem-giftcards` endpoint. This session type requires a purchase amount, `amount_in_cents`, to be provided. It is also possible to specify whether multiple giftcards can be used for a single tran",
    "f": [
     [
      "amount_in_cents",
      "n",
      1,
      "Purchase amount in cents (€10.40 = 1040)"
     ],
     [
      "shop_uuid",
      "s",
      1,
      "A valid shop UUID for the portal session being created."
     ],
     [
      "allow_multiple_giftcards",
      "b",
      0,
      "Enable the use of multiple giftcards per transaction. If not set, defaults to true."
     ],
     [
      "contact_uuid",
      "s",
      0,
      "The UUID of the Contact for whom the portal session is to be created. This can also be set in the portal session itself."
     ],
     [
      "scanner_type",
      "s",
      0,
      "Specify the type of scanner that is being used. Option: 'camera' and 'hand_scanner'. If not set, defaults to 'camera'."
     ],
     [
      "enable_email_identification",
      "b",
      0,
      "Enable the option for contacts to use their email-address as identification. If not set, defaults to false."
     ],
     [
      "enable_registration",
      "b",
      0,
      "Enable the option to register new contacts. If not set, defaults to false."
     ],
     [
      "enable_on_screen_keyboard",
      "b",
      0,
      "Enable the on-screen keyboard. If not set, defaults to false."
     ],
     [
      "camera_service",
      "n",
      0,
      "Select which camera service to use. Options include 1, 2 or 3. Defaults to 3."
     ],
     [
      "facing_mode",
      "s",
      0,
      "MediaTrackConstraints facingMode. Specifies the default camera if applicable. Specify 'user' to use the front camera and 'environment' to use the back camera. D"
     ],
     [
      "primary_identification_method",
      "s",
      0,
      "Start the identification flow with either 'email' or 'identifier'. Defaults to 'identifier'."
     ]
    ]
   },
   "createTopUpGiftcardPortalSession": {
    "k": "mutation",
    "m": "POST",
    "p": "/portal-sessions/top-up-giftcards",
    "d": "A portal session can also specifically be made for topping up giftcards. This is done by specifying the `top-up-giftcards` endpoint. All other parameters are the same as when creating a regular portal session.",
    "f": [
     [
      "shop_uuid",
      "s",
      1,
      "A valid shop UUID for the portal session being created."
     ],
     [
      "contact_uuid",
      "s",
      0,
      "The UUID of the Contact for whom the portal session is to be created. This can also be set in the portal session itself."
     ],
     [
      "scanner_type",
      "s",
      0,
      "Specify the type of scanner that is being used. Option: 'camera' and 'hand_scanner'. If not set, defaults to 'camera'."
     ],
     [
      "enable_email_identification",
      "b",
      0,
      "Enable the option for contacts to use their email-address as identification. If not set, defaults to false."
     ],
     [
      "enable_registration",
      "b",
      0,
      "Enable the option to register new contacts. If not set, defaults to false."
     ],
     [
      "enable_on_screen_keyboard",
      "b",
      0,
      "Enable the on-screen keyboard. If not set, defaults to false."
     ],
     [
      "camera_service",
      "n",
      0,
      "Select which camera service to use. Options include 1, 2 or 3. Defaults to 3."
     ],
     [
      "facing_mode",
      "s",
      0,
      "MediaTrackConstraints facingMode. Specifies the default camera if applicable. Specify 'user' to use the front camera and 'environment' to use the back camera. D"
     ],
     [
      "primary_identification_method",
      "s",
      0,
      "Start the identification flow with either 'email' or 'identifier'. Defaults to 'identifier'."
     ]
    ]
   },
   "createPayPrepaidPortalSession": {
    "k": "mutation",
    "m": "POST",
    "p": "/portal-sessions/pay-prepaid",
    "d": "A portal session can also specifically be made for prepaid transactions. This is done by specifying the `pay-prepaid` endpoint. All other parameters are the same as when creating a regular portal session.",
    "f": [
     [
      "shop_uuid",
      "s",
      1,
      "A valid shop UUID for the portal session being created."
     ],
     [
      "contact_uuid",
      "s",
      0,
      "The UUID of the Contact for whom the portal session is to be created. This can also be set in the portal session itself."
     ],
     [
      "scanner_type",
      "s",
      0,
      "Specify the type of scanner that is being used. Option: 'camera' and 'hand_scanner'. If not set, defaults to 'camera'."
     ],
     [
      "enable_email_identification",
      "b",
      0,
      "Enable the option for contacts to use their email-address as identification. If not set, defaults to false."
     ],
     [
      "enable_registration",
      "b",
      0,
      "Enable the option to register new contacts. If not set, defaults to false."
     ],
     [
      "enable_on_screen_keyboard",
      "b",
      0,
      "Enable the on-screen keyboard. If not set, defaults to false."
     ],
     [
      "camera_service",
      "n",
      0,
      "Select which camera service to use. Options include 1, 2 or 3. Defaults to 3."
     ],
     [
      "facing_mode",
      "s",
      0,
      "MediaTrackConstraints facingMode. Specifies the default camera if applicable. Specify 'user' to use the front camera and 'environment' to use the back camera. D"
     ],
     [
      "primary_identification_method",
      "s",
      0,
      "Start the identification flow with either 'email' or 'identifier'. Defaults to 'identifier'."
     ]
    ]
   },
   "createTopUpPrepaidPortalSession": {
    "k": "mutation",
    "m": "POST",
    "p": "/portal-sessions/top-up-prepaid",
    "d": "A portal session can also specifically be made to top up a contact's prepaid balance. This is done by specifying the `top-up-prepaid` endpoint. All other parameters are the same as when creating a regular portal session.",
    "f": [
     [
      "shop_uuid",
      "s",
      1,
      "A valid shop UUID for the portal session being created."
     ],
     [
      "contact_uuid",
      "s",
      0,
      "The UUID of the Contact for whom the portal session is to be created. This can also be set in the portal session itself."
     ],
     [
      "scanner_type",
      "s",
      0,
      "Specify the type of scanner that is being used. Option: 'camera' and 'hand_scanner'. If not set, defaults to 'camera'."
     ],
     [
      "enable_email_identification",
      "b",
      0,
      "Enable the option for contacts to use their email-address as identification. If not set, defaults to false."
     ],
     [
      "enable_registration",
      "b",
      0,
      "Enable the option to register new contacts. If not set, defaults to false."
     ],
     [
      "enable_on_screen_keyboard",
      "b",
      0,
      "Enable the on-screen keyboard. If not set, defaults to false."
     ],
     [
      "camera_service",
      "n",
      0,
      "Select which camera service to use. Options include 1, 2 or 3. Defaults to 3."
     ],
     [
      "facing_mode",
      "s",
      0,
      "MediaTrackConstraints facingMode. Specifies the default camera if applicable. Specify 'user' to use the front camera and 'environment' to use the back camera. D"
     ],
     [
      "primary_identification_method",
      "s",
      0,
      "Start the identification flow with either 'email' or 'identifier'. Defaults to 'identifier'."
     ]
    ]
   },
   "createVoucherPortalSession": {
    "k": "mutation",
    "m": "POST",
    "p": "/portal-sessions/vouchers",
    "d": "A portal session can also specifically be made for vouchers. This is done by specifying the `vouchers` endpoint. All other parameters are the same as when creating a regular portal session.",
    "f": [
     [
      "shop_uuid",
      "s",
      1,
      "A valid shop UUID for the portal session being created."
     ],
     [
      "contact_uuid",
      "s",
      0,
      "The UUID of the Contact for whom the portal session is to be created. This can also be set in the portal session itself."
     ],
     [
      "scanner_type",
      "s",
      0,
      "Specify the type of scanner that is being used. Option: 'camera' and 'hand_scanner'. If not set, defaults to 'camera'."
     ],
     [
      "enable_email_identification",
      "b",
      0,
      "Enable the option for contacts to use their email-address as identification. If not set, defaults to false."
     ],
     [
      "enable_registration",
      "b",
      0,
      "Enable the option to register new contacts. If not set, defaults to false."
     ],
     [
      "enable_on_screen_keyboard",
      "b",
      0,
      "Enable the on-screen keyboard. If not set, defaults to false."
     ],
     [
      "camera_service",
      "n",
      0,
      "Select which camera service to use. Options include 1, 2 or 3. Defaults to 3."
     ],
     [
      "facing_mode",
      "s",
      0,
      "MediaTrackConstraints facingMode. Specifies the default camera if applicable. Specify 'user' to use the front camera and 'environment' to use the back camera. D"
     ],
     [
      "primary_identification_method",
      "s",
      0,
      "Start the identification flow with either 'email' or 'identifier'. Defaults to 'identifier'."
     ]
    ]
   }
  }
 },
 "posTransactions": {
  "title": "POS Transactions",
  "tools": {
   "createPosTransaction": {
    "k": "mutation",
    "m": "POST",
    "p": "/pos-transactions",
    "d": "Creates a POS Transaction in the Piggy system. You may choose to set a transaction ID and/or a terminal ID.",
    "f": [
     [
      "amount_in_cents",
      "n",
      1,
      "Purchase amount in cents (€10.40 = 1040)"
     ],
     [
      "transaction_id",
      "n",
      0,
      "ID for transaction"
     ],
     [
      "terminal_id",
      "n",
      0,
      "ID of the terminal used for transaction"
     ]
    ]
   },
   "pushPosTransaction": {
    "k": "mutation",
    "m": "POST",
    "p": "/pos-transactions/{pos_transaction_uuid}/push",
    "d": "Send a push to Device after a POS Transaction creation, so a Credit Reception may be created using the Device.",
    "f": []
   }
  }
 },
 "prepaidTransactions": {
  "title": "Prepaid Transactions",
  "tools": {
   "createPrepaidTransaction": {
    "k": "mutation",
    "m": "POST",
    "p": "/prepaid-transactions",
    "d": "This API call generates a Prepaid Transaction for a specified Contact. Necessary parameters include either the Contact's UUID or their unique identifier value, the amount in cents for the transaction, and the Shop UUID where the transaction is occurring. Using this method ensures and accurate and up",
    "f": [
     [
      "contact_uuid",
      "s",
      0,
      "The UUID of the Contact you want to create the Prepaid Transaction for. Required without contact_identifier_value."
     ],
     [
      "contact_identifier_value",
      "s",
      0,
      "The Contact Identifier used to conduct the transaction. Required without contact_uuid."
     ],
     [
      "amount_in_cents",
      "n",
      1,
      "The amount for the transaction, supply a round number in cents."
     ],
     [
      "shop_uuid",
      "s",
      1,
      "The UUID of the Shop where the transaction takes place."
     ]
    ]
   },
   "listPrepaidTransactions": {
    "k": "query",
    "m": "GET",
    "p": "/prepaid-transactions",
    "d": "Returns a paginated list of Prepaid Transactions, which can be filtered either by Contact or Shop.",
    "f": [
     [
      "contact_uuid",
      "s",
      0,
      "The Contact's UUID for whom the Prepaid Transactions are to be retrieved."
     ],
     [
      "shop_uuid",
      "s",
      0,
      "The Shop's UUID for which the Prepaid Transactions are to be retrieved."
     ],
     [
      "limit",
      "s",
      0,
      "Limit of Transactions to be retrieved (max: 30, default: 10)."
     ],
     [
      "page",
      "s",
      0,
      "Page of Transactions to retrieve (default: 1)."
     ]
    ]
   },
   "reversePrepaidTransaction": {
    "k": "mutation",
    "m": "POST",
    "p": "/prepaid-transactions/{prepaid_transaction_uuid}/reverse",
    "d": "At times, an initial Prepaid Transaction needs to be reversed, because of a refund for instance. This will create a new Prepaid Transaction with the same data as initially used, but for the negative amount issued.",
    "f": []
   }
  }
 },
 "products": {
  "title": "Products",
  "tools": {
   "listProducts": {
    "k": "query",
    "m": "GET",
    "p": "/products",
    "d": "Lists all Products in the Leat system.",
    "f": [
     [
      "limit",
      "n",
      0,
      "The maximum number of Products to return (max 100)"
     ],
     [
      "page",
      "n",
      0,
      "The page number to return"
     ]
    ]
   },
   "createProduct": {
    "k": "mutation",
    "m": "POST",
    "p": "/products",
    "d": "Creates a new Product in the Leat system and returns the Product entity.",
    "f": [
     [
      "external_identifier",
      "s",
      1,
      "A unique identifier from your system"
     ],
     [
      "name",
      "s",
      1,
      "The name of the Product"
     ],
     [
      "description",
      "s",
      0,
      "The description of the Product"
     ],
     [
      "categories",
      "j",
      0,
      "List of Categories that the product belongs to"
     ]
    ]
   },
   "batchCreateProducts": {
    "k": "mutation",
    "m": "POST",
    "p": "/products/batch",
    "d": "Creates a batch of Products in the Leat system. Accepts up to 100 Products per request. The maximum allowed payload size is 1MB.",
    "f": [
     [
      "products",
      "j",
      1,
      "List of Products"
     ]
    ]
   },
   "getProduct": {
    "k": "query",
    "m": "GET",
    "p": "/products/{uuid}",
    "d": "Get a specific Product in the Leat system.",
    "f": []
   },
   "findProduct": {
    "k": "query",
    "m": "GET",
    "p": "/products/find",
    "d": "Use the `external_identifier` to find a Product.",
    "f": [
     [
      "external_identifier",
      "s",
      1,
      "A unique identifier from your system"
     ]
    ]
   },
   "findOrCreateProduct": {
    "k": "mutation",
    "m": "POST",
    "p": "/products/find-or-create",
    "d": "Finds an existing Product or creates a new Product in the Leat system and returns the Product entity.",
    "f": [
     [
      "external_identifier",
      "s",
      1,
      "A unique identifier from your system"
     ],
     [
      "name",
      "s",
      0,
      "The name of the Product"
     ],
     [
      "description",
      "s",
      0,
      "The description of the Product"
     ],
     [
      "categories",
      "j",
      0,
      "List of Categories that the product belongs to"
     ]
    ]
   },
   "updateProduct": {
    "k": "mutation",
    "m": "PUT",
    "p": "/products/{uuid}",
    "d": "Updates a Product in the Leat system and returns the updated Product entity.",
    "f": [
     [
      "external_identifier",
      "s",
      0,
      "A unique identifier from your system"
     ],
     [
      "name",
      "s",
      0,
      "The name of the Product"
     ],
     [
      "description",
      "s",
      0,
      "The description of the Product"
     ],
     [
      "categories",
      "j",
      0,
      "List of Categories that the product belongs to"
     ]
    ]
   },
   "deleteProduct": {
    "k": "mutation",
    "m": "DELETE",
    "p": "/products/{uuid}",
    "d": "Delete a specific Product in the Leat system.",
    "f": []
   }
  }
 },
 "promotionAttributes": {
  "title": "Promotion Attributes",
  "tools": {
   "listPromotionAttributes": {
    "k": "query",
    "m": "GET",
    "p": "/promotion-attributes",
    "d": "Retrieve a list of all Promotion Attributes associated with your Account.",
    "f": []
   },
   "createPromotionAttribute": {
    "k": "mutation",
    "m": "POST",
    "p": "/promotion-attributes",
    "d": "Globally create a Promotion Attribute for the Account in question, customizable to your wishes.",
    "f": [
     [
      "name",
      "s",
      1,
      "The (internal) name for the attribute."
     ],
     [
      "label",
      "s",
      1,
      "The label for the attribute."
     ],
     [
      "type",
      "s",
      1,
      "Type of attribute (options: url,"
     ],
     [
      "description",
      "s",
      0,
      "The description of the attribute."
     ],
     [
      "options",
      "j",
      0,
      "Applicable for (multi)selects only. Array consisting of label and value objects."
     ]
    ]
   }
  }
 },
 "promotions": {
  "title": "Promotions",
  "tools": {
   "listPromotions": {
    "k": "query",
    "m": "GET",
    "p": "/promotions",
    "d": "Retrieves a list of all Promotions linked to an Account, providing detailed insights into each promotion's attributes such as name, description, voucher limits, and expiration periods.",
    "f": []
   },
   "getPromotion": {
    "k": "query",
    "m": "GET",
    "p": "/promotions/{promotion_uuid}",
    "d": "Retrieve a specific Promotion by specifying its UUID.",
    "f": []
   }
  }
 },
 "referrals": {
  "title": "Referrals",
  "tools": {
   "listReferrals": {
    "k": "query",
    "m": "GET",
    "p": "/referrals",
    "d": "Retrieve a list of Referrals from your referral program.",
    "f": [
     [
      "referring_contact_uuid",
      "s",
      0,
      "The uuid of the Contact who has referred another Contact."
     ],
     [
      "status",
      "s",
      0,
      "The Referral status can be one of the following: pending, completed, or failed, indicating the current state of the Referral."
     ],
     [
      "limit",
      "n",
      0,
      "Maximum number of items to retrieve. Default value = 30, limit max = 100."
     ],
     [
      "page",
      "n",
      0,
      "Page within list to retrieve"
     ]
    ]
   },
   "getReferralProgramSettings": {
    "k": "query",
    "m": "GET",
    "p": "/referrals/settings",
    "d": "Retrieve a Referral program's settings, like the incentive for both the *referring* contact and the *referred* contact.",
    "f": []
   }
  }
 },
 "reviews": {
  "title": "Reviews",
  "tools": {
   "listReviews": {
    "k": "query",
    "m": "GET",
    "p": "/reviews",
    "d": "Retrieve a paginated list of Reviews, ordered by most recent.",
    "f": [
     [
      "limit",
      "n",
      0,
      "Number of Reviews to retrieve (min: 0, max: 500, default: 30)"
     ],
     [
      "page",
      "n",
      0,
      "Number of page to retrieve (default: 1)"
     ],
     [
      "contact",
      "j",
      0,
      "Only return Reviews written by this Contact"
     ],
     [
      "business_profile",
      "j",
      0,
      "Only return Reviews that came in through this Business Profile"
     ],
     [
      "product",
      "j",
      0,
      "Only return Reviews about this product"
     ],
     [
      "type",
      "s",
      0,
      "Filter by what was reviewed"
     ]
    ]
   },
   "findReview": {
    "k": "query",
    "m": "GET",
    "p": "/reviews/find",
    "d": "Use the `external_identifier` to find a Review.",
    "f": [
     [
      "external_identifier",
      "s",
      1,
      "The Review's identifier in the source system"
     ]
    ]
   },
   "createReview": {
    "k": "mutation",
    "m": "POST",
    "p": "/reviews",
    "d": "Create a new Review in the Leat system and returns the Review entity.",
    "f": [
     [
      "contact",
      "j",
      1,
      "Contact who wrote the Review"
     ],
     [
      "business_profile",
      "j",
      0,
      "Business Profile the Review came in through"
     ],
     [
      "type",
      "s",
      1,
      "What was reviewed"
     ],
     [
      "rating",
      "n",
      1,
      "The rating given, from 1 to 5"
     ],
     [
      "external_identifier",
      "s",
      1,
      "The Review's identifier in the source system. Unique per account, so replaying the same review is rejected instead of duplicated (max 255 characters)"
     ],
     [
      "title",
      "s",
      0,
      "The title of the Review (max 255 characters)"
     ],
     [
      "body",
      "s",
      0,
      "The text of the Review"
     ],
     [
      "product",
      "j",
      0,
      "The product the Review is about. Prohibited when the type is COMPANY"
     ],
     [
      "submitted_at",
      "s",
      1,
      "The date and time the Review was submitted in the source system (in ISO 8601 format)"
     ],
     [
      "source",
      "s",
      0,
      "Source from where the Review was created (max 255 characters)"
     ],
     [
      "custom_attributes",
      "j",
      0,
      "Custom attribute values to store on the Review"
     ]
    ]
   },
   "updateReview": {
    "k": "mutation",
    "m": "PUT",
    "p": "/reviews/{external_identifier}",
    "d": "Updates the Review with the given external identifier. Only its rating, title, body and custom attributes can change. Everything else is immutable: the Contact, the Business Profile, the type, the product, the external identifier and the submitted date cannot be changed.",
    "f": [
     [
      "rating",
      "n",
      0,
      "The rating given, from 1 to 5"
     ],
     [
      "title",
      "s",
      0,
      "The title of the Review (max 255 characters)"
     ],
     [
      "body",
      "s",
      0,
      "The text of the Review"
     ],
     [
      "custom_attributes",
      "j",
      0,
      "Custom attribute values to store on the Review"
     ]
    ]
   }
  }
 },
 "rewardReceptions": {
  "title": "Reward Receptions",
  "tools": {
   "createRewardReception": {
    "k": "mutation",
    "m": "POST",
    "p": "/reward-receptions",
    "d": "Create a Reward Reception by specifying the Contact's UUID and the desired Reward's UUID. It enables a Contact to claim a Reward. Our backend manages various scenarios, like insufficient credits, stock limitations, Reward limits, and inactivity of Rewards, ensuring a correct Reward claiming process.",
    "f": [
     [
      "contact_uuid",
      "s",
      1,
      "The UUID of the Contact you want to create the Reward Reception for."
     ],
     [
      "reward_uuid",
      "s",
      1,
      "The Reward's UUID that is related to the reception."
     ],
     [
      "contact_identifier_value",
      "s",
      0,
      "The Contact Identifier used by the Contact."
     ],
     [
      "shop_uuid",
      "s",
      1,
      "The UUID of the Shop you want to create the Reward Reception for."
     ]
    ]
   },
   "reverseRewardReception": {
    "k": "mutation",
    "m": "POST",
    "p": "/reward-receptions/{reward_reception_uuid}/reverse",
    "d": "At times, a Reward redemption needs to be reversed, because of a canceled order for instance. This will create a new Credit Reception with the same data as initially used, to reissue the credits used. The reversed Reward Reception no longer counts towards the Contact's limit on that Reward, so they ",
    "f": []
   }
  }
 },
 "rewards": {
  "title": "Rewards",
  "tools": {
   "listRewards": {
    "k": "query",
    "m": "GET",
    "p": "/rewards",
    "d": "This API endpoint is used to list Rewards available for to be shown in-store or to list Rewards that a specific Contact can claim, with potentially a subsequent Create Reward Reception call when a Contact claims a Reward. The list of Rewards for a particular Contact might differ from the full list o",
    "f": [
     [
      "shop_uuid",
      "s",
      0,
      "The Shop UUID for which the Rewards you want to retrieve."
     ],
     [
      "contact_uuid",
      "s",
      0,
      "List the claimable rewards associated with the Contact by supplying their UUID."
     ]
    ]
   },
   "getReward": {
    "k": "query",
    "m": "GET",
    "p": "/rewards/{reward_uuid}",
    "d": "Retrieve a specific Reward by specifying its UUID.",
    "f": []
   },
   "updateReward": {
    "k": "mutation",
    "m": "PUT",
    "p": "/rewards/{reward_uuid}",
    "d": "You can modify both global values and custom Reward Attributes. If you need to update a custom attribute—one that you've created specifically for a Reward—simply include it in the parameters, just as you would with the title, description, and required credits.",
    "f": [
     [
      "title",
      "s",
      0,
      "A new title for the Reward."
     ],
     [
      "description",
      "s",
      0,
      "A new description for the Reward."
     ],
     [
      "required_credits",
      "n",
      0,
      "Number of credits required to claim this Reward."
     ]
    ]
   }
  }
 },
 "shiftTeams": {
  "title": "Shift Teams",
  "tools": {
   "listTeams": {
    "k": "query",
    "m": "GET",
    "p": "/shift-teams",
    "d": "Returns a paginated list of Teams for Shifts.",
    "f": [
     [
      "page",
      "n",
      0,
      "The page number."
     ],
     [
      "limit",
      "n",
      0,
      "The maximum number of Teams to retrieve (default: 30, max: 100)."
     ]
    ]
   },
   "createTeam": {
    "k": "mutation",
    "m": "POST",
    "p": "/shift-teams",
    "d": "Creates a new Team for Shifts.",
    "f": [
     [
      "name",
      "s",
      1,
      "The Name of the Team you want to create."
     ]
    ]
   },
   "findTeamByName": {
    "k": "query",
    "m": "GET",
    "p": "/shift-teams/find",
    "d": "Returns all relevant information for a Team.",
    "f": [
     [
      "name",
      "s",
      1,
      "The Name of this Team."
     ]
    ]
   },
   "getTeam": {
    "k": "query",
    "m": "GET",
    "p": "/shift-teams/{uuid}",
    "d": "Retrieve a Team using its UUID.",
    "f": []
   },
   "updateTeam": {
    "k": "mutation",
    "m": "PUT",
    "p": "/shift-teams/{uuid}",
    "d": "Updates the attributes of a Team.",
    "f": [
     [
      "name",
      "s",
      1,
      "The Name for this Team."
     ]
    ]
   }
  }
 },
 "shiftTypes": {
  "title": "Shift Types",
  "tools": {
   "listShiftTypes": {
    "k": "query",
    "m": "GET",
    "p": "/shift-types",
    "d": "Returns a paginated list of Shift Types.",
    "f": [
     [
      "page",
      "n",
      0,
      "The page number."
     ],
     [
      "limit",
      "n",
      0,
      "The maximum number of Shift Types to retrieve (default: 30, max: 100)."
     ]
    ]
   },
   "createShiftType": {
    "k": "mutation",
    "m": "POST",
    "p": "/shift-types",
    "d": "Creates a new Shift Type.",
    "f": [
     [
      "name",
      "s",
      1,
      "The Name of the Shift Type you want to create."
     ],
     [
      "description",
      "s",
      1,
      "The Description of the Shift Type you want to create."
     ]
    ]
   },
   "findShiftTypeByName": {
    "k": "query",
    "m": "GET",
    "p": "/shift-types/find",
    "d": "Returns all relevant information for a Shift Type.",
    "f": [
     [
      "name",
      "s",
      1,
      "The Name of this Shift Type."
     ]
    ]
   },
   "getShiftType": {
    "k": "query",
    "m": "GET",
    "p": "/shift-types/{uuid}",
    "d": "Retrieve a Shift Type using its UUID.",
    "f": []
   },
   "updateShiftType": {
    "k": "mutation",
    "m": "PUT",
    "p": "/shift-types/{uuid}",
    "d": "Updates the attributes of a Shift Type.",
    "f": [
     [
      "name",
      "s",
      1,
      "The Name for this Shift Type."
     ],
     [
      "description",
      "s",
      1,
      "The Description for this Shift Type."
     ]
    ]
   }
  }
 },
 "shifts": {
  "title": "Shifts",
  "tools": {
   "listShifts": {
    "k": "query",
    "m": "GET",
    "p": "/shifts",
    "d": "Returns a paginated list of Shifts.",
    "f": [
     [
      "shop_uuid",
      "s",
      1,
      "The UUID of the Shop you want to create the Shift for."
     ],
     [
      "status",
      "s",
      1,
      "The Status for this Shift."
     ],
     [
      "team_uuid",
      "s",
      0,
      "The UUID of the Team you want to create the Shift for."
     ],
     [
      "page",
      "n",
      0,
      "The page number."
     ],
     [
      "limit",
      "n",
      0,
      "The maximum number of Shifts to retrieve (default: 30, max: 100)."
     ]
    ]
   },
   "createShift": {
    "k": "mutation",
    "m": "POST",
    "p": "/shifts",
    "d": "Creates a new Shift.",
    "f": [
     [
      "contact_uuid",
      "s",
      1,
      "The UUID of the Contact you want to create the Shift for."
     ],
     [
      "shop_uuid",
      "s",
      1,
      "The UUID of the Shop you want to create the Shift for."
     ],
     [
      "started_at",
      "s",
      1,
      "The start date and time of the Shift in ISO 8601 format."
     ],
     [
      "ended_at",
      "s",
      1,
      "The end date and time of the Shift in ISO 8601 format."
     ],
     [
      "status",
      "s",
      1,
      "The Status for this Shift."
     ],
     [
      "external_id",
      "s",
      0,
      "An external identifier for the Shift."
     ],
     [
      "team_uuid",
      "s",
      0,
      "The UUID of the Team you want to create the Shift for."
     ],
     [
      "shift_type_uuid",
      "s",
      0,
      "The UUID of the Shift Team you want to create the Shift for."
     ],
     [
      "break_in_minutes",
      "n",
      0,
      "The break in a minutes for this Shift."
     ]
    ]
   },
   "findShiftByExternalId": {
    "k": "query",
    "m": "GET",
    "p": "/shifts/find",
    "d": "Returns all relevant information for a Shift.",
    "f": [
     [
      "external_id",
      "s",
      1,
      "The external identifier for this Shift."
     ]
    ]
   },
   "getShift": {
    "k": "query",
    "m": "GET",
    "p": "/shifts/{uuid}",
    "d": "Retrieve a Shift using its UUID.",
    "f": []
   },
   "updateShift": {
    "k": "mutation",
    "m": "PUT",
    "p": "/shifts/{uuid}",
    "d": "Updates the attributes of a Shift. Shop and contact cannot be updated.",
    "f": [
     [
      "contact_uuid",
      "s",
      0,
      "The UUID of the Contact."
     ],
     [
      "team_uuid",
      "s",
      0,
      "The UUID of the Team."
     ],
     [
      "started_at",
      "s",
      1,
      "The start date and time of the Shift in ISO 8601 format."
     ],
     [
      "ended_at",
      "s",
      1,
      "The end date and time of the Shift in ISO 8601 format."
     ],
     [
      "status",
      "s",
      1,
      "The Status for this Shift."
     ],
     [
      "break_in_minutes",
      "n",
      0,
      "The break in a minutes for this Shift."
     ]
    ]
   },
   "deleteShift": {
    "k": "mutation",
    "m": "DELETE",
    "p": "/shifts/{shift_uuid}",
    "d": "Deletes an existing Shift.",
    "f": []
   }
  }
 },
 "shops": {
  "title": "Shops",
  "tools": {
   "listShops": {
    "k": "query",
    "m": "GET",
    "p": "/shops",
    "d": "Retrieve all Shops belonging to an Account. In case this call is used for a Loyalty flow, then please check for a Loyalty program. None of the Loyalty API calls where a Shop ID is required will work if the Shop used is not linked to a Loyalty Program.",
    "f": []
   },
   "getShop": {
    "k": "query",
    "m": "GET",
    "p": "/shops/{shop_uuid}",
    "d": "Retrieve information of your Shop. This call is useful for getting insights into individual shop settings and attributes.",
    "f": []
   }
  }
 },
 "subscriptionTypes": {
  "title": "Subscription Types",
  "tools": {
   "listSubscriptionTypes": {
    "k": "query",
    "m": "GET",
    "p": "/subscription-types",
    "d": "Retrieves a list of all Subscription Types linked to an Account. Useful for getting an overview of the various communication categories and their enrollment strategies.",
    "f": []
   }
  }
 },
 "tiers": {
  "title": "Tiers",
  "tools": {
   "listTiers": {
    "k": "query",
    "m": "GET",
    "p": "/tiers",
    "d": "This API call fetches a list of all Tiers available in your Loyalty Program. It's a handy way to view the different status levels that Contacts can achieve.",
    "f": []
   }
  }
 },
 "units": {
  "title": "Units",
  "tools": {
   "listUnits": {
    "k": "query",
    "m": "GET",
    "p": "/units",
    "d": "Lists all Units for an account. These can subsequently be used to create Credit Receptions, where the unit\\_name parameter needs to be supplied if the default unit purchase\\_amount is not wished to be used.",
    "f": []
   },
   "createUnit": {
    "k": "mutation",
    "m": "POST",
    "p": "/units",
    "d": "Create a new Unit for your Account with this API call. By default, a Unit always exists for an Account. If `is_default` is set to `true`, the newly created Unit will be the default Unit for the Account, meaning this will be used for Credit Receptions if Unit is not specified. For integrating purpose",
    "f": [
     [
      "name",
      "s",
      1,
      "Internal and unique value for the Unit. Cannot be altered after creation."
     ],
     [
      "label",
      "s",
      1,
      "Label of the Unit, to be outputted to end users."
     ],
     [
      "is_default",
      "b",
      0,
      "Specifies whether this Unit is to be the Account's default. Accepts: true, false, 1, 0, yes, no. Defaults to false if not set."
     ],
     [
      "prefix",
      "s",
      0,
      "The prefix of the Unit, this will be outputted to end users. Defaults to the first character of the name, if not set."
     ]
    ]
   }
  }
 },
 "visits": {
  "title": "Visits",
  "tools": {
   "listVisit": {
    "k": "query",
    "m": "GET",
    "p": "/visits",
    "d": "List Visit",
    "f": [
     [
      "limit",
      "n",
      0,
      "Number of Visits to retrieve (min: 0, max: 500, default: 30)"
     ],
     [
      "page",
      "n",
      0,
      "Number of page to retrieve (default: 1)"
     ],
     [
      "contact_uuid",
      "s",
      0,
      "A contact's UUID to filter the Visits by"
     ]
    ]
   },
   "showVisit": {
    "k": "query",
    "m": "GET",
    "p": "/visits/{uuid}",
    "d": "Show Visit",
    "f": []
   },
   "createVisit": {
    "k": "mutation",
    "m": "POST",
    "p": "/visits",
    "d": "Create a new Visit in the Leat system and returns the Visit entity.",
    "f": []
   },
   "updateVisit": {
    "k": "mutation",
    "m": "PUT",
    "p": "/visits/{uuid}",
    "d": "Updates the attributes of a Visit. Shop and contact cannot be updated.",
    "f": []
   }
  }
 },
 "vouchers": {
  "title": "Vouchers",
  "tools": {
   "listVouchers": {
    "k": "query",
    "m": "GET",
    "p": "/vouchers",
    "d": "Retrieve a paginated list of all Vouchers for an Account, with the option to filter by Promotion, Contact, Voucher status, and more.",
    "f": [
     [
      "promotion_uuid",
      "s",
      0,
      "UUID of the Promotion for which the Vouchers are to be retrieved."
     ],
     [
      "contact_uuid",
      "s",
      0,
      "UUID of the Contact for which the Vouchers are to be retrieved."
     ],
     [
      "status",
      "s",
      0,
      "Status of the Vouchers, options: ACTIVE, REDEEMED, EXPIRED, DEACTIVATED, INACTIVE and LOCKED."
     ],
     [
      "limit",
      "n",
      0,
      "Number of Vouchers to retrieve (min: 0, max: 500, default: 30)."
     ],
     [
      "page",
      "n",
      0,
      "Page within list to retrieve."
     ]
    ]
   },
   "createVoucher": {
    "k": "mutation",
    "m": "POST",
    "p": "/vouchers",
    "d": "Creates a new Voucher for a Promotion. Only the `promotion_uuid` is required. A specific code can be given to be used, or else a code will be generated by the system. Similarly, if no `activation_date` and/or `expiration_date` is given, the system will calculate those dates by the validity rules set",
    "f": [
     [
      "promotion_uuid",
      "s",
      1,
      "UUID of the Promotion for which the Voucher is to be created."
     ],
     [
      "code",
      "s",
      0,
      "The unique code of the Voucher which will serve as its identifier. If not given, a random code will be automatically generated."
     ],
     [
      "contact_uuid",
      "s",
      0,
      "The Contact's UUID to be linked to this Voucher. If not given, the recipient will need to identify themselves to use the Voucher."
     ],
     [
      "expiration_date",
      "s",
      0,
      "The Vouchers expiration date in ISO 8601 format. Dates are stored in UTC time. If not given, Promotion validity rules apply."
     ],
     [
      "activation_date",
      "s",
      0,
      "The Vouchers activation date in ISO 8601 format. Dates are stored in UTC time. If not given, Promotion validity rules apply."
     ],
     [
      "total_redemptions_allowed",
      "n",
      0,
      "Number of times this specific Voucher can be redeemed. If not given, Promotion type and redemptions per voucher will apply."
     ],
     [
      "custom_attributes",
      "j",
      0,
      "Additional Custom Attributes for the created Voucher."
     ]
    ]
   },
   "createBatchOfVouchers": {
    "k": "mutation",
    "m": "POST",
    "p": "/vouchers/batch",
    "d": "Create multiple Vouchers at once for a specific Promotion. Specify the quantity and, optionally, a Contact UUID, `activation_date` and/or `expiration_date`. The system will generate a batch of Vouchers according to the Promotion's rules.",
    "f": [
     [
      "promotion_uuid",
      "s",
      1,
      "UUID of the Promotion for which the Vouchers are to be created."
     ],
     [
      "quantity",
      "n",
      1,
      "The number of Vouchers you want to generate (min: 1, max: 500).\""
     ],
     [
      "contact_uuid",
      "s",
      0,
      "The Contact's UUID to be linked to the batch of Vouchers."
     ],
     [
      "expiration_date",
      "s",
      0,
      "The expiration date for the batch of Vouchers in ISO 8601 format. Dates are stored in UTC time. If not given, promotion validity rules apply."
     ],
     [
      "activation_date",
      "s",
      0,
      "The activation date for the batch of Vouchers in ISO 8601 format. Dates are stored in UTC time. If not given, promotion validity rules apply."
     ],
     [
      "custom_attributes",
      "j",
      0,
      "Additional Custom Attributes for the Vouchers."
     ]
    ]
   },
   "findVoucher": {
    "k": "query",
    "m": "GET",
    "p": "/vouchers/find",
    "d": "Finds a Voucher by its unique code. This call will help you with identifying individual Vouchers and viewing their specifications like whether the Voucher is redeemed or not or when it expires.",
    "f": [
     [
      "code",
      "s",
      1,
      "The unique code of the Voucher, which serves as its identifier."
     ]
    ]
   },
   "updateVoucher": {
    "k": "mutation",
    "m": "PUT",
    "p": "/vouchers/{voucher_uuid}",
    "d": "Update the status of a Voucher. This endpoint allows you to activate or deactivate a Voucher, changing its usability status as needed.",
    "f": [
     [
      "status",
      "s",
      1,
      "Can be either ACTIVE or DEACTIVATED."
     ],
     [
      "custom_attributes",
      "j",
      0,
      "Additional Custom Attributes as a key-value array."
     ],
     [
      "expiration_date",
      "s",
      0,
      "New expiration date for the Voucher. Note: this can only be done for inactive and active Vouchers."
     ]
    ]
   },
   "checkVoucherValidity": {
    "k": "query",
    "m": "POST",
    "p": "/vouchers/{voucher_uuid}/validate",
    "d": "Validates if the Voucher can be redeemed at this point by the Contact.",
    "f": [
     [
      "contact_uuid",
      "s",
      0,
      "The UUID of the Contact who would redeem the Voucher"
     ],
     [
      "shop_uuid",
      "s",
      1,
      "The UUID of the Shop where the Voucher would be redeemed"
     ]
    ]
   },
   "redeemVoucher": {
    "k": "mutation",
    "m": "POST",
    "p": "/vouchers/redeem",
    "d": "Redeems a Voucher for a Contact. If the Voucher is already linked to a Contact – because it was sent in an automated email for instance – the call only requires the Voucher's code for redeeming it. If the Voucher isn't yet linked to a Contact – because a series of Vouchers were printed as flyers to ",
    "f": [
     [
      "code",
      "s",
      1,
      "The unique code of the Voucher which will serve as its identifier"
     ],
     [
      "shop_uuid",
      "s",
      1,
      "UUID of the Shop through which the voucher is redeemed."
     ],
     [
      "contact_uuid",
      "s",
      0,
      "Not required if Contact is already assigned to Voucher, but could serve as identity check if given nevertheless. In case no Contact is assigned to the Voucher, "
     ],
     [
      "release_key",
      "s",
      0,
      "The release key that was returned when locking the voucher (Only applicable if locking is used)."
     ]
    ]
   },
   "lockVoucherOptional": {
    "k": "mutation",
    "m": "POST",
    "p": "/vouchers/{voucher_uuid}/lock",
    "d": "Using the lock functionality, you can make sure that a Voucher cannot be used by another process at the same time as well as return the Voucher to its ACTIVE state when a failure occurs on your side (using the Release call). Using the locking method, you can make sure the Voucher only reaches a REDE",
    "f": []
   },
   "releaseVoucherOptional": {
    "k": "mutation",
    "m": "POST",
    "p": "/vouchers/{voucher_uuid}/release",
    "d": "When using Voucher locking, there is also the process of releasing the Voucher. Using the call you can release the Voucher from its lock using the release key that was retrieved during the initial lock.",
    "f": [
     [
      "release_key",
      "s",
      1,
      "The release key of the Voucher that was given upon locking it."
     ]
    ]
   },
   "reverseVoucherRedemption": {
    "k": "mutation",
    "m": "POST",
    "p": "/vouchers/{uuid}/reverse",
    "d": "Reverses a Voucher Redemption.",
    "f": []
   },
   "multiRedeemVoucher": {
    "k": "mutation",
    "m": "POST",
    "p": "/vouchers/multi-redeem",
    "d": "Redeems a Voucher multiple times at once for a Contact. If the Voucher isn't yet linked to a Contact – because a series of Vouchers were printed as flyers to be given away for instance – then the `contact_uuid`is required as well as the Voucher code. Please note that when using locked Vouchers, you ",
    "f": [
     [
      "code",
      "s",
      1,
      "The unique code of the Voucher which will serve as its identifier"
     ],
     [
      "number_of_times",
      "n",
      1,
      "Number of times the Voucher is to be redeemed (min: 1, max: 50). Note: Only multi-use Vouchers can be used here."
     ],
     [
      "contact_uuid",
      "s",
      0,
      "Not required if Contact is already assigned to Voucher, but could serve as identity check if given nevertheless. In case no Contact is assigned to the Voucher, "
     ],
     [
      "shop_uuid",
      "s",
      1,
      "The Shop or Business Profile where the Voucher is redeemed"
     ],
     [
      "release_key",
      "s",
      0,
      "The release key that was returned when locking the voucher (Only applicable if locking is used)."
     ]
    ]
   }
  }
 },
 "webhooks": {
  "title": "Webhooks",
  "tools": {
   "listWebhookSubscriptions": {
    "k": "query",
    "m": "GET",
    "p": "/webhook-subscriptions",
    "d": "Lists an Account's current Webhook Subscriptions.",
    "f": [
     [
      "event_type",
      "s",
      0,
      "Only retrieve Webhook Subscription of a specific event type (options: see available webhook event types)."
     ],
     [
      "status",
      "s",
      0,
      "Only retrieve Webhook Subscription of a specific status (options: ACTIVE, INACTIVE)."
     ]
    ]
   },
   "createWebhookSubscription": {
    "k": "mutation",
    "m": "POST",
    "p": "/webhook-subscriptions",
    "d": "Subscribes to a specific Webhook event. Pass `version` to choose the envelope your endpoint receives — see Webhook versions. Leave it out and you get V1, so pass `V2` for anything new. An integration has one subscription per event type. When the token belongs to a private app or another integration ",
    "f": [
     [
      "name",
      "s",
      1,
      "A name given to the subscription for internal purposes."
     ],
     [
      "event_type",
      "s",
      1,
      "The event type to listen to, can only choose from available event types."
     ],
     [
      "url",
      "s",
      1,
      "The endpoint to which webhook data is to be sent."
     ],
     [
      "secret",
      "s",
      0,
      "The secret used to sign the Signature header. Defaults to the account secret."
     ],
     [
      "version",
      "s",
      0,
      "The envelope your endpoint is sent: V2 for a batch of events, V1 for a single one. Defaults to V1. V2 is the version we advise building on."
     ]
    ]
   },
   "getWebhookSubscription": {
    "k": "query",
    "m": "GET",
    "p": "/webhook-subscriptions/{webhook_subscription_uuid}",
    "d": "Retrieve a specific Webhook Subscription by specifying its UUID.",
    "f": []
   },
   "updateWebhookSubscription": {
    "k": "mutation",
    "m": "PUT",
    "p": "/webhook-subscriptions/{webhook_subscription_uuid}",
    "d": "Updates an existing Webhook Subscription. The subscription's `event_type`and `secret`cannot be altered after creation.",
    "f": [
     [
      "name",
      "s",
      0,
      "A name given to the subscription for internal purposes."
     ],
     [
      "url",
      "s",
      0,
      "The endpoint to which webhook data is to be sent."
     ],
     [
      "status",
      "s",
      0,
      "The subscription's status (options: ACTIVE, INACTIVE)."
     ],
     [
      "attributes",
      "j",
      0,
      "Required if event_type is contact_updated, even when you only change the status: an array of one or more contact attribute names that exist in the account. It i"
     ]
    ]
   },
   "deleteWebhookSubscription": {
    "k": "mutation",
    "m": "DELETE",
    "p": "/webhook-subscriptions/{webhook_subscription_uuid}",
    "d": "Removes an existing Webhook Subscription.",
    "f": []
   }
  }
 }
};
