// ==========================================================================
// GIGFLEX FREELANCE PLATFORM CORE JAVASCRIPT
// ==========================================================================

const BASE_URL = window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1")
    ? "http://127.0.0.1:8000"
    : window.location.origin;

// Local caching state variables
let freelancersCached = [];
let clientsCached = [];
let projectsCached = [];
let bidsCached = [];
let contractsCached = [];

// Edit states trackers
let editFreelancerId = null;
let editClientId = null;
let editProjectId = null;
let editBidId = null;
let editContractId = null;

// Get currently logged-in user
function getLoggedInUser() {
    const userStr = localStorage.getItem("gig_user");
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch (e) {
        return null;
    }
}

// Route guard based on auth status and role
function checkAuthentication() {
    const user = getLoggedInUser();
    const currentPath = window.location.pathname.split("/").pop();

    if (currentPath === "login.html" || currentPath === "register.html") {
        if (user) {
            window.location.href = "dashboard.html";
        }
        return;
    }

    if (!user) {
        const protectedPages = ["dashboard.html", "bids.html", "contracts.html"];
        if (protectedPages.includes(currentPath)) {
            window.location.href = "login.html";
        }
    }
}

// Render navbar links based on authentication state
function renderNavbar() {
    const navLinks = document.getElementById("navLinks");
    if (!navLinks) return;

    const user = getLoggedInUser();
    const currentPath = window.location.pathname.split("/").pop() || "index.html";

    let linksHTML = `<li><a href="index.html" class="${currentPath === 'index.html' ? 'active' : ''}">Home</a></li>`;
    linksHTML += `<li><a href="projects.html" class="${currentPath === 'projects.html' ? 'active' : ''}">Explore Projects</a></li>`;

    if (!user) {
        linksHTML += `
            <li><a href="login.html" class="${currentPath === 'login.html' ? 'active' : ''}">Sign In</a></li>
            <li><a href="register.html" class="${currentPath === 'register.html' ? 'active' : ''}">Register</a></li>
        `;
    } else {
        linksHTML += `
            <li><a href="dashboard.html" class="${currentPath === 'dashboard.html' ? 'active' : ''}">My Dashboard</a></li>
            <li><a href="contracts.html" class="${currentPath === 'contracts.html' ? 'active' : ''}">Contracts</a></li>
            <li><a href="#" onclick="handleLogout(event)"><i class="fa-solid fa-power-off"></i> Logout (${user.full_name})</a></li>
        `;
    }

    navLinks.innerHTML = linksHTML;
}

// Toggles visible fields in the registration page based on role selection
function toggleRegistrationFields() {
    const role = document.getElementById("regRole").value;
    const freelancerSection = document.getElementById("freelancerFields");
    const clientSection = document.getElementById("clientFields");

    if (role === "freelancer") {
        freelancerSection.style.display = "block";
        clientSection.style.display = "none";
        // Mark inputs required/optional
        document.getElementById("freeName").required = true;
        document.getElementById("freeSkills").required = true;
        document.getElementById("freeExp").required = true;
        document.getElementById("freeRate").required = true;
        document.getElementById("clientCompany").required = false;
        document.getElementById("clientContact").required = false;
        document.getElementById("clientLoc").required = false;
    } else {
        freelancerSection.style.display = "none";
        clientSection.style.display = "block";
        document.getElementById("freeName").required = false;
        document.getElementById("freeSkills").required = false;
        document.getElementById("freeExp").required = false;
        document.getElementById("freeRate").required = false;
        document.getElementById("clientCompany").required = true;
        document.getElementById("clientContact").required = true;
        document.getElementById("clientLoc").required = true;
    }
}

// Authentication Handlers
function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();

    // Check special admin email pattern
    if (email === "admin@gigflex.com") {
        const adminUser = { customer_id: 100, full_name: "Platform Admin", email: "admin@gigflex.com", role: "admin" };
        localStorage.setItem("gig_user", JSON.stringify(adminUser));
        alert("Welcome back, Administrator!");
        window.location.href = "dashboard.html";
        return;
    }

    // Verify against Freelancers first, then Clients
    Promise.all([
        fetch(BASE_URL + "/freelancers/").then(res => res.json()).catch(() => []),
        fetch(BASE_URL + "/clients/").then(res => res.json()).catch(() => [])
    ]).then(([freelancers, clients]) => {
        const freelancer = freelancers.find(f => f.email.toLowerCase() === email.toLowerCase());
        if (freelancer) {
            const userObj = {
                freelancer_id: freelancer.freelancer_id,
                full_name: freelancer.full_name,
                email: freelancer.email,
                role: "freelancer"
            };
            localStorage.setItem("gig_user", JSON.stringify(userObj));
            alert("Signed in as Freelancer: " + freelancer.full_name);
            window.location.href = "dashboard.html";
            return;
        }

        const client = clients.find(c => c.email.toLowerCase() === email.toLowerCase());
        if (client) {
            const userObj = {
                client_id: client.client_id,
                full_name: client.company_name, // Map company name as user title
                email: client.email,
                role: "client"
            };
            localStorage.setItem("gig_user", JSON.stringify(userObj));
            alert("Signed in as Client: " + client.company_name);
            window.location.href = "dashboard.html";
            return;
        }

        alert("Email not registered. Please create a freelancer or client profile.");
    });
}

function handleRegisterSubmit(e) {
    e.preventDefault();
    const role = document.getElementById("regRole").value;
    const email = document.getElementById("regEmail").value;
    const phone = document.getElementById("regPhone").value;

    if (role === "freelancer") {
        const freelancerPayload = {
            full_name: document.getElementById("freeName").value,
            email: email,
            phone: phone,
            skills: document.getElementById("freeSkills").value,
            experience: document.getElementById("freeExp").value,
            hourly_rate: document.getElementById("freeRate").value
        };

        fetch(BASE_URL + "/freelancers/add/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(freelancerPayload)
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) alert("Error: " + data.error);
            else {
                alert("Freelancer profile created successfully! Please login.");
                window.location.href = "login.html";
            }
        });
    } else {
        const clientPayload = {
            company_name: document.getElementById("clientCompany").value,
            contact_person: document.getElementById("clientContact").value,
            email: email,
            phone: phone,
            location: document.getElementById("clientLoc").value
        };

        fetch(BASE_URL + "/clients/add/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(clientPayload)
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) alert("Error: " + data.error);
            else {
                alert("Client company profile registered! Please login.");
                window.location.href = "login.html";
            }
        });
    }
}

function handleLogout(e) {
    if (e) e.preventDefault();
    localStorage.removeItem("gig_user");
    alert("Signed out successfully.");
    window.location.href = "index.html";
}

// ==========================================================================
// HOME PAGE - SEARCH TALENTS & PROJECTS
// ==========================================================================
function getHomeData() {
    Promise.all([
        fetch(BASE_URL + "/freelancers/").then(res => res.json()).catch(() => []),
        fetch(BASE_URL + "/projects/").then(res => res.json()).catch(() => [])
    ]).then(([freelancers, projects]) => {
        freelancersCached = freelancers;
        projectsCached = projects;

        displayFreelancers(freelancers);
        displayProjects(projects.slice(0, 4)); // Show first 4 as featured
    });
}

function displayFreelancers(freelancers) {
    const container = document.getElementById("freelancerList");
    if (!container) return;

    container.innerHTML = "";
    if (freelancers.length === 0) {
        container.innerHTML = `<div class="no-records"><i class="fa-solid fa-user-slash"></i> No freelancers registered on the platform.</div>`;
        return;
    }

    const freeAvatars = [
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80"
    ];

    freelancers.forEach((f, index) => {
        const imgUrl = freeAvatars[index % freeAvatars.length];
        container.innerHTML += `
        <div class="freelancer-card">
            <span class="card-badge"><i class="fa-solid fa-dollar-sign"></i> ${f.hourly_rate}/hr</span>
            <div class="card-image" style="background-image: url('${imgUrl}')"></div>
            <div class="card-body">
                <h3>${f.full_name}</h3>
                <p><i class="fa-solid fa-screwdriver-wrench"></i> <b>Skills:</b> ${f.skills}</p>
                <p><i class="fa-solid fa-business-time"></i> <b>Experience:</b> ${f.experience} Years</p>
                <p><i class="fa-solid fa-phone"></i> <b>Contact:</b> ${f.phone}</p>
            </div>
        </div>
        `;
    });
}

function displayProjects(projects) {
    const container = document.getElementById("featuredProjectsList") || document.getElementById("projectListGrid");
    if (!container) return;

    container.innerHTML = "";
    if (projects.length === 0) {
        container.innerHTML = `<div class="no-records"><i class="fa-solid fa-folder-open"></i> No active projects available.</div>`;
        return;
    }

    const projImages = [
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80"
    ];

    const user = getLoggedInUser();

    projects.forEach((p, index) => {
        const imgUrl = projImages[index % projImages.length];
        const showBidButton = user && user.role === "freelancer";

        container.innerHTML += `
        <div class="project-card">
            <span class="card-badge"><i class="fa-solid fa-money-bill-wave"></i> $${p.budget}</span>
            <div class="card-image" style="background-image: url('${imgUrl}')"></div>
            <div class="card-body">
                <h3>${p.project_title}</h3>
                <p><i class="fa-solid fa-tags"></i> <b>Category:</b> ${p.category}</p>
                <p><i class="fa-solid fa-building"></i> <b>Client:</b> ${p.client_name}</p>
                <p><i class="fa-solid fa-calendar-days"></i> <b>Deadline:</b> ${p.deadline}</p>
                <p style="margin-top: 10px; font-size:13px; color: var(--text-muted);">${p.description}</p>
                
                <div class="card-actions">
                    ${showBidButton ? `
                        <a href="bids.html?project=${encodeURIComponent(p.project_title)}" class="btn" style="width:100%; display:inline-flex; justify-content:center;">
                            <i class="fa-solid fa-paper-plane"></i> Bid on Project
                        </a>
                    ` : `
                        <span style="color:var(--text-muted); font-size:12px; margin-top: 10px;">Login as Freelancer to bid</span>
                    `}
                </div>
            </div>
        </div>
        `;
    });
}

function triggerSearch() {
    const query = document.getElementById("searchQuery").value.trim().toLowerCase();
    if (!query) {
        getHomeData();
        return;
    }

    const filteredFreelancers = freelancersCached.filter(f => 
        f.full_name.toLowerCase().includes(query) || 
        f.skills.toLowerCase().includes(query)
    );

    const filteredProjects = projectsCached.filter(p => 
        p.project_title.toLowerCase().includes(query) || 
        p.category.toLowerCase().includes(query) ||
        p.client_name.toLowerCase().includes(query)
    );

    displayFreelancers(filteredFreelancers);
    displayProjects(filteredProjects);
}

function handleSearch(e) {
    if (e.key === "Enter") {
        triggerSearch();
    }
}

// ==========================================================================
// PROJECTS SECTION (EXPLORE & FILTER BY CATEGORIES)
// ==========================================================================
function getExploreProjects() {
    const user = getLoggedInUser();
    
    // Reveal project post form if user is Client
    const postPanel = document.getElementById("projectPostPanel");
    const listWrapper = document.getElementById("projectListWrapper");

    if (user && user.role === "client" && postPanel) {
        postPanel.style.display = "block";
        if (listWrapper) {
            listWrapper.removeAttribute("style"); // Reset grid column
        }
    }

    fetch(BASE_URL + "/projects/")
        .then(res => res.json())
        .then(projects => {
            projectsCached = projects;
            displayProjects(projects);
        });
}

function filterProjectsByCategory() {
    const category = document.getElementById("categoryFilter").value;
    if (category === "All") {
        displayProjects(projectsCached);
        return;
    }

    const filtered = projectsCached.filter(p => p.category === category);
    displayProjects(filtered);
}

function handleProjectFormSubmit(e) {
    e.preventDefault();
    const user = getLoggedInUser();
    if (!user) return;

    const payload = {
        project_title: document.getElementById("projTitle").value,
        description: document.getElementById("projDesc").value,
        category: document.getElementById("projCat").value,
        budget: document.getElementById("projBudget").value,
        deadline: document.getElementById("projDeadline").value,
        client_name: user.full_name
    };

    fetch(BASE_URL + "/projects/add/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) alert("Error: " + data.error);
        else {
            alert("Project posted successfully!");
            document.getElementById("projectForm").reset();
            getExploreProjects();
        }
    });
}

// ==========================================================================
// BIDS MANAGEMENT & PLACING PROPOSAL
// ==========================================================================
function loadBidDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectTitle = urlParams.get("project");
    if (!projectTitle) return;

    document.getElementById("bidProjectTitle").value = projectTitle;
}

function handleBidSubmit(e) {
    e.preventDefault();
    const user = getLoggedInUser();
    if (!user) return;

    const payload = {
        project_title: document.getElementById("bidProjectTitle").value,
        freelancer_name: user.full_name,
        bid_amount: document.getElementById("bidAmount").value,
        proposal: document.getElementById("bidProposal").value,
        status: "Pending"
    };

    fetch(BASE_URL + "/bids/add/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            alert("Error: " + data.error);
        } else {
            alert("Proposal bid submitted successfully!");
            window.location.href = "dashboard.html";
        }
    })
    .catch(err => console.error("Bidding submission failure:", err));
}

// ==========================================================================
// CONTRACTS LOG PORTAL
// ==========================================================================
function getContracts() {
    const user = getLoggedInUser();
    if (!user) return;

    let url = BASE_URL + "/contracts/";
    if (user.role === "freelancer") {
        url += "?freelancer=" + encodeURIComponent(user.full_name);
    } else if (user.role === "client") {
        url += "?client=" + encodeURIComponent(user.full_name);
    }

    fetch(url)
        .then(res => res.json())
        .then(contracts => {
            const tableBody = document.getElementById("contractsListTable");
            if (!tableBody) return;

            tableBody.innerHTML = "";
            if (contracts.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="9" class="no-records">
                            <i class="fa-solid fa-file-contract"></i> No active project contracts recorded.
                        </td>
                    </tr>
                `;
                return;
            }

            contracts.forEach(c => {
                let badgeClass = "badge-success";
                if (c.contract_status === "Cancelled") badgeClass = "badge-danger";
                else if (c.contract_status === "Completed") badgeClass = "badge-info";

                tableBody.innerHTML += `
                <tr>
                    <td><b>#${c.contract_id}</b></td>
                    <td><b>${c.project_title}</b></td>
                    <td>${c.client_name}</td>
                    <td><b>${c.freelancer_name}</b></td>
                    <td><b>$${c.agreed_budget}</b></td>
                    <td>${c.start_date}</td>
                    <td>${c.end_date}</td>
                    <td><span class="badge ${badgeClass}">${c.contract_status}</span></td>
                    <td>
                        ${c.contract_status === 'Active' && user.role === 'client' ? `
                            <button class="btn btn-success" onclick="updateContractStatus(${c.contract_id}, 'Completed')" style="padding:6px 12px; font-size:12px;">Complete</button>
                        ` : '<span style="color:var(--text-muted); font-size:12px;">N/A</span>'}
                    </td>
                </tr>
                `;
            });
        });
}

function updateContractStatus(contractId, newStatus) {
    const payload = { contract_status: newStatus };
    fetch(BASE_URL + "/contracts/update/" + contractId + "/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || data.error);
        getContracts();
    });
}

// ==========================================================================
// UNIFIED ROLE-BASED DASHBOARD
// ==========================================================================
function loadDashboardData() {
    const user = getLoggedInUser();
    if (!user) return;

    document.getElementById("dashboardWelcomeTitle").innerHTML = `<i class="fa-solid fa-hand-wave"></i> Welcome, ${user.full_name}!`;

    if (user.role === "freelancer") {
        document.getElementById("freelancerDashboardSection").style.display = "block";
        loadFreelancerDashboard(user);
    } else if (user.role === "client") {
        document.getElementById("clientDashboardSection").style.display = "block";
        loadClientDashboard(user);
    } else if (user.role === "admin") {
        document.getElementById("adminDashboardSection").style.display = "block";
        loadAdminDashboard();
    }
}

// 1. Freelancer Dashboard Loader
function loadFreelancerDashboard(user) {
    // Populate Profile Fields
    fetch(BASE_URL + "/freelancers/")
        .then(res => res.json())
        .then(freelancers => {
            const free = freelancers.find(f => f.freelancer_id === user.freelancer_id);
            if (free) {
                document.getElementById("dbFreeRate").value = free.hourly_rate;
                document.getElementById("dbFreeSkills").value = free.skills;
                document.getElementById("dbFreeExp").value = free.experience;
                document.getElementById("dbFreePhone").value = free.phone;
            }
        });

    // Populate Bids Table
    fetch(BASE_URL + "/bids/?freelancer=" + encodeURIComponent(user.full_name))
        .then(res => res.json())
        .then(bids => {
            const tbody = document.getElementById("dbFreelancerBidsTable");
            tbody.innerHTML = "";
            if (bids.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:15px; color:var(--text-muted);">No submitted bids found.</td></tr>`;
                return;
            }

            bids.forEach(b => {
                let badgeClass = "badge-warning";
                if (b.status === "Accepted") badgeClass = "badge-success";
                else if (b.status === "Rejected") badgeClass = "badge-danger";

                tbody.innerHTML += `
                <tr>
                    <td><b>${b.project_title}</b></td>
                    <td><b>$${b.bid_amount}</b></td>
                    <td>${b.proposal}</td>
                    <td><span class="badge ${badgeClass}">${b.status}</span></td>
                    <td>
                        ${b.status === 'Pending' ? `
                            <button class="btn btn-danger" onclick="deleteFreelancerBid(${b.bid_id})" style="padding:6px 12px; font-size:12px;">Delete</button>
                        ` : 'N/A'}
                    </td>
                </tr>
                `;
            });
        });

    // Populate Contracts Table
    fetch(BASE_URL + "/contracts/?freelancer=" + encodeURIComponent(user.full_name))
        .then(res => res.json())
        .then(contracts => {
            const tbody = document.getElementById("dbFreelancerContractsTable");
            tbody.innerHTML = "";
            if (contracts.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:15px; color:var(--text-muted);">No active contracts.</td></tr>`;
                return;
            }

            contracts.forEach(c => {
                let badgeClass = "badge-success";
                if (c.contract_status === "Cancelled") badgeClass = "badge-danger";
                tbody.innerHTML += `
                <tr>
                    <td><b>#${c.contract_id}</b></td>
                    <td><b>${c.project_title}</b></td>
                    <td>${c.client_name}</td>
                    <td><b>$${c.agreed_budget}</b></td>
                    <td>${c.end_date}</td>
                    <td><span class="badge ${badgeClass}">${c.contract_status}</span></td>
                </tr>
                `;
            });
        });
}

function handleFreelancerProfileUpdate(e) {
    e.preventDefault();
    const user = getLoggedInUser();
    if (!user) return;

    const payload = {
        hourly_rate: document.getElementById("dbFreeRate").value,
        skills: document.getElementById("dbFreeSkills").value,
        experience: document.getElementById("dbFreeExp").value,
        phone: document.getElementById("dbFreePhone").value
    };

    fetch(BASE_URL + "/freelancers/update/" + user.freelancer_id + "/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || data.error);
        loadDashboardData();
    });
}

function deleteFreelancerBid(bidId) {
    if (!confirm("Are you sure you want to withdraw this proposal bid?")) return;

    fetch(BASE_URL + "/bids/delete/" + bidId + "/", { method: "DELETE" })
        .then(res => res.json())
        .then(data => {
            alert(data.message || data.error);
            loadDashboardData();
        });
}

// 2. Client Dashboard Loader
function loadClientDashboard(user) {
    // Load Client's posted projects
    fetch(BASE_URL + "/projects/?client=" + encodeURIComponent(user.full_name))
        .then(res => res.json())
        .then(projects => {
            const tbody = document.getElementById("dbClientProjectsTable");
            tbody.innerHTML = "";
            if (projects.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:15px; color:var(--text-muted);">No posted projects.</td></tr>`;
                return;
            }

            projects.forEach(p => {
                tbody.innerHTML += `
                <tr>
                    <td><b>#${p.project_id}</b></td>
                    <td><b>${p.project_title}</b></td>
                    <td>${p.category}</td>
                    <td><b>$${p.budget}</b></td>
                    <td>${p.deadline}</td>
                    <td>
                        <button class="btn btn-danger" onclick="deleteClientProject(${p.project_id})" style="padding:6px 12px; font-size:12px;">Delete</button>
                    </td>
                </tr>
                `;
            });

            // Get bids for all these projects
            loadClientReceivedBids(projects.map(p => p.project_title));
        });

    // Load Client's active contracts
    fetch(BASE_URL + "/contracts/?client=" + encodeURIComponent(user.full_name))
        .then(res => res.json())
        .then(contracts => {
            const tbody = document.getElementById("dbClientContractsTable");
            tbody.innerHTML = "";
            if (contracts.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:15px; color:var(--text-muted);">No contracts active.</td></tr>`;
                return;
            }

            contracts.forEach(c => {
                let badgeClass = "badge-success";
                if (c.contract_status === "Completed") badgeClass = "badge-info";
                else if (c.contract_status === "Cancelled") badgeClass = "badge-danger";

                tbody.innerHTML += `
                <tr>
                    <td><b>#${c.contract_id}</b></td>
                    <td><b>${c.project_title}</b></td>
                    <td><b>${c.freelancer_name}</b></td>
                    <td><b>$${c.agreed_budget}</b></td>
                    <td>${c.end_date}</td>
                    <td><span class="badge ${badgeClass}">${c.contract_status}</span></td>
                    <td>
                        ${c.contract_status === 'Active' ? `
                            <button class="btn btn-success" onclick="updateClientContractStatus(${c.contract_id}, 'Completed')" style="padding:4px 8px; font-size:11px;">Complete</button>
                            <button class="btn btn-danger" onclick="updateClientContractStatus(${c.contract_id}, 'Cancelled')" style="padding:4px 8px; font-size:11px;">Cancel</button>
                        ` : 'N/A'}
                    </td>
                </tr>
                `;
            });
        });
}

function deleteClientProject(projectId) {
    if (!confirm("Are you sure you want to delete this project?")) return;

    fetch(BASE_URL + "/projects/delete/" + projectId + "/", { method: "DELETE" })
        .then(res => res.json())
        .then(data => {
            alert(data.message || data.error);
            loadDashboardData();
        });
}

function loadClientReceivedBids(projectTitles) {
    fetch(BASE_URL + "/bids/")
        .then(res => res.json())
        .then(bids => {
            // Filter bids matching client's project titles
            const filteredBids = bids.filter(b => projectTitles.includes(b.project_title));
            const tbody = document.getElementById("dbClientBidsTable");
            tbody.innerHTML = "";

            if (filteredBids.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:15px; color:var(--text-muted);">No bids received.</td></tr>`;
                return;
            }

            filteredBids.forEach(b => {
                let badgeClass = "badge-warning";
                if (b.status === "Accepted") badgeClass = "badge-success";
                else if (b.status === "Rejected") badgeClass = "badge-danger";

                tbody.innerHTML += `
                <tr>
                    <td><b>${b.project_title}</b></td>
                    <td><b>${b.freelancer_name}</b></td>
                    <td><b>$${b.bid_amount}</b></td>
                    <td>${b.proposal}</td>
                    <td><span class="badge ${badgeClass}">${b.status}</span></td>
                    <td>
                        ${b.status === 'Pending' ? `
                            <button class="btn btn-success" onclick="updateBidStatus(${b.bid_id}, 'Accepted')" style="padding:4px 8px; font-size:11px;">Accept</button>
                            <button class="btn btn-danger" onclick="updateBidStatus(${b.bid_id}, 'Rejected')" style="padding:4px 8px; font-size:11px;">Reject</button>
                        ` : 'N/A'}
                    </td>
                </tr>
                `;
            });
        });
}

function updateBidStatus(bidId, newStatus) {
    const payload = { status: newStatus };
    fetch(BASE_URL + "/bids/update/" + bidId + "/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || data.error);
        loadDashboardData();
    });
}

function updateClientContractStatus(contractId, newStatus) {
    const payload = { contract_status: newStatus };
    fetch(BASE_URL + "/contracts/update/" + contractId + "/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || data.error);
        loadDashboardData();
    });
}

// 3. Admin Dashboard Loader
function loadAdminDashboard() {
    Promise.all([
        fetch(BASE_URL + "/freelancers/").then(res => res.json()).catch(() => []),
        fetch(BASE_URL + "/clients/").then(res => res.json()).catch(() => []),
        fetch(BASE_URL + "/projects/").then(res => res.json()).catch(() => []),
        fetch(BASE_URL + "/contracts/").then(res => res.json()).catch(() => [])
    ]).then(([freelancers, clients, projects, contracts]) => {
        freelancersCached = freelancers;
        clientsCached = clients;
        projectsCached = projects;
        contractsCached = contracts;

        // Stats counters
        document.getElementById("statFreelancers").textContent = freelancers.length;
        document.getElementById("statClients").textContent = clients.length;
        document.getElementById("statProjects").textContent = projects.length;
        document.getElementById("statContracts").textContent = contracts.length;

        // Load tables
        displayAdminFreelancers();
        displayAdminClients();
        displayAdminContracts();
    });
}

function displayAdminFreelancers() {
    const tbody = document.getElementById("adminFreelancersTable");
    tbody.innerHTML = "";
    if (freelancersCached.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:12px; color:var(--text-muted);">No freelancers records.</td></tr>`;
        return;
    }

    freelancersCached.forEach(f => {
        tbody.innerHTML += `
        <tr>
            <td><b>#${f.freelancer_id}</b></td>
            <td><b>${f.full_name}</b></td>
            <td>${f.email}</td>
            <td>${f.phone}</td>
            <td>${f.skills}</td>
            <td><b>${f.experience} Yrs / $${f.hourly_rate}</b></td>
            <td>
                <button class="btn btn-danger" onclick="deleteAdminFreelancer(${f.freelancer_id})" style="padding:6px 12px; font-size:12px;">Delete</button>
            </td>
        </tr>
        `;
    });
}

function deleteAdminFreelancer(id) {
    if (!confirm("Are you sure you want to delete this freelancer profile?")) return;

    fetch(BASE_URL + "/freelancers/delete/" + id + "/", { method: "DELETE" })
        .then(res => res.json())
        .then(data => {
            alert(data.message || data.error);
            loadAdminDashboard();
        });
}

function displayAdminClients() {
    const tbody = document.getElementById("adminClientsTable");
    tbody.innerHTML = "";
    if (clientsCached.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:12px; color:var(--text-muted);">No clients records.</td></tr>`;
        return;
    }

    clientsCached.forEach(c => {
        tbody.innerHTML += `
        <tr>
            <td><b>#${c.client_id}</b></td>
            <td><b>${c.company_name}</b></td>
            <td>${c.contact_person}</td>
            <td>${c.email}</td>
            <td>${c.phone}</td>
            <td>${c.location}</td>
            <td>
                <button class="btn btn-danger" onclick="deleteAdminClient(${c.client_id})" style="padding:6px 12px; font-size:12px;">Delete</button>
            </td>
        </tr>
        `;
    });
}

function deleteAdminClient(id) {
    if (!confirm("Are you sure you want to delete this client company profile?")) return;

    fetch(BASE_URL + "/clients/delete/" + id + "/", { method: "DELETE" })
        .then(res => res.json())
        .then(data => {
            alert(data.message || data.error);
            loadAdminDashboard();
        });
}

function displayAdminContracts() {
    const tbody = document.getElementById("adminContractsTable");
    tbody.innerHTML = "";
    if (contractsCached.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:12px; color:var(--text-muted);">No contracts logs found.</td></tr>`;
        return;
    }

    contractsCached.forEach(c => {
        let badgeClass = "badge-success";
        if (c.contract_status === "Completed") badgeClass = "badge-info";
        else if (c.contract_status === "Cancelled") badgeClass = "badge-danger";

        tbody.innerHTML += `
        <tr>
            <td><b>#${c.contract_id}</b></td>
            <td><b>${c.project_title}</b></td>
            <td><b>${c.freelancer_name}</b></td>
            <td>${c.client_name}</td>
            <td><b>$${c.agreed_budget}</b></td>
            <td>${c.end_date}</td>
            <td><span class="badge ${badgeClass}">${c.contract_status}</span></td>
            <td>
                <button class="btn btn-danger" onclick="deleteAdminContract(${c.contract_id})" style="padding:6px 12px; font-size:12px;">Cancel</button>
            </td>
        </tr>
        `;
    });
}

function deleteAdminContract(id) {
    if (!confirm("Are you sure you want to cancel this contract?")) return;

    fetch(BASE_URL + "/contracts/delete/" + id + "/", { method: "DELETE" })
        .then(res => res.json())
        .then(data => {
            alert(data.message || data.error);
            loadAdminDashboard();
        });
}

// Mobile Hamburger Menu toggler
function toggleMobileMenu() {
    const navLinks = document.getElementById("navLinks");
    if (navLinks) {
        navLinks.classList.toggle("open");
    }
}

// ==========================================================================
// WINDOW LOAD DISPATCHER
// ==========================================================================
window.onload = function() {
    // 1. Force Auth Route guard
    checkAuthentication();

    // 2. Render Navbar by role
    renderNavbar();

    // 3. Dispatch functions by page
    const currentPath = window.location.pathname.split("/").pop() || "index.html";

    if (currentPath === "index.html") {
        getHomeData();
    } else if (currentPath === "projects.html") {
        getExploreProjects();
    } else if (currentPath === "bids.html") {
        loadBidDetails();
    } else if (currentPath === "contracts.html") {
        getContracts();
    } else if (currentPath === "dashboard.html") {
        loadDashboardData();
    }
};
