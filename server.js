require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const helmet = require('helmet');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { createObjectCsvWriter } = require('csv-writer');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// Enterprise RSA Security Layer Setup
console.log("Generating 2048-bit RSA Key Pair for secure login payload encryption...");
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});
console.log("RSA Key Pair generated successfully.");

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https://docs.google.com"],
      frameSrc: ["https://docs.google.com", "https://www.google.com"]
    }
  }
}));
app.use(cors());
app.use(express.json()); // Added for parsing JSON bodies
app.use(express.static('public')); 

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 2 // 2 hours
  }
}));

// Rate Limiting for Login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: { success: false, error: 'Too many login attempts from this IP, please try again after 15 minutes.' }
});

// Cache the database in memory for fast lookup
let members = [];
let deletedMembers = [];
const CSV_FILE = '11 april 2026 cpc member database - consolidated_cpc_members_final.csv';
const DELETED_CSV_FILE = 'deleted_members.csv';

// Predefined exact CSV Headers
const csvHeaders = [
    { id: 'Member_Name', title: 'Member_Name' },
    { id: 'Batch', title: 'Batch' },
    { id: 'Registration', title: 'Registration' },
    { id: 'Roll_No', title: 'Roll No.' },
    { id: 'Member_ID', title: 'Member_ID' },
    { id: 'email', title: 'email' },
    { id: 'Mobile_No', title: 'Mobile No.' },
    { id: 'Department', title: 'Department' },
    { id: 'Joined', title: 'cpc joining year' },
    { id: 'Problems_Solved', title: 'Problems_Solved' },
    { id: 'CP_Rating', title: 'CP_Rating' },
    { id: 'Global_Rank', title: 'Global_Rank' },
    { id: 'Course_Status', title: 'Course_Status' },
    { id: 'CF_Handle', title: 'CF_Handle' },
    { id: 'Password_Hash', title: 'Column 6' },
    { id: 'Column7', title: 'Column 7' },
    { id: 'Column8', title: 'Column 8' },
    { id: 'Column9', title: 'Column 9' },
    { id: 'Column10', title: 'Column 10' },
    { id: 'Column11', title: 'Column 11' },
    { id: 'Column12', title: 'Column 12' },
    { id: 'Column13', title: 'Column 13' },
    { id: 'Column14', title: 'Column 14' },
    { id: 'Column15', title: 'Column 15' },
    { id: 'Column16', title: 'Column 16' },
    { id: 'Column17', title: 'Column 17' }
];

const loadDatabase = () => {
  const newMembers = [];
  fs.createReadStream(CSV_FILE)
    .pipe(csv())
    .on('data', (data) => {
        newMembers.push({
            Member_Name: data['Member_Name'] || '',
            Batch: data['Batch'] || '',
            Registration: data['Registration'] || '',
            Roll_No: data['Roll No.'] || '',
            Member_ID: data['Member_ID'] || '',
            email: data['email'] || '', // Not applying lowercase directly to keep original state in CSV, handle in query
            Mobile_No: data['Mobile No.'] || '',
            Department: data['Department'] || '',
            Joined: data['cpc joining year'] || '',
            Problems_Solved: data['Problems_Solved'] || '0',
            CP_Rating: data['CP_Rating'] || '0',
            Global_Rank: data['Global_Rank'] || 'N/A',
            Course_Status: data['Course_Status'] || 'None',
            CF_Handle: data['CF_Handle'] || '',
            Password_Hash: data['Password_Hash'] || data['Column 6'] || '',
            Column7: data['Column 7'] || '',
            Column8: data['Column 8'] || '',
            Column9: data['Column 9'] || '',
            Column10: data['Column 10'] || '',
            Column11: data['Column 11'] || '',
            Column12: data['Column 12'] || '',
            Column13: data['Column 13'] || '',
            Column14: data['Column 14'] || '',
            Column15: data['Column 15'] || '',
            Column16: data['Column 16'] || '',
            Column17: data['Column 17'] || '',
        });
    })
    .on('end', () => {
      members = newMembers;
      console.log(`CSV Database Loaded: ${members.length} records found.`);
    });
};

const loadDeletedDatabase = () => {
  const newDeleted = [];
  if (!fs.existsSync(DELETED_CSV_FILE)) {
      console.log('No deleted_members.csv found. Starting with empty recycle bin.');
      return;
  }
  fs.createReadStream(DELETED_CSV_FILE)
    .pipe(csv())
    .on('data', (data) => newDeleted.push(data))
    .on('end', () => {
      deletedMembers = newDeleted;
      console.log(`Recycle Bin Loaded: ${deletedMembers.length} records found.`);
    });
};

loadDatabase();
loadDeletedDatabase();

// Utility function to write to CSV
const saveDatabase = async () => {
    const csvWriter = createObjectCsvWriter({
        path: CSV_FILE,
        header: csvHeaders
    });
    await csvWriter.writeRecords(members);
};

const saveDeletedDatabase = async () => {
    const csvWriter = createObjectCsvWriter({
        path: DELETED_CSV_FILE,
        header: csvHeaders
    });
    await csvWriter.writeRecords(deletedMembers);
};

// ========================
// PUBLIC API
// ========================

// API endpoint to look up member by email
app.get('/api/member', (req, res) => {
  const queryEmail = req.query.email;
  if (!queryEmail) {
    return res.status(400).json({ error: 'Email parameter is required.' });
  }

  const searchEmail = queryEmail.toLowerCase().trim();
  const match = members.find(m => m.email.toLowerCase().trim() === searchEmail);

  if (match) {
    res.json({ success: true, data: {
        Member_Name: match.Member_Name,
        Batch: match.Batch,
        Registration: match.Registration,
        Roll_No: match.Roll_No,
        Member_ID: match.Member_ID,
        email: match.email.toLowerCase().trim(),
        Mobile_No: match.Mobile_No,
        Department: match.Department,
        Joined: match.Joined,
        Problems_Solved: match.Problems_Solved,
        CP_Rating: match.CP_Rating,
        Global_Rank: match.Global_Rank,
        Course_Status: match.Course_Status,
        CF_Handle: match.CF_Handle
    } });
  } else {
    setTimeout(() => {
        res.status(404).json({ success: false, error: 'Member not found. Please check your email and try again.' });
    }, 300);
  }
});

// ========================
// MEMBER DASHBOARD API
// ========================

// Login for General Members
app.post('/api/member/login', loginLimiter, (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and Password are required.' });
    }

    const searchEmail = email.toLowerCase().trim();

    // Find member
    const match = members.find(m => m.email.toLowerCase().trim() === searchEmail);

    if (match) {
        // If user has a password hash, verify via bcrypt
        if (match.Password_Hash && match.Password_Hash.length > 10) {
            const isValid = bcrypt.compareSync(password, match.Password_Hash);
            if (isValid) {
                req.session.memberEmail = match.email.toLowerCase().trim();
                return res.json({ success: true, message: 'Login successful' });
            }
        } 
        // Fallback: If no password hash, authenticate using the exact Member ID
        else if (match.Member_ID.trim() === password.trim()) {
            req.session.memberEmail = match.email.toLowerCase().trim();
            return res.json({ success: true, message: 'Login successful via default ID' });
        }
    }

    setTimeout(() => {
        res.status(401).json({ success: false, error: 'Invalid Email or Password.' });
    }, 500);
});

// Member Authentication Middleware
const requireMember = (req, res, next) => {
    if (req.session && req.session.memberEmail) {
        next();
    } else {
        res.status(401).json({ success: false, error: 'Unauthorized. Please log in.' });
    }
};

// Update Member Password
app.post('/api/member/password/update', requireMember, async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    const searchEmail = req.session.memberEmail;
    const match = members.find(m => m.email.toLowerCase().trim() === searchEmail);

    if (match) {
        match.Password_Hash = bcrypt.hashSync(newPassword, 10);
        await saveDatabase();
        res.json({ success: true, message: 'Password updated successfully.' });
    } else {
        res.status(404).json({ success: false, error: 'Member not found.' });
    }
});

// Member Authentication Middleware
const requireMember = (req, res, next) => {
    if (req.session && req.session.memberEmail) {
        next();
    } else {
        res.status(401).json({ success: false, error: 'Unauthorized. Please log in.' });
    }
};

// Fetch Logged-in Member Data
app.get('/api/member/me', requireMember, (req, res) => {
    const searchEmail = req.session.memberEmail;
    const match = members.find(m => m.email.toLowerCase().trim() === searchEmail);

    if (match) {
        // Return public + progress fields
        res.json({ success: true, data: {
            Member_Name: match.Member_Name,
            Batch: match.Batch,
            Registration: match.Registration,
            Roll_No: match.Roll_No,
            Member_ID: match.Member_ID,
            email: match.email.toLowerCase().trim(),
            Department: match.Department,
            Joined: match.Joined,
            Problems_Solved: match.Problems_Solved,
            CP_Rating: match.CP_Rating,
            Global_Rank: match.Global_Rank,
            Course_Status: match.Course_Status,
            CF_Handle: match.CF_Handle
        } });
    } else {
        res.status(404).json({ success: false, error: 'Member profile lost.' });
    }
});

// Logout for General Members
app.post('/api/member/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// ========================
// ADMIN API
// ========================

// Require admin authentication middleware
const requireAdmin = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        next();
    } else {
        res.status(401).json({ success: false, error: 'Unauthorized. Please log in.' });
    }
};

// Public Key Endpoint
app.get('/api/admin/public-key', (req, res) => {
    res.json({ success: true, publicKey });
});

// Login API
app.post('/api/admin/login', loginLimiter, (req, res) => {
    const { encryptedPayload } = req.body;

    if (!encryptedPayload) {
        return res.status(400).json({ success: false, error: 'Encrypted payload is required.' });
    }

    let username, password;
    try {
        // Decrypt the payload via RSA-OAEP
        const decryptedBuffer = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
            },
            Buffer.from(encryptedPayload, 'base64')
        );
        
        const decryptedStr = decryptedBuffer.toString('utf8');
        const parsed = JSON.parse(decryptedStr);
        username = parsed.username;
        password = parsed.password;
    } catch (e) {
        console.error("Decryption error:", e);
        return res.status(400).json({ success: false, error: 'Invalid or malformed encrypted payload.' });
    }
    
    // We get hashed password and expected username from .env
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password required.' });
    }

    if (username === adminUsername && bcrypt.compareSync(password, adminPasswordHash)) {
        req.session.isAdmin = true;
        res.json({ success: true, message: 'Logged in successfully.' });
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }
});

// Logout API
app.post('/api/admin/logout', requireAdmin, (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ success: false, error: 'Failed to logout.' });
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Logged out successfully.' });
    });
});

// Check Session API
app.get('/api/admin/me', (req, res) => {
    if (req.session && req.session.isAdmin) {
        res.json({ success: true, isAdmin: true });
    } else {
        res.json({ success: false, isAdmin: false });
    }
});

// Get leaderboard (Top performers by rating)
app.get('/api/leaderboard', (req, res) => {
    const leaderboard = members
        .filter(m => m.CP_Rating && !isNaN(parseInt(m.CP_Rating)) && parseInt(m.CP_Rating) > 0)
        .sort((a, b) => parseInt(b.CP_Rating) - parseInt(a.CP_Rating))
        .slice(0, 10)
        .map(m => ({
            name: m.Member_Name,
            rating: m.CP_Rating,
            solved: m.Problems_Solved,
            handle: m.CF_Handle
        }));
    res.json({ success: true, data: leaderboard });
});

// Get all members for admin
app.get('/api/admin/members', requireAdmin, (req, res) => {
    res.json({ success: true, data: members });
});

// Add new member
app.post('/api/admin/members', requireAdmin, async (req, res) => {
    const newMember = req.body;
    
    // Default columns
    for(let i=1; i<=17; i++) {
        if (!newMember[`Column${i}`]) {
            newMember[`Column${i}`] = '';
        }
    }
    
    members.push(newMember);
    await saveDatabase();
    res.json({ success: true, message: 'Member added successfully.' });
});

// Update member
app.put('/api/admin/members/:email', requireAdmin, async (req, res) => {
    const targetEmail = req.params.email;
    const updateData = req.body;

    const index = members.findIndex(m => m.email === targetEmail);
    if (index === -1) {
        return res.status(404).json({ success: false, error: 'Member not found.' });
    }

    members[index] = { ...members[index], ...updateData };
    await saveDatabase();
    res.json({ success: true, message: 'Member updated successfully.' });
});

// Delete member (Soft Delete)
app.delete('/api/admin/members/:email', requireAdmin, async (req, res) => {
    const targetEmail = req.params.email;
    const initialLen = members.length;
    
    // Find member to move to deleted array
    const memberToDelete = members.find(m => m.email === targetEmail);
    
    members = members.filter(m => m.email !== targetEmail);
    
    if (members.length === initialLen) {
        return res.status(404).json({ success: false, error: 'Member not found.' });
    }

    if (memberToDelete) {
        deletedMembers.push(memberToDelete);
        await saveDeletedDatabase();
    }

    await saveDatabase();
    res.json({ success: true, message: 'Member moved to recycle bin successfully.' });
});

// Get Recycle Bin records
app.get('/api/admin/recycle', requireAdmin, (req, res) => {
    res.json({ success: true, data: deletedMembers });
});

// Restore from Recycle Bin
app.post('/api/admin/recycle/restore/:email', requireAdmin, async (req, res) => {
    const targetEmail = req.params.email;
    const index = deletedMembers.findIndex(m => m.email === targetEmail);
    
    if (index === -1) {
        return res.status(404).json({ success: false, error: 'Member not found in recycle bin.' });
    }

    const [restoredMember] = deletedMembers.splice(index, 1);
    members.push(restoredMember);
    
    await saveDatabase();
    await saveDeletedDatabase();
    res.json({ success: true, message: 'Member restored successfully.' });
});

// Permanent Delete from Recycle Bin
app.delete('/api/admin/recycle/permanent/:email', requireAdmin, async (req, res) => {
    const targetEmail = req.params.email;
    const initialLen = deletedMembers.length;
    
    deletedMembers = deletedMembers.filter(m => m.email !== targetEmail);
    
    if (deletedMembers.length === initialLen) {
        return res.status(404).json({ success: false, error: 'Member not found in recycle bin.' });
    }

    await saveDeletedDatabase();
    res.json({ success: true, message: 'Member permanently deleted from database.' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
