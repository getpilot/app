export interface ToolInfo {
  name: string;
  displayName: string;
  category: string;
  description: string;
  inputFields?: Array<{
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }>;
  outputFields?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
}

export const AI_TOOLS: ToolInfo[] = [
  // user profile Tools
  {
    name: "getUserProfile",
    displayName: "Get User Profile",
    category: "User Profile",
    description:
      "Get the user's profile information including name, email, gender, use case, business type, and main offering",
    outputFields: [
      { name: "name", type: "string", description: "User's name" },
      { name: "email", type: "string", description: "User's email" },
      { name: "gender", type: "string", description: "User's gender" },
      { name: "use_case", type: "array", description: "User's use cases" },
      {
        name: "business_type",
        type: "string",
        description: "User's business type",
      },
      {
        name: "main_offering",
        type: "string",
        description: "User's main offering",
      },
    ],
  },
  {
    name: "updateUserProfile",
    displayName: "Update User Profile",
    category: "User Profile",
    description: "Update the user's profile information",
    inputFields: [
      {
        name: "name",
        type: "string",
        description: "User's name",
        required: false,
      },
      {
        name: "gender",
        type: "string",
        description: "User's gender",
        required: false,
      },
      {
        name: "use_case",
        type: "array",
        description: "User's use cases",
        required: false,
      },
      {
        name: "business_type",
        type: "string",
        description: "User's business type",
        required: false,
      },
      {
        name: "main_offering",
        type: "string",
        description: "User's main offering",
        required: false,
      },
    ],
  },

  // offers tools
  {
    name: "listUserOffers",
    displayName: "List User Offers",
    category: "Offers",
    description: "List all user offers",
    outputFields: [
      { name: "offers", type: "array", description: "Array of user offers" },
    ],
  },
  {
    name: "createUserOffer",
    displayName: "Create User Offer",
    category: "Offers",
    description: "Create a new user offer",
    inputFields: [
      {
        name: "name",
        type: "string",
        description: "The name of the offer",
        required: true,
      },
      {
        name: "content",
        type: "string",
        description: "The content/description of the offer",
        required: true,
      },
      {
        name: "value",
        type: "number",
        description: "The value/price of the offer",
        required: false,
      },
    ],
  },
  {
    name: "updateUserOffer",
    displayName: "Update User Offer",
    category: "Offers",
    description: "Update an existing user offer",
    inputFields: [
      {
        name: "offerId",
        type: "string",
        description: "The ID of the offer to update",
        required: true,
      },
      {
        name: "name",
        type: "string",
        description: "The name of the offer",
        required: false,
      },
      {
        name: "content",
        type: "string",
        description: "The content/description of the offer",
        required: false,
      },
      {
        name: "value",
        type: "number",
        description: "The value/price of the offer",
        required: false,
      },
    ],
  },
  {
    name: "deleteUserOffer",
    displayName: "Delete User Offer",
    category: "Offers",
    description: "Delete a user offer",
    inputFields: [
      {
        name: "offerId",
        type: "string",
        description: "The ID of the offer to delete",
        required: true,
      },
    ],
  },
  {
    name: "listUserOfferLinks",
    displayName: "List User Offer Links",
    category: "Offers",
    description: "List all user offer links",
    outputFields: [
      {
        name: "links",
        type: "array",
        description: "Array of user offer links",
      },
    ],
  },
  {
    name: "addUserOfferLink",
    displayName: "Add User Offer Link",
    category: "Offers",
    description: "Add a new user offer link",
    inputFields: [
      {
        name: "type",
        type: "enum",
        description: "The type of link (primary, calendar, notion, website)",
        required: true,
      },
      {
        name: "url",
        type: "string",
        description: "The URL of the link",
        required: true,
      },
    ],
  },

  // tone & training tools
  {
    name: "getToneProfile",
    displayName: "Get Tone Profile",
    category: "Tone & Training",
    description:
      "Get the user's tone profile including tone type, sample text, and files",
    outputFields: [
      {
        name: "toneType",
        type: "string",
        description: "The tone type (friendly, direct, like_me, custom)",
      },
      {
        name: "sampleText",
        type: "array",
        description: "Array of sample texts",
      },
      {
        name: "sampleFiles",
        type: "array",
        description: "Array of sample files",
      },
      {
        name: "trainedEmbeddingId",
        type: "string",
        description: "Trained embedding ID",
      },
    ],
  },
  {
    name: "updateToneProfile",
    displayName: "Update Tone Profile",
    category: "Tone & Training",
    description: "Update the user's tone profile",
    inputFields: [
      {
        name: "toneType",
        type: "enum",
        description: "The tone type (friendly, direct, like_me, custom)",
        required: false,
      },
      {
        name: "sampleText",
        type: "array",
        description: "Array of sample texts",
        required: false,
      },
      {
        name: "sampleFiles",
        type: "array",
        description: "Array of sample files",
        required: false,
      },
      {
        name: "trainedEmbeddingId",
        type: "string",
        description: "Trained embedding ID",
        required: false,
      },
    ],
  },
  {
    name: "addToneSample",
    displayName: "Add Tone Sample",
    category: "Tone & Training",
    description: "Add a sample text to the user's tone profile",
    inputFields: [
      {
        name: "text",
        type: "string",
        description: "The sample text to add",
        required: true,
      },
    ],
  },

  // FAQs tools
  {
    name: "listFaqs",
    displayName: "List FAQs",
    category: "FAQs",
    description: "List all user FAQs",
    outputFields: [
      { name: "faqs", type: "array", description: "Array of user FAQs" },
    ],
  },
  {
    name: "addFaq",
    displayName: "Add FAQ",
    category: "FAQs",
    description: "Add a new FAQ",
    inputFields: [
      {
        name: "question",
        type: "string",
        description: "The FAQ question",
        required: true,
      },
      {
        name: "answer",
        type: "string",
        description: "The FAQ answer",
        required: false,
      },
    ],
  },
  {
    name: "updateFaq",
    displayName: "Update FAQ",
    category: "FAQs",
    description: "Update an existing FAQ",
    inputFields: [
      {
        name: "faqId",
        type: "string",
        description: "The ID of the FAQ to update",
        required: true,
      },
      {
        name: "question",
        type: "string",
        description: "The FAQ question",
        required: false,
      },
      {
        name: "answer",
        type: "string",
        description: "The FAQ answer",
        required: false,
      },
    ],
  },
  {
    name: "deleteFaq",
    displayName: "Delete FAQ",
    category: "FAQs",
    description: "Delete an FAQ",
    inputFields: [
      {
        name: "faqId",
        type: "string",
        description: "The ID of the FAQ to delete",
        required: true,
      },
    ],
  },

  // sidekick settings tools
  {
    name: "getSidekickSettings",
    displayName: "Get Sidekick Settings",
    category: "Settings",
    description: "Get the user's sidekick settings including system prompt",
    outputFields: [
      {
        name: "systemPrompt",
        type: "string",
        description: "The current system prompt",
      },
    ],
  },
  {
    name: "updateSidekickSettings",
    displayName: "Update Sidekick Settings",
    category: "Settings",
    description: "Update the user's sidekick settings",
    inputFields: [
      {
        name: "systemPrompt",
        type: "string",
        description: "The new system prompt",
        required: true,
      },
    ],
  },

  // action logs tools
  {
    name: "listActionLogs",
    displayName: "List Action Logs",
    category: "Action Logs",
    description: "List recent action logs for the user",
    inputFields: [
      {
        name: "limit",
        type: "number",
        description: "Number of logs to return",
        required: false,
      },
    ],
    outputFields: [
      { name: "logs", type: "array", description: "Array of action logs" },
    ],
  },
  {
    name: "getActionLog",
    displayName: "Get Action Log",
    category: "Action Logs",
    description: "Get a specific action log by ID",
    inputFields: [
      {
        name: "actionId",
        type: "string",
        description: "The ID of the action log",
        required: true,
      },
    ],
    outputFields: [
      { name: "log", type: "object", description: "The action log details" },
    ],
  },

  // contacts tools
  {
    name: "listContacts",
    displayName: "List Contacts",
    category: "Contacts",
    description: "List all contacts with filtering and sorting options",
    inputFields: [
      {
        name: "stage",
        type: "enum",
        description: "Filter by stage (new, lead, follow-up, ghosted)",
        required: false,
      },
      {
        name: "sentiment",
        type: "enum",
        description: "Filter by sentiment (hot, warm, cold, ghosted, neutral)",
        required: false,
      },
      {
        name: "limit",
        type: "number",
        description: "Number of contacts to return",
        required: false,
      },
      {
        name: "sortBy",
        type: "enum",
        description: "Sort by field (createdAt, lastMessageAt, leadScore)",
        required: false,
      },
    ],
    outputFields: [
      { name: "contacts", type: "array", description: "Array of contacts" },
    ],
  },
  {
    name: "getContact",
    displayName: "Get Contact",
    category: "Contacts",
    description: "Get a specific contact by ID",
    inputFields: [
      {
        name: "contactId",
        type: "string",
        description: "The ID of the contact",
        required: true,
      },
    ],
    outputFields: [
      { name: "contact", type: "object", description: "The contact details" },
    ],
  },
  {
    name: "updateContact",
    displayName: "Update Contact",
    category: "Contacts",
    description: "Update contact information",
    inputFields: [
      {
        name: "contactId",
        type: "string",
        description: "The ID of the contact to update",
        required: true,
      },
      {
        name: "stage",
        type: "enum",
        description: "Contact stage (new, lead, follow-up, ghosted)",
        required: false,
      },
      {
        name: "sentiment",
        type: "enum",
        description: "Contact sentiment (hot, warm, cold, ghosted, neutral)",
        required: false,
      },
      {
        name: "leadScore",
        type: "number",
        description: "Lead score (0-100)",
        required: false,
      },
      {
        name: "nextAction",
        type: "string",
        description: "Next action to take",
        required: false,
      },
      {
        name: "leadValue",
        type: "number",
        description: "Estimated lead value",
        required: false,
      },
      {
        name: "notes",
        type: "string",
        description: "Contact notes",
        required: false,
      },
    ],
  },
  {
    name: "addContactTag",
    displayName: "Add Contact Tag",
    category: "Contacts",
    description: "Add a tag to a contact",
    inputFields: [
      {
        name: "contactId",
        type: "string",
        description: "The ID of the contact",
        required: true,
      },
      {
        name: "tag",
        type: "string",
        description: "The tag to add",
        required: true,
      },
    ],
  },
  {
    name: "removeContactTag",
    displayName: "Remove Contact Tag",
    category: "Contacts",
    description: "Remove a tag from a contact",
    inputFields: [
      {
        name: "contactId",
        type: "string",
        description: "The ID of the contact",
        required: true,
      },
      {
        name: "tag",
        type: "string",
        description: "The tag to remove",
        required: true,
      },
    ],
  },
  {
    name: "getContactTags",
    displayName: "Get Contact Tags",
    category: "Contacts",
    description: "Get all tags for a contact",
    inputFields: [
      {
        name: "contactId",
        type: "string",
        description: "The ID of the contact",
        required: true,
      },
    ],
    outputFields: [
      { name: "tags", type: "array", description: "Array of contact tags" },
    ],
  },
  {
    name: "searchContacts",
    displayName: "Search Contacts",
    category: "Contacts",
    description: "Search contacts by username or notes",
    inputFields: [
      {
        name: "query",
        type: "string",
        description: "Search query",
        required: true,
      },
      {
        name: "limit",
        type: "number",
        description: "Number of results to return",
        required: false,
      },
    ],
    outputFields: [
      {
        name: "contacts",
        type: "array",
        description: "Array of matching contacts",
      },
    ],
  },
];