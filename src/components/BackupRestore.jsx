import { parseBackup } from '../lib/appStore.js';

export default function BackupRestore({ onRestore, notify }) {
  const restoreData = async (event) => {
    const [file] = event.target.files;
    event.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      notify('Choose a backup smaller than 2 MB.', 'error');
      return;
    }
    let backup;
    try {
      backup = parseBackup(await file.text());
    } catch {
      notify('Choose a valid SecondYouth JSON backup.', 'error');
      return;
    }
    if (window.confirm(`Replace this device’s profile and care data with the backup for ${backup.profile.name}? Audio memories stay on this device.`)) {
      onRestore(backup);
    }
  };

  return <label className="field"><span>Restore a device backup</span><input type="file" accept=".json,application/json" onChange={restoreData} /><small>Backups include care data. Audio memories are stored separately.</small></label>;
}
