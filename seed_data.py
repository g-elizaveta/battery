from extensions import app, db
from models import Device, Battery

def add_test_data():
    with app.app_context():
        if Device.query.first() is not None or Battery.query.first() is not None:
            return

        device1 = Device(
            name="Устройство-1",
            firmware_version="v1.0.0", 
            status=False
        )
        
        device2 = Device(
            name="Устройство-2",
            firmware_version="v1.0.0",
            status=True
        )
        
        db.session.add_all([device1, device2])
        db.session.commit() 

        battery1 = Battery(
            name="АКБ-001",
            voltage=12,  
            capacity=60,        
            lifetime=24,           
            device_id=device2.id   
        )
        
        battery2 = Battery(
            name="АКБ-002", 
            voltage=24,
            capacity=30,
            lifetime=12,
        )
        
        battery3 = Battery(
            name="АКБ-003",
            voltage=6,
            capacity=80, 
            lifetime=36,
            device_id=device2.id
        )
        
        db.session.add_all([battery1, battery2, battery3])
        db.session.commit()