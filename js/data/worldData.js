// =========================================================
// WORLD DATA — Continents, Countries, States, Cities
// =========================================================

export const WORLD_DATA = {
    continents: {
        ASIA: {
            id: 'ASIA',
            name: 'Asia',
            countries: [
                {
                    id: 'BANGLADESH',
                    name: 'Bangladesh',
                    flag: '🇧🇩',
                    color: 0x006a4e,
                    lightColor: 0x00a87a,
                    capital: 'Dhaka',
                    description: 'Bangladesh is a South Asian country with a rich history and strategic location.',
                    states: [
                        { id: 'DHAKA', name: 'Dhaka', population: 15000000, industry: 8, agriculture: 3 },
                        { id: 'CHITTAGONG', name: 'Chittagong', population: 8000000, industry: 5, agriculture: 2 },
                        { id: 'RAJSHAHI', name: 'Rajshahi', population: 5000000, industry: 3, agriculture: 4 },
                        { id: 'KHULNA', name: 'Khulna', population: 4000000, industry: 3, agriculture: 5 },
                        { id: 'SYLHET', name: 'Sylhet', population: 3500000, industry: 2, agriculture: 4 },
                        { id: 'BARISAL', name: 'Barisal', population: 3000000, industry: 2, agriculture: 6 },
                        { id: 'RANGPUR', name: 'Rangpur', population: 2800000, industry: 2, agriculture: 5 },
                        { id: 'MYMENSINGH', name: 'Mymensingh', population: 2500000, industry: 2, agriculture: 4 }
                    ]
                },
                {
                    id: 'INDIA',
                    name: 'India',
                    flag: '🇮🇳',
                    color: 0xff9933,
                    lightColor: 0xffbb55,
                    capital: 'New Delhi',
                    description: 'India is the world\'s largest democracy with a rapidly growing economy.',
                    states: [
                        { id: 'DELHI', name: 'Delhi', population: 30000000, industry: 10, agriculture: 2 },
                        { id: 'MUMBAI', name: 'Mumbai', population: 20000000, industry: 9, agriculture: 1 },
                        { id: 'KOLKATA', name: 'Kolkata', population: 14000000, industry: 7, agriculture: 2 },
                        { id: 'CHENNAI', name: 'Chennai', population: 10000000, industry: 6, agriculture: 2 },
                        { id: 'BANGALORE', name: 'Bangalore', population: 12000000, industry: 8, agriculture: 1 },
                        { id: 'HYDERABAD', name: 'Hyderabad', population: 9000000, industry: 6, agriculture: 2 },
                        { id: 'AHMEDABAD', name: 'Ahmedabad', population: 8000000, industry: 5, agriculture: 3 },
                        { id: 'PUNE', name: 'Pune', population: 7000000, industry: 5, agriculture: 2 }
                    ]
                },
                {
                    id: 'CHINA',
                    name: 'China',
                    flag: '🇨🇳',
                    color: 0xcc2222,
                    lightColor: 0xff3333,
                    capital: 'Beijing',
                    description: 'China is the world\'s most populous country and second-largest economy.',
                    states: [
                        { id: 'BEIJING', name: 'Beijing', population: 21000000, industry: 10, agriculture: 1 },
                        { id: 'SHANGHAI', name: 'Shanghai', population: 24000000, industry: 10, agriculture: 1 },
                        { id: 'GUANGZHOU', name: 'Guangzhou', population: 15000000, industry: 8, agriculture: 2 },
                        { id: 'SHENZHEN', name: 'Shenzhen', population: 13000000, industry: 9, agriculture: 1 },
                        { id: 'CHENGDU', name: 'Chengdu', population: 10000000, industry: 6, agriculture: 3 },
                        { id: 'WUHAN', name: 'Wuhan', population: 11000000, industry: 7, agriculture: 2 },
                        { id: 'NANJING', name: 'Nanjing', population: 9000000, industry: 6, agriculture: 2 },
                        { id: 'HANGZHOU', name: 'Hangzhou', population: 8000000, industry: 5, agriculture: 3 }
                    ]
                },
                {
                    id: 'PAKISTAN',
                    name: 'Pakistan',
                    flag: '🇵🇰',
                    color: 0x01411c,
                    lightColor: 0x027a35,
                    capital: 'Islamabad',
                    description: 'Pakistan is a South Asian nation with diverse landscapes and strategic location.',
                    states: [
                        { id: 'ISLAMABAD', name: 'Islamabad', population: 2000000, industry: 5, agriculture: 2 },
                        { id: 'KARACHI', name: 'Karachi', population: 16000000, industry: 7, agriculture: 1 },
                        { id: 'LAHORE', name: 'Lahore', population: 12000000, industry: 6, agriculture: 3 },
                        { id: 'FAISALABAD', name: 'Faisalabad', population: 5000000, industry: 4, agriculture: 4 },
                        { id: 'RAWALPINDI', name: 'Rawalpindi', population: 4000000, industry: 3, agriculture: 2 },
                        { id: 'MULTAN', name: 'Multan', population: 3000000, industry: 3, agriculture: 5 },
                        { id: 'PESHAWAR', name: 'Peshawar', population: 2500000, industry: 3, agriculture: 3 }
                    ]
                },
                {
                    id: 'INDONESIA',
                    name: 'Indonesia',
                    flag: '🇮🇩',
                    color: 0xce1126,
                    lightColor: 0xff1a33,
                    capital: 'Jakarta',
                    description: 'Indonesia is the world\'s largest archipelago nation with rich biodiversity.',
                    states: [
                        { id: 'JAKARTA', name: 'Jakarta', population: 10000000, industry: 8, agriculture: 1 },
                        { id: 'SURABAYA', name: 'Surabaya', population: 5000000, industry: 5, agriculture: 2 },
                        { id: 'BANDUNG', name: 'Bandung', population: 4000000, industry: 4, agriculture: 3 },
                        { id: 'MEDAN', name: 'Medan', population: 3000000, industry: 3, agriculture: 4 },
                        { id: 'MAKASSAR', name: 'Makassar', population: 2000000, industry: 3, agriculture: 3 },
                        { id: 'DENPASAR', name: 'Denpasar', population: 1500000, industry: 3, agriculture: 2 },
                        { id: 'BALI', name: 'Bali', population: 4000000, industry: 3, agriculture: 5 },
                        { id: 'LOMBOK', name: 'Lombok', population: 2000000, industry: 2, agriculture: 4 }
                    ]
                }
            ]
        },
        EUROPE: {
            id: 'EUROPE',
            name: 'Europe',
            countries: [
                {
                    id: 'UK',
                    name: 'United Kingdom',
                    flag: '🇬🇧',
                    color: 0x8a2a2a,
                    lightColor: 0xcc4040,
                    capital: 'London',
                    description: 'The United Kingdom is a European island nation with a rich history.',
                    states: [
                        { id: 'LONDON', name: 'London', population: 9000000, industry: 9, agriculture: 1 },
                        { id: 'MANCHESTER', name: 'Manchester', population: 3000000, industry: 6, agriculture: 2 },
                        { id: 'BIRMINGHAM', name: 'Birmingham', population: 2500000, industry: 5, agriculture: 2 },
                        { id: 'GLASGOW', name: 'Glasgow', population: 2000000, industry: 4, agriculture: 3 }
                    ]
                },
                {
                    id: 'FRANCE',
                    name: 'France',
                    flag: '🇫🇷',
                    color: 0x2a5a8a,
                    lightColor: 0x4a88c0,
                    capital: 'Paris',
                    description: 'France is a European nation with a rich cultural heritage.',
                    states: [
                        { id: 'PARIS', name: 'Paris', population: 11000000, industry: 9, agriculture: 1 },
                        { id: 'MARSEILLE', name: 'Marseille', population: 5000000, industry: 5, agriculture: 2 },
                        { id: 'LYON', name: 'Lyon', population: 4000000, industry: 5, agriculture: 2 },
                        { id: 'TOULOUSE', name: 'Toulouse', population: 3000000, industry: 4, agriculture: 3 },
                        { id: 'NICE', name: 'Nice', population: 2000000, industry: 3, agriculture: 2 },
                        { id: 'BORDEAUX', name: 'Bordeaux', population: 2000000, industry: 3, agriculture: 4 },
                        { id: 'LILLE', name: 'Lille', population: 2000000, industry: 4, agriculture: 2 },
                        { id: 'STRASBOURG', name: 'Strasbourg', population: 1500000, industry: 3, agriculture: 3 }
                    ]
                },
                {
                    id: 'GERMANY',
                    name: 'Germany',
                    flag: '🇩🇪',
                    color: 0x3a3a3a,
                    lightColor: 0x666666,
                    capital: 'Berlin',
                    description: 'Germany is Europe\'s largest economy with a strong industrial base.',
                    states: [
                        { id: 'BERLIN', name: 'Berlin', population: 8000000, industry: 8, agriculture: 1 },
                        { id: 'HAMBURG', name: 'Hamburg', population: 5000000, industry: 6, agriculture: 2 },
                        { id: 'MUNICH', name: 'Munich', population: 4000000, industry: 7, agriculture: 2 },
                        { id: 'FRANKFURT', name: 'Frankfurt', population: 3000000, industry: 6, agriculture: 1 },
                        { id: 'STUTTGART', name: 'Stuttgart', population: 3000000, industry: 5, agriculture: 2 },
                        { id: 'DUSSELDORF', name: 'Dusseldorf', population: 2500000, industry: 5, agriculture: 2 },
                        { id: 'COLOGNE', name: 'Cologne', population: 2500000, industry: 4, agriculture: 2 },
                        { id: 'HANNOVER', name: 'Hannover', population: 2000000, industry: 4, agriculture: 3 }
                    ]
                },
                {
                    id: 'TURKEY',
                    name: 'Turkey',
                    flag: '🇹🇷',
                    color: 0xe30a17,
                    lightColor: 0xff1a2a,
                    capital: 'Ankara',
                    description: 'Turkey is a transcontinental country bridging Europe and Asia.',
                    states: [
                        { id: 'ISTANBUL', name: 'Istanbul', population: 15000000, industry: 8, agriculture: 2 },
                        { id: 'ANKARA', name: 'Ankara', population: 5000000, industry: 5, agriculture: 3 },
                        { id: 'IZMIR', name: 'Izmir', population: 4000000, industry: 4, agriculture: 3 },
                        { id: 'BURSA', name: 'Bursa', population: 3000000, industry: 4, agriculture: 4 },
                        { id: 'ANTALYA', name: 'Antalya', population: 2500000, industry: 3, agriculture: 4 },
                        { id: 'KONYA', name: 'Konya', population: 2000000, industry: 3, agriculture: 5 },
                        { id: 'ADANA', name: 'Adana', population: 2000000, industry: 3, agriculture: 4 },
                        { id: 'GAZIANTEP', name: 'Gaziantep', population: 2000000, industry: 3, agriculture: 3 }
                    ]
                },
                {
                    id: 'RUSSIA',
                    name: 'Russia',
                    flag: '🇷🇺',
                    color: 0x003399,
                    lightColor: 0x0055cc,
                    capital: 'Moscow',
                    description: 'Russia is the world\'s largest country by area with vast natural resources.',
                    states: [
                        { id: 'MOSCOW', name: 'Moscow', population: 12000000, industry: 9, agriculture: 1 },
                        { id: 'ST_PETERSBURG', name: 'St Petersburg', population: 5000000, industry: 6, agriculture: 2 },
                        { id: 'NOVOSIBIRSK', name: 'Novosibirsk', population: 3000000, industry: 4, agriculture: 3 },
                        { id: 'YEKATERINBURG', name: 'Yekaterinburg', population: 2500000, industry: 4, agriculture: 3 },
                        { id: 'KAZAN', name: 'Kazan', population: 2000000, industry: 3, agriculture: 4 },
                        { id: 'NIZHNY', name: 'Nizhny', population: 2000000, industry: 3, agriculture: 3 },
                        { id: 'SAMARA', name: 'Samara', population: 1500000, industry: 3, agriculture: 3 },
                        { id: 'OMSK', name: 'Omsk', population: 1500000, industry: 3, agriculture: 4 }
                    ]
                }
            ]
        },
        NORTH_AMERICA: {
            id: 'NORTH_AMERICA',
            name: 'North America',
            countries: [
                {
                    id: 'USA',
                    name: 'United States',
                    flag: '🇺🇸',
                    color: 0x2a5c8a,
                    lightColor: 0x4a8cc0,
                    capital: 'Washington DC',
                    description: 'The United States is a global superpower with the world\'s largest economy.',
                    states: [
                        { id: 'WASHINGTON_DC', name: 'Washington DC', population: 7000000, industry: 8, agriculture: 1 },
                        { id: 'NEW_YORK', name: 'New York', population: 20000000, industry: 10, agriculture: 1 },
                        { id: 'LOS_ANGELES', name: 'Los Angeles', population: 18000000, industry: 8, agriculture: 2 },
                        { id: 'CHICAGO', name: 'Chicago', population: 9000000, industry: 7, agriculture: 2 },
                        { id: 'HOUSTON', name: 'Houston', population: 7000000, industry: 6, agriculture: 3 },
                        { id: 'PHOENIX', name: 'Phoenix', population: 5000000, industry: 4, agriculture: 3 },
                        { id: 'PHILADELPHIA', name: 'Philadelphia', population: 6000000, industry: 5, agriculture: 2 },
                        { id: 'DALLAS', name: 'Dallas', population: 7000000, industry: 6, agriculture: 3 }
                    ]
                }
            ]
        },
        MIDDLE_EAST: {
            id: 'MIDDLE_EAST',
            name: 'Middle East',
            countries: [
                {
                    id: 'IRAN',
                    name: 'Iran',
                    flag: '🇮🇷',
                    color: 0x239f40,
                    lightColor: 0x3ad060,
                    capital: 'Tehran',
                    description: 'Iran is a Middle Eastern country with ancient history and significant oil reserves.',
                    states: [
                        { id: 'TEHRAN', name: 'Tehran', population: 9000000, industry: 7, agriculture: 2 },
                        { id: 'ISFAHAN', name: 'Isfahan', population: 4000000, industry: 5, agriculture: 3 },
                        { id: 'KHURASAN', name: 'Khurasan', population: 3000000, industry: 4, agriculture: 4 },
                        { id: 'FARS', name: 'Fars', population: 3000000, industry: 3, agriculture: 5 },
                        { id: 'RAZAVI', name: 'Razavi', population: 3000000, industry: 4, agriculture: 4 },
                        { id: 'EAST_AZERBAIJAN', name: 'East Azerbaijan', population: 2500000, industry: 3, agriculture: 4 },
                        { id: 'MAZANDARAN', name: 'Mazandaran', population: 2000000, industry: 3, agriculture: 5 },
                        { id: 'GILAN', name: 'Gilan', population: 2000000, industry: 3, agriculture: 4 }
                    ]
                },
                {
                    id: 'SAUDI',
                    name: 'Saudi Arabia',
                    flag: '🇸🇦',
                    color: 0x165d31,
                    lightColor: 0x229544,
                    capital: 'Riyadh',
                    description: 'Saudi Arabia is the largest country in the Middle East and a global oil powerhouse.',
                    states: [
                        { id: 'RIYADH', name: 'Riyadh', population: 7000000, industry: 7, agriculture: 2 },
                        { id: 'MAKKAH', name: 'Makkah', population: 5000000, industry: 5, agriculture: 3 },
                        { id: 'MADINAH', name: 'Madinah', population: 3000000, industry: 4, agriculture: 3 },
                        { id: 'EASTERN', name: 'Eastern', population: 4000000, industry: 6, agriculture: 2 },
                        { id: 'ASIR', name: 'Asir', population: 2000000, industry: 3, agriculture: 5 },
                        { id: 'TABUK', name: 'Tabuk', population: 1500000, industry: 3, agriculture: 4 },
                        { id: 'JAZAN', name: 'Jazan', population: 1500000, industry: 2, agriculture: 5 },
                        { id: 'NAJRAN', name: 'Najran', population: 1000000, industry: 2, agriculture: 4 }
                    ]
                }
            ]
        },
        AFRICA: {
            id: 'AFRICA',
            name: 'Africa',
            countries: [
                {
                    id: 'EGYPT',
                    name: 'Egypt',
                    flag: '🇪🇬',
                    color: 0xce1126,
                    lightColor: 0xff1a33,
                    capital: 'Cairo',
                    description: 'Egypt spans North Africa and the Middle East, home to ancient civilization.',
                    states: [
                        { id: 'CAIRO', name: 'Cairo', population: 20000000, industry: 8, agriculture: 2 },
                        { id: 'ALEXANDRIA', name: 'Alexandria', population: 5000000, industry: 5, agriculture: 3 },
                        { id: 'GIZA', name: 'Giza', population: 4000000, industry: 4, agriculture: 3 },
                        { id: 'LUXOR', name: 'Luxor', population: 3000000, industry: 3, agriculture: 4 },
                        { id: 'ASWAN', name: 'Aswan', population: 2000000, industry: 3, agriculture: 5 },
                        { id: 'PORT_SAID', name: 'Port Said', population: 2000000, industry: 4, agriculture: 2 },
                        { id: 'SUEZ', name: 'Suez', population: 1500000, industry: 4, agriculture: 2 },
                        { id: 'MINYA', name: 'Minya', population: 1500000, industry: 3, agriculture: 5 }
                    ]
                }
            ]
        },
        CENTRAL_ASIA: {
            id: 'CENTRAL_ASIA',
            name: 'Central Asia',
            countries: [
                {
                    id: 'AFGHANISTAN',
                    name: 'Afghanistan',
                    flag: '🇦🇫',
                    color: 0x000000,
                    lightColor: 0x333333,
                    capital: 'Kabul',
                    description: 'Afghanistan is a landlocked country at the crossroads of Central and South Asia.',
                    states: [
                        { id: 'KABUL', name: 'Kabul', population: 4000000, industry: 3, agriculture: 3 },
                        { id: 'KANDAHAR', name: 'Kandahar', population: 3000000, industry: 2, agriculture: 4 },
                        { id: 'HERAT', name: 'Herat', population: 2500000, industry: 2, agriculture: 5 },
                        { id: 'MAZAR', name: 'Mazar', population: 2000000, industry: 2, agriculture: 4 },
                        { id: 'NANGARHAR', name: 'Nangarhar', population: 1500000, industry: 2, agriculture: 4 },
                        { id: 'BALKH', name: 'Balkh', population: 1500000, industry: 2, agriculture: 4 },
                        { id: 'GHAZNI', name: 'Ghazni', population: 1000000, industry: 2, agriculture: 3 },
                        { id: 'HELMAND', name: 'Helmand', population: 1000000, industry: 2, agriculture: 5 }
                    ]
                }
            ]
        },
        MIDDLE_EAST_SPECIAL: {
            id: 'MIDDLE_EAST_SPECIAL',
            name: 'Middle East',
            countries: [
                {
                    id: 'PALESTINE',
                    name: 'Palestine',
                    flag: '🇵🇸',
                    color: 0x007a3d,
                    lightColor: 0x00b85a,
                    capital: 'Jerusalem',
                    description: 'Palestine is a historic region in the Middle East with rich cultural heritage.',
                    states: [
                        { id: 'WEST_BANK', name: 'West Bank', population: 3000000, industry: 2, agriculture: 4 },
                        { id: 'GAZA_STRIP', name: 'Gaza Strip', population: 2000000, industry: 2, agriculture: 3 },
                        { id: 'JERUSALEM', name: 'Jerusalem', population: 1000000, industry: 3, agriculture: 2 },
                        { id: 'RAMALLAH', name: 'Ramallah', population: 500000, industry: 2, agriculture: 3 },
                        { id: 'HEBRON', name: 'Hebron', population: 500000, industry: 2, agriculture: 4 },
                        { id: 'NABLUS', name: 'Nablus', population: 500000, industry: 2, agriculture: 3 }
                    ]
                }
            ]
        }
    }
};

// ================= HELPER FUNCTIONS =================

export function getCountryById(countryId) {
    for (const continent of Object.values(WORLD_DATA.continents)) {
        for (const country of continent.countries) {
            if (country.id === countryId) return country;
        }
    }
    return null;
}

export function getStateById(stateId) {
    for (const continent of Object.values(WORLD_DATA.continents)) {
        for (const country of continent.countries) {
            for (const state of country.states) {
                if (state.id === stateId) return { ...state, countryId: country.id };
            }
        }
    }
    return null;
}

export function getCityById(cityId) {
    return getStateById(cityId);
}

export function getCitiesByState(stateId) {
    const state = getStateById(stateId);
    if (!state) return [];
    return [{ ...state }];
}

export function getCitiesByCountry(countryId) {
    const country = getCountryById(countryId);
    if (!country) return [];
    return country.states;
}

export function getCountriesByContinent(continentId) {
    const continent = WORLD_DATA.continents[continentId];
    if (!continent) return [];
    return continent.countries;
}

export function getAllCountries() {
    const allCountries = [];
    for (const continent of Object.values(WORLD_DATA.continents)) {
        allCountries.push(...continent.countries);
    }
    return allCountries;
}

export function getAllStates() {
    const allStates = [];
    for (const continent of Object.values(WORLD_DATA.continents)) {
        for (const country of continent.countries) {
            allStates.push(...country.states.map(s => ({ ...s, countryId: country.id })));
        }
    }
    return allStates;
}