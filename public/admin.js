document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('usernameInput');
    const passwordInput = document.getElementById('passwordInput');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginErrorMsg = document.getElementById('loginErrorMsg');
    
    const logoutBtn = document.getElementById('logoutBtn');
    const membersBody = document.getElementById('membersBody');
    
    // Modal Elements
    const editModal = document.getElementById('editModal');
    const modalTitle = document.getElementById('modalTitle');
    const editForm = document.getElementById('editForm');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    
    let isEditing = false;
    let oldEmail = '';
    let serverPublicKey = null;
    let currentTab = 'members'; // 'members' or 'recycle'

    // Fetch Public Key on Load
    const fetchPublicKey = async () => {
        try {
            const res = await fetch('/api/admin/public-key');
            const data = await res.json();
            if (data.success) {
                serverPublicKey = data.publicKey;
            }
        } catch (e) {
            console.error("Failed to fetch public key for secure login.");
        }
    };
    fetchPublicKey();

    // Check Session on Load
    const checkSession = async () => {
        try {
            const res = await fetch('/api/admin/me');
            const data = await res.json();
            if (data.success && data.isAdmin) {
                showDashboard();
            }
        } catch (e) {
            console.error("Session check failed", e);
        }
    };
    
    checkSession();

    // Login Handle
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        loginBtnText.style.display = 'none';
        loginSpinner.style.display = 'block';
        loginErrorMsg.textContent = '';
        
        try {
            if (!serverPublicKey) {
                loginErrorMsg.textContent = 'Secure connection not established. Please refresh.';
                return;
            }

            // Encrypt the payload
            const publicKey = forge.pki.publicKeyFromPem(serverPublicKey);
            const payloadStr = JSON.stringify({
                username: usernameInput.value,
                password: passwordInput.value
            });
            const encryptedBuffer = publicKey.encrypt(payloadStr, 'RSA-OAEP', {
                md: forge.md.sha256.create(),
                mgf1: {
                    md: forge.md.sha256.create()
                }
            });
            const encryptedPayload = forge.util.encode64(encryptedBuffer);

            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    encryptedPayload
                })
            });
            const data = await res.json();
            
            if (data.success) {
                showDashboard();
            } else {
                loginErrorMsg.textContent = data.error || 'Login failed';
            }
        } catch (err) {
            console.error('Login error:', err);
            loginErrorMsg.textContent = 'Error: ' + (err.message || 'Network error.');
        } finally {
            loginBtnText.style.display = 'block';
            loginSpinner.style.display = 'none';
        }
    });

    // Logout Handle
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await fetch('/api/admin/logout', { method: 'POST' });
            dashboardSection.style.display = 'none';
            loginSection.style.display = 'block';
            usernameInput.value = '';
            passwordInput.value = '';
        } catch(err) {}
    });

    // Show Dashboard
    const showDashboard = () => {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'flex';
        loadMembers();
    };

    // Tab switching logic
    const navMembers = document.getElementById('navMembers');
    const navRecycle = document.getElementById('navRecycle');
    const mainHeading = document.getElementById('mainHeading');
    const addMemberBtn = document.getElementById('addMemberBtn');

    navMembers.addEventListener('click', (e) => {
        e.preventDefault();
        currentTab = 'members';
        navMembers.parentElement.classList.add('active');
        navRecycle.parentElement.classList.remove('active');
        mainHeading.textContent = 'Member Directory';
        addMemberBtn.style.display = 'block';
        loadMembers();
    });

    navRecycle.addEventListener('click', (e) => {
        e.preventDefault();
        currentTab = 'recycle';
        navRecycle.parentElement.classList.add('active');
        navMembers.parentElement.classList.remove('active');
        mainHeading.textContent = 'Recycle Bin';
        addMemberBtn.style.display = 'none';
        loadRecycleBin();
    });

    // Load Members Data
    const loadMembers = async () => {
        try {
            const res = await fetch('/api/admin/members');
            const data = await res.json();
            if (data.success) {
                renderTable(data.data);
            }
        } catch (e) {
            console.error('Failed to load members', e);
        }
    };

    // Load Recycle Bin Data
    const loadRecycleBin = async () => {
        try {
            const res = await fetch('/api/admin/recycle');
            const data = await res.json();
            if (data.success) {
                renderTable(data.data);
            }
        } catch (e) {
            console.error('Failed to load recycle bin', e);
        }
    };

    // Render Table
    const renderTable = (members) => {
        membersBody.innerHTML = '';
        members.forEach(member => {
            const tr = document.createElement('tr');
            
            let actionButtons = '';
            if (currentTab === 'members') {
                actionButtons = `
                    <button class="btn-secondary edit-btn" data-email="${member.email}">Edit</button>
                    <button class="btn-danger del-btn" data-email="${member.email}">Del</button>
                `;
            } else {
                actionButtons = `
                    <button class="btn-secondary restore-btn" data-email="${member.email}">Restore</button>
                    <button class="btn-danger perm-del-btn" data-email="${member.email}">Perm Del</button>
                `;
            }

            tr.innerHTML = `
                <td>${member.email}</td>
                <td>${member.Member_Name}</td>
                <td>${member.Member_ID}</td>
                <td>${member.Batch}</td>
                <td>${member.Department}</td>
                <td class="action-btns">
                    ${actionButtons}
                </td>
            `;
            membersBody.appendChild(tr);
        });

        if (currentTab === 'members') {
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const email = btn.getAttribute('data-email');
                    const member = members.find(m => m.email === email);
                    if(member) openModal(member);
                });
            });

            document.querySelectorAll('.del-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const email = btn.getAttribute('data-email');
                    if (confirm(`Are you sure you want to move ${email} to the recycle bin?`)) {
                        await deleteMember(email);
                    }
                });
            });
        } else {
            document.querySelectorAll('.restore-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const email = btn.getAttribute('data-email');
                    await restoreMember(email);
                });
            });

            document.querySelectorAll('.perm-del-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const email = btn.getAttribute('data-email');
                    if (confirm(`WARNING: Are you sure you want to PERMANENTLY delete ${email}? This cannot be undone.`)) {
                        await permanentDeleteMember(email);
                    }
                });
            });
        }
    };

    // Delete Member (Moves to Recycle)
    const deleteMember = async (email) => {
        try {
            const res = await fetch(`/api/admin/members/${encodeURIComponent(email)}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                loadMembers();
            } else {
                alert(data.error);
            }
        } catch (e) {
            alert('Delete failed');
        }
    };

    // Restore Member
    const restoreMember = async (email) => {
        try {
            const res = await fetch(`/api/admin/recycle/restore/${encodeURIComponent(email)}`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                loadRecycleBin();
            } else {
                alert(data.error);
            }
        } catch (e) {
            alert('Restore failed');
        }
    };

    // Permanent Delete
    const permanentDeleteMember = async (email) => {
        try {
            const res = await fetch(`/api/admin/recycle/permanent/${encodeURIComponent(email)}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                loadRecycleBin();
            } else {
                alert(data.error);
            }
        } catch (e) {
            alert('Permanent Delete failed');
        }
    };


    // Open Modal
    document.getElementById('addMemberBtn').addEventListener('click', () => {
        openModal(null);
    });

    const openModal = (member) => {
        editModal.style.display = 'flex';
        if (member) {
            isEditing = true;
            oldEmail = member.email;
            modalTitle.textContent = "Edit Member";
            document.getElementById('editEmail').value = member.email;
            document.getElementById('editName').value = member.Member_Name;
            document.getElementById('editMemberId').value = member.Member_ID;
            document.getElementById('editBatch').value = member.Batch;
            document.getElementById('editRegistration').value = member.Registration;
            document.getElementById('editRollNo').value = member.Roll_No;
            document.getElementById('editDept').value = member.Department;
            document.getElementById('editMobile').value = member.Mobile_No;
            document.getElementById('editJoined').value = member.Joined || '';
            document.getElementById('editSolved').value = member.Problems_Solved || '0';
            document.getElementById('editRating').value = member.CP_Rating || '0';
            document.getElementById('editRank').value = member.Global_Rank || 'N/A';
            document.getElementById('editCFHandle').value = member.CF_Handle || '';
            document.getElementById('editCourse').value = member.Course_Status || 'None';
        } else {
            isEditing = false;
            oldEmail = '';
            modalTitle.textContent = "Add Member";
            editForm.reset();
        }
    };

    cancelEditBtn.addEventListener('click', () => {
        editModal.style.display = 'none';
    });

    // Save Form
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const memberData = {
            email: document.getElementById('editEmail').value,
            Member_Name: document.getElementById('editName').value,
            Member_ID: document.getElementById('editMemberId').value,
            Batch: document.getElementById('editBatch').value,
            Registration: document.getElementById('editRegistration').value,
            Roll_No: document.getElementById('editRollNo').value,
            Department: document.getElementById('editDept').value,
            Mobile_No: document.getElementById('editMobile').value,
            Joined: document.getElementById('editJoined').value,
            Problems_Solved: document.getElementById('editSolved').value,
            CP_Rating: document.getElementById('editRating').value,
            Global_Rank: document.getElementById('editRank').value,
            CF_Handle: document.getElementById('editCFHandle').value,
            Course_Status: document.getElementById('editCourse').value,
        };

        try {
            let res;
            if (isEditing) {
                res = await fetch(`/api/admin/members/${encodeURIComponent(oldEmail)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(memberData)
                });
            } else {
                res = await fetch(`/api/admin/members`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(memberData)
                });
            }

            const data = await res.json();
            if (data.success) {
                editModal.style.display = 'none';
                loadMembers();
            } else {
                alert(data.error || 'Failed to save');
            }
        } catch (e) {
            alert('Save failed');
        }
    });
});
