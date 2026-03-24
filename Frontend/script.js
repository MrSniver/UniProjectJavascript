const API_BASE_URL = 'http://13.53.174.126:3000/api';

//funkcjonalność popapów banowania użytkownika
function openBanPopup() {
    const popup = document.getElementById('banPopup');
    if (popup) {
        popup.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeBanPopup() {
    const popup = document.getElementById('banPopup');
    if (popup) {
        popup.classList.remove('show');
        document.body.style.overflow = 'auto';
        clearBanForm();
    }
}

function clearBanForm() {
    document.getElementById('banReason').value = '';
    document.getElementById('banDescription').value = '';
    document.getElementById('banDuration').value = '';
}

async function submitBan() {
    const reason = document.getElementById('banReason').value;
    const description = document.getElementById('banDescription').value;
    const duration = document.getElementById('banDuration').value;

    if (!reason || !description) {
        alert('Proszę wypełnić wszystkie wymagane pola');
        return;
    }

    if (!duration) {
        alert('Proszę wybrać czas trwania banu lub datę końca');
        return;
    }

    // Get selected user ID
    const selectedUserId = localStorage.getItem('selectedUserId');
    if (!selectedUserId) {
        alert('Nie wybrano użytkownika do zbanowania');
        return;
    }

    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Musisz być zalogowany!');
        return;
    }

    try {
        let banTo;
        if (duration === 'permanent') {
            banTo = null; // or use a far future date
        } else {
            const now = new Date();
            banTo = new Date(now.getTime() + (parseInt(duration) * 24 * 60 * 60 * 1000)).toISOString();
        }

        const banFrom = new Date().toISOString();

        const requestBody = {
            userId: selectedUserId,
            reason: reason,
            description: description,
            banFrom: banFrom,
            banTo: banTo
        };

        const response = await fetch(`${API_BASE_URL}/adminpanel/banuser`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            const selectedUsername = localStorage.getItem('selectedUsername') || 'Użytkownik';
            const endDateText = banTo ? formatDate(new Date(banTo)) : 'Permanent';
            
            alert(`${selectedUsername} został zbanowany!\n\nPowód: ${reason}\nOpis: ${description}\nBan od: ${formatDate(new Date(banFrom))}\nBan do: ${endDateText}`);
            closeBanPopup();
            
            // Refresh ban list if on ban list page
            if (typeof loadBanList === 'function') {
                loadBanList();
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Ban API Error:', {
                status: response.status,
                statusText: response.statusText,
                errorData: errorData,
                requestBody: requestBody
            });
            alert(`Błąd podczas banowania użytkownika (${response.status}): ${errorData.message || errorData.error || response.statusText || 'Nieznany błąd'}`);
        }
    } catch (error) {
        console.error('Error banning user:', error);
        console.error('Request details:', {
            url: `${API_BASE_URL}/adminpanel/banuser`,
            selectedUserId: selectedUserId,
            token: token ? 'present' : 'missing'
        });
        alert('Błąd połączenia z serwerem: ' + error.message);
    }
}

async function unBan() {
    // Get selected user ID
    const selectedUserId = localStorage.getItem('selectedUserId');
    if (!selectedUserId) {
        alert('Nie wybrano użytkownika do odbanowania');
        return;
    }

    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Musisz być zalogowany!');
        return;
    }

    const selectedUsername = localStorage.getItem('selectedUsername') || 'Użytkownik';
    
    // Confirm unban action
    if (!confirm(`Czy na pewno chcesz odbanować użytkownika ${selectedUsername}?`)) {
        return;
    }

    const requestBody = {
        userId: selectedUserId
    };

    try {
        const response = await fetch(`${API_BASE_URL}/adminpanel/unbanuser`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            alert(`${selectedUsername} został odbanowany!`);
            
            // Refresh ban list if on ban list page
            if (typeof loadBanList === 'function') {
                loadBanList();
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            alert(`Błąd podczas odbanowywania użytkownika: ${errorData.message || 'Nieznany błąd'}`);
        }
    } catch (error) {
        console.error('Error unbanning user:', error);
        alert('Błąd połączenia z serwerem');
    }
}

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

document.addEventListener('DOMContentLoaded', function() {
    const popup = document.getElementById('banPopup');
    if (popup) {
        popup.addEventListener('click', function(e) {
            if (e.target === popup) {
                closeBanPopup();
            }
        });
    }
    
    const userTableBody = document.getElementById('userTableBody');
    if (userTableBody) {
        if (isUserLoggedIn()) {
            fetchUsers(1);
        }
    }
    
    initializeUserContext();
    displayRegisteredUsername();
});

function initializeUserContext() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedUser = urlParams.get('user');
    
    if (selectedUser) {
        const searchedUserElement = document.getElementById('searchedUser');
        if (searchedUserElement) {
            searchedUserElement.textContent = selectedUser;
        }
        
        updateNavigationLinks(selectedUser);
        
        const banPopupTitle = document.querySelector('.popup-header h3');
        if (banPopupTitle) {
            banPopupTitle.textContent = `Zbanuj użytkownika: ${selectedUser}`;
        }
    }
}

function updateNavigationLinks(username) {
    const navLinks = [
        'paneladminalistabanow.html',
        'paneladminaaktywnebany.html', 
        'paneladminahistoriagier.html',
        'paneladminahistoriaplatnosci.html',
        'paneladminazmiennazwe.html',
        'paneladminanadajadmina.html'
    ];
    
    navLinks.forEach(page => {
        const link = document.querySelector(`a[href*="${page}"]`);
        if (link) {
            link.href = `${page}?user=${encodeURIComponent(username)}`;
        }
    });
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeBanPopup();
    }
});


//Paginacja i filtrowanie użytkowników
function applyFilters() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Musisz być zalogowany!');
        return;
    }

    const filterData = {};
    
    const usernameField = document.getElementById('usernameFilter');
    if (usernameField && usernameField.value) {
        filterData.username = usernameField.value;
    }
    
    const dateFromField = document.getElementById('dateFromFilter');
    if (dateFromField && dateFromField.value) {
        filterData.created_from = dateFromField.value;
    }
    
    const dateToField = document.getElementById('dateToFilter');
    if (dateToField && dateToField.value) {
        filterData.created_before = dateToField.value;
    }
    
    const verifiedField = document.getElementById('verifiedFilter');
    if (verifiedField && verifiedField.value) {
        filterData.age_verified = verifiedField.value === 'tak';
    }
    
    const bannedField = document.getElementById('bannedFilter');
    if (bannedField && bannedField.value) {
        filterData.banned = bannedField.value === 'tak';
    }
    
    if (Object.keys(filterData).length === 0) {
        const usernameInput = document.querySelector('input[placeholder="Nazwa użytkownika"]');
        if (usernameInput && usernameInput.value) {
            filterData.username = usernameInput.value;
        }
    }
    
    console.log('Filter data:', filterData);

    const isUserListPage = document.getElementById('userTableBody') !== null;
    const isSearchPage = document.getElementById('searchResults') !== null;
    
    if (isUserListPage) {
        fetchUsers(1, filterData);
    } else if (isSearchPage) {
        // For search page, use dedicated search function
        searchUsersExact(filterData);
    } else {
        updateSearchResults([]);
    }
}

// Dedicated search function for paneladminauzytkownik.html page
async function searchUsersExact(filterData) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Musisz być zalogowany!');
        return;
    }

    try {
        console.log('Searching with exact filters:', filterData);
        
        // If only username is provided and no other filters, use the getusersbyname endpoint
        if (filterData.username && Object.keys(filterData).length === 1) {
            const response = await fetch(`${API_BASE_URL}/adminpanel/getusersbyname/${encodeURIComponent(filterData.username)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Search response:', data);
                
                // The getusersbyname endpoint returns {users: [...]}
                const users = data.users || [];
                updateSearchResults(users);
            } else {
                console.error('Search failed:', response.status);
                updateSearchResults([]);
                alert('Błąd podczas wyszukiwania użytkowników');
            }
        } else {
            // For complex filters, use the getpagedusers endpoint
            const params = new URLSearchParams(filterData);
            const url = `${API_BASE_URL}/adminpanel/getpagedusers?${params}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                updateSearchResults(data.users || []);
            } else {
                console.error('Search failed:', response.status);
                updateSearchResults([]);
                alert('Błąd podczas wyszukiwania użytkowników');
            }
        }
    } catch (error) {
        console.error('Error searching users:', error);
        updateSearchResults([]);
        alert('Błąd połączenia z serwerem');
    }
}

// Search users function for admin search page
async function searchUsers(filterData) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Musisz być zalogowany!');
        return;
    }

    try {
        const params = new URLSearchParams(filterData);
        const url = `${API_BASE_URL}/adminpanel/getpagedusers?${params}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateSearchResults(data.users || []);
        } else {
            console.error('Search failed:', response.status);
            updateSearchResults([]);
            alert('Błąd podczas wyszukiwania użytkowników');
        }
    } catch (error) {
        console.error('Error searching users:', error);
        updateSearchResults([]);
        alert('Błąd połączenia z serwerem');
    }
}

// User selection functionality for admin panels
function selectUser(userId, username) {
    // Store userId in localStorage
    localStorage.setItem('selectedUserId', userId);
    localStorage.setItem('selectedUsername', username);
    
    // Update the "Wybrany użytkownik" display on current page
    const searchedUserElements = document.querySelectorAll('#searchedUser');
    searchedUserElements.forEach(element => {
        element.textContent = username;
    });
    
    // Navigate to admin ban list page with user context
    window.location.href = `paneladminalistabanow.html?user=${encodeURIComponent(username)}&userId=${encodeURIComponent(userId)}`;
}

// Load selected user on page load
function loadSelectedUser() {
    const urlParams = new URLSearchParams(window.location.search);
    const userFromUrl = urlParams.get('user');
    const userIdFromUrl = urlParams.get('userId');
    
    let selectedUsername = userFromUrl || localStorage.getItem('selectedUsername');
    let selectedUserId = userIdFromUrl || localStorage.getItem('selectedUserId');
    
    if (selectedUsername) {
        const searchedUserElements = document.querySelectorAll('#searchedUser');
        searchedUserElements.forEach(element => {
            element.textContent = selectedUsername;
        });
        
        // Update localStorage if we got user from URL
        if (userFromUrl) localStorage.setItem('selectedUsername', selectedUsername);
        if (userIdFromUrl) localStorage.setItem('selectedUserId', selectedUserId);
    }
}

// Authentication functions
function isUserLoggedIn() {
    return localStorage.getItem('token') !== null;
}

function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const loggedInSection = document.getElementById('logged-in-section');
    const loggedInUserPanel = document.getElementById('logged-in-user-panel');
    const notLoggedInSection = document.getElementById('not-logged-in-section');
    
    if (token) {
        if (loggedInSection) loggedInSection.style.display = 'flex';
        if (loggedInUserPanel) loggedInUserPanel.style.display = 'flex';
        if (notLoggedInSection) notLoggedInSection.style.display = 'none';
    } else {
        if (loggedInSection) loggedInSection.style.display = 'none';
        if (loggedInUserPanel) loggedInUserPanel.style.display = 'none';
        if (notLoggedInSection) notLoggedInSection.style.display = 'flex';
    }
}

function checkAdminStatus() {
    const adminButtons = document.querySelectorAll('a[href*="PanelAdmin"]');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    
    adminButtons.forEach(button => {
        if (isAdmin) {
            button.style.display = 'inline-block';
        } else {
            button.style.display = 'none';
        }
    });
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
    window.location.href = '../index.html';
}

function fetchUsers(page = 1, filters = {}) {
    const params = new URLSearchParams({
        page: page,
        limit: usersPerPage,
        ...filters
    });
    
    const url = `${API_BASE_URL}/adminpanel/getpagedusers?${params}`;
    
    makeAuthenticatedRequest(url)
        .then(response => response.json())
        .then(data => {
            console.log('Users data:', data);
            
            if (data.users && Array.isArray(data.users)) {
                allUsersData = data.users;
                totalUsers = data.totalItems || data.totalUsers || data.users.length;
                currentPage = page;
                
                updateUserTableFromAPI(data.users, page);
                updatePaginationControls();
            } else {
                console.error('Invalid response format:', data);
                alert('Błąd pobierania danych użytkowników');
            }
        })
        .catch(error => {
            console.error('Error fetching users:', error);
            alert('Błąd pobierania danych użytkowników');
        });
}

function updateSearchResults(users) {
    const tbody = document.getElementById('searchResults');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9">Nie znaleziono użytkowników</td></tr>';
        return;
    }
    
    users.forEach((user, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td class="userLogin">${user.username || user.login || ''}</td>
            <td>${user.email || ''}</td>
            <td>${user.username || user.nickname || ''}</td>
            <td>${user.age_verified ? 'Tak' : 'Nie'}</td>
            <td>${user.created_at ? new Date(user.created_at).toLocaleDateString('pl-PL') : ''}</td>
            <td>${user.currency || user.balance || '0'}</td>
            <td>${user.banned ? 'Tak' : 'Nie'}</td>
            <td><button onclick="selectUser('${user.id || user.user_id}', '${user.username || user.nickname}')">+</button></td>
        `;
        tbody.appendChild(row);
    });
}


let currentPage = 1;
let usersPerPage = 10;
let totalUsers = 0;
let allUsersData = [];

function updateUserTable(users, page = 1) {
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;
    
    allUsersData = users;
    totalUsers = users.length;
    currentPage = page;
    
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const pageUsers = users.slice(startIndex, endIndex);
    
    tbody.innerHTML = '';
    
    if (pageUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9">Brak użytkowników do wyświetlenia</td></tr>';
    } else {
        pageUsers.forEach((user, index) => {
            const globalIndex = startIndex + index + 1;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${globalIndex}</td>
                <td class="userLogin">${user.login || ''}</td>
                <td>${user.email || ''}</td>
                <td>${user.username || ''}</td>
                <td>${user.verified ? 'Tak' : 'Nie'}</td>
                <td>${user.createdAt || ''}</td>
                <td>${user.currency || '0'}</td>
                <td>${user.banned ? 'Tak' : 'Nie'}</td>
                <td><a href="paneladminalistabanow.html?user=${user.login}"><button>+</button></a></td>
            `;
            tbody.appendChild(row);
        });
    }
    
    updatePaginationControls();
}

function updatePaginationControls() {
    const totalPages = Math.ceil(totalUsers / usersPerPage);
    
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        pageInfo.textContent = `Strona ${currentPage} z ${totalPages} (${totalUsers} wyników)`;
    }
    
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    
    const pageNumbers = document.getElementById('pageNumbers');
    if (pageNumbers) {
        let numbersHtml = '';
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        
        for (let i = start; i <= end; i++) {
            numbersHtml += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        }
        pageNumbers.innerHTML = numbersHtml;
    }
}

function changePage(direction) {
    const newPage = currentPage + direction;
    const totalPages = Math.ceil(totalUsers / usersPerPage);
    
    if (newPage >= 1 && newPage <= totalPages) {
        if (typeof fetchUsers === 'function') {
            // Pobierz aktualne filtry
            const filterData = getCurrentFilters();
            fetchUsers(newPage, filterData);
        } else {
            updateUserTable(allUsersData, newPage);
        }
    }
}

function goToPage(page) {
    if (typeof fetchUsers === 'function') {
        const filterData = getCurrentFilters();
        fetchUsers(page, filterData);
    } else {
        updateUserTable(allUsersData, page);
    }
}

function getCurrentFilters() {
    const filterData = {};
    
    const usernameField = document.getElementById('usernameFilter');
    if (usernameField && usernameField.value) {
        filterData.username = usernameField.value;
    }
    
    const dateFromField = document.getElementById('dateFromFilter');
    if (dateFromField && dateFromField.value) {
        filterData.created_from = dateFromField.value;
    }
    
    const dateToField = document.getElementById('dateToFilter');
    if (dateToField && dateToField.value) {
        filterData.created_before = dateToField.value;
    }
    
    const verifiedField = document.getElementById('verifiedFilter');
    if (verifiedField && verifiedField.value) {
        filterData.age_verified = verifiedField.value === 'tak';
    }
    
    const bannedField = document.getElementById('bannedFilter');
    if (bannedField && bannedField.value) {
        filterData.banned = bannedField.value === 'tak';
    }
    
    return filterData;
}

function updateUserTableFromAPI(users, page = 1) {
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;
    
    currentPage = page;
    
    tbody.innerHTML = '';
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9">Brak użytkowników do wyświetlenia</td></tr>';
        return;
    }
    
    users.forEach((user, index) => {
        const globalIndex = ((currentPage - 1) * usersPerPage) + index + 1;
        const row = document.createElement('tr');
        
        const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString('pl-PL') : '';
        
        // Try multiple possible field names for user ID
        const userId = user.id || user.user_id || user.userid || user.userId;
        const username = user.username || user.nickname || user.login;
        
        row.innerHTML = `
            <td>${globalIndex}</td>
            <td class="userLogin">${username || ''}</td>
            <td>${user.email || ''}</td>
            <td>${username || ''}</td>
            <td>${user.age_verified ? 'Tak' : 'Nie'}</td>
            <td>${createdAt}</td>
            <td>${user.currency || '0'}</td>
            <td>${user.banned ? 'Tak' : 'Nie'}</td>
            <td><button onclick="selectUser('${userId}', '${username}')">+</button></td>
        `;
        tbody.appendChild(row);
    });
    
    updatePaginationControls();
}

function getExtendedTestUserData() {
    const users = [];
    for (let i = 1; i <= 25; i++) {
        users.push({
            login: `user${i}`,
            email: `user${i}@example.com`,
            username: `username${i}`,
            verified: i % 2 === 0,
            createdAt: `${String(i).padStart(2, '0')}.01.2026 12:00:00`,
            currency: `${1000 * i}`,
            banned: i % 5 === 0
        });
    }
    return users;
}

function toggleMobileMenu() {
    const nav = document.querySelector('nav');
    if (nav) {
        nav.classList.toggle('mobile-menu-open');
    }
}

// Dla menu hamburger - zamykanie menu po kliknięciu poza nim
document.addEventListener('click', function(event) {
    const nav = document.querySelector('nav');
    const hamburger = document.querySelector('.hamburger-menu');
    
    if (nav && hamburger) {
        if (!nav.contains(event.target) && !hamburger.contains(event.target)) {
            nav.classList.remove('mobile-menu-open');
        }
    }
});

async function adminGrant() {
    // Get selected user ID
    const selectedUserId = localStorage.getItem('selectedUserId');
    const selectedUsername = localStorage.getItem('selectedUsername');
    
    if (!selectedUserId) {
        alert('Nie wybrano użytkownika. Wybierz użytkownika aby nadać mu uprawnienia administratora.');
        return;
    }

    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Musisz być zalogowany!');
        return;
    }

    try {
        const requestBody = {
            userId: selectedUserId
        };

        const response = await fetch(`${API_BASE_URL}/adminpanel/grantadmin`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            alert(`Nadano uprawnienia administratora użytkownikowi "${selectedUsername || 'Użytkownik'}"!`);
        } else {
            const errorData = await response.text();
            alert(`Błąd podczas nadawania uprawnień administratora (${response.status}): ${errorData || response.statusText || 'Nieznany błąd'}`);
        }
    } catch (error) {
        console.error('Error granting admin:', error);
        alert('Błąd połączenia z serwerem: ' + error.message);
    }
}

function adminRevoke(){
    alert(`Zabrano admina użytkownikowi! (Funkcja nie jest jeszcze zaimplementowana)`)
}

async function usernameChange() {
    const newUsername = document.getElementById('newUsername').value;
    
    if (!newUsername || newUsername.trim() === '') {
        alert('Proszę wprowadzić nową nazwę użytkownika');
        return;
    }

    // Get selected user ID
    const selectedUserId = localStorage.getItem('selectedUserId');
    const selectedUsername = localStorage.getItem('selectedUsername');
    
    if (!selectedUserId) {
        alert('Nie wybrano użytkownika. Wybierz użytkownika aby zmienić jego nazwę.');
        return;
    }

    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Musisz być zalogowany!');
        return;
    }

    try {
        const requestBody = {
            userId: selectedUserId,
            newNickname: newUsername.trim()
        };

        const response = await fetch(`${API_BASE_URL}/adminpanel/changeusernickname`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            alert(`Zmieniono nazwę użytkownika "${selectedUsername || 'Użytkownik'}" na "${newUsername}"`);
            
            // Clear the input field
            document.getElementById('newUsername').value = '';
            
            // Update localStorage with new username if needed
            localStorage.setItem('selectedUsername', newUsername);
            
            // Update display
            const searchedUserElements = document.querySelectorAll('#searchedUser');
            searchedUserElements.forEach(element => {
                element.textContent = newUsername;
            });
        } else {
            const errorData = await response.text();
            alert(`Błąd podczas zmiany nazwy użytkownika (${response.status}): ${errorData || response.statusText || 'Nieznany błąd'}`);
        }
    } catch (error) {
        console.error('Error changing username:', error);
        alert('Błąd połączenia z serwerem: ' + error.message);
    }
}

// Funkcjonalność slotów
const symbols = ['../Placeholdery/cherries.png', '../Placeholdery/lemon.png', '../Placeholdery/diamond.png', '../Placeholdery/bell.png', '../Placeholdery/seven.png', '../Placeholdery/clover.png'];

function spinSlots() {
    const resultDiv = document.getElementById('result');
    const winningsDiv = document.getElementById('winnings');
    const betAmount = parseInt(document.getElementById('betAmount').value) || 10;
    
    resultDiv.textContent = 'Kręci się...';
    winningsDiv.textContent = '';

    // Animacja kręcenia
    let spins = 0;
    const spinInterval = setInterval(() => {
        const reel1Symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const reel2Symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const reel3Symbol = symbols[Math.floor(Math.random() * symbols.length)];

        document.getElementById('reel1').innerHTML = `<img src="${reel1Symbol}" alt="symbol">`;
        document.getElementById('reel2').innerHTML = `<img src="${reel2Symbol}" alt="symbol">`;
        document.getElementById('reel3').innerHTML = `<img src="${reel3Symbol}" alt="symbol">`;
        spins++;
        
        if (spins > 20) {
            clearInterval(spinInterval);
            
            // Pobierz ostateczne symbole
            const reel1 = document.getElementById('reel1').innerHTML;
            const reel2 = document.getElementById('reel2').innerHTML;
            const reel3 = document.getElementById('reel3').innerHTML;

            // Zlicz identyczne symbole
            let matchCount = 0;
            if (reel1 === reel2 && reel2 === reel3) {
                matchCount = 3; // Wszystkie 3 takie same
            } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
                matchCount = 2; // Dwa takie same
            } else {
                matchCount = 0; // Żadne nie pasują
            }

            // Wylicz wygraną
            let winnings = 0;
            if (matchCount === 3) {
                winnings = betAmount * 10;
                resultDiv.textContent = 'MEGA BIG WIN!';
            } else if (matchCount === 2) {
                winnings = betAmount * 2;
                resultDiv.textContent = 'Nieźle! Dawaj dalej';
            } else {
                winnings = 0;
                resultDiv.textContent = 'Przegrana! Spróbuj jeszcze raz...';
            }

            // Wyświetl wygrane
            if (winnings > 0) {
                winningsDiv.textContent = `Wygrywasz: ${winnings} PLN`;
            }
        }
    }, 100);
}

// ===== Funkcje do integracji z backendem - Logowanie i Rejestracja =====

// Logowanie użytkownika
function handleLogin(event) {
    if (event) event.preventDefault();
    
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberMe = document.getElementById('remember')?.checked || false;
    
    const username = usernameInput?.value;
    const password = passwordInput?.value;
    
    if (!username || !password) {
        alert('Wypełnij wszystkie pola!');
        return;
    }
    
    console.log('Sending login request...');
    
    fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(response => {
        console.log('Login response status:', response.status);
        
        if (response.status === 200) {
            return response.json();
        } else {
            return response.json().then(errorData => {
                throw new Error(errorData.message || 'Błąd logowania');
            });
        }
    })
    .then(data => {
        console.log('Login successful:', data);
        
        // Store token consistently with the rest of the application
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('username', username);
        
        window.location.href = '../index.html';
    })
    .catch(error => {
        console.error('Login error:', error);
        alert(error.message || 'Błąd połączenia z serwerem');
    });
}

// Weryfikacja kodu 2FA przy logowaniu
function handleLoginVerification(event) {
    if (event) event.preventDefault();
    
    const codeInputs = document.querySelectorAll('.login2-container .code-input');
    const code = Array.from(codeInputs).map(input => input.value).join('');
    
    console.log('Login verification code:', code);
    
}

// Resetowanie hasła
function handleForgotPassword(event) {
    if (event) event.preventDefault();
    
    const email = prompt('Podaj adres email przypisany do konta:');
    
    if (!email) return;
    
    console.log('Password reset request for:', email);
    
    alert('Link do resetowania hasła został wysłany na podany adres email');
}

// Rejestracja użytkownika
function handleRegister(event) {
    if (event) event.preventDefault();
    
    const usernameInput = document.querySelector('.register-container input[type="text"]');
    const emailInput = document.querySelector('.register-container input[type="email"]');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const twoFactorEnabled = document.getElementById('twoFactor')?.checked || false;
    
    const username = usernameInput?.value;
    const email = emailInput?.value;
    const password = passwordInput?.value;
    const passwordConfirm = confirmPasswordInput?.value;
    
    if (password !== passwordConfirm) {
        alert('Hasła nie są identyczne!');
        return;
    }
    
    if (!username || !email || !password) {
        alert('Wypełnij wszystkie pola!');
        return;
    }
    
    console.log('Sending registration request...');
    
    fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password,
            email: email
        })
    })
    .then(response => {
        console.log('Response received:', response.status);
        
        if (response.status === 201) {
            console.log('Success! Redirecting...');
            localStorage.setItem('registeredUsername', username);
            window.location.href = 'register2.html';
        } else {
            response.text().then(text => {
                console.log('Error response:', text);
                try {
                    const data = JSON.parse(text);
                    alert(data.message || 'Błąd rejestracji');
                } catch (e) {
                    alert('Błąd serwera: ' + response.status);
                }
            });
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
        alert('Błąd połączenia z serwerem');
    });
}

// Weryfikacja wieku przez Profil Zaufany
function handleAgeVerification(event) {
    if (event) event.preventDefault();
    
    console.log('Age verification via Profil Zaufany');
    
}

// Weryfikacja kodu email przy rejestracji
function handleRegistrationVerification(event) {
    if (event) event.preventDefault();
    
    const codeInputs = document.querySelectorAll('.register3-container .code-input');
    const code = Array.from(codeInputs).map(input => input.value).join('');
    
    console.log('Registration verification code:', code);
    
}

// Zakończenie rejestracji
function completeRegistration(event) {
    if (event) event.preventDefault();
    
    console.log('Registration completed, redirecting to homepage');
    
}

// Automatyczne przełączanie między polami kodu weryfikacyjnego
function setupCodeInputs() {
    const codeInputs = document.querySelectorAll('.code-input');
    
    if (codeInputs.length === 0) return;
    
    codeInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < codeInputs.length - 1) {
                codeInputs[index + 1].focus();
            }
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                codeInputs[index - 1].focus();
            }
        });
        
        // Tylko cyfry
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
    });
}

// Inicjalizacja przy załadowaniu strony
document.addEventListener('DOMContentLoaded', function() {
    setupCodeInputs();
    initializeBlackjack();
});

// ===== LOGIKA GRY BLACKJACK =====

// Zmienne globalne dla blackjacka
let blackjackDeck = [];
let playerHand = [];
let dealerHand = [];
let gameActive = false;
let playerMoney = 1500;

// Karty
const suits = ['♠', '♥', '♦', '♣'];
const values = [
    { name: '2', value: 2 }, { name: '3', value: 3 }, { name: '4', value: 4 }, { name: '5', value: 5 },
    { name: '6', value: 6 }, { name: '7', value: 7 }, { name: '8', value: 8 }, { name: '9', value: 9 },
    { name: '10', value: 10 }, { name: 'J', value: 10 }, { name: 'Q', value: 10 }, { name: 'K', value: 10 },
    { name: 'A', value: 11 }
];

// Tworzenie nowej talii
function createBlackjackDeck() {
    const newDeck = [];
    for (let suit of suits) {
        for (let value of values) {
            newDeck.push({
                suit: suit,
                name: value.name,
                value: value.value
            });
        }
    }
    return shuffleBlackjackDeck(newDeck);
}

// Tasowanie talii
function shuffleBlackjackDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// Dobieranie karty
function dealCard() {
    return blackjackDeck.pop();
}

// Obliczanie wartości ręki
function calculateHandValue(hand) {
    let value = 0;
    let aces = 0;

    for (let card of hand) {
        if (card.name === 'A') {
            aces++;
            value += 11;
        } else {
            value += card.value;
        }
    }

    // Obsługa asów
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }

    return value;
}

// Wyświetlanie karty
function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.innerHTML = `
        <div style="font-size: 14px; font-weight: bold;">${card.name}</div>
        <div style="font-size: 20px; color: ${card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'};">${card.suit}</div>
    `;
    return cardDiv;
}

// Wyświetlanie kart gracza
function displayPlayerCards() {
    const container = document.getElementById('player-cards');
    if (!container) return;
    
    container.innerHTML = '';
    playerHand.forEach(card => {
        container.appendChild(createCardElement(card));
    });
    const playerScoreElement = document.getElementById('player-score');
    if (playerScoreElement) {
        playerScoreElement.textContent = `Punkty: ${calculateHandValue(playerHand)}`;
    }
}

// Wyświetlanie kart krupiera
function displayDealerCards(hideFirst = false) {
    const container = document.getElementById('dealer-cards');
    if (!container) return;
    
    container.innerHTML = '';
    dealerHand.forEach((card, index) => {
        if (hideFirst && index === 0) {
            const hiddenCard = document.createElement('div');
            hiddenCard.className = 'card';
            hiddenCard.style.backgroundColor = '#666';
            hiddenCard.innerHTML = '<div style="color: white;">?</div>';
            container.appendChild(hiddenCard);
        } else {
            container.appendChild(createCardElement(card));
        }
    });
    
    const dealerScoreElement = document.getElementById('dealer-score');
    if (dealerScoreElement) {
        if (hideFirst) {
            dealerScoreElement.textContent = `Punkty: ${calculateHandValue([dealerHand[1]])}`;
        } else {
            dealerScoreElement.textContent = `Punkty: ${calculateHandValue(dealerHand)}`;
        }
    }
}

// Rozpoczęcie gry
async function startBlackjackGame() {
    const betAmountElement = document.getElementById('bet-amount');
    const statusElement = document.getElementById('status-message');
    
    if (!betAmountElement || !statusElement) return;
    
    const betAmount = parseInt(betAmountElement.value);
    if (betAmount <= 0) {
        statusElement.textContent = 'Nieprawidłowa stawka!';
        return;
    }

    try {
        // Place bet (subtract currency)
        await placeBet(betAmount);
        
        blackjackDeck = createBlackjackDeck();
        playerHand = [];
        dealerHand = [];
        gameActive = true;

        // Rozdaj początkowe karty
        playerHand.push(dealCard());
        dealerHand.push(dealCard());
        playerHand.push(dealCard());
        dealerHand.push(dealCard());

        displayPlayerCards();
        displayDealerCards(true);

        // Sprawdź blackjacka
        if (calculateHandValue(playerHand) === 21) {
            endBlackjackGame('blackjack');
        } else {
            statusElement.textContent = 'Twoja kolej! Hit czy Stand?';
            updateBlackjackButtons(true);
        }
    } catch (error) {
        statusElement.textContent = 'Nie można rozpocząć gry - sprawdź saldo!';
    }
}

// Dobierz kartę
function hitBlackjack() {
    if (!gameActive) return;

    playerHand.push(dealCard());
    displayPlayerCards();

    const playerValue = calculateHandValue(playerHand);
    if (playerValue > 21) {
        endBlackjackGame('bust');
    } else if (playerValue === 21) {
        standBlackjack();
    }
}

// Pas
function standBlackjack() {
    if (!gameActive) return;

    displayDealerCards(false); // Pokaż wszystkie karty krupiera

    // Krupier dobiera do 17
    while (calculateHandValue(dealerHand) < 17) {
        dealerHand.push(dealCard());
        displayDealerCards(false);
    }

    endBlackjackGame('compare');
}

// Zakończenie gry
async function endBlackjackGame(reason) {
    gameActive = false;
    updateBlackjackButtons(false);

    const playerValue = calculateHandValue(playerHand);
    const dealerValue = calculateHandValue(dealerHand);
    const betAmountElement = document.getElementById('bet-amount');
    const statusElement = document.getElementById('status-message');
    
    if (!betAmountElement || !statusElement) return;
    
    const betAmount = parseInt(betAmountElement.value);

    let message = '';
    let winnings = 0;

    if (reason === 'bust') {
        message = 'Przekroczyłeś 21! Przegrana.';
        winnings = 0; // Already lost the bet when placing it
    } else if (reason === 'blackjack') {
        if (calculateHandValue(dealerHand) === 21) {
            message = 'Remis! Obaj macie Blackjacka.';
            winnings = betAmount; // Return bet amount
        } else {
            message = 'Blackjack! Wygrałeś!';
            winnings = betAmount + Math.floor(betAmount * 1.5); // Bet + 1.5x winnings
        }
        displayDealerCards(false);
    } else if (reason === 'compare') {
        if (dealerValue > 21) {
            message = `Krupier przekroczył 21! Wygrałeś!`;
            winnings = betAmount * 2; // Bet + winnings
        } else if (playerValue > dealerValue) {
            message = `Wygrałeś! ${playerValue} vs ${dealerValue}`;
            winnings = betAmount * 2; // Bet + winnings
        } else if (playerValue < dealerValue) {
            message = `Przegrałeś! ${playerValue} vs ${dealerValue}`;
            winnings = 0; // Already lost the bet
        } else {
            message = `Remis! ${playerValue} vs ${dealerValue}`;
            winnings = betAmount; // Return bet amount
        }
    }

    // Add winnings if any
    if (winnings > 0) {
        try {
            await addWinnings(winnings);
        } catch (error) {
            console.error('Error adding winnings:', error);
        }
    }

    // Save game history
    const gameStatus = winnings > 0 ? 'win' : 'lose';
    await saveGameHistory('blackjack', gameStatus, winnings);

    statusElement.textContent = message;
}

// Zarządzanie przyciskami
function updateBlackjackButtons(gameInProgress) {
    const startBtn = document.getElementById('btn-start');
    const hitBtn = document.getElementById('btn-hit');
    const standBtn = document.getElementById('btn-stand');
    
    if (startBtn) startBtn.disabled = gameInProgress;
    if (hitBtn) hitBtn.disabled = !gameInProgress;
    if (standBtn) standBtn.disabled = !gameInProgress;
}

// Inicjalizacja blackjacka
function initializeBlackjack() {
    // Sprawdź czy jesteśmy na stronie blackjacka
    if (!document.getElementById('btn-start')) return;
    
    // Event listenery
    const startBtn = document.getElementById('btn-start');
    const hitBtn = document.getElementById('btn-hit');
    const standBtn = document.getElementById('btn-stand');
    
    if (startBtn) startBtn.addEventListener('click', startBlackjackGame);
    if (hitBtn) hitBtn.addEventListener('click', hitBlackjack);
    if (standBtn) standBtn.addEventListener('click', standBlackjack);

    // Inicjalizacja przycisków
    updateBlackjackButtons(false);
}

function displayRegisteredUsername() {
    const username = localStorage.getItem('registeredUsername');
    if (username) {
        const welcomeTitleElements = document.querySelectorAll('.welcome-title');
        welcomeTitleElements.forEach(element => {
            element.textContent = username;
        });
    }
}

function isUserLoggedIn() {
    const token = localStorage.getItem('token');
    return !!token;
}

function getLoggedInUser() {
    return localStorage.getItem('username');
}

function logout() {
    makeAuthenticatedRequest(`${API_BASE_URL}/auth/logout`, { method: 'POST' })
        .then(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('username');
            if (window.location.pathname.includes('/UserPanel/') || window.location.pathname.includes('/PanelAdmin/')) {
                window.location.href = '../index.html';
            } else {
                window.location.reload();
            }
        })
        .catch(error => {
            console.error('Logout error:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('username');
            alert('Wylogowano lokalnie');
            if (window.location.pathname.includes('/UserPanel/') || window.location.pathname.includes('/PanelAdmin/')) {
                window.location.href = '../index.html';
            } else {
                window.location.reload();
            }
        });
}

function checkLoginStatus() {
    const loggedInSection = document.getElementById('logged-in-section');
    const loggedInUserPanel = document.getElementById('logged-in-user-panel');
    const notLoggedInSection = document.getElementById('not-logged-in-section');
    
    if (isUserLoggedIn()) {
        if (loggedInSection) loggedInSection.style.display = 'flex';
        if (loggedInUserPanel) loggedInUserPanel.style.display = 'flex';
        if (notLoggedInSection) notLoggedInSection.style.display = 'none';
        
        // Pobierz aktualną walutę
        makeAuthenticatedRequest(`${API_BASE_URL}/users/getcurrency`)
            .then(response => response.json())
            .then(data => {
                const currencyElement = document.getElementById('user-currency');
                if (currencyElement) {
                    currencyElement.textContent = data.currency || 0;
                }
            })
            .catch(error => {
                console.error('Error fetching currency:', error);
                const currencyElement = document.getElementById('user-currency');
                if (currencyElement) {
                    currencyElement.textContent = '0';
                }
            });
    } else {
        if (loggedInSection) loggedInSection.style.display = 'none';
        if (loggedInUserPanel) loggedInUserPanel.style.display = 'none';
        if (notLoggedInSection) notLoggedInSection.style.display = 'flex';
    }
}

function checkAdminStatus() {
    if (isUserLoggedIn()) {
        makeAuthenticatedRequest(`${API_BASE_URL}/adminpanel/checkadmin`)
            .then(response => response.json())
            .then(data => {
                // For admin panel pages - redirect if not admin
                if (window.location.pathname.includes('/PanelAdmin/')) {
                    if (!data.isAdmin) {
                        alert('Nie masz uprawnień do tej strony');
                        window.location.href = '../index.html';
                    }
                } else {
                    // For other pages - hide admin button if not admin
                    const adminNavButton = document.querySelector('nav a[href*="PanelAdmin"] button');
                    if (adminNavButton) {
                        adminNavButton.parentElement.style.display = data.isAdmin ? 'inline' : 'none';
                    }
                }
            })
            .catch(error => {
                console.error('Error checking admin status:', error);
                if (window.location.pathname.includes('/PanelAdmin/')) {
                    alert('Błąd sprawdzania uprawnień');
                    window.location.href = '../index.html';
                } else {
                    const adminNavButton = document.querySelector('nav a[href*="PanelAdmin"] button');
                    if (adminNavButton) {
                        adminNavButton.parentElement.style.display = 'none';
                    }
                }
            });
    } else {
        if (window.location.pathname.includes('/PanelAdmin/')) {
            alert('Musisz być zalogowany');
            window.location.href = '../Logowanie/login.html';
        } else {
            const adminNavButton = document.querySelector('nav a[href*="PanelAdmin"] button');
            if (adminNavButton) {
                adminNavButton.parentElement.style.display = 'none';
            }
        }
    }
}

function makeAuthenticatedRequest(url, options = {}) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert('Musisz być zalogowany!');
        window.location.href = 'Logowanie/login.html';
        return Promise.reject('No token');
    }
    
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    return fetch(url, mergedOptions)
        .then(response => {
            if (response.status === 401) {
                alert('Sesja wygasła. Zaloguj się ponownie.');
                logout();
                return Promise.reject('Token expired');
            }
            return response;
        });
}

// Currency management functions
async function updateUserCurrency(amount) {
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/users/updatecurrency`, {
            method: 'PUT',
            body: JSON.stringify({ amount: amount })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update currency');
        }
        
        const data = await response.json();
        console.log('Currency updated:', data);
        
        // Refresh displayed currency
        await refreshDisplayedCurrency();
        
        return data;
    } catch (error) {
        console.error('Error updating currency:', error);
        throw error;
    }
}

async function refreshDisplayedCurrency() {
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/users/getcurrency`);
        const data = await response.json();
        
        const currencyElement = document.getElementById('user-currency');
        if (currencyElement) {
            currencyElement.textContent = data.currency || 0;
        }
        
        return data.currency;
    } catch (error) {
        console.error('Error refreshing currency:', error);
    }
}

// Game-specific currency functions
async function placeBet(amount) {
    try {
        return await updateUserCurrency(-Math.abs(amount));
    } catch (error) {
        alert('Niewystarczająca ilość waluty!');
        throw error;
    }
}

async function addWinnings(amount) {
    try {
        return await updateUserCurrency(Math.abs(amount));
    } catch (error) {
        console.error('Error adding winnings:', error);
        throw error;
    }
}

// ===== SLOTS GAME LOGIC =====

// Slot machine symbols and payouts
const slotSymbols = ['🍒', '🍋', '💎', '🔔', '⭐', '7️⃣'];
const slotPayouts = {
    '🍒🍒🍒': 3,
    '🍋🍋🍋': 5,
    '💎💎💎': 10,
    '🔔🔔🔔': 15,
    '⭐⭐⭐': 20,
    '7️⃣7️⃣7️⃣': 50
};

let isSlotSpinning = false;

async function playSlots() {
    if (isSlotSpinning) return;

    const betAmountElement = document.getElementById('betAmount');
    if (!betAmountElement) return;

    const betAmount = parseInt(betAmountElement.value);
    
    if (isNaN(betAmount) || betAmount <= 0) {
        alert("Podaj prawidłową stawkę!");
        return;
    }

    try {
        // Place bet (deduct currency)
        await placeBet(betAmount);
        
        isSlotSpinning = true;
        
        // Clear previous results
        const resultElement = document.getElementById('result');
        const winningsElement = document.getElementById('winnings');
        if (resultElement) resultElement.textContent = '';
        if (winningsElement) winningsElement.textContent = '';

        // Get reel elements
        const reel1 = document.getElementById('reel1');
        const reel2 = document.getElementById('reel2');
        const reel3 = document.getElementById('reel3');

        if (!reel1 || !reel2 || !reel3) return;

        // Generate random symbols
        const symbol1 = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
        const symbol2 = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
        const symbol3 = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];

        // Animate spinning
        let spins = 0;
        const maxSpins = 20;
        const spinInterval = setInterval(() => {
            reel1.textContent = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
            reel2.textContent = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
            reel3.textContent = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
            
            spins++;
            if (spins >= maxSpins) {
                clearInterval(spinInterval);
                finishSlotSpin(symbol1, symbol2, symbol3, betAmount);
            }
        }, 100);

    } catch (error) {
        console.error('Error during slot machine spin:', error);
        alert('Nie można rozpocząć gry - sprawdź saldo!');
        isSlotSpinning = false;
    }
}

async function finishSlotSpin(symbol1, symbol2, symbol3, betAmount) {
    // Set final symbols
    const reel1 = document.getElementById('reel1');
    const reel2 = document.getElementById('reel2');
    const reel3 = document.getElementById('reel3');
    
    if (reel1) reel1.textContent = symbol1;
    if (reel2) reel2.textContent = symbol2;
    if (reel3) reel3.textContent = symbol3;

    // Check for win
    let multiplier = 0;
    
    // Check if all 3 symbols are the same
    if (symbol1 === symbol2 && symbol2 === symbol3) {
        multiplier = 10; // 3 identical symbols = x10
    }
    // Check if any 2 symbols are the same
    else if (symbol1 === symbol2 || symbol2 === symbol3 || symbol1 === symbol3) {
        multiplier = 2; // 2 identical symbols = x2
    }
    
    const resultElement = document.getElementById('result');
    const winningsElement = document.getElementById('winnings');

    if (multiplier > 0) {
        const winAmount = betAmount * multiplier;
        if (resultElement) {
            resultElement.textContent = 'Wygrałeś!';
            resultElement.style.color = 'green';
        }
        if (winningsElement) {
            winningsElement.textContent = `Wygrana: ${winAmount} monet (x${multiplier})`;
            winningsElement.style.color = 'green';
        }
        
        // Add winnings to player account
        try {
            await addWinnings(winAmount);
        } catch (error) {
            console.error('Error adding winnings:', error);
        }
    } else {
        if (resultElement) {
            resultElement.textContent = 'Przegrana!';
            resultElement.style.color = 'red';
        }
        if (winningsElement) {
            winningsElement.textContent = `Stracono: ${betAmount} monet`;
            winningsElement.style.color = 'red';
        }
    }

    // Save game history
    const gameStatus = multiplier > 0 ? 'win' : 'lose';
    const wonAmount = multiplier > 0 ? betAmount * multiplier : 0;
    await saveGameHistory('slots', gameStatus, wonAmount);

    isSlotSpinning = false;
}

// ===== USERNAME CHANGE FUNCTIONALITY =====

async function changeUsername() {
    const newUsernameInput = document.getElementById('new-username');
    const statusElement = document.getElementById('username-status');
    const newUsername = newUsernameInput?.value?.trim();
    
    if (!newUsername) {
        if (statusElement) {
            statusElement.textContent = 'Podaj nową nazwę użytkownika';
            statusElement.style.color = 'red';
        }
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Musisz być zalogowany!');
        window.location.href = '../Logowanie/login.html';
        return;
    }
    
    try {
        if (statusElement) {
            statusElement.textContent = 'Zapisywanie...';
            statusElement.style.color = 'orange';
        }
        
        const response = await fetch(`${API_BASE_URL}/users/changenickname`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ newNickname: newUsername })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Aktualizuj localStorage
            localStorage.setItem('username', newUsername);
            
            if (statusElement) {
                statusElement.textContent = 'Nazwa użytkownika została zmieniona!';
                statusElement.style.color = 'green';
            }
            
            // Przekieruj po 2 sekundach
            setTimeout(() => {
                window.location.href = 'panel.html';
            }, 2000);
        } else {
            const errorData = await response.json();
            if (statusElement) {
                statusElement.textContent = errorData.message || 'Błąd podczas zmiany nazwy';
                statusElement.style.color = 'red';
            }
        }
    } catch (error) {
        console.error('Error changing username:', error);
        if (statusElement) {
            statusElement.textContent = 'Błąd połączenia z serwerem';
            statusElement.style.color = 'red';
        }
    }
}

// ===== GAME HISTORY LOGGING =====

async function saveGameHistory(gameType, gameStatus, wonAmount) {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('User not logged in, skipping game history save');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/games/history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                gameType: gameType,
                gameStatus: gameStatus,
                wonAmount: wonAmount
            })
        });

        if (response.ok) {
            console.log('Game history saved successfully');
        } else {
            console.error('Failed to save game history:', response.status);
        }
    } catch (error) {
        console.error('Error saving game history:', error);
    }
}

// ===== GAME HISTORY FUNCTIONALITY =====

// Załaduj historię gier z API
async function loadGameHistory() {
    const token = localStorage.getItem('token');
    if (!token) {
        displayNoData('Musisz być zalogowany aby zobaczyć historię gier');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/getusergamehistory`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            const historyData = result.history || result.data || result || [];
            displayGameHistory(historyData);
        } else {
            const errorText = await response.text();
            displayNoData(`Błąd API: ${response.status} - ${errorText || response.statusText}`);
        }
    } catch (error) {
        displayNoData('Błąd połączenia z serwerem: ' + error.message);
    }
}

// Wyświetl historię gier w tabeli
function displayGameHistory(history) {
    const tbody = document.getElementById('game-history-tbody');
    console.log('Displaying history:', history); // Debug log
    
    if (!history || history.length === 0) {
        displayNoData('Nie masz jeszcze historii gier');
        return;
    }
    
    tbody.innerHTML = history.map((game, index) => {
        // Handle different possible field names from API
        const gameDate = game.created || game.game_date || game.date || game.created_at || game.createdAt;
        const winAmount = game.won_amount || game.win_amount || game.winAmount || game.amount || 0;
        const gameType = game.game_type || game.type || game.gameType || 'Nieznany';
        const gameStatus = game.game_status || game.status || game.gameStatus || '';
        
        const formattedDate = gameDate ? new Date(gameDate).toLocaleDateString('pl-PL') : 'Nieznana data';
        
        console.log('Game entry:', { gameType, winAmount, gameDate, gameStatus }); // Debug log
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${gameType}</td>
                <td>${winAmount}</td>
                <td>${formattedDate}</td>
            </tr>
        `;
    }).join('');
}

// Wyświetl komunikat gdy brak danych (dla historii gier)
function displayNoData(message) {
    const tbody = document.getElementById('game-history-tbody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
                    ${message}
                </td>
            </tr>
        `;
    }
}

// ===== BAN LIST FUNCTIONALITY =====

// Load ban list from API
async function loadBanList() {
    const token = localStorage.getItem('token');
    if (!token) {
        displayNoBanData('Musisz być zalogowany aby zobaczyć listę banów');
        return;
    }

    // Get selected user ID
    const selectedUserId = localStorage.getItem('selectedUserId');
    if (!selectedUserId) {
        displayNoBanData('Nie wybrano użytkownika. Wybierz użytkownika aby zobaczyć jego bany.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/adminpanel/userbanlist/${selectedUserId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Ban list response:', result);
            
            // Result should be array directly from userbanlist endpoint
            const banData = Array.isArray(result) ? result : [];
            displayBanList(banData);
        } else {
            const errorText = await response.text();
            console.error('Ban list API error:', response.status, errorText);
            displayNoBanData(`Błąd API: ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading ban list:', error);
        displayNoBanData('Błąd połączenia z serwerem');
    }
}

// Load active bans for selected user
async function loadActiveBans() {
    const token = localStorage.getItem('token');
    if (!token) {
        displayNoBanData('Musisz być zalogowany aby zobaczyć aktywne bany');
        return;
    }

    // Get selected user ID
    const selectedUserId = localStorage.getItem('selectedUserId');
    if (!selectedUserId) {
        displayNoBanData('Nie wybrano użytkownika. Wybierz użytkownika aby zobaczyć jego aktywne bany.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/adminpanel/activebanlist/${selectedUserId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Active bans response:', result);
            
            // Result should be array directly from activebanlist endpoint
            const banData = Array.isArray(result) ? result : [];
            displayBanList(banData);
        } else {
            const errorText = await response.text();
            console.error('Active bans API error:', response.status, errorText);
            displayNoBanData(`Błąd API: ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading active bans:', error);
        displayNoBanData('Błąd połączenia z serwerem');
    }
}

// Load game history for selected user (admin panel)
async function loadAdminGameHistory() {
    const token = localStorage.getItem('token');
    if (!token) {
        displayNoGameData('Musisz być zalogowany aby zobaczyć historię gier');
        return;
    }

    // Get selected user ID
    const selectedUserId = localStorage.getItem('selectedUserId');
    if (!selectedUserId) {
        displayNoGameData('Nie wybrano użytkownika. Wybierz użytkownika aby zobaczyć jego historię gier.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/adminpanel/usergamehistory/${selectedUserId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Game history response:', result);
            
            // Result should be array directly from usergamehistory endpoint
            const gameData = Array.isArray(result) ? result : [];
            displayGameHistory(gameData);
        } else {
            const errorText = await response.text();
            console.error('Game history API error:', response.status, errorText);
            displayNoGameData(`Błąd API: ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading game history:', error);
        displayNoGameData('Błąd połączenia z serwerem');
    }
}

// Display game history in table
function displayGameHistory(gameHistory) {
    const tbody = document.getElementById('game-history-tbody');
    if (!tbody) return;
    
    if (!gameHistory || gameHistory.length === 0) {
        displayNoGameData('Nie ma żadnych gier do wyświetlenia');
        return;
    }
    
    tbody.innerHTML = '';
    
    gameHistory.forEach((game, index) => {
        const row = document.createElement('tr');
        
        // Format date
        const gameDate = game.created ? new Date(game.created).toLocaleString('pl-PL') : '';
        
        // Format game status
        const gameStatus = game.game_status || 'nieznany';
        
        // Format won amount
        const wonAmount = game.won_amount || 0;
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${game.game_type || 'nieznana'}</td>
            <td>${gameStatus}</td>
            <td>${wonAmount}</td>
            <td>${gameDate}</td>
        `;
        tbody.appendChild(row);
    });
}

// Display message when no game data is available
function displayNoGameData(message) {
    const tbody = document.getElementById('game-history-tbody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px; color: #666;">
                    ${message}
                </td>
            </tr>
        `;
    }
}

// Load payment history for selected user
async function loadUserPaymentHistory() {
    const token = localStorage.getItem('token');
    if (!token) {
        displayNoPaymentData('Musisz być zalogowany aby zobaczyć historię płatności');
        return;
    }

    // Get selected user ID
    const selectedUserId = localStorage.getItem('selectedUserId');
    if (!selectedUserId) {
        displayNoPaymentData('Nie wybrano użytkownika. Wybierz użytkownika aby zobaczyć jego historię płatności.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/adminpanel/userpaymenthistory/${selectedUserId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Payment history response:', result);
            
            // Result should be array directly from userpaymenthistory endpoint
            const paymentData = Array.isArray(result) ? result : [];
            displayUserPaymentHistory(paymentData);
        } else {
            const errorText = await response.text();
            console.error('Payment history API error:', response.status, errorText);
            displayNoPaymentData(`Błąd API: ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading payment history:', error);
        displayNoPaymentData('Błąd połączenia z serwerem');
    }
}

// Display user payment history in table
function displayUserPaymentHistory(paymentHistory) {
    const tbody = document.getElementById('payment-history-tbody');
    if (!tbody) return;
    
    if (!paymentHistory || paymentHistory.length === 0) {
        displayNoPaymentData('Nie ma żadnych płatności do wyświetlenia');
        return;
    }
    
    tbody.innerHTML = '';
    
    paymentHistory.forEach((payment, index) => {
        const row = document.createElement('tr');
        
        // Format date
        const paymentDate = payment.payment_date ? new Date(payment.payment_date).toLocaleString('pl-PL') : '';
        
        // Format amount with currency
        const payedAmount = payment.payed_amount ? `${payment.payed_amount} zł` : '0 zł';
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${payedAmount}</td>
            <td>${payment.payment_type || 'nieznany'}</td>
            <td>${payment.bought_currency || 0}</td>
            <td>${paymentDate}</td>
        `;
        tbody.appendChild(row);
    });
}

// Display message when no payment data is available
function displayNoPaymentData(message) {
    const tbody = document.getElementById('payment-history-tbody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px; color: #666;">
                    ${message}
                </td>
            </tr>
        `;
    }
}

// Display ban list in table
async function displayBanList(banList) {
    const tbody = document.getElementById('ban-list-tbody');
    if (!tbody) return;
    
    if (!banList || banList.length === 0) {
        displayNoBanData('Nie ma żadnych banów do wyświetlenia');
        return;
    }
    
    // Process each ban and get admin username
    const processedBans = await Promise.all(banList.map(async (ban, index) => {
        // Get admin username by ID
        let adminUsername = 'Nieznany admin';
        if (ban.created_by) {
            try {
                adminUsername = await getAdminUsername(ban.created_by);
            } catch (error) {
                console.error('Error getting admin username:', error);
            }
        }
        
        // Format dates
        const banFrom = ban.ban_from ? new Date(ban.ban_from).toLocaleString('pl-PL') : 'Nieznana data';
        const banTo = ban.ban_to ? new Date(ban.ban_to).toLocaleString('pl-PL') : 'Nieznana data';
        
        return {
            ...ban,
            adminUsername,
            formattedBanFrom: banFrom,
            formattedBanTo: banTo,
            index: index + 1
        };
    }));
    
    tbody.innerHTML = processedBans.map(ban => `
        <tr>
            <td>${ban.index}</td>
            <td>${ban.reason || 'Brak powodu'}</td>
            <td>${ban.description || 'Brak opisu'}</td>
            <td>${ban.formattedBanFrom}</td>
            <td>${ban.formattedBanTo}</td>
            <td>${ban.adminUsername}</td>
        </tr>
    `).join('');
}

// Get admin username by ID
async function getAdminUsername(userId) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/adminpanel/getuserbyid/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            return user.username || user.nickname || 'Nieznany admin';
        } else {
            console.error('Failed to get admin username for ID:', userId);
            return 'Nieznany admin';
        }
    } catch (error) {
        console.error('Error fetching admin username:', error);
        return 'Nieznany admin';
    }
}

// Display message when no ban data is available
function displayNoBanData(message) {
    const tbody = document.getElementById('ban-list-tbody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
                    ${message}
                </td>
            </tr>
        `;
    }
}

// ===== PAYMENT HISTORY FUNCTIONALITY =====

// Load payment history from API
async function loadPaymentHistory() {
    const token = localStorage.getItem('token');
    if (!token) {
        displayNoPaymentData('Musisz być zalogowany aby zobaczyć historię płatności');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/getpaymenthistory`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            
            // Handle different possible response formats
            const historyData = result.history || result.payments || result.data || result || [];
            displayPaymentHistory(historyData);
        } else {
            const errorText = await response.text();
            console.error('Payment history API error:', response.status, errorText);
            displayNoPaymentData(`Błąd API: ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading payment history:', error);
        displayNoPaymentData('Błąd połączenia z serwerem');
    }
}

// Display payment history in table
function displayPaymentHistory(history) {
    const tbody = document.getElementById('payment-history-tbody');
    if (!tbody) return;
    
    if (!history || history.length === 0) {
        displayNoPaymentData('Nie masz jeszcze historii płatności');
        return;
    }
    
    tbody.innerHTML = history.map((payment, index) => {
        // Handle different possible field names from API
        const paymentDate = payment.created_at || payment.payment_date || payment.date || payment.created;
        const transactionId = payment.transaction_id || payment.id || payment.payment_id || `#TR-${Date.now()}-${index}`;
        const paymentMethod = payment.payment_method || payment.method || 'Karta';
        const amount = payment.amount || payment.payed_amount || payment.paid_amount || 0;
        const currency = payment.bought_currency || payment.currency_amount || payment.tokens || payment.currency || 0;
        const status = payment.status || 'Zrealizowano';
        
        const formattedDate = paymentDate ? new Date(paymentDate).toLocaleString('pl-PL') : 'Nieznana data';
        
        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${transactionId}</td>
                <td>${paymentMethod}</td>
                <td>${amount} PLN</td>
                <td>+ ${currency}</td>
                <td>${status}</td>
            </tr>
        `;
    }).join('');
}

// Display message when no payment data is available
function displayNoPaymentData(message) {
    const tbody = document.getElementById('payment-history-tbody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
                    ${message}
                </td>
            </tr>
        `;
    }
}

// ===== PASSWORD CHANGE FUNCTIONALITY =====

async function changePassword() {
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const statusElement = document.getElementById('password-status');
    
    const currentPassword = currentPasswordInput?.value?.trim();
    const newPassword = newPasswordInput?.value?.trim();
    const confirmPassword = confirmPasswordInput?.value?.trim();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        if (statusElement) {
            statusElement.textContent = 'Wypełnij wszystkie pola';
            statusElement.style.color = 'red';
        }
        return;
    }
    
    if (newPassword !== confirmPassword) {
        if (statusElement) {
            statusElement.textContent = 'Nowe hasła nie są identyczne';
            statusElement.style.color = 'red';
        }
        return;
    }
    
    if (newPassword.length < 6) {
        if (statusElement) {
            statusElement.textContent = 'Nowe hasło musi mieć minimum 6 znaków';
            statusElement.style.color = 'red';
        }
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Musisz być zalogowany!');
        window.location.href = '../Logowanie/login.html';
        return;
    }
    
    try {
        if (statusElement) {
            statusElement.textContent = 'Zapisywanie...';
            statusElement.style.color = 'orange';
        }
        
        const response = await fetch(`${API_BASE_URL}/users/changepassword`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                oldPassword: currentPassword,
                newPassword: newPassword 
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (statusElement) {
                statusElement.textContent = 'Hasło zostało zmienione! Wylogowywanie...';
                statusElement.style.color = 'green';
            }
            
            // Wyczyść pola
            currentPasswordInput.value = '';
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';
            
            // Wyloguj użytkownika po 2 sekundach
            setTimeout(() => {
                logout();
            }, 2000);
        } else {
            const errorData = await response.json();
            if (statusElement) {
                statusElement.textContent = errorData.message || 'Błąd podczas zmiany hasła';
                statusElement.style.color = 'red';
            }
        }
    } catch (error) {
        console.error('Error changing password:', error);
        if (statusElement) {
            statusElement.textContent = 'Błąd połączenia z serwerem';
            statusElement.style.color = 'red';
        }
    }
}