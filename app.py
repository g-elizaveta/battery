from flask import render_template
from flask_swagger_ui import get_swaggerui_blueprint
from extensions import app, db, migrate
from config import Config
from models import * 
from seed_data import add_test_data 

from api.device import device_bp
from api.battery import battery_bp

app.config.from_object(Config)
db.init_app(app)
migrate.init_app(app, db)

SWAGGER_URL = '/api/docs'
API_URL = '/static/swagger.yaml'

swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        'app_name': "API Мониторинг АКБ",
        'layout': "BaseLayout"
    }
)

app.register_blueprint(device_bp)
app.register_blueprint(battery_bp)
app.register_blueprint(swaggerui_blueprint)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    add_test_data()
    app.run(host='0.0.0.0', port=5000, debug=True)