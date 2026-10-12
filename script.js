/* =========================================================
   TO-LET FINDER — COMPLETE script.js
========================================================= */

/* SUPABASE SETUP */

const SUPABASE_URL =
    "https://amvzimxdycbulvxxmboq.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_LI8n64pscrtoMEW6FMk4_Q_r6K5J2XK";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

/* COMMON HELPERS */

function escapeHTML(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "'");
}

function openProperty(id) {
    window.location.href =
        "property.html?id=" + encodeURIComponent(id);
}

function getPropertyImage(property) {
    return property.photo_url || "images/house1.jpg";
}

/* PROPERTY CARDS */

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

    const bottom = document.createElement("div");
    bottom.className = "property-card-bottom";

    const rent = document.createElement("p");
    rent.className = "property-rent";
    rent.textContent =
        "₹" +
        Number(property.monthly_rent || 0).toLocaleString("en-IN") +
        "/month";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "view-details-button";
    button.textContent = "View Details";

    button.addEventListener("click", function (event) {
        event.stopPropagation();
        openProperty(property.id);
    });

    bottom.append(rent, button);
    card.append(image, bottom);

    card.addEventListener("click", function () {
        openProperty(property.id);
    });

    return card;
}

/* LOAD AVAILABLE PROPERTIES */

async function getAvailableProperties() {
    const { data, error } = await supabaseClient
        .from("properties")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error loading properties:", error);
        return [];
    }

    return data || [];
}

/* PROPERTIES PAGE */

async function loadPropertiesPage() {
    const propertyList = document.getElementById("property-list");
    if (!propertyList) return;

    propertyList.innerHTML = "<p>Loading houses...</p>";

    const properties = await getAvailableProperties();
    propertyList.innerHTML = "";

    if (!properties.length) {
        propertyList.innerHTML = "<p>No houses available.</p>";
        return;
    }

    properties.forEach(function (property) {
        propertyList.appendChild(createPropertyCard(property));
    });
}

/* HOME PAGE SEARCH */

function searchProperties(properties, searchText) {
    if (!searchText || !searchText.trim()) return properties;

    const text = searchText.toLowerCase().trim();
    let results = properties;

    const bedroomMatch = text.match(
        /(\d+)\s*(?:bhk|bedroom|bedrooms)/
    );

    if (bedroomMatch) {
        const bedroomNumber = Number(bedroomMatch[1]);

        results = results.filter(function (property) {
            return Number(property.bedrooms) === bedroomNumber;
        });
    }

    const maxRentMatch = text.match(
        /(?:under|below|max|maximum|upto|up to)\s*(?:₹\s*)?(\d+(?:\.\d+)?)\s*(k)?/i
    );

    let maxRent = null;

    if (maxRentMatch) {
        maxRent = Number(maxRentMatch[1]);

        if (maxRentMatch[2] && maxRent < 1000) {
            maxRent *= 1000;
        }

        results = results.filter(function (property) {
            return Number(property.monthly_rent) <= maxRent;
        });
    }

    if (maxRent === null) {
        const exactRentMatch = text.match(
            /(?:₹\s*)?(\d{4,6})(?!\s*k)/i
        );

        if (exactRentMatch) {
            const exactRent = Number(exactRentMatch[1]);

            results = results.filter(function (property) {
                return Number(property.monthly_rent) === exactRent;
            });
        }
    }

    const ignoredWords = [
        "bhk", "bedroom", "bedrooms", "under", "below",
        "maximum", "max", "upto", "up", "to"
    ];

    const words = text.split(/\s+/).filter(function (word) {
        return word.length > 1 && !ignoredWords.includes(word);
    });

    results = results.filter(function (property) {
        const searchableText = (
            String(property.location || "") + " " +
            String(property.property_type || "") + " " +
            String(property.description || "") + " " +
            String(property.parking || "") + " " +
            String(property.water || "")
        ).toLowerCase();

        return words.every(function (word) {
            return searchableText.includes(word);
        });
    });

    return results;
}

/* PROPERTY POSTING FORM HANDLING */

document.addEventListener("DOMContentLoaded", function () {
    // If you are on the list page, automatically load properties
    loadPropertiesPage();

    const postForm = document.getElementById("post-property-form") || document.querySelector("form");
    if (!postForm) return;

    postForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        // 1. Check if the user is authenticated securely
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            alert("Security Violation: You must be logged in to post properties.");
            return;
        }

        // Show a loading feedback visual state
        const submitButton = postForm.querySelector("button[type='submit']") || document.querySelector(".posting-container button");
        const originalText = submitButton ? submitButton.textContent : "Submit";
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Posting...";
        }

        try {
            // 2. Safely capture input values from form fields
            const propertyType = document.getElementById("property-type")?.value || "";
            const rent = document.getElementById("monthly-rent")?.value || 0;
            const location = document.getElementById("location")?.value || "";
            const bedrooms = document.getElementById("bedrooms")?.value || 1;
            const parking = document.getElementById("parking")?.value || "No";
            const water = document.getElementById("water")?.value || "No";
            const description = document.getElementById("description")?.value || "";
            const photoInput = document.getElementById("photo-upload") || document.querySelector("input[type='file']");

            let photoUrl = "";

            // 3. Handle File Upload if an image file was chosen by the client
            if (photoInput && photoInput.files && photoInput.files.length > 0) {
                const file = photoInput.files[0];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `property-photos/${fileName}`;

                // Upload image payload to Supabase storage bucket named 'properties'
                const { error: uploadError } = await supabaseClient.storage
                    .from("properties")
                    .upload(filePath, file);

                if (uploadError) {
                    throw new Error("Photo upload failed: " + uploadError.message);
                }

                // Retrieve the public URL string for our new image asset
                const { data: urlData } = supabaseClient.storage
                    .from("properties")
                    .getPublicUrl(filePath);

                photoUrl = urlData.publicUrl;
            }

            // 4. Submit fields to PostgreSQL database along with active user_id context
            const { data, error: insertError } = await supabaseClient
                .from("properties")
                .insert([
                    {
                        user_id: user.id, // Direct linkage to logged in account to bypass RLS
                        property_type: propertyType,
                        monthly_rent: Number(rent),
                        location: location,
                        bedrooms: Number(bedrooms),
                        parking: parking,
                        water: water,
                        description: description,
                        photo_url: photoUrl,
                        status: "available"
                    }
                ]);

            if (insertError) {
                throw insertError;
            }

            alert("Success! Your property has been posted safely.");
            postForm.reset();
            
            // Redirect to home page or property list page after successful post
            window.location.href = "index.html";

        } catch (error) {
            console.error("Submission error details:", error);
            alert("Error posting property: " + error.message);
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        }
    });
});
