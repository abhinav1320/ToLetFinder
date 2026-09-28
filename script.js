// ==========================================
// SUPABASE CONNECTION
// ==========================================

const SUPABASE_URL =
    "https://amvzimxdycbulvxxmboq.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_LI8n64pscrtoMEW6FMk4_Q_r6K5J2XK";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// ==========================================
// POST PROPERTY
// ==========================================

const propertyForm =
    document.getElementById("property-form");


if (propertyForm) {

    propertyForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const propertyType =
                document.getElementById("property-type").value;

            const ownerName =
                document.getElementById("owner-name").value.trim();

            const phoneNumber =
                document.getElementById("phone-number").value.trim();

            const monthlyRent =
                document.getElementById("monthly-rent").value;

            const propertyLocation =
                document.getElementById("property-location").value.trim();

            const bedrooms =
                document.getElementById("bedrooms").value;

            const bathrooms =
                document.getElementById("bathrooms").value;

            const parking =
                document.getElementById("parking").value;

            const water =
                document.getElementById("water").value;

            const description =
                document.getElementById("description").value.trim();


            // ------------------------------------------
            // PHOTO
            // ------------------------------------------

            const photoInput =
                document.getElementById("photo-input");

            const photoFile =
                photoInput.files[0];


            if (!photoFile) {

                alert("Please select a property photo.");

                return;
            }


            // ------------------------------------------
            // VALIDATION
            // ------------------------------------------

            if (
                !ownerName ||
                !phoneNumber ||
                !monthlyRent ||
                !propertyLocation ||
                !bedrooms
            ) {

                alert("Please fill all required fields.");

                return;
            }


            try {

                // ======================================
                // 1. UPLOAD PHOTO
                // ======================================

                const fileExtension =
                    photoFile.name
                    .split(".")
                    .pop()
                    .toLowerCase();


                const fileName =
                    Date.now() +
                    "_" +
                    Math.random()
                    .toString(36)
                    .substring(2) +
                    "." +
                    fileExtension;


                const filePath =
                    fileName;


                const uploadResult =
                    await supabaseClient
                    .storage
                    .from("property-photos")
                    .upload(
                        filePath,
                        photoFile,
                        {
                            cacheControl: "3600",
                            upsert: false
                        }
                    );


                if (uploadResult.error) {

                    throw uploadResult.error;

                }


                // ======================================
                // 2. GET PHOTO URL
                // ======================================

                const publicUrlResult =
                    supabaseClient
                    .storage
                    .from("property-photos")
                    .getPublicUrl(filePath);


                const photoUrl =
                    publicUrlResult.data.publicUrl;


                // ======================================
                // 3. SAVE PROPERTY TO DATABASE
                // ======================================

                const { data, error } =
                    await supabaseClient
                    .from("properties")
                    .insert([
                        {

                            property_type:
                                propertyType,

                            owner_name:
                                ownerName,

                            monthly_rent:
                                Number(monthlyRent),

                            location:
                                propertyLocation,

                            bedrooms:
                                Number(bedrooms),

                            bathrooms:
                                bathrooms === ""
                                    ? null
                                    : Number(bathrooms),

                            parking:
                                parking,

                            water:
                                water,

                            description:
                                description,

                            phone_number:
                                phoneNumber,

                            photo_url:
                                photoUrl

                        }
                    ])
                    .select();


                if (error) {

                    throw error;

                }


                console.log(
                    "Property saved:",
                    data
                );


                // ======================================
                // 4. SUCCESS
                // ======================================

                alert(
                    "Property posted successfully!"
                );


                propertyForm.reset();


                const preview =
                    document.getElementById(
                        "photo-preview"
                    );


                if (preview) {

                    preview.innerHTML = "";

                }


            } catch (error) {

                console.error(error);

                alert(
                    "Something went wrong:\n\n" +
                    error.message
                );

            }

        }
    );

}



// ==========================================
// PROPERTY LIST
// ==========================================

const propertyList =
    document.getElementById(
        "property-list"
    );


if (propertyList) {

    loadProperties();

}


async function loadProperties() {

    propertyList.innerHTML =
        "<p>Loading houses...</p>";


    const urlParams =
        new URLSearchParams(
            window.location.search
        );


    const searchLocation =
        urlParams.get("location");


    try {

        let query =
            supabaseClient
            .from("properties")
            .select("*")
            .eq("status", "available")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        const { data, error } =
            await query;


        if (error) {

            throw error;

        }


        let properties =
            data || [];


        // ==========================================
        // LOCATION SEARCH
        // ==========================================

        if (searchLocation) {

            const searchText =
                searchLocation.toLowerCase();


            properties =
                properties.filter(
                    function(property) {

                        return property.location
                            .toLowerCase()
                            .includes(searchText);

                    }
                );

        }


        displayProperties(
            properties
        );


    } catch (error) {

        console.error(error);


        propertyList.innerHTML = `

            <p>
                Unable to load houses.
            </p>

        `;

    }

}



// ==========================================
// DISPLAY PROPERTIES
// ==========================================

function displayProperties(
    properties
) {

    propertyList.innerHTML = "";


    if (
        !properties ||
        properties.length === 0
    ) {

        propertyList.innerHTML = `

            <p>
                No houses match your search.
            </p>

        `;

        return;

    }


    properties.forEach(
        function(property) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "property-card";


            card.innerHTML = `

                <div class="property-info-text">

                    <h3>
                        ${property.property_type}
                    </h3>

                    <p>
                        ₹${property.monthly_rent}
                        / month
                    </p>

                    <p>
                        📍 ${property.location}
                    </p>

                    <p>
                        ${property.bedrooms}
                        Bedrooms •
                        ${
                            property.bathrooms ||
                            "Not specified"
                        }
                        Bathrooms
                    </p>

                </div>

                <img
                    src="${
                        property.photo_url ||
                        "images/house1.jpg"
                    }"
                    alt="Rental House"
                >

            `;


            card.addEventListener(
                "click",
                function() {

                    window.location.href =
                        "property.html?id=" +
                        property.id;

                }
            );


            propertyList.appendChild(
                card
            );

        }
    );

}



// ==========================================
// PROPERTY DETAILS PAGE
// ==========================================

const propertyImage =
    document.getElementById(
        "property-image"
    );


if (propertyImage) {

    loadPropertyDetails();

}


async function loadPropertyDetails() {

    const urlParams =
        new URLSearchParams(
            window.location.search
        );


    const propertyId =
        urlParams.get("id");


    if (!propertyId) {

        return;

    }


    try {

        const { data: property, error } =
            await supabaseClient
            .from("properties")
            .select("*")
            .eq("id", propertyId)
            .single();


        if (error) {

            throw error;

        }


        document.getElementById(
            "property-image"
        ).src =
            property.photo_url ||
            "images/house1.jpg";


        document.getElementById(
            "property-title"
        ).textContent =
            property.property_type;


        document.getElementById(
            "property-rent"
        ).textContent =
            "₹" +
            property.monthly_rent +
            " / month";


        document.getElementById(
            "property-location"
        ).textContent =
            "📍 " +
            property.location;


        document.getElementById(
            "property-bedrooms"
        ).textContent =
            property.bedrooms;


        document.getElementById(
            "property-bathrooms"
        ).textContent =
            property.bathrooms ||
            "Not specified";


        document.getElementById(
            "property-parking"
        ).textContent =
            property.parking;


        document.getElementById(
            "property-water"
        ).textContent =
            property.water;


        document.getElementById(
            "property-description"
        ).textContent =
            property.description ||
            "No description provided.";


        document.getElementById(
            "property-owner"
        ).textContent =
            "👤 " +
            property.owner_name;


        document.getElementById(
            "property-phone"
        ).textContent =
            "📞 " +
            property.phone_number;


        document.getElementById(
            "call-owner"
        ).href =
            "tel:" +
            property.phone_number;


        document.getElementById(
            "whatsapp-owner"
        ).href =
            "https://wa.me/" +
            property.phone_number
            .replace(/\D/g, "");


    } catch (error) {

        console.error(error);


        document.querySelector(
            "main"
        ).innerHTML = `

            <h2>
                Property not found
            </h2>

            <p>
                This property could not be loaded.
            </p>

        `;

    }

}



// ==========================================
// HOME PAGE PROPERTY LIST
// ==========================================

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


if (homePropertyList) {

    loadHomeProperties();


    // Search button
    if (homeSearchButton) {

        homeSearchButton.addEventListener(
            "click",
            function() {

                const searchText =
                    homeSearch.value.trim();

                loadHomeProperties(
                    searchText
                );

            }
        );

    }


    // Press Enter to search
    if (homeSearch) {

        homeSearch.addEventListener(
            "keydown",
            function(event) {

                if (event.key === "Enter") {

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


async function loadHomeProperties(
    searchText = ""
) {

    homePropertyList.innerHTML =
        "<p>Loading houses...</p>";


    try {

        let query =
            supabaseClient
            .from("properties")
            .select("*")
            .eq("status", "available")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        // Search by location
        if (searchText) {

            query =
                query.ilike(
                    "location",
                    "%" +
                    searchText +
                    "%"
                );

        }


        const {
            data,
            error
        } = await query;


        if (error) {

            throw error;

        }


        if (
            !data ||
            data.length === 0
        ) {

            homePropertyList.innerHTML =
                "<p>No houses found.</p>";

            return;

        }


        homePropertyList.innerHTML =
            "";


        data.forEach(
            function(property) {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "property-card";


                card.innerHTML = `

                    <div class="property-info-text">

                        <h3>
                            ${property.property_type}
                        </h3>

                        <p>
                            ₹${property.monthly_rent}
                            / month
                        </p>

                        <p>
                            📍
                            ${property.location}
                        </p>

                        <p>
                            🛏️
                            ${property.bedrooms}
                            Bedrooms
                        </p>

                        <p>
                            🚿
                            ${
                                property.bathrooms ||
                                "Not specified"
                            }
                            Bathrooms
                        </p>

                    </div>

                    <img
                        src="${
                            property.photo_url ||
                            "images/house1.jpg"
                        }"
                        alt="Rental House"
                    >

                `;


                card.addEventListener(
                    "click",
                    function() {

                        window.location.href =
                            "property.html?id=" +
                            property.id;

                    }
                );


                homePropertyList.appendChild(
                    card
                );

            }
        );


    } catch (error) {

        console.error(error);

        homePropertyList.innerHTML =
            "<p>Error loading houses.</p>";

    }

}
// ==========================================
// TEST USER LOCATION
// ==========================================

alert("Location code is running!");

navigator.geolocation.getCurrentPosition(

    function(position) {

        alert(
            "Location received!\n\n" +
            "Latitude: " +
            position.coords.latitude +
            "\nLongitude: " +
            position.coords.longitude
        );

    },

    function(error) {

        alert(
            "Location error:\n\n" +
            error.message
        );

    }

);



