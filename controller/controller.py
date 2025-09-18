import sqlite3
import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

def get_limits(cur, _time):
    tz = ZoneInfo("Europe/London")

    extract_active = """
        SELECT preset_id
        FROM preset_history
        WHERE active_to IS NULL;
    """

    cur.execute(extract_active)
    active = cur.fetchone()

    if active is None:
        return {'preset_id': 0}
    
    preset_id = active['preset_id']

    extract_week_preset = """
        SELECT 
            preset_id, 
            monday_preset_id, 
            tuesday_preset_id, 
            wednesday_preset_id, 
            thursday_preset_id, 
            friday_preset_id, 
            saturday_preset_id, 
            sunday_preset_id
        FROM week_presets
        WHERE 
            preset_id = :preset_id
            AND valid_from <= :time
            AND (
                valid_to IS NULL 
                OR valid_to > :time
            );
    """

    cur.execute(
        extract_week_preset, 
        {'preset_id': preset_id, 'time': _time}
    )
    week_preset = cur.fetchone()

    if week_preset is not None:
        day_id_keys = ['monday_preset_id', 'tuesday_preset_id', 'wednesday_preset_id', 'thursday_preset_id', 'friday_preset_id', 'saturday_preset_id', 'sunday_preset_id']
        day = datetime.fromtimestamp(_time, tz=tz).weekday()
        preset_id = week_preset[day_id_keys[day]]

    extract_day_presets = """
        SELECT 
            preset_id, 
            start, 
            end, 
            chunk_preset_id
        FROM day_preset_chunks
        WHERE 
            preset_id = :preset_id
            AND valid_from <= :time
            AND (
                valid_to IS NULL 
                OR valid_to > :time
            );
    """

    cur.execute(
        extract_day_presets, 
        {'preset_id': preset_id, 'time': _time}
    )
    day_presets = cur.fetchall()

    if len(day_presets) > 0:
        time_dt = datetime.fromtimestamp(_time, tz=tz)
        day_start = time_dt.replace(hour=0, minute=0, second=0, microsecond=0)
        for chunk in day_presets:
            if (
                day_start + timedelta(seconds=chunk['start']) <= time_dt
                and day_start + timedelta(seconds=chunk['end']) > time_dt
            ):
                preset_id = chunk['chunk_preset_id']
                break

    extract_atomic_preset = """
        SELECT 
            preset_id,
            core_high,
            core_low,
            oven_high, 
            oven_low
        FROM atomic_presets
        WHERE 
            preset_id = :preset_id
            AND valid_from <= :time
            AND (
                valid_to IS NULL 
                OR valid_to > :time
            );
    """

    cur.execute(
        extract_atomic_preset, 
        {'preset_id': preset_id, 'time': _time}
    )
    atomic_preset = cur.fetchone()

    return dict(atomic_preset) if atomic_preset else {}

def get_previous(cur):
    extract_previous = """
        SELECT 
            core_on,
            oven_on
        FROM temperatures
        ORDER BY time DESC
        LIMIT 1
    """

    cur.execute(extract_previous)
    previous = cur.fetchone()

    if previous is None:
        return {'core_on': False, 'oven_on': False}
    
    return {
        'core_on': bool(previous['core_on']),
        'oven_on': bool(previous['oven_on'])
    }

def get_temperatures():
    # TODO
    return {'core': 0, 'oven': 0}

def is_on(preset_id, temp, high, low, was_on):
    if preset_id == 0:
        return False
    if temp > high:
        return False
    if temp < low:
        return True
    return was_on

def insert_record(cur, record):
    insert = """
        INSERT INTO temperatures
            (time, core, oven, core_on, oven_on)
        VALUES
            (:time, :core, :oven, :core_on, :oven_on)
    """

    cur.execute(insert, record)

def set_relays(core_on, oven_on):
    # TODO
    pass

con = None
try:
    con = sqlite3.connect(
        "../app.db",
        detect_types=sqlite3.PARSE_DECLTYPES
    )
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    _time = int(time.time())

    temps = get_temperatures()
    limits = get_limits(cur, _time)
    previous = get_previous(cur)

    # I used .get() here in case anything happens with the data consistency
    # it just means it can continue to run and shut off peacefully 
    # after inserting to the db
    record = {
        'time': _time,
        'core': temps['core'],
        'oven': temps['oven'],
        'core_on': 
            is_on(
                limits.get('preset_id', 0),
                temps['core'], 
                limits.get('core_high', 0),
                limits.get('core_low', 0),
                previous['core_on']
            ),
        'oven_on': 
            is_on(
                limits.get('preset_id', 0),
                temps['oven'], 
                limits.get('oven_high', 0),
                limits.get('oven_low', 0),
                previous['oven_on']
            )
    }

    insert_record(cur, record)
    con.commit()

    set_relays(record['core_on'], record['oven_on'])

except Exception as e:
    # If any exception occurs, rollback and turn off the oven
    if con:
        con.rollback()
    set_relays(False, False)
    print("test")

finally:
    if con:
        con.close()

    