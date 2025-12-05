const fs = require('fs');
const path = require('path');
const readline = require('readline');
const db = require('./db');
require('./events/logger'); // Initialize event logger

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


function exportVaultData(records) {
  const exportFile = 'export.txt';
  const now = new Date();

  // Header
  let output = `===== NodeVault Export =====
File: ${exportFile}
Exported On: ${now.toLocaleString()}
Total Records: ${records.length}
=================================\n\n`;

  // Body (each record)
  if (records.length === 0) {
    output += "No records found.\n";
  } else {
    records.forEach((r, index) => {
      output += `${index + 1}. ID: ${r.id}\n`;
      output += `   Name: ${r.name}\n`;
      output += `   Value: ${r.value}\n`;
      output += `   Created: ${r.createdAt}\n\n`;
    });
  }

  // Write to file
  fs.writeFileSync(exportFile, output);

  console.log(`📄 Data exported successfully to ${exportFile}`);
}

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

      case '1':
        rl.question('Enter name: ', name => {
          rl.question('Enter value: ', value => {
            db.addRecord({ name, value });
            console.log('✅ Record added successfully!');
            menu();
          });
        });
        break;

      case '2':
        const records = db.listRecords();
        if (records.length === 0) console.log('No records found.');
        else records.forEach(r => console.log(`ID: ${r.id} | Name: ${r.name} | Value: ${r.value}`));
        menu();
        break;

      case '3':
        rl.question('Enter record ID to update: ', id => {
          rl.question('New name: ', name => {
            rl.question('New value: ', value => {
              const updated = db.updateRecord(Number(id), name, value);
              console.log(updated ? '✅ Record updated!' : '❌ Record not found.');
              menu();
            });
          });
        });
        break;

      case '4':
        rl.question('Enter record ID to delete: ', id => {
          const deleted = db.deleteRecord(Number(id));
          console.log(deleted ? '🗑️ Record deleted!' : '❌ Record not found.');
          menu();
        });
        break;

      case '5':  
        // 🔎 SEARCH FUNCTIONALITY
        rl.question('Enter search keyword (ID or Name): ', keyword => {
          const all = db.listRecords();
          const lower = keyword.toLowerCase();

          const results = all.filter(r =>
            r.name.toLowerCase().includes(lower) ||
            String(r.id).includes(keyword)
          );

          if (results.length === 0) {
            console.log('❌ No matching records found.');
          } else {
            console.log(`🔎 Found ${results.length} matching record(s):`);
            results.forEach(r =>
              console.log(`ID: ${r.id} | Name: ${r.name} | Value: ${r.value}`)
            );
          }

          menu();
        });
        break;

      case '6':  
        // 🔽 SORTING FEATURE
        const all = db.listRecords();

        if (all.length === 0) {
          console.log('No records found to sort.');
          return menu();
        }

        console.log(`
Choose field to sort by:
1. Name
2. Creation Date
        `);

        rl.question('Enter option: ', fieldChoice => {
          let field = null;

          if (fieldChoice.trim() === '1') field = 'name';
          else if (fieldChoice.trim() === '2') field = 'createdAt';
          else {
            console.log('Invalid option.');
            return menu();
          }

          console.log(`
Choose order:
1. Ascending
2. Descending
          `);

          rl.question('Enter option: ', orderChoice => {
            let ascending = true;
            if (orderChoice.trim() === '1') ascending = true;
            else if (orderChoice.trim() === '2') ascending = false;
            else {
              console.log('Invalid option.');
              return menu();
            }

            // Clone to avoid changing actual DB data
            const sorted = [...all];

            sorted.sort((a, b) => {
              if (field === 'name') {
                const nameA = a.name.toLowerCase();
                const nameB = b.name.toLowerCase();
                if (nameA < nameB) return ascending ? -1 : 1;
                if (nameA > nameB) return ascending ? 1 : -1;
                return 0;
              }

              if (field === 'createdAt') {
                const tA = new Date(a.createdAt).getTime();
                const tB = new Date(b.createdAt).getTime();
                return ascending ? tA - tB : tB - tA;
              }
            });

            console.log(`\n📌 Sorted Records:\n`);
            sorted.forEach((r, i) => {
              console.log(
                `${i + 1}. ID: ${r.id} | Name: ${r.name} | Value: ${r.value} | Created: ${r.createdAt}`
              );
            });

            menu();
          });
        });
        break;
      case '7':
  	const recordsToExport = db.listRecords();
  	exportVaultData(recordsToExport);
  	menu();
  	break;
      case '8':
  	showVaultStatistics();
  	menu();
  	break;

      case '9':
        console.log('👋 Exiting NodeVault...');
        rl.close();
        break;

      default:
        console.log('Invalid option.');
        menu();
    }
  });
}

menu();

