from flask import Blueprint, request, jsonify
from extensions import db  
from models import *

device_bp = Blueprint('device_api', __name__, url_prefix='/device')

# GET /device - получить данные всех устройств
@device_bp.route('/', methods=['GET'])
def get_devices():
    try:
        devices = Device.query.order_by(Device.id.asc()).all()
        return jsonify({
            'success': True,
            'data': [device.to_dict() for device in devices],
            'count': len(devices)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# GET /device/<id> - получить данные устройства по ID
@device_bp.route('/<int:device_id>', methods=['GET'])
def get_device(device_id):
    try:
        device = Device.query.get_or_404(device_id)
        return jsonify({
            'success': True,
            'data': device.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 404

# POST /device/create_new - создать новое устройство
@device_bp.route('/create_new', methods=['POST'])
def create_device():
    try:
        data = request.get_json()

        if not data.get('name') or not data.get('firmware_version'):
            return jsonify({
                'success': False,
                'error': 'Укажите название и версию прошивки для устройства'
            }), 400
        
        if len(data['name']) > 100 or len(data['firmware_version']) > 50:
            return jsonify({
                'success': False,
                'error': 'Превышен лимит количества символов в названии либо версии устройства'
            }), 400

        if Device.query.filter_by(name=data['name']).first():
            return jsonify({
                'success': False,
                'error': 'Устройство с таким названием уже существует'
            }), 400

        device = Device(
            name=data['name'],
            firmware_version=data['firmware_version'],
            status=False
        )
        
        db.session.add(device)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': device.to_dict(),
            'message': 'Новое устройство успешно создано'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# PUT /device/<id> - обновить устройство
@device_bp.route('/<int:device_id>', methods=['PUT'])
def update_device(device_id):
    try:
        device = Device.query.get_or_404(device_id)
        data = request.get_json()

        if 'name' in data:
            existing = Device.query.filter(Device.name == data['name'], Device.id != device_id).first()
            if existing:
                return jsonify({
                    'success': False,
                    'error': 'Устройство с таким названием уже существует'
                }), 400
            if len(data['name']) > 100 or len(data['firmware_version']) > 50:
                return jsonify({
                    'success': False,
                    'error': 'Превышен лимит количества символов в названии либо версии устройства'
                }), 400
            device.name = data['name']
        
        if 'firmware_version' in data:
            device.firmware_version = data['firmware_version']
        
        if 'status' in data:
            device.status = data['status']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': device.to_dict(),
            'message': 'Данные устройства были обновлены'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# DELETE /device/<id> - удалить устройство
@device_bp.route('/<int:device_id>', methods=['DELETE'])
def delete_device(device_id):
    try:
        device = Device.query.get_or_404(device_id)

        for battery in device.batteries:
            battery.device_id = None
        
        db.session.delete(device)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Устройство успешно удалено'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
# Отключение/подключение АКБ к устройству

# POST /device/<device_id>/connect_battery/<battery_id> - подключить АКБ к устройству
@device_bp.route('/<int:device_id>/connect_battery/<int:battery_id>', methods=['POST'])
def connect_battery(device_id, battery_id):
    try:
        device = Device.query.get_or_404(device_id)
        battery = Battery.query.get_or_404(battery_id)

        if not device.can_add_battery():
            return jsonify({
                'success': False,
                'error': 'Можно подключить только до 5 АКБ одновременно'
            }), 400

        battery.device_id = device_id
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'АКБ {battery.name} подключено к {device.name}',
            'data': {
                'device': device.to_dict(),
                'battery': battery.to_dict()
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# DELETE /device/<device_id>/delete_battery/<battery_id> - отключить АКБ от устройства
@device_bp.route('/<int:device_id>/delete_battery/<int:battery_id>', methods=['DELETE'])
def disconnect_battery(device_id, battery_id):
    try:
        device = Device.query.get_or_404(device_id)
        battery = Battery.query.get_or_404(battery_id)

        if battery.device_id != device_id:
            return jsonify({
                'success': False,
                'error': 'Выбранное АКБ не подключено к данному устройству'
            }), 400

        battery.device_id = None
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'АКБ {battery.name} отключено от {device.name}',
            'data': {
                'device': device.to_dict(),
                'battery': battery.to_dict()
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500