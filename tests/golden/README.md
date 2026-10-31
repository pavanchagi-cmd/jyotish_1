# Golden reference charts

20 birth records, one JSON file each, with expected values taken from
**Drik Panchang (Lahiri ayanamsa)**. The owner supplies these values;
they must never be generated or guessed.

Until they arrive, the golden tests are `it.todo` (see spec section 10).

Required cases: births before 1956 (Mumbai, Kolkata), during 1942–45,
near midnight, near a Lagna sign change, and outside India
(London, Dubai, New York with DST).

Each file will hold: birth input (local date-time, place, lat, lng,
IANA zone or confirmed offset), expected Lagna sign, every planet's
sidereal sign and degree, Moon nakshatra and pada, and the
Mahadasha/Antardasha at a stated date.
