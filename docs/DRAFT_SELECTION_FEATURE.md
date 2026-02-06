# Draft Selection Feature - Visual Design & Flow

## Overview
This feature allows users to see and manage their existing draft submissions before starting a new one, similar to ProductHunt's "Your existing in progress posts" feature.

---

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER VISITS /submit                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Check if user has    │
            │  existing drafts      │
            └───────────┬───────────┘
                        │
        ┌───────────────┴───────────────┐
        │                                │
        ▼                                ▼
┌───────────────┐              ┌──────────────────┐
│ Has Drafts?   │              │  No Drafts?      │
│ YES           │              │  Show Form       │
└───────┬───────┘              └──────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│           DRAFT SELECTION SCREEN                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Submit Your Launch                                  │   │
│  │  Continue your existing draft or start a new        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Your existing in progress posts:                   │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  [🖼️ Logo]  Project Name                      │  │   │
│  │  │            🔗 https://project1.com            │  │   │
│  │  │            Tagline: Catchy tagline here         │  │   │
│  │  │            Description preview text that...    │  │   │
│  │  │            [Category] 🕐 Last updated: 2 days  │  │   │
│  │  │                        [Continue] [🗑️]        │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  [🖼️ Logo]  Project 2 Name                   │  │   │
│  │  │            🔗 https://project2.com             │  │   │
│  │  │            ...                                │  │   │
│  │  │                        [Continue] [🗑️]        │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│              [+ Start New Submission]                       │
└─────────────────────────────────────────────────────────────┘
        │
        ├─── Continue Draft ────► Navigate to /submit?draft=<id>
        │
        ├─── Delete Draft ───────► Remove from database
        │
        └─── Start New ──────────► Clear form & show empty form
```

---

## Visual Layout Details

### Header Section
```
┌─────────────────────────────────────────┐
│         Submit Your Launch              │
│  Continue your existing draft or        │
│  start a new submission                 │
└─────────────────────────────────────────┘
```

### Draft Card Design
```
┌────────────────────────────────────────────────────────────┐
│  [Logo/Thumbnail]  Project Name                           │
│  12x12 rounded    🔗 https://example.com                   │
│                                                             │
│  Tagline: Catchy tagline that describes the project        │
│                                                             │
│  Description preview text that gets truncated after        │
│  two lines to keep the card compact...                     │
│                                                             │
│  [Category Badge]  🕐 Last updated: 2 days ago             │
│                                                             │
│                                    [Continue]  [🗑️ Delete] │
└────────────────────────────────────────────────────────────┘
```

### Start New Button
```
┌─────────────────────────────────────┐
│  ➕ Start New Submission            │
└─────────────────────────────────────┘
```

---

## Component Structure

### DraftSelectionScreen Component
- **Location**: `startuphunt/src/Components/DraftSelectionScreen.jsx`
- **Props**:
  - `user` (object): Current authenticated user
  - `onContinueDraft` (function, optional): Callback when user clicks Continue
  - `onStartNew` (function, optional): Callback when user clicks Start New
  - `onDismiss` (function, optional): Callback to dismiss the screen

### Features
1. **Fetches user drafts** from database (status='draft')
2. **Filters empty drafts** (only shows drafts with meaningful data)
3. **Displays draft cards** with:
   - Logo/thumbnail image
   - Project name
   - Website URL
   - Tagline
   - Description preview (2 lines max)
   - Category badge
   - Last updated date
4. **Actions**:
   - Continue draft → Navigate to `/submit?draft=<id>`
   - Delete draft → Shows confirmation dialog
   - Start new → Clears form and shows empty form

---

## Integration with Register.jsx

### How it works:
1. **Register.jsx** checks if user has drafts on mount
2. If drafts exist → Shows `DraftSelectionScreen`
3. If no drafts → Shows form directly
4. When user clicks "Continue" → Navigates to `/submit?draft=<id>`
5. When user clicks "Start New" → Clears localStorage and shows empty form

### Code Integration:
```jsx
// In Register.jsx
import DraftSelectionScreen from '../Components/DraftSelectionScreen';

// Add state
const [showDraftSelection, setShowDraftSelection] = useState(false);
const [userDrafts, setUserDrafts] = useState([]);
const [loadingDrafts, setLoadingDrafts] = useState(false);

// In render, before form:
{showDraftSelection && userDrafts.length > 0 && (
    <DraftSelectionScreen
        user={user}
        onContinueDraft={(draftId) => navigate(`/submit?draft=${draftId}`)}
        onStartNew={() => {
            localStorage.removeItem('launch_draft');
            setShowDraftSelection(false);
            // Clear form state
        }}
    />
)}
```

---

## Styling Details

### Colors:
- Background: `bg-gray-50` (light gray)
- Card: `bg-white` with border
- Primary button: `bg-blue-600` (blue)
- Delete button: `text-red-600` (red)
- Text: Gray scale (`text-gray-800`, `text-gray-500`, etc.)

### Spacing:
- Container: `max-w-4xl mx-auto`
- Padding: `py-12 px-4`
- Card padding: `p-6`
- Gap between cards: `space-y-4`

### Responsive:
- Mobile: Cards stack vertically
- Desktop: Cards maintain width, centered

---

## User Experience Benefits

1. **No Lost Work**: Users can see all their drafts and continue where they left off
2. **Multiple Projects**: Users can work on multiple projects without losing progress
3. **Clear Actions**: Easy to continue, delete, or start new
4. **Visual Preview**: See project details at a glance
5. **Time Awareness**: Shows when draft was last updated

---

## Edge Cases Handled

1. **Empty Drafts**: Filters out drafts with no meaningful data
2. **Missing Images**: Shows placeholder icon if logo/thumbnail missing
3. **Long Text**: Truncates description to 2 lines
4. **Date Formatting**: Shows relative dates (e.g., "2 days ago")
5. **Delete Confirmation**: Requires confirmation before deleting
6. **Loading State**: Shows spinner while fetching drafts

---

## Next Steps

1. Review this design
2. Integrate `DraftSelectionScreen` into `Register.jsx`
3. Test the flow with multiple drafts
4. Adjust styling if needed

