from extensions import db
class Device(db.Model):
    __tablename__ = 'devices'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    firmware_version = db.Column(db.String(50), nullable=False)
    status = db.Column(db.Boolean, default=False)
    
    batteries = db.relationship('Battery', backref='device', lazy=True, 
                               order_by="Battery.id")
    
    def can_add_battery(self):
        return len(self.batteries) < 5
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'firmware_version': self.firmware_version,
            'status': self.status,
            'batteries_count': len(self.batteries),
            'batteries': [battery.to_dict() for battery in self.batteries]
        }

class Battery(db.Model):
    __tablename__ = 'batteries'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    voltage = db.Column(db.Float, nullable=False) 
    capacity = db.Column(db.Float, nullable=False) 
    lifetime = db.Column(db.Integer)     
    capacity_history = db.Column(db.JSON, default=list)
    device_id = db.Column(db.Integer, db.ForeignKey('devices.id'), nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'voltage': self.voltage,
            'capacity': self.capacity,
            'lifetime': self.lifetime,
            'device_id': self.device_id,
            'capacity_history': self.capacity_history or []
        }