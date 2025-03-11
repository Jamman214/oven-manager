from flask import Flask
from dotenv import dotenv_values

app = Flask(__name__)

secrets = dotenv_values('.env')
app.secret_key = secrets['APP_SECRET_KEY']

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
