import sqlite3
import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import schedule
import logging
import atexit
import sys
import signal
try:
    import RPi.GPIO as GPIO
    ON_PI = True
except (ImportError, RuntimeError):
    ON_PI = False

tz = ZoneInfo("Europe/London")
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class DatabaseHandler():
    def __init__(self):
        self.con = None
    
    def init_resources(self):
        try:
            self.con = sqlite3.connect(
                "/app/data/temperatures_and_presets.db",
                detect_types=sqlite3.PARSE_DECLTYPES
            )
            self.con.row_factory = sqlite3.Row
        except sqlite3.Error as e:
            logging.error(f"Database connection failed: {e}")
            sys.exit(1) # Exit the script with a failure code
    
    def handle_cleanup(self):
        if self.con:
            self.con.close()

    def get_limits(self, cur, _time):
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

        if atomic_preset is None:
            logging.error(f"Limits read failed")
            return {}

        return dict(atomic_preset)

    def get_previous(self, cur):
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
            logging.error(f"Previous read failed")
            return {}

        return {
            'core_on': bool(previous['core_on']),
            'oven_on': bool(previous['oven_on'])
        }
    
    def insert_record(self, cur, record):
        insert = """
            INSERT INTO temperatures
                (time, core, oven, core_on, oven_on)
            VALUES
                (:time, :core, :oven, :core_on, :oven_on)
        """

        cur.execute(insert, record)



class GpioHandler():
    @staticmethod
    def require_pi(default=None):
        def decorator(func):
            def wrapper(*args, **kwargs):
                if not ON_PI:
                    return default
                return func(*args, **kwargs)
            return wrapper
        return decorator

    @require_pi()
    def handle_cleanup(self):
        GPIO.cleanup()

    @require_pi({})
    def get_temperatures(self):
        temps = None
        # TODO
        if temps is None:
            logging.error(f"Temperature read failed")
            return {}
        return dict(temps)
    
    @require_pi()
    def set_relays(self, core_on, oven_on):
        # TODO
        pass



class Controller():
    def __init__(self):
        self.db = DatabaseHandler()
        self.gpio = GpioHandler()
        self.set_cleanup_handler(self.handle_cleanup)
        self.db.init_resources()

    def handle_cleanup(self, signum=None, frame=None):
        self.db.handle_cleanup()
        self.gpio.handle_cleanup()

    def set_cleanup_handler(self, handler):
        atexit.register(handler)
        signal.signal(signal.SIGTERM, handler) # Catches `docker stop`
        signal.signal(signal.SIGINT, handler)  # Catches Ctrl+C

    def should_be_on(self, sector, temps, limits, previous):
        if not (temps and limits and previous):
            return False

        if limits['preset_id'] == 0:
            return False
        if temps[sector] > limits[f"{sector}_high"]:
            return False
        if temps[sector] < limits[f"{sector}_low"]:
            return True
        return previous[f"{sector}_on"]

    def run_task(self):
        try:
            _time = int(time.time())

            temps = self.gpio.get_temperatures()

            con = self.db.con
            with con:
                cur = con.cursor()
                limits = self.db.get_limits(cur, _time)
                previous = self.db.get_previous(cur)
                    
                record = {
                    'time': _time,
                    'core': temps.get('core', 0),
                    'oven': temps.get('oven', 0),
                    'core_on': self.should_be_on('core', temps, limits, previous),
                    'oven_on': self.should_be_on('oven', temps, limits, previous),
                }

                self.db.insert_record(cur, record)

            self.gpio.set_relays(record['core_on'], record['oven_on'])

        except Exception as e:
            logging.error(f"Error running task: {e}")
            self.gpio.set_relays(False, False)

def main():
    controller = Controller()

    schedule.every().minute.at(":00").do(controller.run_task)

    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    main()