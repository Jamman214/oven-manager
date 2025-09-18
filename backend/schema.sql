DROP TABLE IF EXISTS preset_ids;
DROP TABLE IF EXISTS preset_names;
DROP TABLE IF EXISTS atomic_presets;
DROP TABLE IF EXISTS day_preset_chunks;
DROP TABLE IF EXISTS week_presets;
DROP TABLE IF EXISTS preset_history;
DROP TABLE IF EXISTS temperatures;

DROP INDEX IF EXISTS current_preset_names;
DROP INDEX IF EXISTS current_atomic_presets;
DROP INDEX IF EXISTS current_day_preset_chunks;
DROP INDEX IF EXISTS current_week_presets;
DROP INDEX IF EXISTS active_preset;

DROP TRIGGER IF EXISTS insert_preset_names;
DROP TRIGGER IF EXISTS insert_atomic_presets;
DROP TRIGGER IF EXISTS insert_day_preset_chunks;
DROP TRIGGER IF EXISTS insert_week_presets;
DROP TRIGGER IF EXISTS insert_preset_history;



-- Presets --------------------------------------------------------------------

CREATE TABLE preset_ids (
    id INTEGER PRIMARY KEY AUTOINCREMENT
);

-- Allow 0 to be used as the off preset
INSERT INTO preset_ids (id) VALUES (0);

CREATE TABLE preset_names (
    preset_id         INTEGER NOT NULL REFERENCES preset_ids (preset_id),
    name       TEXT NOT NULL CHECK (length(name) > 0),
    valid_from INTEGER NOT NULL DEFAULT (unixepoch()),
    valid_to   INTEGER,
    PRIMARY KEY (preset_id, valid_from),
    CHECK (valid_to IS NULL OR valid_to > valid_from)
);

CREATE UNIQUE INDEX current_preset_names
ON preset_names(preset_id)
WHERE valid_to IS NULL;

CREATE TRIGGER insert_preset_names
BEFORE INSERT ON preset_names
BEGIN
    -- Cancel if inserting invalidated
    SELECT RAISE(ABORT, 'Cannot insert invalidated record') WHERE NEW.valid_to IS NOT NULL;

    -- If there are no changes then skip insertion
    SELECT RAISE(IGNORE)
    WHERE EXISTS (
        SELECT 1 FROM preset_names 
        WHERE 
            preset_id = NEW.preset_id 
            AND valid_to IS NULL
            AND name = NEW.name
    );

    -- Otherwise make the previous preset invalidated before inserting
    UPDATE preset_names
    SET valid_to = NEW.valid_from
    WHERE
        preset_id = NEW.preset_id
        AND valid_to IS NULL;
END;

-- Atomic Presets -------------------------------------------------------------

CREATE TABLE atomic_presets (
    preset_id INTEGER NOT NULL REFERENCES preset_ids (preset_id),
    core_high INTEGER NOT NULL CHECK (core_high BETWEEN 0 AND 500),
    core_low INTEGER NOT NULL CHECK (core_low BETWEEN 0 AND 500),
    oven_high INTEGER NOT NULL CHECK (oven_high BETWEEN 0 AND 500),
    oven_low INTEGER NOT NULL CHECK (oven_low BETWEEN 0 AND 500),
    valid_from INTEGER NOT NULL DEFAULT (unixepoch()),
    valid_to INTEGER,
    PRIMARY KEY (preset_id, valid_from),
    CHECK (valid_to IS NULL OR valid_to > valid_from),
    CHECK (core_high > core_low),
    CHECK (oven_high > oven_low),
    CHECK (core_low > oven_high)
);

CREATE UNIQUE INDEX current_atomic_presets
ON atomic_presets(preset_id)
WHERE valid_to IS NULL;

CREATE TRIGGER insert_atomic_presets
BEFORE INSERT ON atomic_presets
BEGIN
    -- Cancel if inserting invalidated
    SELECT RAISE(ABORT, 'Cannot insert invalidated record') 
    WHERE NEW.valid_to IS NOT NULL;

    -- Cancel if any records for this preset exist in another table
    SELECT RAISE(ABORT, 'Preset is of a different type') 
    WHERE (
        EXISTS (SELECT 1 from day_preset_chunks WHERE preset_id = NEW.preset_id)
        OR EXISTS (SELECT 1 from week_presets WHERE preset_id = NEW.preset_id)
    );

    -- If there are no changes then skip insertion
    SELECT RAISE(IGNORE)
    WHERE EXISTS (
        SELECT 1 FROM atomic_presets 
        WHERE 
            preset_id = NEW.preset_id 
            AND valid_to IS NULL
            AND core_high = NEW.core_high
            AND core_low = NEW.core_low
            AND oven_high = NEW.oven_high
            AND oven_low = NEW.oven_low
    );

    -- Make the previous preset invalidated before inserting
    UPDATE atomic_presets
    SET valid_to = NEW.valid_from
    WHERE
        preset_id = NEW.preset_id
        AND valid_to IS NULL;
END;

-- Day Presets ----------------------------------------------------------------

CREATE TABLE day_preset_chunks (
    preset_id INTEGER NOT NULL REFERENCES preset_ids (preset_id),
    start INTEGER NOT NULL CHECK (0 <= start AND start <= 86400),
    end INTEGER NOT NULL CHECK (0 <= end AND end <= 86400),
    chunk_preset_id INTEGER NOT NULL REFERENCES preset_ids (preset_id),
    valid_from INTEGER NOT NULL DEFAULT (unixepoch()),
    valid_to INTEGER,
    PRIMARY KEY (preset_id, start, valid_from),
    CHECK (valid_to IS NULL OR valid_to > valid_from),
    CHECK (end > start)
);

CREATE UNIQUE INDEX current_day_preset_chunks
ON day_preset_chunks(preset_id, start)
WHERE valid_to IS NULL;

CREATE TRIGGER insert_day_preset_chunks
BEFORE INSERT ON day_preset_chunks
BEGIN
    -- Cancel if inserting invalidated
    SELECT RAISE(ABORT, 'Cannot insert invalidated record') WHERE NEW.valid_to IS NOT NULL;

    -- Cancel if any records for this preset exist in another table
    SELECT RAISE(ABORT, 'Preset is of a different type') 
    WHERE (
        EXISTS (SELECT 1 from atomic_presets WHERE preset_id = NEW.preset_id)
        OR EXISTS (SELECT 1 from week_presets WHERE preset_id = NEW.preset_id)
    );

    -- If there are no changes then skip insertion
    SELECT RAISE(IGNORE)
    WHERE EXISTS (
        SELECT 1 FROM day_preset_chunks 
        WHERE 
            preset_id = NEW.preset_id 
            AND valid_to IS NULL
            AND start = NEW.start
            AND end = NEW.end
            AND chunk_preset_id = NEW.chunk_preset_id
    );

    -- Make overlapping presets invalidated before inserting
    UPDATE day_preset_chunks
    SET valid_to = NEW.valid_from
    WHERE
        preset_id = NEW.preset_id
        AND valid_to IS NULL
        AND start < NEW.end AND end > NEW.start;

    -- Note: this approach could leave blank spaces withing a day
    -- To prevent this checks are made within the program before 
    -- inserting to ensure there are no gaps in the inserted chunks
    -- All chunks are also inserted in a single transaction
END;

-- Week Presets ---------------------------------------------------------------

CREATE TABLE week_presets (
    preset_id INTEGER NOT NULL REFERENCES preset_ids (preset_id),
    monday_preset_id INTEGER NOT NULL REFERENCES preset_ids (preset_id),
    tuesday_preset_id INTEGER NOT NULL REFERENCES preset_ids (preset_id),
    wednesday_preset_id INTEGER NOT NULL REFERENCES preset_ids (preset_id),
    thursday_preset_id INTEGER NOT NULL REFERENCES preset_ids (preset_id),
    friday_preset_id INTEGER NOT NULL REFERENCES preset_ids (preset_id),
    saturday_preset_id INTEGER NOT NULL REFERENCES preset_ids (preset_id),
    sunday_preset_id INTEGER NOT NULL REFERENCES preset_ids (preset_id),
    valid_from INTEGER NOT NULL DEFAULT (unixepoch()),
    valid_to INTEGER,
    PRIMARY KEY (preset_id, valid_from),
    CHECK (valid_to IS NULL OR valid_to > valid_from)
);

CREATE UNIQUE INDEX current_week_presets
ON week_presets(preset_id)
WHERE valid_to IS NULL;

CREATE TRIGGER insert_week_presets
BEFORE INSERT ON week_presets
BEGIN
    -- Cancel if inserting invalidated
    SELECT RAISE(ABORT, 'Cannot insert invalidated record') WHERE NEW.valid_to IS NOT NULL;

    -- Cancel if any records for this preset exist in another table
    SELECT RAISE(ABORT, 'Preset is of a different type') 
    WHERE (
        EXISTS (SELECT 1 from atomic_presets WHERE preset_id = NEW.preset_id)
        OR EXISTS (SELECT 1 from day_preset_chunks WHERE preset_id = NEW.preset_id)
    );

    -- If there are no changes then skip insertion
    SELECT RAISE(IGNORE)
    WHERE EXISTS (
        SELECT 1 FROM week_presets 
        WHERE 
            preset_id = NEW.preset_id 
            AND valid_to IS NULL
            AND monday_preset_id = NEW.monday_preset_id
            AND tuesday_preset_id = NEW.tuesday_preset_id
            AND wednesday_preset_id = NEW.wednesday_preset_id
            AND thursday_preset_id = NEW.thursday_preset_id
            AND friday_preset_id = NEW.friday_preset_id
            AND saturday_preset_id = NEW.saturday_preset_id
            AND sunday_preset_id = NEW.sunday_preset_id
    );

    -- Make the previous preset invalidated before inserting
    UPDATE week_presets
    SET valid_to = NEW.valid_from
    WHERE
        preset_id = NEW.preset_id
        AND valid_to IS NULL;
END;

-- History  -------------------------------------------------------------------

CREATE TABLE preset_history (
    preset_id INTEGER NOT NULL REFERENCES preset_ids(preset_id),
    active_from INTEGER DEFAULT (unixepoch()),
    active_to INTEGER,
    CHECK (active_to IS NULL OR active_to > active_from)
);

CREATE UNIQUE INDEX active_preset
ON preset_history(1)
WHERE active_to IS NULL;

CREATE TRIGGER insert_preset_history
BEFORE INSERT ON preset_history
BEGIN
    -- Cancel if inserting invalidated
    SELECT RAISE(ABORT, 'Cannot insert inactive preset') WHERE NEW.active_to IS NOT NULL;

    -- If there are no changes then skip insertion
    SELECT RAISE(IGNORE)
    WHERE EXISTS (
        SELECT 1 FROM preset_history 
        WHERE 
            preset_id = NEW.preset_id 
            AND active_to IS NULL
    );

    -- Make the previous active preset inactive before inserting
    UPDATE preset_history
    SET active_to = NEW.active_from
    WHERE
        active_to IS NULL;

    -- If inserting 0, then dont insert anything but still make inactive
    SELECT RAISE(IGNORE) WHERE NEW.preset_id = 0;
END;

-- Temperature  ---------------------------------------------------------------

CREATE TABLE temperatures (
    time INTEGER NOT NULL UNIQUE,
    core INTEGER NOT NULL,
    oven INTEGER NOT NULL,
    core_on BOOLEAN NOT NULL,
    oven_on BOOLEAN NOT NULL
);
