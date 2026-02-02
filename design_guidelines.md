# Design Guidelines: Service After-Sales Mobile App

## Brand Identity

**Purpose**: Professional B2B service management tool enabling sales representatives to report product issues and technicians to resolve them efficiently.

**Aesthetic Direction**: Bold/Utilitarian - High contrast design with strong visual hierarchy. Think industrial efficiency meets modern software. Colors signal status clearly, typography is legible at a glance, and actions are unmistakable. This is a tool for professionals who need to work fast.

**Memorable Element**: Status-driven color system - declarations pulse through distinct visual states (New → In Progress → Resolved) with bold color coding that's visible across the app.

## Navigation Architecture

**Root Navigation**: Tab Bar (3 tabs)

**Authentication**: Required (JWT-based)
- Users have roles: "commercial" or "technicien"
- Apple Sign-In (iOS required)
- Email/password fallback
- Include privacy policy & terms links (placeholders)

**Tab Structure**:
1. **Déclarations** (Home) - Main workspace
2. **Clients** (Commercials only) - Client directory
3. **Profil** (Profile) - Account & settings

## Screen Specifications

### Auth Screens (Stack-only)

**Login Screen**
- Header: None (custom welcome view)
- Layout: Centered form with app logo/icon at top
- Safe area: top: insets.top + Spacing.xl, bottom: insets.bottom + Spacing.xl
- Components: Email input, password input, "Se connecter" button, SSO buttons, "Pas de compte?" link
- Form buttons: Below form inputs

**Signup Screen**
- Header: Default back button (left)
- Layout: Scrollable form
- Safe area: top: Spacing.xl, bottom: insets.bottom + Spacing.xl
- Components: Name, email, password, role selector (Commercial/Technicien), "S'inscrire" button
- Form buttons: Below form

### Déclarations Tab (Both Roles)

**Liste des Déclarations Screen**
- Header: Transparent, title "Déclarations", search bar, filter button (right)
- Layout: FlatList with pull-to-refresh
- Safe area: top: headerHeight + Spacing.xl, bottom: tabBarHeight + Spacing.xl
- Components: 
  - Declaration cards showing: category badge, product name, client name, status indicator, date, thumbnail if photo exists
  - Floating action button (Commercials only): "+" button for new declaration
- Empty state: Show empty-declarations.png illustration with "Aucune déclaration"

**Nouvelle Déclaration Screen** (Commercials only, modal)
- Header: "Nouvelle déclaration", cancel (left), save (right, disabled until valid)
- Layout: Scrollable form
- Safe area: top: Spacing.xl, bottom: insets.bottom + Spacing.xl
- Components: Category picker, product name input, reference input, serial number input, description textarea, photo picker, client selector
- Photo button shows thumbnail if selected
- Form buttons: In header

**Détail Déclaration Screen**
- Header: Default back button (left), menu (right: edit/delete for creator)
- Layout: Scrollable content
- Safe area: top: Spacing.xl, bottom: tabBarHeight + Spacing.xl
- Components:
  - Status banner at top (color-coded)
  - Product info section, client info section, photo (if exists), description
  - Action button (Technicians): "Prendre en charge" or "Marquer comme réglée" based on status
  - Timeline showing: created date, taken date (if applicable), resolved date (if applicable)

### Clients Tab (Commercials only)

**Liste des Clients Screen**
- Header: Transparent, title "Clients", search bar, add button (right)
- Layout: FlatList with alphabetical sections
- Safe area: top: headerHeight + Spacing.xl, bottom: tabBarHeight + Spacing.xl
- Components: Client cards showing name, email, phone
- Empty state: Show empty-clients.png illustration

**Nouveau Client Screen** (modal)
- Header: "Nouveau client", cancel (left), save (right)
- Layout: Scrollable form
- Safe area: top: Spacing.xl, bottom: insets.bottom + Spacing.xl
- Components: Name, email, phone, address inputs
- Form buttons: In header

### Profil Tab

**Profil Screen**
- Header: Transparent, title "Profil"
- Layout: Scrollable sections
- Safe area: top: headerHeight + Spacing.xl, bottom: tabBarHeight + Spacing.xl
- Components:
  - Avatar (editable), display name, email, role badge
  - Settings sections: Notifications, Theme, Language
  - Log out button, Delete account (nested under Settings)

## Color Palette

**Primary**: #E63946 (Bold red - urgent action, declarations)
**Secondary**: #457B9D (Professional blue - resolved, calm)
**Success**: #06D6A0 (Resolved status)
**Warning**: #F77F00 (In progress status)
**Background**: #FAFAFA (Soft white)
**Surface**: #FFFFFF (Cards, modals)
**Text Primary**: #1D1D1F
**Text Secondary**: #6C757D
**Border**: #E5E5E5

## Typography

**Font**: System (SF Pro iOS / Roboto Android)
**Scale**:
- Hero: 34px, Bold
- Title: 28px, Bold
- Headline: 20px, Semibold
- Body: 16px, Regular
- Caption: 14px, Regular
- Small: 12px, Regular

## Visual Design

- Icons: Feather icons from @expo/vector-icons
- Touchable feedback: Scale animation (0.95) + opacity (0.7)
- Floating action button shadow: shadowOffset {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2
- Cards: 12px border radius, subtle border or shadow
- Status badges: Rounded pills with background colors matching status

## Assets to Generate

1. **icon.png** - Red wrench/gear symbol on white circle. Used: App icon on device
2. **splash-icon.png** - Same as icon but larger. Used: Launch screen
3. **empty-declarations.png** - Minimalist clipboard with checkmark. Used: Empty state on Déclarations list
4. **empty-clients.png** - Simple address book icon in muted colors. Used: Empty state on Clients list
5. **avatar-commercial.png** - Default avatar for commercial role (professional figure). Used: Profile placeholder
6. **avatar-technicien.png** - Default avatar for technician role (professional figure with tool). Used: Profile placeholder