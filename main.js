const readline = require('readline');
const mongoose = require('mongoose');
const db = require('./db');
const fs = require('fs');
require('dotenv').config();  // Load .env variables

const mongoURI = process.env.MONGO_URI;  // Use environment variable


require('./events/logger');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


// ------------------- Vault Statistics -------------------
async function showVaultStatistics() {
  const records = await db.listRecords();

  console.log("\nVault Statistics:");
  console.log("--------------------------");
  console.log(`Total Records: ${records.length}`);

  // ---------------- Last Modified ----------------
  let lastModified = "N/A";
  if (records.length > 0) {
    const latestUpdate = records.reduce((latest, r) => {
      const updated = r.updatedAt || r.createdAt;
      return new Date(updated) > new Date(latest) ? updated : latest;
    }, records[0].updatedAt || records[0].createdAt);

    lastModified = new Date(latestUpdate).toLocaleString();
  }
  console.log(`Last Modified: ${lastModified}`);

  // ---------------- Other Stats ----------------
  if (records.length > 0) {

    // Longest Name
    const longest = records.reduce((max, r) =>
      r.name.length > max.name.length ? r : max
    );
    console.log(`Longest Name: ${longest.name} (${longest.name.length} characters)`);

    // Sort by creation date
    const sortedByDate = [...records]
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const earliestDate = new Date(sortedByDate[0].createdAt)
      .toISOString()
      .split("T")[0];

    const latestDate = new Date(sortedByDate[sortedByDate.length - 1].createdAt)
      .toISOString()
      .split("T")[0];

    console.log(`Earliest Record: ${earliestDate}`);
    console.log(`Latest Record: ${latestDate}`);
  }

  console.log("");
}


// ------------------- Export Data -------------------
function exportVaultData(records) {
  const exportFile = 'export.txt';
  const now = new Date();

  let output = `===== NodeVault Export =====
File: ${exportFile}
Exported On: ${now.toLocaleString()}
Total Records: ${records.length}
================================\n\n`;

  if (records.length === 0) output += "No records found.\n";
  else {
    records.forEach((r, i) => {
      output += `${i + 1}. ID: ${r.id}\n   Name: ${r.name}\n   Value: ${r.value}\n   Created: ${r.createdAt}\n\n`;
    });
  }

  fs.writeFileSync(exportFile, output);
  console.log(`📄 Data exported successfully to ${exportFile}`);
}

// ------------------- Menu -------------------
function menu() {
  console.log(`
===== NodeVault =====
1. Add Record
2. List Records
3. Update Record
4. Delete Record
5. Search Records
6. Sort Records
7. Export Data
8. View Vault Statistics
9. Exit
=====================
`);

  rl.question('Choose option: ', ans => {
    switch (ans.trim()) {

      case '1': // Add
        rl.question('Enter name: ', name => {
          rl.question('Enter value: ', value => {
            (async () => {
              const newRec = await db.addRecord({ name, value });
              console.log(`✅ Record added successfully! ID: ${newRec.id}`);
              menu();
            })();
          });
        });
        break;

      case '2': // List
        (async () => {
          const records = await db.listRecords();
          if (records.length === 0) console.log('No records found.');
          else records.forEach(r => console.log(`ID: ${r.id} | Name: ${r.name} | Value: ${r.value}`));
          menu();
        })();
        break;

      case '3': // Update
        rl.question('Enter record ID to update: ', id => {
          rl.question('New name: ', name => {
            rl.question('New value: ', value => {
              (async () => {
                const updated = await db.updateRecord(Number(id), name, value);
                console.log(updated ? '✅ Record updated!' : '❌ Record not found.');
                menu();
              })();
            });
          });
        });
        break;

      case '4': // Delete
        rl.question('Enter record ID to delete: ', id => {
          (async () => {
            const deleted = await db.deleteRecord(Number(id));
            console.log(deleted ? '🗑️ Record deleted!' : '❌ Record not found.');
            menu();
          })();
        });
        break;

      case '5': // Search
        rl.question('Enter search keyword (ID or Name): ', keyword => {
          (async () => {
            const all = await db.listRecords();
            const lower = keyword.toLowerCase();
            const results = all.filter(r => r.name.toLowerCase().includes(lower) || String(r.id).includes(keyword));
            if (results.length === 0) console.log('❌ No matching records found.');
            else {
              console.log(`🔎 Found ${results.length} record(s):`);
              results.forEach(r => console.log(`ID: ${r.id} | Name: ${r.name} | Value: ${r.value}`));
            }
            menu();
          })();
        });
        break;

      case '6': // Sort
        (async () => {
          const all = await db.listRecords();
          if (all.length === 0) { console.log('No records to sort.'); return menu(); }

          console.log(`Choose field to sort by:\n1. Name\n2. Creation Date`);
          rl.question('Enter option: ', fieldChoice => {
            const field = fieldChoice.trim() === '1' ? 'name' : fieldChoice.trim() === '2' ? 'createdAt' : null;
            if (!field) { console.log('Invalid option.'); return menu(); }

            console.log(`Choose order:\n1. Ascending\n2. Descending`);
            rl.question('Enter option: ', orderChoice => {
              const ascending = orderChoice.trim() === '1' ? true : orderChoice.trim() === '2' ? false : null;
              if (ascending === null) { console.log('Invalid option.'); return menu(); }

              const sorted = [...all].sort((a, b) => {
                if (field === 'name') return ascending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
                if (field === 'createdAt') return ascending ? new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt);
              });

              console.log(`\n📌 Sorted Records:\n`);
              sorted.forEach((r, i) => console.log(`${i + 1}. ID: ${r.id} | Name: ${r.name} | Value: ${r.value} | Created: ${r.createdAt}`));
              menu();
            });
          });
        })();
        break;

      case '7': // Export
        (async () => {
          const recordsToExport = await db.listRecords();
          exportVaultData(recordsToExport);
          menu();
        })();
        break;

      case '8': // Statistics
        (async () => {
          await showVaultStatistics();
          menu();
        })();
        break;

      case '9': // Exit
  	console.log('👋 Exiting NodeVault...');
  	mongoose.connection.close(); // 🔥 Close DB connection
  	rl.close();
  	process.exit(0); // 🔥 Force exit cleanly
  	break;


      default:
        console.log('Invalid option.');
        menu();
    }
  });
}

// ------------------- Start App -------------------
async function initApp() {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    menu();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

initApp();

