# SecondYouth Figma design kit

Import `manifest.json` in the Figma desktop app using **Plugins → Development → Import plugin from manifest**. Open a Figma Design file and run **SecondYouth Design Kit** from Development. Choose `care-portrait.jpg in the kit` from the repository as the dashboard portrait, then select **Create editable screens**.

The plugin adds editable Auto Layout frames for desktop and mobile Home, Medicines, Care sharing, the caregiver timeline, onboarding, Settings, and Safety. It adds reusable button and status components, plus color styles to the current file. Run it in a blank page for an uncluttered canvas.

## Prompt for Figma Make

> Redesign SecondYouth, an offline-first care dashboard for older adults and their invited caregivers. Build a polished, responsive web UI for 1440 px desktop and 390 px mobile. Start with the Home dashboard and extend the system to medicine check-ins, caregiver invitations and consent, a read-only caregiver timeline, Settings, and onboarding.
>
> Use the existing website’s palette. Use forest `#123D2B`, primary green `#176B4A`, mint `#E3F4EC`, canvas `#F5F8F5`, white `#FFFFFF`, ink `#1D2A24`, muted text `#53645A`, and outlines `#DBE6DE`. Give Family blue `#265D98` on `#E7F0FB`, Safety scanner amber `#80530E` on `#FFF2D8`, and Legacy vault rose `#A63D54` on `#FAE8ED`. Reserve deep red `#8E1F27` on `#FFF2F1` for emergency and destructive actions.
>
> Set welcoming headings in Newsreader and interface text in DM Sans. Use a restrained editorial hierarchy, comfortable reading sizes, clear labels, visible focus, WCAG AA text contrast, and targets at least 44 px tall. Define Auto Layout, text styles, semantic color variables, and reusable button, navigation, card, and status components. Use the supplied editorial portrait in the mint welcome panel.
>
> On desktop, use a white 228 px sidebar and a quiet profile bar. On mobile, use a compact brand bar with SOS and profile settings, plus bottom navigation for Home, Medicine, Safety, and Settings. Lead with the current date, greeting, and Open schedule button. Show the actual dose count and next medicine in Today’s care plan. Keep Emergency SOS visually distinct and place Safe zone nearby. Provide labeled cards for Family, Safety scanner, Legacy vault, and Care sharing.
>
> Prototype the important paths. Show medicine check-ins with Saved on this device, Awaiting sync, Synced, and Undo. Show the caregiver’s last refresh, check-in history, no check-in received, and revoked access. Keep SOS actions explicit. Include empty, error, keyboard focus, and high-contrast states. Use realistic fictional data in the mockups and never imply a dose was missed when the timeline lacks a check-in.
