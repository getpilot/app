## 🧭 Onboarding Flow — PRD for Pilot

### 🎯 Objective

Create a multi-step onboarding flow using a stepper component that:

* Collects user information.
* Updates the `user` table in Neon DB via Drizzle ORM.
* Marks the onboarding process as complete using a `onboarding_complete` boolean.

---

### 🏗️ Feature Scope

#### 🔹 Flow Overview (3 Steps):

1. **“Let’s Get to Know You”**

   * `use_case[]`
   * `other_use_case`
   * `leads_per_month`
   * `active_platforms[]`
   * `other_platform`

2. **“Let’s Set Your Goals”**

   * `business_type`
   * `other_business_type`
   * `pilot_goal[]`
   * `current_tracking[]`
   * `other_tracking`

3. **“Activate Your Account”**

   * Confirmation screen
   * Backend flag: `onboarding_complete = true`

---

### 🗃️ Database Schema (Updated)

In your existing `user` table, append the following fields:

```ts
use_case: text("use_case").array(),
other_use_case: text("other_use_case"),
leads_per_month: text("leads_per_month"),
active_platforms: text("active_platforms").array(),
other_platform: text("other_platform"),
business_type: text("business_type"),
other_business_type: text("other_business_type"),
pilot_goal: text("pilot_goal").array(),
current_tracking: text("current_tracking").array(),
other_tracking: text("other_tracking"),
onboarding_complete: boolean("onboarding_complete").default(false),
```

---

### ⚙️ Backend Logic

#### 🔁 Server Actions (Server Actions ONLY)

* On form submission for each step:
  * Validate using `zod`
  * Update the corresponding user record with partial data

* After final step:
  * Set `onboarding_complete = true`

Example flow:

```ts
await db.update(user)
  .set({ use_case, leads_per_month, ... })
  .where(eq(user.id, session.user.id));
```

---

### 💡 UX Requirements

#### 💻 UI

* Use the `Stepper` + `StepperItem` components
* One step per page section
* Controlled progression (can’t skip ahead)
* `StepButtons` to handle "Next", "Back", "Submit"

#### 🧠 Validation

* Use `react-hook-form` + `zod` schema for each step
* Disable "Next" until validation passes
* Mark progress visually via `StepperIndicator`

#### 🎨 Layout

* Use existing `OnboardingLayout`
* Left column: friendly text + branding
* Right column: stepper, form, CTA buttons

---

### 🧪 Testing & Edge Cases

* Prevent re-accessing onboarding if `onboarding_complete = true`
* Handle form interruptions with draft-saving or step memory
* UX fallback if file upload fails
* Protect route with server-side auth

---

### 🚫 Out of Scope (for V1) - DON'T IMPLEMENT THESE FOR NOW

* Integrations (Gumroad, IG, X)
* Paywall
* Dynamic onboarding customization based on role
* Group/team onboarding
* Tone reference file

---

### 🔚 Completion Criteria

✅ Data persists in DB per step
✅ Final screen marks onboarding complete
✅ Authenticated users with `onboarding_complete = true` skip onboarding
✅ Frontend is polished, responsive, and fast (use shadcn/ui)
✅ Back button works on all steps
✅ User can’t proceed unless inputs are valid