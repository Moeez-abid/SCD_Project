const fs = require('fs');
const path = require('path');
const fileDB = require('./file');
const recordUtils = require('./record');
const vaultEvents = require('../events');

function createBackup(records) {
  const backupsDir = path.join(__dirname, '..', 'backups');

  // Create /backups folder if not exists
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir);
  }

  // Timestamp format: 2025-11-04_15-22-10
  const timestamp = new Date()
    .toISOString()
    .replace(/T/, '_')
    .replace(/:/g, '-')
    .replace(/\..+/, '');

  const filename = `backup_${timestamp}.json`;
  const filepath = path.join(backupsDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(records, null, 2));

  console.log(`💾 Backup created: ${filename}`);
}

function addRecord({ name, value }) {
  recordUtils.validateRecord({ name, value });
  
  const data = fileDB.readDB();

  const newRecord = { 
    id: recordUtils.generateId(),
    name, 
    value,
    createdAt: new Date().toISOString(),   // ✅ auto creation date
    updatedAt: new Date().toISOString()
  };

  data.push(newRecord);
  fileDB.writeDB(data);
  createBackup(data);
  vaultEvents.emit('recordAdded', newRecord);

  return newRecord;
}


function listRecords() {
  return fileDB.readDB();
}

function updateRecord(id, newName, newValue) {
  const data = fileDB.readDB();
  const record = data.find(r => r.id === id);
  if (!record) return null;
  record.name = newName;
  record.value = newValue;
  fileDB.writeDB(data);
  vaultEvents.emit('recordUpdated', record);
  return record;
}

function deleteRecord(id) {
  let data = fileDB.readDB();
  const record = data.find(r => r.id === id);
  if (!record) return null;
  data = data.filter(r => r.id !== id);
  fileDB.writeDB(data);
  createBackup(data);
  vaultEvents.emit('recordDeleted', record);
  return record;
}

module.exports = { addRecord, listRecords, updateRecord, deleteRecord };
