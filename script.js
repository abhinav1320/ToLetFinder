/* ==========================================
   SUPABASE SETUP
========================================== */

const SUPABASE_URL =
    "https://amvzimxdycbulvxxmboq.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_LI8n64pscrtoMEW6FMk4_Q_r6K5J2XK";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/* ==========================================
   POST PROPERTY
========================================== */

const postPropertyForm =
    document.getElementById(
        "post-property-form"
    );

if (postPropertyForm) {

    postPropertyForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            try {

                const propertyType =
                    document.getElementById(
                        "property-type"
                    ).value;

                const monthlyRent =
                    document.getElementById(
                        "monthly-rent"
                    ).value;

                const ownerName =
                    document.getElementById(
                        "owner-name"
                    ).value;

                const propertyLocation =
                    document.getElementById(
                        "property-location"
                    ).value;

                const bedrooms =
                    document.getElementById(
                        "bedrooms"
                    ).value;

                const bathrooms =
                    document.getElementById(
                        "bathrooms"
                    ).value;

                const parking =
                    document.getElementById(
                        "parking"
                    ).value;

                const water =
                    document.getElementById(
                        "water"
                    ).value;

                const description =
                    document.getElementById(
                        "description"
                    ).value;

                const phoneNumber =
                    document.getElementById(
                        "phone-number"
                    ).value;

                const photoInput =
                    document.getElementById(
                        "photo-input"
                    );


                if (
                    !propertyType ||
                    !monthlyRent ||
                    !ownerName ||
                    !propertyLocation ||
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


                /* ==========================================
                   UPLOAD PHOTO
                ========================================== */

                let photoURL = "";


                if (
                    photoInput &&
                    photoInput.files.length > 0
                ) {

                    const photo =
                        photoInput.files[0];


                    const fileName =
                        Date.now() +
                        "-" +
                        photo.name;


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
                            fileName,
                            photo
                        );


                    if (uploadError) {

                        throw uploadError;

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
                            fileName
                        );


                    photoURL =
                        publicURLData.publicUrl;

                }


                /* ==========================================
                   INSERT PROPERTY
                ========================================== */

                const {
                    error
                } =
                    await supabaseClient
                    .from(
                        "properties"
                    )
                    .insert({

                        property_type:
                            propertyType,

                        owner_name:
                            ownerName,

                        monthly_rent:
                            Number(
                                monthlyRent
                            ),

                        location:
                            propertyLocation,

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
                            description || "",

                        phone_number:
                            phoneNumber,

                        photo_url:
                            photoURL,

                        status:
                            "available"

                    });


                if (error) {

                    throw error;

                }


                alert(
                    "Property posted successfully!"
                );


                postPropertyForm.reset();

            }

            catch (error) {

                console.error(
                    error
                );

                alert(
                    "Something went wrong while posting the property."
                );

            }

        }
    );

}


/* ==========================================
   PROPERTIES PAGE
========================================== */

const propertyList =
    document.getElementById(
        "property-list"
    );

if (propertyList) {

    loadPropertiesPage();

}


async function loadPropertiesPage() {

    propertyList.innerHTML =
        "<p>Loading houses...</p>";


    try {

        const {
            data,
            error
        } =
            await supabaseClient
            .from(
                "properties"
            )
            .select("*")
            .eq(
                "status",
                "available"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            throw error;

        }


        if (
            !data ||
            data.length === 0
        ) {

            propertyList.innerHTML =
                "<p>No houses available.</p>";

            return;

        }


        propertyList.innerHTML = "";


        data.forEach(
            function(property) {

                createPropertyCard(
                    propertyList,
                    property
                );

            }
        );

    }

    catch (error) {

        console.error(
            error
        );

        propertyList.innerHTML =
            "<p>Error loading houses.</p>";

    }

}


/* ==========================================
   CREATE PROPERTY CARD
========================================== */

function createPropertyCard(
    container,
    property
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "property-card";


    card.innerHTML = `

        <img
            src="${
                property.photo_url ||
                "images/house1.jpg"
            }"
            alt="Rental House"
        >

        <div
            class="property-card-bottom"
        >

            <div
                class="property-rent"
            >
                ₹${property.monthly_rent}/month
            </div>

            <button
                type="button"
                class="view-details-button"
            >
                View Details
            </button>

        </div>

    `;


    card.addEventListener(
        "click",
        function() {

            window.location.href =
                "property.html?id=" +
                property.id;

        }
    );


    const viewButton =
        card.querySelector(
            ".view-details-button"
        );


    if (viewButton) {

        viewButton.addEventListener(
            "click",
            function(event) {

                event.stopPropagation();

                window.location.href =
                    "property.html?id=" +
                    property.id;

            }
        );

    }


    container.appendChild(
        card
    );

}


/* ==========================================
   HOME PAGE ELEMENTS
========================================== */

const homePropertyList =
    document.getElementById(
        "home-property-list"
    );

const homeSearch =
    document.getElementById(
        "home-search"
    );

const homeSearchButton =
    document.getElementById(
        "home-search-button"
    );


/* ==========================================
   FILTER ELEMENTS
========================================== */

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


/* ==========================================
   FILTER VALUES
========================================== */

let selectedFilters = {

    rent: "",

    propertyType: "",

    bedrooms: "",

    bathrooms: "",

    parking: "",

    water: ""

};


/* ==========================================
   FILTER DISPLAY VALUES
========================================== */

const filterDisplayValues = {

    rent:
        document.getElementById(
            "filter-rent-value"
        ),

    propertyType:
        document.getElementById(
            "filter-property-type-value"
        ),

    bedrooms:
        document.getElementById(
            "filter-bedrooms-value"
        ),

    bathrooms:
        document.getElementById(
            "filter-bathrooms-value"
        ),

    parking:
        document.getElementById(
            "filter-parking-value"
        ),

    water:
        document.getElementById(
            "filter-water-value"
        )

};


/* ==========================================
   FILTER PANEL
========================================== */

if (
    filtersToggle &&
    filtersPanel
) {

    /*
       Force filters CLOSED
       when page first opens.
    */

    filtersPanel.hidden =
        true;


    filtersPanel.style.setProperty(
        "display",
        "none",
        "important"
    );


    filtersToggle.setAttribute(
        "aria-expanded",
        "false"
    );


    if (filtersArrow) {

        filtersArrow.textContent =
            "▼";

    }


    filtersToggle.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            event.stopPropagation();


            const isOpen =
                filtersToggle.getAttribute(
                    "aria-expanded"
                ) === "true";


            if (isOpen) {

                /* CLOSE */

                filtersToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );


                filtersPanel.hidden =
                    true;


                filtersPanel.style.setProperty(
                    "display",
                    "none",
                    "important"
                );


                if (filtersArrow) {

                    filtersArrow.textContent =
                        "▼";

                }

            }

            else {

                /* OPEN */

                filtersToggle.setAttribute(
                    "aria-expanded",
                    "true"
                );


                filtersPanel.hidden =
                    false;


                filtersPanel.style.removeProperty(
                    "display"
                );


                if (filtersArrow) {

                    filtersArrow.textContent =
                        "▲";

                }

            }

        }
    );

}


/* ==========================================
   SMALL FILTER SELECTORS
========================================== */

const filterSelectors =
    document.querySelectorAll(
        ".filter-selector"
    );


filterSelectors.forEach(
    function(selector) {

        selector.addEventListener(
            "click",
            function(event) {

                event.preventDefault();

                event.stopPropagation();


                const filterName =
                    selector.dataset.filter;


                let optionsId;


                if (
                    filterName ===
                    "property-type"
                ) {

                    optionsId =
                        "property-type-options";

                }

                else {

                    optionsId =
                        filterName +
                        "-options";

                }


                const options =
                    document.getElementById(
                        optionsId
                    );


                if (!options) {

                    return;

                }


                /* Close other option boxes */

                document
                    .querySelectorAll(
                        ".filter-options"
                    )
                    .forEach(
                        function(otherOptions) {

                            if (
                                otherOptions !==
                                options
                            ) {

                                otherOptions.classList.remove(
                                    "open"
                                );

                            }

                        }
                    );


                /* Open selected option box */

                options.classList.toggle(
                    "open"
                );

            }
        );

    }
);


/* ==========================================
   FILTER OPTION BUTTONS
========================================== */

document
    .querySelectorAll(
        ".filter-options button"
    )
    .forEach(
        function(optionButton) {

            optionButton.addEventListener(
                "click",
                function(event) {

                    event.preventDefault();

                    event.stopPropagation();


                    const optionsContainer =
                        optionButton.parentElement;


                    const filterName =
                        optionsContainer.id
                        .replace(
                            "-options",
                            ""
                        );


                    const value =
                        optionButton.dataset.value;


                    /* Save selected value */

                    if (
                        filterName ===
                        "property-type"
                    ) {

                        selectedFilters.propertyType =
                            value;

                    }

                    else {

                        selectedFilters[
                            filterName
                        ] =
                            value;

                    }


                    /* Display selected value */

                    const displayName =
                        filterName ===
                        "property-type"
                            ? "propertyType"
                            : filterName;


                    if (
                        filterDisplayValues[
                            displayName
                        ]
                    ) {

                        filterDisplayValues[
                            displayName
                        ].textContent =
                            optionButton.textContent;

                    }


                    /* Remove previous selection */

                    optionsContainer
                        .querySelectorAll(
                            "button"
                        )
                        .forEach(
                            function(button) {

                                button.classList.remove(
                                    "selected"
                                );

                            }
                        );


                    /* Mark selected */

                    optionButton.classList.add(
                        "selected"
                    );


                    /* Close option box */

                    optionsContainer.classList.remove(
                        "open"
                    );

                }
            );

        }
    );


/* ==========================================
   CLOSE SMALL OPTION BOXES
========================================== */

document.addEventListener(
    "click",
    function() {

        document
            .querySelectorAll(
                ".filter-options"
            )
            .forEach(
                function(options) {

                    options.classList.remove(
                        "open"
                    );

                }
            );

    }
);


/* ==========================================
   HOME PAGE INITIAL LOAD
========================================== */

if (homePropertyList) {

    loadHomeProperties();


    /* SEARCH BUTTON */

    if (homeSearchButton) {

        homeSearchButton.addEventListener(
            "click",
            function() {

                const searchText =
                    homeSearch
                        ? homeSearch.value.trim()
                        : "";


                loadHomeProperties(
                    searchText
                );

            }
        );

    }


    /* ENTER KEY */

    if (homeSearch) {

        homeSearch.addEventListener(
            "keydown",
            function(event) {

                if (
                    event.key === "Enter"
                ) {

                    const searchText =
                        homeSearch.value.trim();


                    loadHomeProperties(
                        searchText
                    );

                }

            }
        );

    }

}


/* ==========================================
   APPLY FILTERS
========================================== */

const applyFiltersButton =
    document.getElementById(
        "apply-filters"
    );


if (applyFiltersButton) {

    applyFiltersButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            event.stopPropagation();


            const searchText =
                homeSearch
                    ? homeSearch.value.trim()
                    : "";


            loadHomeProperties(
                searchText
            );


            /* Close filters */

            if (
                filtersPanel &&
                filtersToggle
            ) {

                filtersPanel.hidden =
                    true;


                filtersPanel.style.setProperty(
                    "display",
                    "none",
                    "important"
                );


                filtersToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );


                if (filtersArrow) {

                    filtersArrow.textContent =
                        "▼";

                }

            }

        }
    );

}


/* ==========================================
   CLEAR FILTERS
========================================== */

const clearFiltersButton =
    document.getElementById(
        "clear-filters"
    );


if (clearFiltersButton) {

    clearFiltersButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            event.stopPropagation();


            selectedFilters = {

                rent: "",

                propertyType: "",

                bedrooms: "",

                bathrooms: "",

                parking: "",

                water: ""

            };


            /* Reset visible values */

            if (
                filterDisplayValues.rent
            ) {

                filterDisplayValues.rent.textContent =
                    "Any rent";

            }


            if (
                filterDisplayValues.propertyType
            ) {

                filterDisplayValues.propertyType.textContent =
                    "Any type";

            }


            if (
                filterDisplayValues.bedrooms
            ) {

                filterDisplayValues.bedrooms.textContent =
                    "Any bedrooms";

            }


            if (
                filterDisplayValues.bathrooms
            ) {

                filterDisplayValues.bathrooms.textContent =
                    "Any bathrooms";

            }


            if (
                filterDisplayValues.parking
            ) {

                filterDisplayValues.parking.textContent =
                    "Any parking";

            }


            if (
                filterDisplayValues.water
            ) {

                filterDisplayValues.water.textContent =
                    "Any water";

            }


            /* Remove selected marks */

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


            /* Reload */

            loadHomeProperties(
                homeSearch
                    ? homeSearch.value.trim()
                    : ""
            );

        }
    );

}


/* ==========================================
   YES / NO FILTER
========================================== */

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


    if (
        wanted === "yes"
    ) {

        return (
            actual.includes("yes") ||
            actual.includes("available") ||
            actual.includes("true")
        );

    }


    if (
        wanted === "no"
    ) {

        return (
            actual === "no" ||
            actual.includes("not available") ||
            actual.includes("false")
        );

    }


    return false;

}


/* ==========================================
   SMART HOME SEARCH
========================================== */

async function loadHomeProperties(
    searchText = ""
) {

    if (!homePropertyList) {

        return;

    }


    homePropertyList.innerHTML =
        "<p>Loading houses...</p>";


    try {

        const {
            data,
            error
        } =
            await supabaseClient
            .from(
                "properties"
            )
            .select("*")
            .eq(
                "status",
                "available"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            throw error;

        }


        if (
            !data ||
            data.length === 0
        ) {

            homePropertyList.innerHTML =
                "<p>No houses available.</p>";

            return;

        }


        /* ==========================================
           CLEAN SEARCH
        ========================================== */

        let search =
            String(
                searchText || ""
            )
            .toLowerCase()
            .trim();


        /* No search */

        if (!search) {

            displayHomeProperties(
                applyPropertyFilters(
                    data
                )
            );

            return;

        }


        /* Normalize */

        search =
            search
            .replace(
                /,/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();


        /* ==========================================
           BEDROOM SEARCH
        ========================================== */

        let bedroomSearch =
            null;


        const bedroomMatch =
            search.match(
                /(\d+)\s*(?:bhk|bedroom|bedrooms|beds?)/i
            );


        if (bedroomMatch) {

            bedroomSearch =
                Number(
                    bedroomMatch[1]
                );


            search =
                search.replace(
                    bedroomMatch[0],
                    ""
                )
                .trim();

        }


        /* ==========================================
           RENT SEARCH
        ========================================== */

        let rentSearch =
            null;

        let maximumRent =
            null;


        /* Under / below / max / upto */

        const maximumRentMatch =
            search.match(
                /(?:under|below|less\s+than|max(?:imum)?|upto|up\s+to)\s*₹?\s*(\d+(?:\.\d+)?)\s*(k)?/i
            );


        if (maximumRentMatch) {

            let amount =
                Number(
                    maximumRentMatch[1]
                );


            if (
                maximumRentMatch[2]
            ) {

                amount =
                    amount * 1000;

            }


            maximumRent =
                amount;


            search =
                search.replace(
                    maximumRentMatch[0],
                    ""
                )
                .trim();

        }

        else {

            /*
               Exact rent search
            */

            const simpleRentMatch =
                search.match(
                    /₹?\s*(\d+(?:\.\d+)?)\s*(k)?/i
                );


            if (simpleRentMatch) {

                let amount =
                    Number(
                        simpleRentMatch[1]
                    );


                if (
                    simpleRentMatch[2]
                ) {

                    amount =
                        amount * 1000;

                }


                /*
                   Avoid treating small numbers
                   such as 1 or 2 as rent.
                */

                if (
                    amount >= 100
                ) {

                    rentSearch =
                        amount;


                    search =
                        search.replace(
                            simpleRentMatch[0],
                            ""
                        )
                        .trim();

                }

            }

        }


        /* ==========================================
           REMOVE COMMON WORDS
        ========================================== */

        search =
            search
            .replace(
                /\b(?:house|houses|home|homes|rent|rental|rentals)\b/gi,
                ""
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();


        /* ==========================================
           SEARCH RESULTS
        ========================================== */

        let results =
            data.filter(
                function(property) {

                    /* ------------------------------
                       BEDROOM SEARCH
                    ------------------------------ */

                    if (
                        bedroomSearch !== null
                    ) {

                        if (
                            Number(
                                property.bedrooms
                            ) !==
                            bedroomSearch
                        ) {

                            return false;

                        }

                    }


                    /* ------------------------------
                       RENT SEARCH
                    ------------------------------ */

                    const propertyRent =
                        Number(
                            property.monthly_rent
                        );


                    if (
                        maximumRent !== null
                    ) {

                        if (
                            propertyRent >
                            maximumRent
                        ) {

                            return false;

                        }

                    }

                    else if (
                        rentSearch !== null
                    ) {

                        if (
                            propertyRent !==
                            rentSearch
                        ) {

                            return false;

                        }

                    }


                    /* ------------------------------
                       TEXT SEARCH
                    ------------------------------ */

                    if (search) {

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


                        const searchWords =
                            search
                            .split(" ")
                            .filter(
                                function(word) {

                                    return (
                                        word.length > 0
                                    );

                                }
                            );


                        const allWordsMatch =
                            searchWords.every(
                                function(word) {

                                    return searchableText.includes(
                                        word
                                    );

                                }
                            );


                        if (
                            !allWordsMatch
                        ) {

                            return false;

                        }

                    }


                    return true;

                }
            );


        /* ==========================================
           APPLY FILTER PANEL
        ========================================== */

        results =
            applyPropertyFilters(
                results
            );


        /* ==========================================
           DISPLAY
        ========================================== */

        displayHomeProperties(
            results
        );

    }

    catch (error) {

        console.error(
            "Home property search error:",
            error
        );


        homePropertyList.innerHTML =
            "<p>Error loading houses.</p>";

    }

}


/* ==========================================
   APPLY PROPERTY FILTERS
========================================== */

function applyPropertyFilters(
    properties
) {

    let results =
        properties;


    /* ==========================================
       MAXIMUM RENT
    ========================================== */

    if (
        selectedFilters.rent
    ) {

        results =
            results.filter(
                function(property) {

                    return Number(
                        property.monthly_rent
                    ) <=
                    Number(
                        selectedFilters.rent
                    );

                }
            );

    }


    /* ==========================================
       PROPERTY TYPE
    ========================================== */

    if (
        selectedFilters.propertyType
    ) {

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


    /* ==========================================
       BEDROOMS
    ========================================== */

    if (
        selectedFilters.bedrooms
    ) {

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

        }

        else {

            results =
                results.filter(
                    function(property) {

                        return Number(
                            property.bedrooms
                        ) ===
                        Number(
                            selectedFilters.bedrooms
                        );

                    }
                );

        }

    }


    /* ==========================================
       BATHROOMS
    ========================================== */

    if (
        selectedFilters.bathrooms
    ) {

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

        }

        else {

            results =
                results.filter(
                    function(property) {

                        return Number(
                            property.bathrooms
                        ) ===
                        Number(
                            selectedFilters.bathrooms
                        );

                    }
                );

        }

    }


    /* ==========================================
       PARKING
    ========================================== */

    if (
        selectedFilters.parking
    ) {

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


    /* ==========================================
       WATER
    ========================================== */

    if (
        selectedFilters.water
    ) {

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


/* ==========================================
   DISPLAY HOME PROPERTIES
========================================== */

function displayHomeProperties(
    properties
) {

    if (!homePropertyList) {

        return;

    }


    homePropertyList.innerHTML =
        "";


    if (
        !properties ||
        properties.length === 0
    ) {

        homePropertyList.innerHTML =
            "<p>No houses match your search.</p>";

        return;

    }


    properties.forEach(
        function(property) {

            createPropertyCard(
                homePropertyList,
                property
            );

        }
    );

}


/* ==========================================
   PROPERTY DETAILS PAGE
========================================== */

const propertyTitle =
    document.getElementById(
        "property-title"
    );

const propertyRent =
    document.getElementById(
        "property-rent"
    );


if (
    propertyTitle &&
    propertyRent
) {

    loadPropertyDetails();

}


async function loadPropertyDetails() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const propertyId =
        params.get(
            "id"
        );


    if (!propertyId) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
            .from(
                "properties"
            )
            .select("*")
            .eq(
                "id",
                propertyId
            )
            .single();


        if (error) {

            throw error;

        }


        if (!data) {

            return;

        }


        /* ==========================================
           TITLE
        ========================================== */

        propertyTitle.textContent =
            data.property_type;


        /* ==========================================
           RENT
        ========================================== */

        propertyRent.textContent =
            "₹" +
            data.monthly_rent +
            " / month";


        /* ==========================================
           BEDROOMS
        ========================================== */

        const bedroomsElement =
            document.getElementById(
                "property-bedrooms"
            );


        if (bedroomsElement) {

            bedroomsElement.textContent =
                data.bedrooms +
                " Bedrooms";

        }


        /* ==========================================
           BATHROOMS
        ========================================== */

        const bathroomsElement =
            document.getElementById(
                "property-bathrooms"
            );


        if (bathroomsElement) {

            bathroomsElement.textContent =
                data.bathrooms ||
                "Not specified";

        }


        /* ==========================================
           PARKING
        ========================================== */

        const parkingElement =
            document.getElementById(
                "property-parking"
            );


        if (parkingElement) {

            parkingElement.textContent =
                data.parking;

        }


        /* ==========================================
           WATER
        ========================================== */

        const waterElement =
            document.getElementById(
                "property-water"
            );


        if (waterElement) {

            waterElement.textContent =
                data.water;

        }


        /* ==========================================
           LOCATION
        ========================================== */

        const locationElement =
            document.getElementById(
                "property-location"
            );


        if (locationElement) {

            locationElement.textContent =
                data.location;

        }


        /* ==========================================
           DESCRIPTION
        ========================================== */

        const descriptionElement =
            document.getElementById(
                "property-description"
            );


        if (descriptionElement) {

            descriptionElement.textContent =
                data.description ||
                "No description provided.";

        }


        /* ==========================================
           OWNER
        ========================================== */

        const ownerElement =
            document.getElementById(
                "property-owner"
            );


        if (ownerElement) {

            ownerElement.textContent =
                data.owner_name;

        }


        /* ==========================================
           PHONE
        ========================================== */

        const phoneElement =
            document.getElementById(
                "property-phone"
            );


        if (phoneElement) {

            phoneElement.textContent =
                data.phone_number;

        }


        /* ==========================================
           PROPERTY IMAGE
        ========================================== */

        const propertyImage =
            document.getElementById(
                "property-image"
            );


        if (propertyImage) {

            propertyImage.src =
                data.photo_url ||
                "images/house1.jpg";

        }


        /* ==========================================
           CALL OWNER
        ========================================== */

        const callButton =
            document.getElementById(
                "call-owner"
            );


        if (
            callButton &&
            data.phone_number
        ) {

            callButton.href =
                "tel:" +
                data.phone_number;

        }


        /* ==========================================
           WHATSAPP OWNER
        ========================================== */

        const whatsappButton =
            document.getElementById(
                "whatsapp-owner"
            );


        if (
            whatsappButton &&
            data.phone_number
        ) {

            const cleanNumber =
                data.phone_number
                .replace(
                    /[^0-9]/g,
                    ""
                );


            whatsappButton.href =
                "https://wa.me/" +
                cleanNumber;

        }

    }

    catch (error) {

        console.error(
            "Property details error:",
            error
        );

    }

}


/* ==========================================
   EXPLORE MORE BUTTON
========================================== */

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