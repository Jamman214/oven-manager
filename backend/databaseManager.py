import sqlite3
from flask import current_app, g
import click
import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import random

class DatabaseManager():
    tz = ZoneInfo("Europe/London")
    db_name = "/app/data/temperatures_and_presets.db"

    @staticmethod
    def get_db():
        if 'db' not in g:
            g.db = sqlite3.connect(
                DatabaseManager.db_name,
                detect_types=sqlite3.PARSE_DECLTYPES,
                autocommit=False
            )
            g.db.row_factory = sqlite3.Row
        return g.db

    @staticmethod
    def close_db():
        db = g.pop('db', None)

        if db is not None:
            db.close()
    
    @staticmethod
    def query_db(query, args={}, one=False):
        con = DatabaseManager.get_db()
        try:
            cur = con.cursor()
            cur.execute(query, args)
            if one:
                return cur.fetchone()
            return cur.fetchall()
        finally:
            cur.close()
    
    @staticmethod
    def querymany_db(query, args=[], one=False):
        con = DatabaseManager.get_db()
        try:
            cur = con.cursor()
            results = []
            for a in args:
                cur.execute(query, a)
                if one:
                    results.append(cur.fetchone())
                else:
                    results.append(cur.fetchall())
            return results
        finally:
            cur.close()

    @staticmethod
    def execute_db(cur_func):
        def innerFunc(*args, **kwargs):
            con = DatabaseManager.get_db()
            result = None
            try:
                cur = con.cursor()
                result = cur_func(cur, *args, **kwargs)
                con.commit()
            except sqlite3.Error as e:
                con.rollback()
                raise e
            finally:
                cur.close()
            return result
        return innerFunc
    
    @staticmethod
    @click.command("init-db")
    @execute_db
    def init_db(cur):
        with current_app.open_resource('schema.sql') as f:
            cur.executescript(f.read().decode('utf8'))
            print("Initialised database")
    
    @staticmethod
    @click.command("populate-db")
    @execute_db
    def populate_db(cur):
        print("Generating data")
        core = 450
        difference = 0
        records = []
        now = int(time.time())
        core_change = 0
        difference_change = 0
        for i in range(7 * 24 * 60, -1, -1):
            core = max(min(core + core_change, 500), 300)
            difference = max(min(difference + difference_change, 100), -5)
            core_change = max(min(core_change + random.randint(-1,1), 10), -10)
            difference_change = max(min(difference_change + random.randint(-1,1), 10), -10)
            records.append({
                'time': now - (i * 60),
                'core': core,
                'oven': core - difference,
                'core_on': core_change > 0,
                'oven_on': core_change - difference_change > 0
            })
        print("Inserting data")
        cur.executemany("""
            INSERT INTO temperatures 
                (time, core, oven, core_on, oven_on) 
            VALUES 
                (:time, :core, :oven, :core_on, :oven_on)
        """, records)
        print("Finished")
        

class PresetManager():
    @staticmethod
    def _init_preset(cur):
        cur.execute("INSERT INTO preset_ids DEFAULT VALUES;")
        return cur.lastrowid

    @staticmethod
    def _insert_preset_name(cur, id, preset):
        cur.execute(
            """
                INSERT INTO preset_names 
                    (preset_id, name) 
                VALUES 
                    (:preset_id, :name)
            """, 
            {**preset, 'preset_id': id}
        )

    



    @staticmethod
    def format_from_api_atomic_preset(api_preset):
        preset_id = api_preset.get('id', None)

        temps = api_preset['temperature']
        core = temps['core']
        oven = temps['oven']

        db_preset =  {
            'name': api_preset['name'],
            'core_high': core['high'],
            'core_low': core['low'],
            'oven_high': oven['high'],
            'oven_low': oven['low']
        }
        return preset_id, db_preset

    @staticmethod
    def format_from_api_day_preset(api_preset):
        preset_id = api_preset.get('id', None)

        chunks = []
        prev = 0
        cur = 0
        for i in range(len(api_preset['time'])):
            cur = ((api_preset['time'][i]['hour'] * 60) + api_preset['time'][i]['minute']) * 60
            chunks.append({
                'start': prev,
                'end': cur,
                'chunk_preset_id': api_preset['preset'][i]
            })
            prev = cur
        chunks.append({
            'start': prev,
            'end': 86400,
            'chunk_preset_id': api_preset['preset'][-1]
        })
        

        db_preset =  {
            'name': api_preset['name'],
            'chunks': chunks
        }
        return preset_id, db_preset
    
    @staticmethod
    def format_from_api_week_preset(api_preset):
        preset_id = api_preset.get('id', None)

        db_preset =  {
            'name': api_preset['name'],
            'monday_preset_id': api_preset['preset'][0],
            'tuesday_preset_id': api_preset['preset'][1],
            'wednesday_preset_id': api_preset['preset'][2],
            'thursday_preset_id': api_preset['preset'][3],
            'friday_preset_id': api_preset['preset'][4],
            'saturday_preset_id': api_preset['preset'][5],
            'sunday_preset_id': api_preset['preset'][6]
        }
        return preset_id, db_preset




    
    @staticmethod
    def _insert_atomic_preset(cur, id, preset):
        PresetManager._insert_preset_name(cur, id, preset)
        cur.execute(
            """
                INSERT INTO atomic_presets 
                    (preset_id, core_high, core_low, oven_high, oven_low) 
                VALUES 
                    (:preset_id, :core_high, :core_low, :oven_high, :oven_low)
            """, 
            {**preset, 'preset_id': id}
        )

    @staticmethod
    def _insert_day_preset(cur, id, preset):
        PresetManager._insert_preset_name(cur, id, preset)
        chunks = ({**p, 'preset_id': id} for p in preset['chunks'])
        cur.executemany(
            """
                INSERT INTO day_preset_chunks 
                    (preset_id, start, end, chunk_preset_id) 
                VALUES 
                    (:preset_id, :start, :end, :chunk_preset_id)
            """, 
            chunks
        )
    
    @staticmethod
    def _insert_week_preset(cur, id, preset):
        PresetManager._insert_preset_name(cur, id, preset)
        cur.execute(
            """
                INSERT INTO week_presets 
                    (preset_id, monday_preset_id, tuesday_preset_id, wednesday_preset_id, thursday_preset_id, friday_preset_id, saturday_preset_id, sunday_preset_id) 
                VALUES 
                    (:preset_id, :monday_preset_id, :tuesday_preset_id, :wednesday_preset_id, :thursday_preset_id, :friday_preset_id, :saturday_preset_id, :sunday_preset_id)
            """, 
            {**preset, 'preset_id': id}
        )




    
    @staticmethod
    @DatabaseManager.execute_db
    def create_atomic_preset(cur, preset):
        id = PresetManager._init_preset(cur)
        PresetManager._insert_atomic_preset(cur, id, preset)
        return id
    
    @staticmethod
    @DatabaseManager.execute_db
    def create_day_preset(cur, preset):
        id = PresetManager._init_preset(cur)
        PresetManager._insert_day_preset(cur, id, preset)
        return id
    
    @staticmethod
    @DatabaseManager.execute_db
    def create_week_preset(cur, preset):
        id = PresetManager._init_preset(cur)
        PresetManager._insert_week_preset(cur, id, preset)
        return id


    


    @staticmethod
    @DatabaseManager.execute_db
    def update_atomic_preset(cur, id, preset):
        PresetManager._insert_atomic_preset(cur, id, preset)

    @staticmethod
    @DatabaseManager.execute_db
    def update_day_preset(cur, id, preset):
        PresetManager._insert_day_preset(cur, id, preset)

    @staticmethod
    @DatabaseManager.execute_db
    def update_week_preset(cur, id, preset):
        PresetManager._insert_week_preset(cur, id, preset)




    @staticmethod
    def get_atomic_presets():
        query = """
            SELECT p.preset_id, p.name 
            FROM preset_names as p
            INNER JOIN atomic_presets as a
            ON p.preset_id = a.preset_id
            WHERE
                p.valid_to IS NULL
                AND a.valid_to IS NULL;
        """

        result = DatabaseManager.query_db(query)

        return [{'id': row['preset_id'], 'name': row['name']} for row in result]
    
    @staticmethod
    def get_day_presets():
        query = """
            SELECT p.preset_id, p.name 
            FROM preset_names as p
            INNER JOIN day_preset_chunks as d
            ON p.preset_id = d.preset_id
            WHERE
                p.valid_to IS NULL
                AND d.valid_to IS NULL
            GROUP BY p.preset_id;
        """

        result = DatabaseManager.query_db(query)

        return [{'id': row['preset_id'], 'name': row['name']} for row in result]
    
    @staticmethod
    def get_week_presets():
        query = """
            SELECT p.preset_id, p.name 
            FROM preset_names as p
            INNER JOIN week_presets as w
            ON p.preset_id = w.preset_id
            WHERE
                p.valid_to IS NULL
                AND w.valid_to IS NULL;
        """

        result = DatabaseManager.query_db(query)

        return [{'id': row['preset_id'], 'name': row['name']} for row in result]
    

    @staticmethod
    def get_atomic_preset(id):
        query = """
            SELECT p.preset_id, p.name, a.core_high, a.core_low, a.oven_high, a.oven_low
            FROM preset_names as p
            INNER JOIN atomic_presets as a
            ON p.preset_id = a.preset_id
            WHERE
                p.preset_id = :preset_id
                AND p.valid_to IS NULL
                AND a.valid_to IS NULL;
        """

        result = DatabaseManager.query_db(
            query,
            args={'preset_id': id},
            one=True
        )

        return {
            'id': result['preset_id'],
            'name': result['name'],
            'temperature': {
                'core': {
                    'high': result['core_high'],
                    'low': result['core_low']
                },
                'oven': {
                    'high': result['oven_high'],
                    'low': result['oven_low']
                }
            }
        }
    
    @staticmethod
    def get_day_preset(id):
        base_query = """
            SELECT p.preset_id, p.name
            FROM preset_names as p
            INNER JOIN day_preset_chunks as d
            ON p.preset_id = d.preset_id
            WHERE
                p.preset_id = :preset_id
                AND p.valid_to IS NULL
                AND d.valid_to IS NULL
            GROUP BY p.preset_id;
        """

        base_result = DatabaseManager.query_db(
            base_query,
            args={'preset_id': id},
            one=True
        )

        chunk_query = """
            SELECT start, chunk_preset_id
            FROM day_preset_chunks
            WHERE
                preset_id = :preset_id
                AND valid_to IS NULL
            ORDER BY start ASC;
        """

        chunk_result = DatabaseManager.query_db(
            chunk_query,
            args={'preset_id': id},
        )

        return {
            'id': base_result['preset_id'],
            'name': base_result['name'],
            'preset': [chunk['chunk_preset_id'] for chunk in chunk_result],
            'time': [{
                    'hour': chunk['start'] // (60 * 60), 
                    'minute': (chunk['start'] // 60) % 60
                } for chunk in chunk_result[1:]]
        }
    
    @staticmethod
    def get_week_preset(id):
        query = """
            SELECT p.preset_id, p.name, a.monday_preset_id, a.tuesday_preset_id, a.wednesday_preset_id, a.thursday_preset_id, a.friday_preset_id, a.saturday_preset_id, a.sunday_preset_id
            FROM preset_names as p
            INNER JOIN week_presets as a
            ON p.preset_id = a.preset_id
            WHERE
                p.preset_id = :preset_id
                AND p.valid_to IS NULL
                AND a.valid_to IS NULL;
        """

        result = DatabaseManager.query_db(
            query,
            args={'preset_id': id},
            one=True
        )

        return {
            'id': result['preset_id'],
            'name': result['name'],
            'preset': [
                result['monday_preset_id'],
                result['tuesday_preset_id'],
                result['wednesday_preset_id'],
                result['thursday_preset_id'],
                result['friday_preset_id'],
                result['saturday_preset_id'],
                result['sunday_preset_id']
            ]
        }
    




    @staticmethod
    @DatabaseManager.execute_db
    def set_active(cur, id):
        cur.execute(
            """
                INSERT INTO preset_history 
                    (preset_id) 
                VALUES 
                    (:preset_id)
            """, 
            {'preset_id': id}
        )
    
    @staticmethod
    def get_active():
        query = """
            SELECT preset_id
            FROM preset_history
            WHERE active_to IS NULL;
        """

        result = DatabaseManager.query_db(
            query,
            args={'preset_id': id},
            one=True
        )

        if result is None:
            return {'id': 0}
        return {'id': result['preset_id']}
    
    @staticmethod
    def get_temperatures(start, end):
        query = """
            SELECT time, core, oven, core_on, oven_on 
            FROM temperatures
            WHERE time BETWEEN :start AND :end;
        """

        result = DatabaseManager.query_db(
            query,
            args={'start': start, 'end': end},
        )

        return [{
            'time': row['time'],
            'core': row['core'],
            'oven': row['oven'],
            'coreOn': bool(row['core_on']),
            'ovenOn': bool(row['oven_on'])
        } for row in result]



    @staticmethod
    def get_boxes(start, end):
        active_presets_query = """
            SELECT 
                preset_id, 
                max(active_from, :start) as active_from, 
                min(COALESCE(active_to, unixepoch()), :end) as active_to
            FROM preset_history
            WHERE 
                active_from < :end 
                AND (
                    active_to IS NULL 
                    OR active_to > :start
                );
        """

        active_presets_0 = DatabaseManager.query_db(
            active_presets_query,
            args={'start': start, 'end': end}
        )

        extract_week_presets = """
            SELECT 
                preset_id, 
                max(valid_from, :active_from) as active_from, 
                min(COALESCE(valid_to, unixepoch()), :active_to) as active_to,
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
                AND valid_from < :active_to
                AND (
                    valid_to IS NULL 
                    OR valid_to > :active_from
                );
        """

        week_presets = DatabaseManager.querymany_db(
            extract_week_presets,
            args=(dict(row) for row in active_presets_0)
        )

        active_presets_1 = []
        for i in range(len(active_presets_0)):
            if len(week_presets[i]) == 0:
                # If the preset was atomic or day
                active_presets_1.append(active_presets_0[i])
                continue
            
            for preset in week_presets[i]:
                active_from = preset['active_from']
                active_to = preset['active_to']

                active_from_dt = datetime.fromtimestamp(active_from, tz=DatabaseManager.tz)
                active_to_dt = datetime.fromtimestamp(active_to, tz=DatabaseManager.tz)
                active_from_day = active_from_dt.replace(hour=0, minute=0, second=0, microsecond=0)
                day_id_keys = ['monday_preset_id', 'tuesday_preset_id', 'wednesday_preset_id', 'thursday_preset_id', 'friday_preset_id', 'saturday_preset_id', 'sunday_preset_id']

                day_start = active_from_day
                while day_start < active_to_dt:
                    day_end = day_start + timedelta(days=1)

                    active_presets_1.append({
                        'preset_id': preset[day_id_keys[day_start.weekday()]],
                        'active_from': int(max(day_start, active_from_dt).timestamp()),
                        'active_to': int(min(day_end, active_to_dt).timestamp())
                    })

                    day_start = day_end

        extract_day_presets = """
            SELECT 
                preset_id, 
                max(valid_from, :active_from) as active_from, 
                min(COALESCE(valid_to, unixepoch()), :active_to) as active_to, 
                start, 
                end, 
                chunk_preset_id
            FROM day_preset_chunks
            WHERE 
                preset_id = :preset_id
                AND valid_from < :active_to
                AND (
                    valid_to IS NULL 
                    OR valid_to > :active_from
                );
        """

        day_presets = DatabaseManager.querymany_db(
            extract_day_presets,
            args=(dict(row) for row in active_presets_1)
        )

        active_presets_2 = []
        for i in range(len(active_presets_1)):
            if len(day_presets[i]) == 0:
                # If the preset was atomic
                active_presets_2.append(active_presets_1[i])
                continue

            for preset in day_presets[i]:
                active_from = preset['active_from']
                active_to = preset['active_to']

                active_from_dt = datetime.fromtimestamp(active_from, tz=DatabaseManager.tz)
                active_to_dt = datetime.fromtimestamp(active_to, tz=DatabaseManager.tz)
                active_from_day = active_from_dt.replace(hour=0, minute=0, second=0, microsecond=0)
                start_td = timedelta(seconds=preset['start'])
                end_td = timedelta(seconds=preset['end'])

                day_start = active_from_day
                # Loop breaks when chunk starts after active period ends
                while (day_start + start_td) < active_to_dt:
                    chunk_start = int(max(day_start + start_td, active_from_dt).timestamp())
                    chunk_end = int(min(day_start + end_td, active_to_dt).timestamp())

                    day_start += timedelta(days=1)

                    if not (chunk_start < chunk_end):
                        continue

                    active_presets_2.append({
                        'preset_id': preset['chunk_preset_id'],
                        'active_from': chunk_start,
                        'active_to': chunk_end
                    })

        extract_atomic_presets = """
            SELECT 
                preset_id, 
                max(valid_from, :active_from) as active_from, 
                min(COALESCE(valid_to, unixepoch()), :active_to) as active_to, 
                core_high,
                core_low,
                oven_high, 
                oven_low
            FROM atomic_presets
            WHERE 
                preset_id = :preset_id
                AND valid_from < :active_to
                AND (
                    valid_to IS NULL 
                    OR valid_to > :active_from
                );
        """

        atomic_presets = DatabaseManager.querymany_db(
            extract_atomic_presets,
            args=(dict(row) for row in active_presets_2)
        )

        final_values = [dict(p) for row in atomic_presets for p in row]

        def identical_atomic_presets(p1, p2):
            return (
                p1['preset_id'] == p2['preset_id']
                and p1['core_high'] == p2['core_high']
                and p1['core_low'] == p2['core_low']
                and p1['oven_high'] == p2['oven_high']
                and p1['oven_low'] == p2['oven_low']
            )

        final_values.sort(key=lambda x: x['active_from'])

        i = 1
        while i < len(final_values):
            if identical_atomic_presets(final_values[i], final_values[i-1]):
                duplicate_preset = final_values.pop(i)
                final_values[i-1]['active_to'] = duplicate_preset['active_to']
            else:
                i += 1

        core = []
        oven = []
        for preset in final_values:
            core.append({
                'max': preset['core_high'],
                'min': preset['core_low'],
                'start': preset['active_from'],
                'end':  preset['active_to'],
            })
            oven.append({
                'max': preset['oven_high'],
                'min': preset['oven_low'],
                'start': preset['active_from'],
                'end':  preset['active_to'],
            })

        return {
            'core': core,
            'oven': oven
        }

    @staticmethod
    def get_history(start, end):
        return {
            'data': PresetManager.get_temperatures(start, end),
            'limit': PresetManager.get_boxes(start, end),
            'start': start,
            'end': end
        }
    
    @staticmethod
    def get_history(start, end):
        return {
            'data': PresetManager.get_temperatures(start, end),
            'limit': PresetManager.get_boxes(start, end),
            'start': start,
            'end': end
        }