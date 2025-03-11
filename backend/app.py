from flask import Flask
import os
from dotenv import dotenv_values

app = Flask(__name__)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
env_path = os.path.join(BASE_DIR, '.env')
secrets = dotenv_values(env_path)

app.secret_key = secrets['APP_SECRET_KEY']

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
