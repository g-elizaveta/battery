document.addEventListener('DOMContentLoaded', async () => {

    async function loadDevices() {
        try {
            const response = await fetch(`/device`);
            const result = await response.json();
            
            if (result.success) {
                renderDevices(result.data);
            } else {
                showError('Ошибка загрузки устройств: ' + result.error);
            }
        } catch (error) {
            showError('Ошибка сети: ' + error.message);
        }
    }
    
    async function loadBatteries() {
        try {
            const response = await fetch(`/battery`);
            const result = await response.json();
            
            if (result.success) {
                renderBatteries(result.data);
            } else {
                showError('Ошибка загрузки аккумуляторов: ' + result.error);
            }
        } catch (error) {
            showError('Ошибка сети: ' + error.message);
        }
    }
    
    // РЕНДЕР УСТРОЙСТВ 
    function renderDevices(devices) {
        const container = document.querySelector('.devices-container');
        container.innerHTML = '';

        devices.forEach(device => {
            const deviceCard = createDeviceCard(device);
            container.appendChild(deviceCard);
        });
    }

    function createDeviceCard(device) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-content">
                <div class="card-header">
                    <h3>${escapeHtml(device.name)}</h3>
                    <button class="status-btn status-${device.status ? 'online' : 'offline'}" 
                            onclick="toggleDeviceStatus(${device.id}, ${!device.status})">
                        ${device.status ? 'Вкл' : 'Выкл'}
                    </button>
                </div>
                <p>Прошивка: ${escapeHtml(device.firmware_version)}</p>
                <p>Подключено АКБ: ${device.batteries_count || 0} из 5</p>
                <div class="card-actions">
                    <button class="btn-edit" onclick="editDevice(${device.id})">Редактировать</button>
                    <button class="btn-delete" onclick="deleteDevice(${device.id})">Удалить</button>
                    <button class="btn-manage ${!device.status ? 'btn-disabled' : ''}" 
                            onclick="${device.status ? `manageDeviceBatteries(${device.id})` : ''}"
                            ${!device.status ? 'title="Включите устройство для управления АКБ"' : ''}>
                        Управление АКБ
                    </button>
                </div>
            </div>
        `;
        return card;
    }

    // РЕНДЕР АККУМУЛЯТОРОВ
    function renderBatteries(batteries) {
        const container = document.querySelector('.batteries-container');
        container.innerHTML = '';

        batteries.forEach(battery => {
            const batteryCard = createBatteryCard(battery);
            container.appendChild(batteryCard);
        });
    }

    function createBatteryCard(battery) {
        const chargeClass = getChargeClass(battery.capacity);
        
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-content">
                <h3>${escapeHtml(battery.name)}</h3>
                <p class="${chargeClass}">Остаточная емкость: ${battery.capacity || 0} Ач</p>
                <p>Напряжение: ${battery.voltage || 'N/A'}В</p>
                <p>Срок службы: ${battery.lifetime || 'N/A'} мес.</p>
                <div class="card-actions">
                    <button class="btn-edit" onclick="editBattery(${battery.id})">Редактировать</button>
                    <button class="btn-delete" onclick="deleteBattery(${battery.id})">Удалить</button>
                </div>
            </div>
        `;
        return card;
    }

    // ФУНКЦИИ УСТРОЙСТВ
    async function createDevice(data) {
        try {
            const response = await fetch(`/device/create_new`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                closeModal();
                loadDevices();
            } else {
                showError(result.error);
            }
        } catch (error) {
            showError('Ошибка сети: ' + error.message);
        }
    }

    async function updateDevice(id, data) {
        try {
            const response = await fetch(`/device/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                closeModal();
                loadDevices();
            } else {
                showError(result.error);
            }
        } catch (error) {
            showError('Ошибка сети: ' + error.message);
        }
    }

    async function toggleDeviceStatus(id, newStatus) {
        try {
            const response = await fetch(`/device/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            
            const result = await response.json();
            
            if (result.success) {
                loadDevices();
            } else {
                showError(result.error);
            }
        } catch (error) {
            showError('Ошибка сети: ' + error.message);
        }
    }

    async function deleteDevice(id) {
        if (!confirm('Удалить устройство?')) return;
        
        try {
            const response = await fetch(`/device/${id}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                loadDevices();
            } else {
                showError(result.error);
            }
        } catch (error) {
            showError('Ошибка сети: ' + error.message);
        }
    }

    function editDevice(id) {
        fetch(`/device/${id}`)
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    showDeviceForm(result.data);
                } else {
                    showError(result.error);
                }
            })
            .catch(error => showError('Ошибка сети: ' + error.message));
    }

    // ФУНКЦИИ ДЛЯ АКБ
    async function createBattery(data) {
        try {
            const response = await fetch(`/battery/create_new`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                closeModal();
                loadBatteries();
            } else {
                showError(result.error);
            }
        } catch (error) {
            showError('Ошибка сети: ' + error.message);
        }
    }

    async function updateBattery(id, data) {
        try {
            const response = await fetch(`/battery/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                closeModal();
                loadBatteries();
            } else {
                showError(result.error);
            }
        } catch (error) {
            showError('Ошибка сети: ' + error.message);
        }
    }

    async function deleteBattery(id) {
        if (!confirm('Удалить аккумулятор?')) return;
        
        try {
            const batteryResponse = await fetch(`/battery/${id}`);
            const batteryResult = await batteryResponse.json();
            
            if (!batteryResult.success) {
                showError('Не удалось получить информацию об аккумуляторе');
                return;
            }
            
            const battery = batteryResult.data;
            const connectedDeviceId = battery.device_id;

            const response = await fetch(`/battery/${id}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {

                if (connectedDeviceId) {
                    await reloadSingleDevice(connectedDeviceId);
                }

                loadBatteries();
                
            } else {
                showError(result.error);
            }
        } catch (error) {
            showError('Ошибка сети: ' + error.message);
        }
    }

    async function reloadSingleDevice(deviceId) {
        try {
            const response = await fetch(`/device/${deviceId}`);
            const result = await response.json();
            
            if (result.success) {
                const deviceCard = document.querySelector(`.devices-container .card .btn-manage[onclick="manageDeviceBatteries(${deviceId})"]`)?.closest('.card');
                if (deviceCard) {
                    const newDeviceCard = createDeviceCard(result.data);
                    deviceCard.replaceWith(newDeviceCard);
                }
            }
        } catch (error) {
            console.error('Error reloading device:', error);
        }
    }

    function editBattery(id) {
        fetch(`/battery/${id}`)
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    showBatteryForm(result.data);
                } else {
                    showError(result.error);
                }
            })
            .catch(error => showError('Ошибка сети: ' + error.message));
    }

    // ФУНКЦИИ ДЛЯ ПОДКЛЮЧЕНИЯ
    async function connectBattery(batteryId, deviceId) {
        try {
            const response = await fetch(`/device/${deviceId}/connect_battery/${batteryId}`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                closeModal();
                loadDevices();
                loadBatteries();
                setTimeout(() => {
                    manageDeviceBatteries(deviceId);
                }, 300);
            } else {
                showError(result.error);
            }
        } catch (error) {
            showError('Ошибка сети: ' + error.message);
        }
    }

    async function disconnectBattery(batteryId, deviceId) {
        if (!confirm('Отключить аккумулятор от устройства?')) return;
        
        try {
            const response = await fetch(`/device/${deviceId}/delete_battery/${batteryId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                closeModal();
                loadDevices();
                loadBatteries();
                setTimeout(() => {
                    manageDeviceBatteries(deviceId);
                }, 300);
                
            } else {
                showError(result.error);
            }
        } catch (error) {
            showError('Ошибка сети: ' + error.message);
        }
    }

    // ФОРМЫ
    function showDeviceForm(device = null) {
        const isEdit = !!device;
        const formHtml = `
            <div class="modal">
                <div class="modal-content">
                    <h3>${isEdit ? 'Редактировать' : 'Добавить'} устройство</h3>
                    <form id="deviceForm">
                        <input type="text" name="name" placeholder="Название устройства" 
                               value="${device ? escapeHtml(device.name) : ''}" required>
                        <input type="text" name="firmware_version" placeholder="Версия прошивки" 
                               value="${device ? escapeHtml(device.firmware_version) : ''}" required>
                        <div class="form-actions">
                            <button type="submit">${isEdit ? 'Обновить' : 'Создать'}</button>
                            <button type="button" onclick="closeModal()">Отмена</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', formHtml);
        
        const form = document.getElementById('deviceForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                firmware_version: formData.get('firmware_version')
            };

            if (isEdit) {
                updateDevice(device.id, data);
            } else {
                createDevice(data);
            }
        };
    }

    function showBatteryForm(battery = null) {
        const isEdit = !!battery;
        const formHtml = `
            <div class="modal">
                <div class="modal-content">
                    <h3>${isEdit ? 'Редактировать' : 'Добавить'} аккумулятор</h3>
                    <form id="batteryForm">
                        <input type="text" name="name" placeholder="Название аккумулятора" 
                            value="${battery ? escapeHtml(battery.name) : ''}" required>
                        <input type="number" step="0.1" name="voltage" placeholder="Напряжение (В)" 
                            value="${battery ? battery.voltage : ''}" required>  
                        <input type="number" step="0.1" name="capacity" placeholder="Емкость (Ач)" 
                            value="${battery ? battery.capacity : ''}" required>
                        <input type="number" name="lifetime" placeholder="Срок службы (мес.)" 
                            value="${battery ? battery.lifetime : ''}">
                        <div class="form-actions">
                            <button type="submit">${isEdit ? 'Обновить' : 'Создать'}</button>
                            <button type="button" onclick="closeModal()">Отмена</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', formHtml);
        
        const form = document.getElementById('batteryForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                voltage: formData.get('voltage') ? parseFloat(formData.get('voltage')) : null,
                capacity: formData.get('capacity') ? parseFloat(formData.get('capacity')) : null,
                lifetime: formData.get('lifetime') ? parseInt(formData.get('lifetime')) : null
            };

            if (!data.voltage || !data.capacity) {
                alert('Поля "Напряжение" и "Емкость" обязательны для заполнения');
                return;
            }

            if (isEdit) {
                updateBattery(battery.id, data);
            } else {
                createBattery(data);
            }
        };
    }

    function escapeHtml(unsafe) {
        return unsafe ? unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;") : '';
    }

    function getChargeClass(capacity) {
        if (capacity >= 70) return 'charge-high';
        if (capacity >= 30) return 'charge-medium';
        return 'charge-low';
    }

    function showError(message) {
        alert('Ошибка: ' + message);
    }

    function closeModal() {
        const modal = document.querySelector('.modal');
        if (modal) modal.remove();
    }

    function manageDeviceBatteries(deviceId) {

        fetch(`/device/${deviceId}`)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(deviceResult => {
                if (!deviceResult.success) {
                    throw new Error(deviceResult.error || 'Failed to load device');
                }

                return fetch(`/battery`)
                    .then(response => {
                        if (!response.ok) throw new Error('Network response was not ok');
                        return response.json();
                    })
                    .then(batteriesResult => {
                        if (!batteriesResult.success) {
                            throw new Error(batteriesResult.error || 'Failed to load batteries');
                        }
                        
                        showDeviceBatteriesManagement(deviceResult.data, batteriesResult);
                    });
            })
            .catch(error => {
                console.error('Error in manageDeviceBatteries:', error);
                showError('Ошибка загрузки данных: ' + error.message);
            });
    }

    function showDeviceBatteriesManagement(device, batteriesResponse) {
        const connectedBatteries = Array.isArray(device.batteries) ? device.batteries : [];
        const allBatteries = Array.isArray(batteriesResponse.data) ? batteriesResponse.data : [];
        
        const freeBatteries = allBatteries.filter(battery => 
            battery && !battery.device_id
        );

        const formHtml = `
            <div class="modal">
                <div class="modal-content large-modal scrollable-modal">
                    <h3>${escapeHtml(device.name)}</h3>
                    
                    <div class="connected-batteries">
                        <h4>Подключенные АКБ (${connectedBatteries.length}/5)</h4>
                        <div class="batteries-list">
                            ${connectedBatteries.length > 0 ? 
                                connectedBatteries.map(battery => {
                                    if (!battery) return '';
                                    const history = battery.capacity_history || [];
                                    return `
                                        <div class="battery-item connected">
                                            <div class="battery-info">
                                                <strong>${escapeHtml(battery.name || 'Unnamed')}</strong>
                                                <div class="battery-details">
                                                    <span>Текущая емкость: ${battery.capacity || 0} Ач</span>
                                                    <span>Напряжение: ${battery.voltage || 'N/A'}В</span>
                                                    <span>Срок службы: ${battery.lifetime || 'N/A'} мес.</span>
                                                </div>
                                                
                                                <!-- ИСТОРИЯ ИЗМЕНЕНИЙ -->
                                                <div class="capacity-history">
                                                    <strong>История изменений:</strong>
                                                        ${history.length > 0 ? 
                                                            history.map(item => `
                                                                <div class="history-item">
                                                                    ${item.capacity} Ач (${new Date(item.timestamp).toLocaleDateString()} ${new Date(item.timestamp).toLocaleTimeString()})
                                                                </div>
                                                            `).join('') 
                                                            : '<div class="no-history">Нет данных истории</div>'
                                                        }
                                                </div>
                                            </div>
                                            <button class="btn-disconnect" onclick="disconnectBattery(${battery.id}, ${device.id})">Отключить</button>
                                        </div>
                                    `;
                                }).join('') : 
                                '<p class="no-batteries">Нет подключенных АКБ</p>'
                            }
                        </div>
                    </div>

                    ${freeBatteries.length > 0 && connectedBatteries.length < 5 ? `
                        <div class="available-batteries">
                            <h4>Доступные для подключения АКБ (${freeBatteries.length})</h4>
                            <form id="connectBatteryForm">
                                <select name="battery_id" required>
                                    <option value="">Выберите АКБ для подключения</option>
                                    ${freeBatteries.map(battery => `
                                        <option value="${battery.id}">
                                            ${escapeHtml(battery.name || 'Unnamed')} 
                                            (${battery.capacity || 0} Ач, ${battery.voltage || 'N/A'}В)
                                        </option>
                                    `).join('')}
                                </select>
                                <div class="form-actions">
                                    <button type="submit">Подключить выбранный АКБ</button>
                                </div>
                            </form>
                        </div>
                    ` : freeBatteries.length === 0 ? 
                        '<p class="no-batteries">Нет доступных АКБ для подключения</p>' : ''}

                    <div class="form-actions">
                        <button type="button" onclick="closeModal()">Закрыть</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', formHtml);
        
        const form = document.getElementById('connectBatteryForm');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const batteryId = parseInt(formData.get('battery_id'));
                
                if (batteryId) {
                    connectBattery(batteryId, device.id);
                }
            };
        }
    }

    function setupEventListeners() {
        document.querySelectorAll('.add-button').forEach(button => {
            const section = button.closest('.section');
            const title = section.querySelector('.section-title').textContent;
            
            button.onclick = () => {
                if (title.includes('Устройства')) {
                    showDeviceForm();
                } else {
                    showBatteryForm();
                }
            };
        });
    }

    window.editDevice = editDevice;
    window.deleteDevice = deleteDevice;
    window.editBattery = editBattery;
    window.deleteBattery = deleteBattery;
    window.closeModal = closeModal;
    window.disconnectBattery = disconnectBattery;
    window.manageDeviceBatteries = manageDeviceBatteries;
    window.toggleDeviceStatus = toggleDeviceStatus;

    loadDevices();
    loadBatteries();
    setupEventListeners();
});