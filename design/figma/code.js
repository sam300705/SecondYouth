/* global figma, __html__ */

const colors = {
  canvas: '#F5F8F5', surface: '#FFFFFF', ink: '#1D2A24', muted: '#53645A',
  line: '#DBE6DE', green: '#176B4A', forest: '#123D2B', mint: '#E3F4EC',
  blue: '#265D98', blueSoft: '#E7F0FB', amber: '#80530E', amberSoft: '#FFF2D8',
  rose: '#A63D54', roseSoft: '#FAE8ED', red: '#8E1F27', redSoft: '#FFF2F1',
};

const paint = (hex) => {
  const number = Number.parseInt(hex.slice(1), 16);
  return { type: 'SOLID', color: { r: (number >> 16) / 255, g: ((number >> 8) & 255) / 255, b: (number & 255) / 255 } };
};

async function chooseFont(choices) {
  for (const font of choices) {
    try {
      await figma.loadFontAsync(font);
      return font;
    } catch {
      // Figma uses the next font when a requested style is unavailable.
    }
  }
  throw new Error('A text font could not be loaded.');
}

function layout(name, direction, fill, options = {}) {
  const node = figma.createFrame();
  node.name = name;
  node.layoutMode = direction;
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'AUTO';
  node.itemSpacing = options.gap ?? 12;
  node.paddingLeft = node.paddingRight = node.paddingTop = node.paddingBottom = options.padding ?? 0;
  node.cornerRadius = options.radius ?? 0;
  node.fills = fill ? [paint(fill)] : [];
  if (options.stroke) node.strokes = [paint(options.stroke)];
  return node;
}

figma.showUI(__html__, { width: 340, height: 155 });

figma.ui.onmessage = async ({ image }) => {
  try {
    const [body, strong, display] = await Promise.all([
      chooseFont([{ family: 'DM Sans', style: 'Regular' }, { family: 'Inter', style: 'Regular' }]),
      chooseFont([{ family: 'DM Sans', style: 'Bold' }, { family: 'Inter', style: 'Bold' }]),
      chooseFont([{ family: 'Newsreader', style: 'Medium' }, { family: 'Georgia', style: 'Regular' }, { family: 'Inter', style: 'Bold' }]),
    ]);
    const imageHash = image ? figma.createImage(new Uint8Array(image)).hash : null;

    function text(name, size, color, font = body) {
      const node = figma.createText();
      node.fontName = font;
      node.fontSize = size;
      node.characters = name;
      node.fills = [paint(color)];
      return node;
    }

    function fill(parent, child) {
      parent.appendChild(child);
      child.layoutAlign = 'STRETCH';
      return child;
    }

    function button(label) {
      const node = layout(label, 'HORIZONTAL', colors.green, { padding: 14, radius: 14 });
      node.appendChild(text(label + '  →', 16, colors.surface, strong));
      return node;
    }

    function card(title, caption, color = colors.forest, background = colors.surface) {
      const node = layout(title, 'VERTICAL', background, { padding: 18, radius: 18, stroke: colors.line, gap: 6 });
      node.appendChild(text(title, 19, color, strong));
      if (caption) node.appendChild(text(caption, 15, colors.muted));
      return node;
    }

    function dashboard(mobile) {
      const screen = layout(mobile ? 'Home / Mobile' : 'Home / Desktop', 'HORIZONTAL', colors.canvas, { gap: 0 });
      figma.currentPage.appendChild(screen);
      if (!mobile) {
        const sidebar = layout('Sidebar', 'VERTICAL', colors.surface, { padding: 22, gap: 18 });
        screen.appendChild(sidebar);
        sidebar.resize(228, 850);
        sidebar.counterAxisSizingMode = 'FIXED';
        sidebar.primaryAxisSizingMode = 'FIXED';
        sidebar.appendChild(text('SecondYouth', 24, colors.forest, strong));
        for (const item of ['Home', 'Medicine', 'Family', 'Safety', 'Safety scanner', 'Legacy vault', 'Care sharing', 'Settings']) {
          fill(sidebar, card(item, '', colors.forest, item === 'Home' ? colors.mint : colors.surface));
        }
      }
      const column = layout('Dashboard content', 'VERTICAL', colors.canvas, { padding: mobile ? 16 : 34, gap: 20 });
      screen.appendChild(column);
      column.resize(mobile ? 390 : 1070, 850);
      column.counterAxisSizingMode = 'FIXED';
      fill(column, card(mobile ? 'SecondYouth' : 'Overview', mobile ? 'Emergency SOS · Profile settings' : '', colors.forest));
      const hero = fill(column, layout('Welcome and schedule', mobile ? 'VERTICAL' : 'HORIZONTAL', colors.mint, { radius: 24, gap: 0 }));
      hero.clipsContent = true;
      const heroCopy = layout('Welcome copy', 'VERTICAL', null, { padding: mobile ? 24 : 34, gap: 18 });
      hero.appendChild(heroCopy);
      heroCopy.appendChild(text('Tuesday, November 24', 15, colors.forest, strong));
      heroCopy.appendChild(text('Good morning,\nAsha.', mobile ? 45 : 65, colors.forest, display));
      heroCopy.appendChild(text('2 medicine check-ins remaining today.', 16, colors.muted));
      heroCopy.appendChild(button('Open schedule'));
      if (mobile) heroCopy.layoutAlign = 'STRETCH';
      else heroCopy.layoutGrow = 1;
      const portrait = figma.createRectangle();
      portrait.name = 'Dashboard portrait';
      portrait.resize(mobile ? 358 : 420, mobile ? 180 : 295);
      portrait.fills = imageHash ? [{ type: 'IMAGE', imageHash, scaleMode: 'FILL' }] : [paint('#C8DFD1')];
      hero.appendChild(portrait);
      portrait.layoutAlign = 'STRETCH';
      const summary = fill(column, layout('Daily plan and emergency', mobile ? 'VERTICAL' : 'HORIZONTAL', null, { gap: 14 }));
      const plan = card('Today’s care plan', '1 of 3 taken');
      summary.appendChild(plan);
      if (mobile) plan.layoutAlign = 'STRETCH';
      else plan.layoutGrow = 1;
      const track = fill(plan, layout('Progress track', 'HORIZONTAL', colors.mint, { radius: 8 }));
      const completed = figma.createRectangle();
      completed.resize(80, 8);
      completed.cornerRadius = 8;
      completed.fills = [paint(colors.green)];
      track.appendChild(completed);
      fill(plan, card('Next medicine', 'Fictional tablet · 9:00 AM', colors.forest, '#F0F7F2'));
      const safety = layout('Safety and emergency', 'VERTICAL', null, { gap: 10 });
      summary.appendChild(safety);
      if (mobile) safety.layoutAlign = 'STRETCH';
      fill(safety, card('Emergency SOS', 'Prepare a call or message', colors.red, colors.redSoft));
      fill(safety, card('Safe zone', 'Set or check your location'));
      column.appendChild(text('Care tools', 25, colors.ink, strong));
      const tools = [
        ['Family', 'Trusted contacts', colors.blue, colors.blueSoft],
        ['Safety scanner', 'Camera-assisted demo', colors.amber, colors.amberSoft],
        ['Legacy vault', 'Record memories', colors.rose, colors.roseSoft],
        ['Care sharing', 'Caregiver access', colors.forest, colors.mint],
      ];
      for (let start = 0; start < tools.length; start += mobile ? 2 : 4) {
        const row = fill(column, layout('Care tools row', 'HORIZONTAL', null, { gap: 10 }));
        for (const args of tools.slice(start, start + (mobile ? 2 : 4))) {
          const tile = card(...args);
          row.appendChild(tile);
          tile.layoutGrow = 1;
        }
      }
      if (mobile) fill(column, card('Home     Medicine     Safety     Settings', '', colors.forest));
      return screen;
    }

    function detail(title, description, rows) {
      const screen = layout(title, 'VERTICAL', colors.canvas, { padding: 26, gap: 14 });
      figma.currentPage.appendChild(screen);
      screen.resize(520, 640);
      screen.counterAxisSizingMode = 'FIXED';
      screen.appendChild(text('SecondYouth', 18, colors.forest, strong));
      screen.appendChild(text(title, 42, colors.forest, display));
      screen.appendChild(text(description, 15, colors.muted));
      for (const args of rows) fill(screen, card(...args));
      return screen;
    }

    const frames = [
      dashboard(false), dashboard(true),
      detail('Medicines', 'Daily schedule', [
        ['9:00 AM · Fictional tablet', 'Mark as taken', colors.forest, colors.surface],
        ['Saved on this device', 'Awaiting sync', colors.amber, colors.amberSoft],
        ['Synced', 'Check-in acknowledged', colors.forest, colors.mint],
      ]),
      detail('Caregiver timeline', 'Check-ins are self-reported.', [
        ['Last checked at 9:04 AM', 'Latest update received at 9:03 AM'],
        ['Fictional tablet · 9:00 AM', 'Marked taken', colors.forest, colors.mint],
        ['No check-in received', 'Dose status unknown', colors.blue, colors.blueSoft],
        ['Access revoked', 'Ask for a new invitation.', colors.red, colors.redSoft],
      ]),
      detail('Care sharing', 'Share check-ins with a caregiver you choose.', [
        ['Check-in sync', 'Enable or pause new uploads'],
        ['Caregiver invitation', 'Create an invitation link'],
        ['Revoke access', 'End future reads for an invitation', colors.red, colors.redSoft],
      ]),
      detail('Set up your account', 'Your details help personalize your care dashboard.', [
        ['Your name', 'Asha Sharma'],
        ['Your phone number', '+91 90000 00000'],
        ['Continue', 'Set up a trusted contact', colors.forest, colors.mint],
        ['Restore a device backup', 'Choose a SecondYouth JSON backup'],
      ]),
      detail('Settings', 'Choose how SecondYouth works for you.', [
        ['Profile', 'Name and phone number'],
        ['Accessibility', 'Large text, high contrast, and voice controls'],
        ['Care sharing', 'Invite and manage caregiver access', colors.forest, colors.mint],
        ['Backup and restore', 'Export or restore care data'],
      ]),
      detail('Safety', 'Find location and emergency tools.', [
        ['Emergency SOS', 'Prepare a call or message', colors.red, colors.redSoft],
        ['Safe zone', 'Set or check your location', colors.forest, colors.mint],
        ['Safety scanner', 'Camera-assisted demo', colors.amber, colors.amberSoft],
      ]),
    ];
    const palette = layout('SecondYouth color styles', 'VERTICAL', colors.canvas, { padding: 24, gap: 8 });
    figma.currentPage.appendChild(palette);
    for (const [name, color] of Object.entries(colors)) {
      const row = layout(name, 'HORIZONTAL', null, { gap: 12 });
      const swatch = figma.createRectangle();
      swatch.resize(36, 24);
      swatch.fills = [paint(color)];
      row.appendChild(swatch);
      row.appendChild(text(name + '  ' + color, 15, colors.ink));
      palette.appendChild(row);
      const style = figma.createPaintStyle();
      style.name = 'SecondYouth/' + name;
      style.paints = [paint(color)];
    }
    const components = layout('SecondYouth components', 'VERTICAL', colors.canvas, { padding: 24, gap: 12 });
    figma.currentPage.appendChild(components);
    for (const [label, foreground, background] of [
      ['Button / Primary', colors.surface, colors.green],
      ['Button / Secondary', colors.ink, colors.surface],
      ['Button / Emergency', colors.red, colors.redSoft],
      ['Status / Local', colors.amber, colors.amberSoft],
      ['Status / Synced', colors.forest, colors.mint],
    ]) {
      const component = figma.createComponent();
      component.name = label;
      component.layoutMode = 'HORIZONTAL';
      component.primaryAxisSizingMode = 'AUTO';
      component.counterAxisSizingMode = 'AUTO';
      component.paddingLeft = component.paddingRight = 14;
      component.paddingTop = component.paddingBottom = 12;
      component.cornerRadius = 14;
      component.fills = [paint(background)];
      component.appendChild(text(label.split(' / ')[1], 16, foreground, strong));
      components.appendChild(component);
    }
    const insertion = figma.viewport.center;
    let x = insertion.x;
    for (const frame of [...frames, components, palette]) {
      frame.x = x;
      frame.y = insertion.y;
      x += frame.width + 64;
    }
    figma.currentPage.selection = frames;
    figma.viewport.scrollAndZoomIntoView(frames.slice(0, 2));
    figma.closePlugin('Added SecondYouth screens and color styles.');
  } catch (error) {
    figma.closePlugin(String(error.message || error));
  }
};
