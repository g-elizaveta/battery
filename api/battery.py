from flask import Blueprint, request, jsonify
from datetime import datetime
from extensions import db  
from models import *

battery_bp = Blueprint('battery_api', __name__, url_prefix='/battery')

# GET /battery - получить список всех акб
@battery_bp.route('/', methods=['GET'])
def get_batteries():
    try:
        batteries = Battery.query.order_by(Battery.id.asc()).all()
        return jsonify({
            'success': True,
            'data': [battery.to_dict() for battery in batteries],
            'count': len(batteries)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# GET /battery/<id> - получить инфо об акб по его ID
@battery_bp.route('/<int:battery_id>', methods=['GET'])
def get_battery(battery_id):
    try:
        battery = Battery.query.get_or_404(battery_id)
        return jsonify({
            'success': True,
            'data': battery.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 404

# POST /battery/create_new - создать новый акб
@battery_bp.route('/create_new', methods=['POST'])
def create_battery():
    try:
        data = request.get_json()

        required_fields = ['name', 'voltage', 'capacity']
        for field in required_fields:
            if field not in data or data[field] is None:
                return jsonify({
                    'success': False,
                    'error': f'Поле {field} обязательно для заполнения'
                }), 400
            
        if len(data['name']) > 100:
            return jsonify({
                    'success': False,
                    'error': f'Название АКБ не должно превышать 100 символов'
                }), 400

        initial_capacity = float(data['capacity'])
        capacity_history = [{
            'capacity': initial_capacity,
            'timestamp': datetime.now().isoformat(),
            'note': 'Начальное значение'
        }]

        battery = Battery(
            name=data['name'],
            voltage=float(data['voltage']), 
            capacity=initial_capacity,
            lifetime=data.get('lifetime'),
            device_id=None,
            capacity_history=capacity_history
        )
        
        db.session.add(battery)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': battery.to_dict(),
            'message': 'Новый АКБ был успешно создан'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# PUT /battery/<id> - обновить данные АКБ
@battery_bp.route('/<int:battery_id>', methods=['PUT'])
def update_battery(battery_id):
    try:
        battery = Battery.query.get_or_404(battery_id)
        data = request.get_json()

        if 'name' in data and not data['name']:
            return jsonify({
                'success': False,
                'error': 'Название АКБ не может быть пустым'
            }), 400
        elif len(data['name']) > 100:
            return jsonify({
                'success': False,
                'error': f'Название АКБ не должно превышать 100 символов'
            }), 400
        
        if 'voltage' in data and data['voltage'] is None:
            return jsonify({
                'success': False,
                'error': 'Поле номинальное напряжение не может быть пустым'
            }), 400
        
        if 'capacity' in data and data['capacity'] is None:
            return jsonify({
                'success': False,
                'error': 'Поле остаточная емкость АКБ не может быть пустым'
            }), 400

        if 'capacity' in data:
            new_capacity = float(data['capacity'])
            if new_capacity != battery.capacity:
                history = (battery.capacity_history or [])[:] 

                history.append({
                    'capacity': new_capacity,
                    'timestamp': datetime.now().isoformat()
                })
                battery.capacity_history = history[-20:]

        if 'name' in data:
            battery.name = data['name']
        
        if 'voltage' in data:
            battery.voltage = float(data['voltage'])
        
        if 'capacity' in data:
            battery.capacity = float(data['capacity'])
        
        if 'lifetime' in data:
            battery.lifetime = data['lifetime']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': battery.to_dict(),
            'message': 'Данные АКБ успешно обновлены'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# DELETE /battery/<id> - удалить акб
@battery_bp.route('/<int:battery_id>', methods=['DELETE'])
def delete_battery(battery_id):
    try:
        battery = Battery.query.get_or_404(battery_id)
        
        db.session.delete(battery)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Данные об АКБ были успешно удалены'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500