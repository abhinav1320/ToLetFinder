/* =========================================================
   TO-LET FINDER
   Complete script.js
========================================================= */


/* =========================================================
   SUPABASE SETUP
========================================================= */

const SUPABASE_URL =
    "https://amvzimxdycbulvxxmboq.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_LI8n64pscrtoMEW6FMk4_Q_r6K5J2XK";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/* =========================================================
   COMMON HELPERS
========================================================= */

function escapeHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function openProperty(id) {
    window.location.href =
        "property.html?id=" + encodeURIComponent(id);
}


function getPropertyImage(property) {

    if (property.photo_url) {
        return property.photo_url;
    }

    return "images/house1.jpg";
}


/* =========================================================
   PROPERTY CARD
========================================================= */

function createPropertyCard(property) {

    const card =
        document.createElement("div");

    card.className = "property-card";

    const image =
        document.createElement("img");

    image.src = getPropertyImage(property);

    image.alt =
        property.property_type ||
        "Rental house";

    image.onerror = function() {
        this.src = "images/house1.jpg";
    };


    const bottom =
        document.createElement("div");

    bottom.className =
        "property-card-bottom";


    const rent =
        document.createElement("p");

    rent.className =
        "property-rent";

    rent.textContent =
        "₹" +
        Number(property.monthly_rent || 0).toLocaleString("en-IN") +
        "/month";


    const button =
        document.createElement("button");

    button.type = "button";

    button.className =
        "view-details-button";

    button.textContent =
        "View Details";


    button.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            openProperty(property.id);
        }
    );


    bottom.appendChild(rent);
    bottom.appendChild(button);

    card.appendChild(image);
    card.appendChild(bottom);


    card.addEventListener(
        "click",
        function() {
            openProperty(property.id);
        }
    );


    return card;
}


/* =========================================================
   LOAD ALL AVAILABLE PROPERTIES
========================================================= */

async function getAvailableProperties() {

    const {
        data,
        error
    } = await supabaseClient
        .from("properties")
        .select("*")
        .eq("status", "available")
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(
            "Error loading properties:",
            error
        );

        return [];
    }

    return data || [];
}


/* =========================================================
   PROPERTIES PAGE
========================================================= */

async function loadPropertiesPage() {

    const propertyList =
        document.getElementById(
            "property-list"
        );

    if (!propertyList) {
        return;
    }


    propertyList.innerHTML =
        "<p>Loading houses...</p>";


    const properties =
        await getAvailableProperties();


    propertyList.innerHTML = "";


    if (properties.length === 0) {

        propertyList.innerHTML =
            "<p>No houses available.</p>";

        return;
    }


    properties.forEach(
        function(property) {

            propertyList.appendChild(
                createPropertyCard(property)
            );
        }
    );
}


/* =========================================================
   HOME PAGE SEARCH
========================================================= */

function searchProperties(properties, searchText) {

    if (!searchText) {
        return properties;
    }


    const text =
        searchText
            .toLowerCase()
            .trim();


    if (!text) {
        return properties;
    }


    let results =
        properties;


    /* -----------------------------------------
       Extract BHK / BEDROOM SEARCH
    ----------------------------------------- */

    let bedroomMatch =
        text.match(
            /(\d+)\s*(?:bhk|bedroom|bedrooms)/
        );


    let bedroomNumber = null;


    if (bedroomMatch) {

        bedroomNumber =
            Number(
                bedroomMatch[1]
            );

        results =
            results.filter(
                function(property) {

                    return Number(
                        property.bedrooms
                    ) === bedroomNumber;
                }
            );
    }


    /* -----------------------------------------
       Extract MAX RENT
    ----------------------------------------- */

    let maxRent = null;


    const maxRentMatch =
        text.match(
            /(?:under|below|max|maximum|upto|up to)\s*(?:₹\s*)?(\d+(?:\.\d+)?)\s*(k)?/i
        );


    if (maxRentMatch) {

        maxRent =
            Number(
                maxRentMatch[1]
            );

        if (
            maxRentMatch[2] &&
            maxRent < 1000
        ) {
            maxRent =
                maxRent * 1000;
        }


        results =
            results.filter(
                function(property) {

                    return Number(
                        property.monthly_rent
                    ) <= maxRent;
                }
            );
    }


    /* -----------------------------------------
       Extract EXACT RENT
    ----------------------------------------- */

    if (maxRent === null) {

        const exactRentMatch =
            text.match(
                /(?:₹\s*)?(\d{4,6})(?!\s*k)/
            );


        if (exactRentMatch) {

            const exactRent =
                Number(
                    exactRentMatch[1]
                );


            results =
                results.filter(
                    function(property) {

                        return Number(
                            property.monthly_rent
                        ) === exactRent;
                    }
                );
        }
    }


    /* -----------------------------------------
       General TEXT SEARCH
    ----------------------------------------- */

    results =
        results.filter(
            function(property) {

                const searchableText =
                    (
                        String(
                            property.location || ""
                        ) +
                        " " +
                        String(
                            property.property_type || ""
                        ) +
                        " " +
                        String(
                            property.description || ""
                        ) +
                        " " +
                        String(
                            property.parking || ""
                        ) +
                        " " +
                        String(
                            property.water || ""
                        )
                    )
                    .toLowerCase();


                const words =
                    text
                        .split(/\s+/)
                        .filter(
                            function(word) {

                                return (
                                    word.length > 1 &&
                                    ![
                                        "bhk",
                                        "bedroom",
                                        "bedrooms",
                                        "under",
                                        "below",
                                        "maximum",
                                        "max",
                                        "upto",
                                        "up",
                                        "to"
                                    ].includes(word)
                                );
                            }
                        );


                return words.every(
                    function(word) {

                        return searchableText.includes(
                            word
                        );
                    }
                );
            }
        );


    return results;
}


/* =========================================================
   FILTER SYSTEM
========================================================= */

let selectedFilters = {

    rent: "",

    propertyType: "",

    bedrooms: "",

    bathrooms: "",

    parking: "",

    water: ""
};


/* =========================================================
   YES / NO MATCHING
========================================================= */

function matchesYesNo(
    value,
    wanted
) {

    if (!wanted) {
        return true;
    }


    const actual =
        String(
            value || ""
        )
        .toLowerCase()
        .trim();


    if (wanted === "yes") {

        return (
            actual.includes("yes") ||
            actual.includes("available") ||
            actual.includes("true")
        );
    }


    if (wanted === "no") {

        return (
            actual === "no" ||
            actual.includes("not available") ||
            actual.includes("false")
        );
    }


    return false;
}


/* =========================================================
   APPLY PROPERTY FILTERS
========================================================= */

function applyPropertyFilters(
    properties
) {

    let results =
        properties;


    /* Maximum Rent */

    if (selectedFilters.rent) {

        results =
            results.filter(
                function(property) {

                    return Number(
                        property.monthly_rent
                    ) <= Number(
                        selectedFilters.rent
                    );
                }
            );
    }


    /* Property Type */

    if (selectedFilters.propertyType) {

        results =
            results.filter(
                function(property) {

                    return String(
                        property.property_type || ""
                    )
                    .toLowerCase()
                    .includes(
                        String(
                            selectedFilters.propertyType
                        )
                        .toLowerCase()
                    );
                }
            );
    }


    /* Bedrooms */

    if (selectedFilters.bedrooms) {

        if (
            selectedFilters.bedrooms === "5"
        ) {

            results =
                results.filter(
                    function(property) {

                        return Number(
                            property.bedrooms
                        ) >= 5;
                    }
                );

        } else {

            results =
                results.filter(
                    function(property) {

                        return Number(
                            property.bedrooms
                        ) === Number(
                            selectedFilters.bedrooms
                        );
                    }
                );
        }
    }


    /* Bathrooms */

    if (selectedFilters.bathrooms) {

        if (
            selectedFilters.bathrooms === "4"
        ) {

            results =
                results.filter(
                    function(property) {

                        return Number(
                            property.bathrooms
                        ) >= 4;
                    }
                );

        } else {

            results =
                results.filter(
                    function(property) {

                        return Number(
                            property.bathrooms
                        ) === Number(
                            selectedFilters.bathrooms
                        );
                    }
                );
        }
    }


    /* Parking */

    if (selectedFilters.parking) {

        results =
            results.filter(
                function(property) {

                    return matchesYesNo(
                        property.parking,
                        selectedFilters.parking
                    );
                }
            );
    }


    /* Water */

    if (selectedFilters.water) {

        results =
            results.filter(
                function(property) {

                    return matchesYesNo(
                        property.water,
                        selectedFilters.water
                    );
                }
            );
    }


    return results;
}


/* =========================================================
   DISPLAY HOME PROPERTIES
========================================================= */

function displayHomeProperties(
    properties
) {

    const list =
        document.getElementById(
            "home-property-list"
        );


    if (!list) {
        return;
    }


    list.innerHTML = "";


    if (!properties.length) {

        list.innerHTML =
            "<p>No houses found.</p>";

        return;
    }


    properties.forEach(
        function(property) {

            list.appendChild(
                createPropertyCard(property)
            );
        }
    );
}


/* =========================================================
   LOAD HOME PROPERTIES
========================================================= */

async function loadHomeProperties() {

    const list =
        document.getElementById(
            "home-property-list"
        );


    if (!list) {
        return;
    }


    list.innerHTML =
        "<p>Loading houses...</p>";


    const properties =
        await getAvailableProperties();


    const searchInput =
        document.getElementById(
            "home-search"
        );


    const searchText =
        searchInput
            ? searchInput.value.trim()
            : "";


    let results =
        searchProperties(
            properties,
            searchText
        );


    results =
        applyPropertyFilters(
            results
        );


    displayHomeProperties(
        results
    );
}


/* =========================================================
   HOME SEARCH BUTTON
========================================================= */

const homeSearchButton =
    document.getElementById(
        "home-search-button"
    );


if (homeSearchButton) {

    homeSearchButton.addEventListener(
        "click",
        function() {

            loadHomeProperties();
        }
    );
}


/* Search when pressing Enter */

const homeSearchInput =
    document.getElementById(
        "home-search"
    );


if (homeSearchInput) {

    homeSearchInput.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                event.preventDefault();

                loadHomeProperties();
            }
        }
    );
}


/* =========================================================
   FILTER OPEN / CLOSE
========================================================= */

const filtersToggle =
    document.getElementById(
        "filters-toggle"
    );

const filtersPanel =
    document.getElementById(
        "filters-panel"
    );

const filtersArrow =
    document.getElementById(
        "filters-arrow"
    );


if (
    filtersToggle &&
    filtersPanel
) {

    filtersPanel.hidden = true;

    filtersToggle.setAttribute(
        "aria-expanded",
        "false"
    );


    if (filtersArrow) {
        filtersArrow.textContent = "▼";
    }


    filtersToggle.addEventListener(
        "click",
        function() {

            const isOpen =
                !filtersPanel.hidden;


            filtersPanel.hidden =
                isOpen;


            filtersToggle.setAttribute(
                "aria-expanded",
                String(!isOpen)
            );


            if (filtersArrow) {

                filtersArrow.textContent =
                    isOpen
                        ? "▼"
                        : "▲";
            }


            if (isOpen) {
                closeAllFilterOptions();
            }
        }
    );
}


/* =========================================================
   FILTER DROPDOWNS — COMPLETE FIX
========================================================= */

/* Close dropdown menus */
function closeAllFilterOptions(exceptOptions) {
    document.querySelectorAll(".filter-options").forEach(function(menu) {
        if (menu !== exceptOptions) {
            menu.classList.remove("open");
        }
    });
}

/* Open and close each filter dropdown */
document.querySelectorAll(".filter-selector").forEach(function(selector) {
    selector.addEventListener("click", function(event) {
        event.preventDefault();
        event.stopPropagation();

        const item = selector.closest(".filter-item");
        if (!item) return;

        const options = item.querySelector(".filter-options");
        if (!options) return;

        const shouldOpen = !options.classList.contains("open");

        closeAllFilterOptions();

        if (shouldOpen) {
            options.classList.add("open");
        }
    });
});

/* Select a filter option */
document.querySelectorAll(".filter-options button").forEach(function(optionButton) {
    optionButton.addEventListener("click", function(event) {
        event.preventDefault();
        event.stopPropagation();

        const options = optionButton.closest(".filter-options");
        const item = optionButton.closest(".filter-item");
        if (!options || !item) return;

        const selector = item.querySelector(".filter-selector");
        if (!selector) return;

        const filterName = selector.dataset.filter;
        const value = optionButton.dataset.value || "";

        const stateName =
            filterName === "property-type"
                ? "propertyType"
                : filterName;

        if (Object.prototype.hasOwnProperty.call(selectedFilters, stateName)) {
            selectedFilters[stateName] = value;
        }

        const display = selector.querySelector("span:first-child");
        if (display) {
            display.textContent = optionButton.textContent.trim();
        }

        options.querySelectorAll("button").forEach(function(button) {
            button.classList.remove("selected");
        });

        optionButton.classList.add("selected");
        options.classList.remove("open");
    });
});

/* Close dropdowns when tapping outside */
document.addEventListener("click", function(event) {
    if (!event.target.closest(".filter-item")) {
        closeAllFilterOptions();
    }
});



/* =========================================================
   CLEAR FILTERS
========================================================= */

const clearFiltersButton =
    document.getElementById(
        "clear-filters"
    );


if (clearFiltersButton) {

    clearFiltersButton.addEventListener(
        "click",
        function() {

            selectedFilters = {

                rent: "",

                propertyType: "",

                bedrooms: "",

                bathrooms: "",

                parking: "",

                water: ""
            };


            const valueIds = [

                "filter-rent-value",

                "filter-property-type-value",

                "filter-bedrooms-value",

                "filter-bathrooms-value",

                "filter-parking-value",

                "filter-water-value"
            ];


            valueIds.forEach(
                function(id) {

                    const element =
                        document.getElementById(
                            id
                        );


                    if (element) {
                        element.textContent =
                            "Any";
                    }
                }
            );


            document
                .querySelectorAll(
                    ".filter-options button"
                )
                .forEach(
                    function(button) {

                        button.classList.remove(
                            "selected"
                        );
                    }
                );


            closeAllFilterOptions();


            loadHomeProperties();
        }
    );
}


/* =========================================================
   APPLY FILTERS
========================================================= */

const applyFiltersButton =
    document.getElementById(
        "apply-filters"
    );


if (applyFiltersButton) {

    applyFiltersButton.addEventListener(
        "click",
        function() {

            closeAllFilterOptions();


            if (filtersPanel) {

                filtersPanel.hidden =
                    true;
            }


            if (filtersToggle) {

                filtersToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }


            if (filtersArrow) {

                filtersArrow.textContent =
                    "▼";
            }


            loadHomeProperties();
        }
    );
}


/* =========================================================
   EXPLORE MORE
========================================================= */

const exploreMoreButton =
    document.getElementById(
        "explore-more-button"
    );


if (exploreMoreButton) {

    exploreMoreButton.addEventListener(
        "click",
        function() {

            window.location.href =
                "map.html";
        }
    );
}
/* =========================================================
   PROFILE BUTTON
========================================================= */

const profileButton =
    document.getElementById("profile-button");

if (profileButton) {
    profileButton.addEventListener("click", function() {
        window.location.href = "profile.html";
    });
}

/* =========================================================
   PROPERTY DETAILS PAGE
========================================================= */

async function loadPropertyDetails() {

    const titleElement =
        document.getElementById(
            "property-title"
        );


    const rentElement =
        document.getElementById(
            "property-rent"
        );


    if (
        !titleElement &&
        !rentElement
    ) {
        return;
    }


    const params =
        new URLSearchParams(
            window.location.search
        );


    const id =
        params.get("id");


    if (!id) {
        return;
    }


    const {
        data: property,
        error
    } = await supabaseClient
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();


    if (error || !property) {

        console.error(
            "Property details error:",
            error
        );

        return;
    }


    /* Title */

    if (titleElement) {

        titleElement.textContent =
            property.property_type ||
            "Rental Property";
    }


    /* Rent */

    if (rentElement) {

        rentElement.textContent =
            "₹" +
            Number(
                property.monthly_rent || 0
            ).toLocaleString("en-IN") +
            "/month";
    }


    /* Image */

    const image =
        document.getElementById(
            "property-image"
        );


    if (image) {

        image.src =
            getPropertyImage(
                property
            );

        image.onerror =
            function() {

                this.src =
                    "images/house1.jpg";
            };
    }


    /* Generic information IDs */

    const fields = {

        "property-location":
            property.location,

        "property-bedrooms":
            property.bedrooms,

        "property-bathrooms":
            property.bathrooms || "N/A",

        "property-parking":
            property.parking,

        "property-water":
            property.water,

        "property-description":
            property.description ||
            "No description provided.",

        "property-owner":
            property.owner_name,

        "property-phone":
            property.phone_number
    };


    Object.keys(fields).forEach(
        function(id) {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.textContent =
                    fields[id];
            }
        }
    );


    /* Call owner */

    const callButton =
        document.getElementById(
            "call-owner"
        );


    if (
        callButton &&
        property.phone_number
    ) {

        callButton.addEventListener(
            "click",
            function() {

                window.location.href =
                    "tel:" +
                    property.phone_number;
            }
        );
    }


    /* WhatsApp */

    const whatsappButton =
        document.getElementById(
            "whatsapp-owner"
        );


    if (
        whatsappButton &&
        property.phone_number
    ) {

        whatsappButton.addEventListener(
            "click",
            function() {

                const phone =
                    String(
                        property.phone_number
                    )
                    .replace(
                        /\D/g,
                        ""
                    );


                const message =
                    encodeURIComponent(
                        "Hello, I am interested in your rental property listed on To-Let Finder."
                    );


                window.open(
                    "https://wa.me/" +
                    phone +
                    "?text=" +
                    message,
                    "_blank"
                );
            }
        );
    }
}


/* =========================================================
   POST PROPERTY PAGE
========================================================= */

const postPropertyForm =
    document.getElementById(
        "post-property-form"
    );


if (postPropertyForm) {

    postPropertyForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const submitButton =
                postPropertyForm.querySelector(
                    "button[type='submit']"
                );


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Posting...";
            }


            try {

                const propertyType =
                    document.getElementById(
                        "property-type"
                    )?.value.trim();


                const monthlyRent =
                    document.getElementById(
                        "monthly-rent"
                    )?.value;


                const ownerName =
                    document.getElementById(
                        "owner-name"
                    )?.value.trim();


                const location =
                    document.getElementById(
                        "property-location"
                    )?.value.trim();


                const bedrooms =
                    document.getElementById(
                        "bedrooms"
                    )?.value;


                const bathrooms =
                    document.getElementById(
                        "bathrooms"
                    )?.value;


                const parking =
                    document.getElementById(
                        "parking"
                    )?.value;


                const water =
                    document.getElementById(
                        "water"
                    )?.value;


                const description =
                    document.getElementById(
                        "description"
                    )?.value.trim();


                const phoneNumber =
                    document.getElementById(
                        "phone-number"
                    )?.value.trim();


                const photoInput =
                    document.getElementById(
                        "photo-input"
                    );


                if (
                    !propertyType ||
                    !monthlyRent ||
                    !ownerName ||
                    !location ||
                    !bedrooms ||
                    !parking ||
                    !water ||
                    !phoneNumber
                ) {

                    alert(
                        "Please fill all required fields."
                    );

                    return;
                }


                /* -----------------------------------------
                   Get current logged-in user
                ----------------------------------------- */

                const {
                    data: {
                        user
                    }
                } =
                    await supabaseClient
                        .auth
                        .getUser();


                /* -----------------------------------------
                   Upload first photo
                ----------------------------------------- */

                let photoURL = "";


                if (
                    photoInput &&
                    photoInput.files.length > 0
                ) {

                    const file =
                        photoInput.files[0];


                    const extension =
                        file.name
                            .split(".")
                            .pop();


                    const fileName =
                        Date.now() +
                        "_" +
                        Math.random()
                            .toString(36)
                            .substring(2) +
                        "." +
                        extension;


                    const filePath =
                        fileName;


                    const {
                        error:
                            uploadError
                    } =
                        await supabaseClient
                            .storage
                            .from(
                                "property-photos"
                            )
                            .upload(
                                filePath,
                                file
                            );


                    if (uploadError) {

                        console.error(
                            uploadError
                        );

                        throw new Error(
                            "Photo upload failed."
                        );
                    }


                    const {
                        data:
                            publicURLData
                    } =
                        supabaseClient
                            .storage
                            .from(
                                "property-photos"
                            )
                            .getPublicUrl(
                                filePath
                            );


                    photoURL =
                        publicURLData
                            .publicUrl;
                }


                /* -----------------------------------------
                   Insert property
                ----------------------------------------- */

                const {
                    error
                } =
                    await supabaseClient
                        .from("properties")
                        .insert([
                            {

                                property_type:
                                    propertyType,

                                owner_name:
                                    ownerName,

                                monthly_rent:
                                    Number(
                                        monthlyRent
                                    ),

                                location:
                                    location,

                                bedrooms:
                                    Number(
                                        bedrooms
                                    ),

                                bathrooms:
                                    bathrooms
                                        ? Number(
                                            bathrooms
                                        )
                                        : null,

                                parking:
                                    parking,

                                water:
                                    water,

                                description:
                                    description ||
                                    null,

                                phone_number:
                                    phoneNumber,

                                photo_url:
                                    photoURL ||
                                    null,

                                status:
                                    "available"
                            }
                        ]);


                if (error) {

                    console.error(
                        error
                    );

                    throw new Error(
                        "Property could not be posted."
                    );
                }


                alert(
                    "Property posted successfully!"
                );


                window.location.href =
                    "index.html";

            } catch (error) {

                console.error(
                    error
                );

                alert(
                    error.message ||
                    "Something went wrong."
                );

            } finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "Post Property";
                }
            }
        }
    );
}


/* =========================================================
   PHOTO PREVIEW
========================================================= */

const photoInput =
    document.getElementById(
        "photo-input"
    );

const photoPreview =
    document.getElementById(
        "photo-preview"
    );


if (
    photoInput &&
    photoPreview
) {

    photoInput.addEventListener(
        "change",
        function() {

            photoPreview.innerHTML =
                "";


            const files =
                Array.from(
                    photoInput.files
                );


            files.forEach(
                function(file) {

                    if (
                        !file.type.startsWith(
                            "image/"
                        )
                    ) {
                        return;
                    }


                    const image =
                        document.createElement(
                            "img"
                        );


                    image.src =
                        URL.createObjectURL(
                            file
                        );


                    image.alt =
                        "Property photo";


                    photoPreview.appendChild(
                        image
                    );
                }
            );
        }
    );
}


/* =========================================================
   LOGIN / AUTH
========================================================= */

async function getCurrentUser() {

    const {
        data: {
            user
        }
    } =
        await supabaseClient
            .auth
            .getUser();


    return user;
}


/* =========================================================
   INITIAL PAGE LOADING
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        /* Home */

        if (
            document.getElementById(
                "home-property-list"
            )
        ) {

            await loadHomeProperties();
        }


        /* Properties */

        if (
            document.getElementById(
                "property-list"
            )
        ) {

            await loadPropertiesPage();
        }


        /* Property details */

        if (
            document.getElementById(
                "property-title"
            ) ||
            document.getElementById(
                "property-rent"
            )
        ) {

            await loadPropertyDetails();
        }
    }
);

async function setupPropertyLikeButton() {
    const likeButton = document.getElementById("like-property-button");

    if (!likeButton) return;

    const params = new URLSearchParams(window.location.search);
    const propertyId = params.get("id");

    if (!propertyId) {
        likeButton.disabled = true;
        return;
    }

    async function getUser() {
        const { data, error } = await supabaseClient.auth.getUser();

        if (error || !data.user) return null;
        return data.user;
    }

    async function refreshLikeButton() {
        const user = await getUser();

        if (!user) {
            likeButton.textContent = "♡";
            likeButton.classList.remove("liked");
            likeButton.setAttribute("aria-pressed", "false");
            return;
        }

        const { data, error } = await supabaseClient
            .from("liked_properties")
            .select("id")
            .eq("user_id", user.id)
            .eq("property_id", propertyId)
            .maybeSingle();

        if (error) {
            console.error("Could not check like:", error.message);
            return;
        }

        const isLiked = !!data;

        likeButton.textContent = isLiked ? "♥" : "♡";
        likeButton.classList.toggle("liked", isLiked);
        likeButton.setAttribute("aria-pressed", String(isLiked));
    }

    likeButton.addEventListener("click", async () => {
        const user = await getUser();

        if (!user) {
            alert("Please log in to like a property.");
            window.location.href = "login.html";
            return;
        }

        likeButton.disabled = true;

        try {
            const isLiked =
                likeButton.getAttribute("aria-pressed") === "true";

            if (isLiked) {
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

            await refreshLikeButton();
        
} catch (error) {
    console.error("Like action failed:", error);
    alert("Like error: " + error.message);
}

            
         finally {
            likeButton.disabled = false;
        }
    });

    await refreshLikeButton();
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        setupPropertyLikeButton
    );
} else {
    setupPropertyLikeButton();
}
















