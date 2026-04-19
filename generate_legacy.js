const fs = require('fs');
const csv = require('csv-parser');

const csvFile = './Previous commitee info/Every Committee data - Form Responses 1.csv';

let currentYear = '';
let committees = [];
let currentCommittee = null;

// Tiers based on position
const getTier = (pos) => {
    pos = pos.toLowerCase();
    if (pos.includes('president') && !pos.includes('vice')) return 'gold';
    if (pos.includes('vice') || pos.includes('secretary') || pos.includes('treasurer')) return 'cyan';
    if (pos.includes('coordinator') || pos.includes('manager') || pos.includes('lead') || pos.includes('officer')) return 'purple';
    return 'exec';
};

const getIcon = (pos) => {
    pos = pos.toLowerCase();
    if (pos.includes('president') && !pos.includes('vice')) return 'fa-crown';
    if (pos.includes('vice')) return 'fa-user';
    if (pos.includes('treasurer') || pos.includes('cash')) return 'fa-coins';
    if (pos.includes('secretary')) return 'fa-pen-clip';
    if (pos.includes('coordinator') || pos.includes('lead')) return 'fa-bolt';
    if (pos.includes('design') || pos.includes('publication')) return 'fa-pen-nib';
    return 'fa-user-astronaut';
};

fs.createReadStream(csvFile)
  .pipe(csv(['Year', 'Position', 'FullName', 'Batch']))
  .on('data', (data) => {
      let year = data.Year ? data.Year.trim() : '';
      let pos = data.Position ? data.Position.trim() : '';
      let name = data.FullName ? data.FullName.trim() : '';
      let batch = data.Batch ? data.Batch.trim() : '';

      // Check if it's a new year row (e.g. "2019 -2020")
      if (year && year.match(/20\d{2}/) && !pos && !name) {
          if (currentCommittee) committees.push(currentCommittee);
          currentCommittee = {
              yearStr: year.replace(/\s+/g, ''),
              yearTitle: year.substring(0, 4),
              members: []
          };
      } 
      // Add member to current committee
      else if (pos && name && currentCommittee) {
          currentCommittee.members.push({ pos, name, batch });
      }
  })
  .on('end', () => {
      if (currentCommittee) committees.push(currentCommittee);
      
      // Reverse so newest is first
      committees.reverse();

      let html = '';
      
      committees.forEach((comm, idx) => {
          html += `\n    <!-- ══════════════════════════════════════════════
         ERA ${comm.yearStr}
         ══════════════════════════════════════════════ -->
    <section class="era-section" id="command-${comm.yearTitle}">
        <div class="era-header reveal">
            <div class="era-year">${comm.yearTitle}</div>
            <div class="era-info">
                <h2>${idx === 0 ? 'CURRENT <span class="gradient-text">COMMAND</span>' : 'TERM <span style="color:var(--cyan)">' + comm.yearStr + '</span>'}</h2>
                <p>Committee Term ${comm.yearStr}</p>
            </div>
        </div>\n`;

          let presidents = comm.members.filter(m => getTier(m.pos) === 'gold');
          let core = comm.members.filter(m => getTier(m.pos) === 'cyan');
          let management = comm.members.filter(m => getTier(m.pos) === 'purple');
          let execs = comm.members.filter(m => getTier(m.pos) === 'exec');

          // President
          if (presidents.length > 0) {
              html += `        <p class="role-label reveal">Core Leadership</p>\n        <div class="president-wrap reveal">\n`;
              presidents.forEach(p => {
                  html += `            <div class="president-card">\n                <div class="avatar avatar-lg avatar-gold" style="margin:0 auto 1.5rem; box-shadow:0 0 30px rgba(245,158,11,0.3);"><i class="fa-solid fa-crown" style="color:var(--gold)"></i></div>\n                <h3 class="member-name">${p.name.toUpperCase()}</h3>\n                <p class="member-role" style="color:var(--gold);">${p.pos}</p>\n                <p class="dept">${p.batch}</p>\n            </div>\n`;
              });
              html += `        </div>\n\n`;
          }

          // Core
          if (core.length > 0) {
              html += `        <p class="role-label reveal">Core Operations</p>\n        <div class="roster-grid reveal" style="max-width:1100px; margin:0 auto 2.5rem;">\n`;
              core.forEach(c => {
                  let icon = getIcon(c.pos);
                  html += `            <div class="member-card tier-cyan">\n                <div class="avatar"><i class="fa-solid ${icon}"></i></div>\n                <h3 class="member-name">${c.name.toUpperCase()}</h3>\n                <p class="member-role">${c.pos}</p>\n                <p class="dept">${c.batch}</p>\n            </div>\n`;
              });
              html += `        </div>\n\n`;
          }

          // Management
          if (management.length > 0) {
              html += `        <p class="role-label reveal">Management Wing</p>\n        <div class="roster-grid reveal" style="max-width:1100px; margin:0 auto 2.5rem;">\n`;
              management.forEach(m => {
                  let icon = getIcon(m.pos);
                  html += `            <div class="member-card tier-purple">\n                <div class="avatar avatar-purple"><i class="fa-solid ${icon}"></i></div>\n                <h3 class="member-name">${m.name.toUpperCase()}</h3>\n                <p class="member-role">${m.pos}</p>\n                <p class="dept">${m.batch}</p>\n            </div>\n`;
              });
              html += `        </div>\n\n`;
          }

          // Execs
          if (execs.length > 0) {
              html += `        <div class="exec-card reveal" style="max-width:1100px; margin:0 auto 3rem;">\n            <h3><i class="fa-solid fa-users" style="color:var(--cyan); margin-right:8px;"></i>Executive Members — ${comm.yearStr}</h3>\n            <div class="exec-names">\n`;
              execs.forEach(e => {
                  html += `                <span class="exec-pill">${e.name} ${e.batch ? '(' + e.batch + ')' : ''}</span>\n`;
              });
              html += `            </div>\n        </div>\n`;
          }

          html += `    </section>\n    <div class="era-divider"></div>\n`;
      });

      fs.writeFileSync('generated_committees.html', html);
      console.log('Successfully generated committees into generated_committees.html');
  });
