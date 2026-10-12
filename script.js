
/* =====================================================
   TO-LET FINDER — script.js
   ===================================================== */

/* 1. SUPABASE SETUP */

const SUPABASE_URL =
    "https://amvzimxdycbulvxxmboq.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_LI8n64pscrtoMEW6FMk4_Q_r6K5J2XK";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


/* 2. COMMON HELPERS */

function escapeHTML(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getPropertyImage(property) {
    return property.photo_url || "images/house1.jpg";
}

function openProperty(id) {
    window.location.href =
        "property.html?id=" + encodeURIComponent(id);
}

async function getAvailableProperties() {
    const { data, error } = await supabaseClient
        .from("properties")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Loading properties failed:", error);
        return [];
    }

    return data || [];
}


/* 3. PROPERTY CARDS */

function createPropertyCard(property) {
    const card = document.createElement("div");
    card.className = "property-card";

    const image = document.createElement("img");
    image.src = getPropertyImage(property);
    image.alt = property.property_type || "Rental house";

    image.onerror = function () {
        this.onerror = null;
        this.src = "images/house1.jpg";
    };

    const details = document.createElement("div");
    details.className = "property-card-bottom";

    const title = document.createElement("h3");
    title.textContent = property.property_type || "Rental House";

    const location = document.createElement("p");
    location.textContent = "📍 " + (property.location || "Location unavailable");

    const rent = document.createElement("p");
    rent.className = "property-rent";
    rent.textContent =
        "₹" + Number(property.monthly_rent || 0).toLocaleString("en-IN") +
        "/month";

    const bedrooms = document.createElement("p");
    bedrooms.textContent =
        "🛏️ " + (property.bedrooms || 0) + " Bedroom(s)";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "view-details-button";
    button.textContent = "View Details";
    button.addEventListener("click", function (event) {
        event.stopPropagation();
        openProperty(property.id);
    });

    details.append(title, location, rent, bedrooms, button);
    card.append(image, details);

    card.addEventListener("click", function () {
        openProperty(property.id);
    });

    return card;
}


/* 4. AVAILABLE PROPERTIES PAGE */

async function loadPropertiesPage() {
    const list = document.getElementById("property-list");
    if (!list) return;

    list.innerHTML = "<p>Loading houses...</p>";

    const properties = await getAvailableProperties();
    list.innerHTML = "";

    if (properties.length === 0) {
        list.innerHTML = "<p>No houses available right now.</p>";
        return;
    }

    properties.forEach(function (property) {
        list.appendChild(createPropertyCard(property));
    });
}


/* 5. HOME PAGE SEARCH */

function searchProperties(properties, searchText) {
    if (!searchText || !searchText.trim()) return properties;

    const text = searchText.toLowerCase().trim();
    let results = properties;

    const bedroomMatch = text.match(
        /(\d+)\s*(?:bhk|bedroom|bedrooms)/
    );

    if (bedroomMatch) {
        const count = Number(bedroomMatch[1]);

        results = results.filter(function (property) {
            return Number(property.bedrooms) === count;
        });
    }

    const rentMatch = text.match(
        /(?:under|below|max|maximum|upto|up to)\s*₹?\s*(\d+(?:\.\d+)?)\s*(k)?/i
    );

    if (rentMatch) {
        let maxRent = Number(rentMatch[1]);

        if (rentMatch[2] && maxRent < 1000) {
            maxRent *= 1000;
        }

        results = results.filter(function (property) {
            return Number(property.monthly_rent) <= maxRent;
        });
    }

    const ignoredWords = [
        "bhk", "bedroom", "bedrooms", "under", "below",
        "maximum", "max", "upto", "up", "to", "house",
        "houses", "rent", "rental", "near", "in", "for"
    ];

    const words = text.split(/\s+/).filter(function (word) {
        return word.length > 1 &&
            !ignoredWords.includes(word) &&
            !/^\d+$/.test(word);
    });

    return results.filter(function (property) {
        const searchable = [
            property.location,
            property.property_type,
            property.description,
            property.parking,
            property.water
        ].join(" ").toLowerCase();

        return words.every(function (word) {
            return searchable.includes(word);
        });
    });
}

async function setupHomeSearch() {
    const input =
        document.getElementById("search-input") ||
        document.getElementById("property-search");

    const resultsContainer =
        document.getElementById("search-results") ||
        document.getElementById("property-list");

    if (!input || !resultsContainer) return;

    let properties = await getAvailableProperties();

    function renderResults() {
        const results = searchProperties(properties, input.value);
        resultsContainer.innerHTML = "";

        if (results.length === 0) {
            resultsContainer.innerHTML =
                "<p>No matching houses found. Try another search.</p>";
            return;
        }

        results.forEach(function (property) {
            resultsContainer.appendChild(createPropertyCard(property));
        });
    }

    input.addEventListener("input", renderResults);

    const searchButton = document.getElementById("search-button");
    if (searchButton) {
        searchButton.addEventListener("click", renderResults);
    }
}


/* 6. SINGLE PROPERTY DETAILS PAGE */

async function loadPropertyDetails() {
    const titleElement = document.getElementById("property-title");
    const rentElement = document.getElementById("property-rent");

    if (!titleElement && !rentElement) return;

    const id = new URLSearchParams(window.location.search).get("id");

    if (!id) {
        if (titleElement) titleElement.textContent = "Property not found";
        return;
    }

    const { data: property, error } = await supabaseClient
        .from("properties")
        .select("*")
        .eq("id", id)
        .eq("status", "available")
        .maybeSingle();

    if (error || !property) {
        if (titleElement) titleElement.textContent = "Property not found";
        return;
    }

    function setText(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) element.textContent = value ?? "";
    }

    setText("property-title", property.property_type || "Rental House");
    setText(
        "property-rent",
        "₹" + Number(property.monthly_rent || 0).toLocaleString("en-IN") +
        "/month"
    );
    setText("property-location", property.location);
    setText("property-bedrooms", property.bedrooms);
    setText("property-bathrooms", property.bathrooms ?? "Not specified");
    setText("property-parking", property.parking);
    setText("property-water", property.water);
    setText("property-description", property.description || "No description provided.");

    const image = document.getElementById("property-image");
    if (image) {
        image.src = getPropertyImage(property);
        image.onerror = function () {
            this.onerror = null;
            this.src = "images/house1.jpg";
        };
    }

    const phone = String(property.phone_number || "").replace(/\D/g, "");

    const callButton = document.getElementById("call-owner");
    if (callButton && phone) {
        callButton.href = "tel:" + phone;
    }

    const whatsappButton = document.getElementById("whatsapp-owner");
    if (whatsappButton && phone) {
        const whatsappNumber = phone.startsWith("91")
            ? phone
            : "91" + phone;

        whatsappButton.href =
            "https://wa.me/" + whatsappNumber;
        whatsappButton.target = "_blank";
        whatsappButton.rel = "noopener";
    }

    setupLikeButton(property.id);
}


/* 7. POST PROPERTY — SIGNED-IN USERS ONLY */

function setupPostPropertyForm() {
    const form = document.getElementById("property-form");

    if (!form || form.dataset.listenerAttached === "true") return;
    form.dataset.listenerAttached = "true";

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const submitButton = form.querySelector(
            'button[type="submit"]'
        );

        const originalText = submitButton
            ? submitButton.textContent
            : "Post Property";

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Posting...";
        }

        try {
            // Verify that the visitor is signed in.
            const {
                data: { user },
                error: authError
            } = await supabaseClient.auth.getUser();

            if (authError || !user) {
                alert("Please log in before posting a property.");
                window.location.href = "login.html";
                return;
            }

            const propertyType =
                document.getElementById("property-type")?.value || "";

            const ownerName =
                document.getElementById("owner-name")?.value.trim() || "";

            const phoneNumber =
                document.getElementById("phone-number")?.value.trim() || "";

            const monthlyRent =
                document.getElementById("monthly-rent")?.value || "";

            const location =
                document.getElementById("property-location")?.value.trim() || "";

            const bedrooms =
                document.getElementById("bedrooms")?.value || "";

            const bathrooms =
                document.getElementById("bathrooms")?.value || "";

            const parking =
                document.getElementById("parking")?.value || "No";

            const water =
                document.getElementById("water")?.value || "No";

            const description =
                document.getElementById("description")?.value.trim() || "";

            if (
                !propertyType || !ownerName || !phoneNumber ||
                !monthlyRent || !location || !bedrooms
            ) {
                alert("Please fill in all required fields.");
                return;
            }

            let photoURL = null;

            const photoInput = document.getElementById("photo-input");
            const photo = photoInput?.files?.[0];

            // Upload an optional photo to the existing bucket.
            if (photo) {
                if (!photo.type.startsWith("image/")) {
                    throw new Error("Please select an image file.");
                }

                const extension = photo.name.split(".").pop();
                const filePath =
                    user.id + "/" + Date.now() + "." + extension;

                const { error: uploadError } = await supabaseClient
                    .storage
                    .from("property-photos")
                    .upload(filePath, photo, {
                        upsert: false,
                        contentType: photo.type
                    });

                if (uploadError) {
                    throw new Error("Photo upload failed: " + uploadError.message);
                }

                const { data: urlData } = supabaseClient
                    .storage
                    .from("property-photos")
                    .getPublicUrl(filePath);

                photoURL = urlData.publicUrl;
            }

            // Keep this payload aligned with your current table schema.
            const propertyData = {
                property_type: propertyType,
                owner_name: ownerName,
                monthly_rent: Number(monthlyRent),
                location: location,
                latitude: typeof propertyLatitude !== "undefined"
                    ? propertyLatitude
                    : null,
                longitude: typeof propertyLongitude !== "undefined"
                    ? propertyLongitude
                    : null,
                bedrooms: Number(bedrooms),
                bathrooms: bathrooms ? Number(bathrooms) : null,
                parking: parking,
                water: water,
                description: description || null,
                phone_number: phoneNumber,
                photo_url: photoURL,
                status: "available"
            };

            const { data, error: insertError } = await supabaseClient
                .from("properties")
                .insert(propertyData)
                .select("id")
                .single();

            if (insertError) {
                console.error("Property insert failed:", insertError);
                throw new Error(insertError.message);
            }

            alert("Your property was posted successfully!");
            window.location.href = "index.html";

        } catch (error) {
            console.error("Post property error:", error);
            alert("Could not post property: " + error.message);
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        }
    });
}


/* 8. LOGIN AND SIGNUP */

function setupAuthForms() {
    const loginForm = document.getElementById("login-form");

    if (loginForm && loginForm.dataset.listenerAttached !== "true") {
        loginForm.dataset.listenerAttached = "true";

        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const email =
                document.getElementById("login-email")?.value.trim() || "";

            const password =
                document.getElementById("login-password")?.value || "";

            const { error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                alert("Login failed: " + error.message);
                return;
            }

            window.location.href = "profile.html";
        });
    }

    const signupForm = document.getElementById("signup-form");

    if (signupForm && signupForm.dataset.listenerAttached !== "true") {
        signupForm.dataset.listenerAttached = "true";

        signupForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const email =
                document.getElementById("signup-email")?.value.trim() || "";

            const password =
                document.getElementById("signup-password")?.value || "";

            const { error } = await supabaseClient.auth.signUp({
                email,
                password
            });

            if (error) {
                alert("Signup failed: " + error.message);
                return;
            }

            alert("Account created. Check your email if confirmation is required.");
        });
    }
}


/* 9. PROFILE AND LOGOUT */

async function setupProfilePage() {
    const emailElement = document.getElementById("profile-email");
    const logoutButton = document.getElementById("logout-button");

    if (!emailElement && !logoutButton) return;

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
        window.location.href = "login.html";
        return;
    }

    if (emailElement) {
        emailElement.textContent = user.email || "Signed-in user";
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", async function () {
            const { error: logoutError } =
                await supabaseClient.auth.signOut();

            if (logoutError) {
                alert("Logout failed: " + logoutError.message);
                return;
            }

            window.location.href = "index.html";
        });
    }
}


/* 10. LIKES */

async function setupLikeButton(propertyId) {
    const button = document.getElementById("like-property-button");
    if (!button) return;

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {
        button.addEventListener("click", function () {
            alert("Please log in to like properties.");
            window.location.href = "login.html";
        });
        return;
    }

    async function refreshLikeState() {
        const { data, error } = await supabaseClient
            .from("liked_properties")
            .select("id")
            .eq("user_id", user.id)
            .eq("property_id", propertyId)
            .maybeSingle();

        if (error) {
            console.error("Could not check like:", error);
            return;
        }

        button.textContent = data ? "♥ Liked" : "♡ Like";
        button.dataset.liked = data ? "true" : "false";
    }

    await refreshLikeState();

    button.addEventListener("click", async function () {
        if (button.dataset.busy === "true") return;
        button.dataset.busy = "true";

        try {
            if (button.dataset.liked === "true") {
                const { error } = await supabaseClient
                    .from("liked_properties")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("property_id", propertyId);

                if (error) throw error;
            } else {
                const { error } = await supabaseClient
                    .from("liked_properties")
                    .insert({
                        user_id: user.id,
                        property_id: propertyId
                    });

                if (error) throw error;
            }

            await refreshLikeState();
        } catch (error) {
            console.error("Like action failed:", error);
            alert("Could not update like: " + error.message);
        } finally {
            button.dataset.busy = "false";
        }
    });
}


/* 11. LIKED PROPERTIES PAGE */

async function loadLikedPropertiesPage() {
    const list = document.getElementById("liked-property-list");
    if (!list) return;

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {
        list.innerHTML = "<p>Please log in to view liked properties.</p>";
        return;
    }

    list.innerHTML = "<p>Loading liked properties...</p>";

    const { data: likes, error } = await supabaseClient
        .from("liked_properties")
        .select("property_id")
        .eq("user_id", user.id);

    if (error) {
        list.innerHTML = "<p>Could not load liked properties.</p>";
        console.error(error);
        return;
    }

    if (!likes || likes.length === 0) {
        list.innerHTML = "<p>You haven't liked any properties yet.</p>";
        return;
    }

    const ids = likes.map(function (item) {
        return item.property_id;
    });

    const { data: properties, error: propertyError } = await supabaseClient
        .from("properties")
        .select("*")
        .in("id", ids)
        .eq("status", "available");

    if (propertyError) {
        list.innerHTML = "<p>Could not load liked houses.</p>";
        return;
    }

    list.innerHTML = "";

    (properties || []).forEach(function (property) {
        list.appendChild(createPropertyCard(property));
    });
}


/* 12. MAP PAGE */

async function loadMapPage() {
    const mapElement = document.getElementById("map");
    if (!mapElement || typeof L === "undefined") return;

    const map = L.map(mapElement).setView([16.5062, 80.6480], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    const properties = await getAvailableProperties();
    const bounds = [];

    properties.forEach(function (property) {
        const latitude = Number(property.latitude);
        const longitude = Number(property.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return;
        }

        const marker = L.marker([latitude, longitude]).addTo(map);

        const popup = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = property.property_type || "Rental House";

        const location = document.createElement("p");
        location.textContent = property.location || "";

        const rent = document.createElement("p");
        rent.textContent =
            "₹" + Number(property.monthly_rent || 0).toLocaleString("en-IN") +
            "/month";

        const button = document.createElement("button");
        button.textContent = "View Details";
        button.type = "button";
        button.addEventListener("click", function () {
            openProperty(property.id);
        });

        popup.append(title, location, rent, button);
        marker.bindPopup(popup);

        bounds.push([latitude, longitude]);
    });

    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [25, 25], maxZoom: 14 });
    }
}


/* 13. START THE CORRECT FEATURES ON EACH PAGE */

document.addEventListener("DOMContentLoaded", function () {
    loadPropertiesPage();
    setupHomeSearch();
    loadPropertyDetails();
    setupPostPropertyForm();
    setupAuthForms();
    setupProfilePage();
    loadLikedPropertiesPage();
    loadMapPage();
});
