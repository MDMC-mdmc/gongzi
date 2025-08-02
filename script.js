document.addEventListener('DOMContentLoaded', function() {
    // 检查当前页面
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'index.html') {
        // 初始化主页
        initIndexPage();
    } else if (currentPage === 'detail.html') {
        // 初始化详情页
        initDetailPage();
    }
});

// 获取垂钓记录
function getFishingRecords() {
    return JSON.parse(localStorage.getItem('fishingRecords')) || {};
}

// 获取历史记录
function getHistoryRecords() {
    return JSON.parse(localStorage.getItem('historyRecords')) || {};
}

// 保存垂钓记录
function saveFishingRecords(records) {
    localStorage.setItem('fishingRecords', JSON.stringify(records));
}

// 保存历史记录
function saveHistoryRecords(records) {
    localStorage.setItem('historyRecords', JSON.stringify(records));
}

// 初始化页面
function initIndexPage() {
    // 加载已保存的垂钓记录
    loadFishingRecords();

    // 表单提交事件
    document.getElementById('fishingForm').addEventListener('submit', function(e) {
        e.preventDefault();
        createFishingRecord();
    });

    // 查看历史记录按钮事件
    const viewHistoryBtn = document.getElementById('viewHistoryBtn');
    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', function() {
            const historyContainer = document.getElementById('historyContainer');
            if (historyContainer.classList.contains('d-none')) {
                loadHistoryRecords();
                historyContainer.classList.remove('d-none');
                viewHistoryBtn.textContent = '隐藏历史回鱼记录';
            } else {
                historyContainer.classList.add('d-none');
                viewHistoryBtn.textContent = '查看历史回鱼记录';
            }
        });
    }
}

// 初始化详情页
function initDetailPage() {
    // 获取URL参数中的座位号
    const urlParams = new URLSearchParams(window.location.search);
    const seatNumber = urlParams.get('seat');
    const isHistory = urlParams.get('history') === 'true';

    // 完成回鱼按钮事件
    const btnComplete = document.getElementById('btnComplete');
    if (btnComplete) {
        // 如果是历史记录，隐藏完成回鱼按钮
        if (isHistory) {
            btnComplete.style.display = 'none';
        }

        btnComplete.addEventListener('click', function() {
            completeFishing(seatNumber);
        });
    }

    if (seatNumber) {
        // 加载该座位的详情
        loadDetailRecord(seatNumber);
    }

    // 返回按钮事件
    document.getElementById('btnBack').addEventListener('click', function() {
        window.location.href = 'index.html';
    });

    // 添加回鱼重量按钮事件
    document.getElementById('addWeight').addEventListener('click', function() {
        addFishWeight(seatNumber);
    });

    // 添加其他物品按钮事件
    document.getElementById('addItem').addEventListener('click', function() {
        addOtherItem(seatNumber);
    });
}

// 创建垂钓记录
function createFishingRecord() {
    const seatNumber = document.getElementById('seatNumber').value;
    const startTime = document.getElementById('startTime').value;
    // 确保垂钓时长按每小时计算
    const fishingHours = Math.ceil(parseFloat(document.getElementById('fishingHours').value));

    // 计算结束时间
    const start = new Date(startTime);
    const end = new Date(start.getTime() + fishingHours * 60 * 60 * 1000);
    // 使用本地时间格式而非UTC时间
    const year = end.getFullYear();
    const month = String(end.getMonth() + 1).padStart(2, '0');
    const day = String(end.getDate()).padStart(2, '0');
    const hours = String(end.getHours()).padStart(2, '0');
    const minutes = String(end.getMinutes()).padStart(2, '0');
    const endTime = `${year}-${month}-${day}T${hours}:${minutes}`;

    // 获取现有记录
    let records = getFishingRecords();

    // 检查座位是否已被占用
    if (records[seatNumber]) {
        alert('该座位已被占用，请选择其他座位');
        return;
    }

    // 创建新记录
    records[seatNumber] = {
        startTime: startTime,
        endTime: endTime,
        fishingHours: fishingHours,
        fishWeights: [],
        otherItems: []
    };

    // 保存记录
    saveFishingRecords(records);

    // 更新座位显示
    loadFishingRecords();

    // 重置表单
    document.getElementById('fishingForm').reset();
}

// 加载历史回鱼记录
function loadHistoryRecords() {
    const historyContainer = document.getElementById('historyContainer');
    historyContainer.innerHTML = '';

    // 获取历史记录
    const historyRecords = getHistoryRecords();

    // 生成历史记录卡片
    for (const seatNumber in historyRecords) {
        const record = historyRecords[seatNumber];
        const start = new Date(record.startTime);
        const end = new Date(record.endTime);
        const complete = new Date(record.completeTime);

        const card = document.createElement('div');
        card.className = 'seat-card bg-secondary bg-opacity-20 relative';
        card.innerHTML = `
            <button class="delete-btn" data-seat="${seatNumber}">×</button>
            <div class="seat-number">座位 ${seatNumber}</div>
            <div class="seat-status">开始: ${formatDateTime(start)}</div>
            <div class="seat-status">结束: ${formatDateTime(end)}</div>
            <div class="seat-status">完成: ${formatDateTime(complete)}</div>
        `;

        // 点击卡片查看历史详情
        card.addEventListener('click', function() {
            window.location.href = `detail.html?seat=${seatNumber}&history=true`;
        });

        // 删除按钮点击事件
        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // 防止触发卡片的点击事件
            if (confirm('确定要删除该历史记录吗？')) {
                delete historyRecords[seatNumber];
                saveHistoryRecords(historyRecords);
                loadHistoryRecords(); // 重新加载历史记录
            }
        });

        historyContainer.appendChild(card);
    }

    // 如果没有历史记录，显示提示
    if (Object.keys(historyRecords).length === 0) {
        historyContainer.innerHTML = '<p class="text-center text-muted">暂无历史回鱼记录</p>';
    }
}

// 加载垂钓记录
function loadFishingRecords() {
    const seatContainer = document.getElementById('seatContainer');
    seatContainer.innerHTML = '';

    // 获取记录
    const records = getFishingRecords();

    // 生成座位卡片
    for (const seatNumber in records) {
        const record = records[seatNumber];
        const start = new Date(record.startTime);
        const end = new Date(record.endTime);
        const now = new Date();

        let status = '进行中';
        let isEnded = false;
        if (now > end) {
            status = '已结束';
            isEnded = true;
        }

        const card = document.createElement('div');
        card.className = 'seat-card' + (isEnded ? ' end-seat' : '');
        card.innerHTML = `
            <button class="delete-btn" data-seat="${seatNumber}">×</button>
            <div class="seat-number">座位 ${seatNumber}</div>
            <div class="seat-status">状态: ${status}</div>
            <div class="seat-status">开始: ${formatDateTime(start)}</div>
            <div class="seat-status">结束: ${formatDateTime(end)}</div>
        `;

        // 点击卡片查看详情
        card.addEventListener('click', function() {
            window.location.href = `detail.html?seat=${seatNumber}`;
        });

        // 长按事件 - 显示删除按钮
        let pressTimer;
        let deleteBtn = card.querySelector('.delete-btn');

        // 开始计时
        card.addEventListener('mousedown', function() {
            pressTimer = setTimeout(function() {
                deleteBtn.style.display = 'block';
            }, 5000); // 5秒后显示删除按钮
        });

        // 移动或释放鼠标时取消计时器
        card.addEventListener('mousemove', function() {
            clearTimeout(pressTimer);
        });

        card.addEventListener('mouseup', function() {
            clearTimeout(pressTimer);
        });

        // 鼠标离开卡片时隐藏删除按钮
        card.addEventListener('mouseleave', function() {
            deleteBtn.style.display = 'none';
        });

        // 删除按钮点击事件
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // 防止触发卡片的点击事件
            if (confirm('确定要删除该垂钓记录吗？')) {
                delete records[seatNumber];
                saveFishingRecords(records);
                loadFishingRecords();
            }
            deleteBtn.style.display = 'none';
        });

        seatContainer.appendChild(card);
    }

    // 如果没有记录，显示提示
    if (Object.keys(records).length === 0) {
        seatContainer.innerHTML = '<p class="text-center text-muted">暂无垂钓记录</p>';
    }
}

// 修改座位号
function updateSeatNumber(oldSeatNumber, newSeatNumber) {
    // 检查新座位号是否已被占用
    const records = getFishingRecords();
    if (records[newSeatNumber]) {
        alert('新座位号已被占用，请选择其他座位号');
        return false;
    }

    // 更新记录中的座位号
    const record = records[oldSeatNumber];
    records[newSeatNumber] = record;
    delete records[oldSeatNumber];

    // 保存修改后的记录
    saveFishingRecords(records);
    return true;
}

// 加载详情记录
function loadDetailRecord(seatNumber) {
    // 获取URL参数中的history标志
    const urlParams = new URLSearchParams(window.location.search);
    const isHistory = urlParams.get('history') === 'true';

    // 根据是否为历史记录选择不同的数据源
    const storageKey = isHistory ? 'historyRecords' : 'fishingRecords';
    const records = JSON.parse(localStorage.getItem(storageKey)) || {};
    const record = records[seatNumber];

    if (!record) {
        alert('未找到该座位的记录');
        window.location.href = 'index.html';
        return;
    }

    // 显示详情
    document.getElementById('detailSeatNumber').textContent = seatNumber;

    // 座位号修改功能
    const editSeatNumberBtn = document.getElementById('editSeatNumberBtn');
    const seatNumberEditContainer = document.getElementById('seatNumberEditContainer');
    const newSeatNumberInput = document.getElementById('newSeatNumber');
    const confirmSeatChangeBtn = document.getElementById('confirmSeatChangeBtn');
    const cancelSeatChangeBtn = document.getElementById('cancelSeatChangeBtn');

    // 点击修改按钮显示输入框
    editSeatNumberBtn.addEventListener('click', function() {
        seatNumberEditContainer.classList.remove('d-none');
        newSeatNumberInput.value = seatNumber;
    });

    // 取消修改
    cancelSeatChangeBtn.addEventListener('click', function() {
        seatNumberEditContainer.classList.add('d-none');
    });

    // 确认修改
    confirmSeatChangeBtn.addEventListener('click', function() {
        const newSeatNumber = newSeatNumberInput.value.trim();
        if (!newSeatNumber || isNaN(newSeatNumber) || parseInt(newSeatNumber) <= 0) {
            alert('请输入有效的座位号');
            return;
        }

        if (newSeatNumber === seatNumber) {
            alert('新座位号与原座位号相同');
            return;
        }

        if (updateSeatNumber(seatNumber, newSeatNumber)) {
            alert('座位号修改成功');
            window.location.href = `detail.html?seat=${newSeatNumber}`;
        }
    });
    document.getElementById('detailStartTime').textContent = formatDateTime(new Date(record.startTime));
    document.getElementById('detailEndTime').textContent = formatDateTime(new Date(record.endTime));
    document.getElementById('detailFishingHours').textContent = record.fishingHours + ' 小时';

    // 设置输入框的初始值
    document.getElementById('startTimeInput').value = record.startTime;
    document.getElementById('endTimeInput').value = record.endTime;
    document.getElementById('fishingHoursInput').value = record.fishingHours;

    // 实现时间可编辑功能
    initEditableTime(seatNumber, record);

    // 显示回鱼重量
    const weightList = document.getElementById('weightList');
    weightList.innerHTML = '';

    // 显示回鱼重量并添加删除按钮
    if (record.fishWeights.length === 0) {
        weightList.innerHTML = '<p class="text-center text-muted">暂无回鱼记录</p>';
    } else {
        record.fishWeights.forEach(function(weight, index) {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            listItem.innerHTML = `
                <span>重量 ${index + 1}</span>
                <div class="d-flex align-items-center">
                    <span class="badge bg-primary rounded-pill me-2">${weight} 斤</span>
                    <button class="btn btn-danger btn-sm delete-weight" data-index="${index}">删除</button>
                </div>
            `;
            weightList.appendChild(listItem);
        });

        // 添加删除按钮事件监听
        document.querySelectorAll('.delete-weight').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                record.fishWeights.splice(index, 1);
                localStorage.setItem('fishingRecords', JSON.stringify(records));
                loadDetailRecord(seatNumber);
            });
        });
    }

    // 计算并显示总重量
    const totalWeight = record.fishWeights.reduce((sum, weight) => sum + weight, 0);
    document.getElementById('totalWeight').textContent = totalWeight.toFixed(1) + ' 斤';

    // 计算并显示回鱼金额 (总重量 * 5)
    const fishAmount = totalWeight * 5;
    document.getElementById('fishAmount').textContent = fishAmount.toFixed(2) + ' 元';

    // 计算并显示总金额
    let totalAmount = record.otherItems.reduce((sum, item) => sum + item.amount, 0);
    document.getElementById('totalAmount').textContent = totalAmount.toFixed(2) + ' 元';

    // 计算并显示需支付金额 (回鱼金额 - 总金额)
    const payableAmount = fishAmount - totalAmount;
    document.getElementById('payableAmount').textContent = payableAmount.toFixed(2) + ' 元';

    // 显示其他物品
    const itemList = document.getElementById('itemList');
    itemList.innerHTML = '';

    // 显示其他物品并添加删除按钮
    if (record.otherItems.length === 0) {
        itemList.innerHTML = '<p class="text-center text-muted">暂无其他物品记录</p>';
    } else {
        record.otherItems.forEach(function(item, index) {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            listItem.innerHTML = `
                <span>${item.name}</span>
                <div class="d-flex align-items-center">
                    <span class="badge bg-primary rounded-pill me-2">${item.amount} 元</span>
                    <button class="btn btn-danger btn-sm delete-item" data-index="${index}">删除</button>
                </div>
            `;
            itemList.appendChild(listItem);
        });

        // 添加删除按钮事件监听
        document.querySelectorAll('.delete-item').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                record.otherItems.splice(index, 1);
                saveFishingRecords(records);
                loadDetailRecord(seatNumber);
            });
        });
    }


}

// 初始化可编辑时间功能
function initEditableTime(seatNumber, record) {
    const records = JSON.parse(localStorage.getItem('fishingRecords')) || {};

    // 开始时间编辑
    const detailStartTime = document.getElementById('detailStartTime');
    const startTimeInput = document.getElementById('startTimeInput');

    detailStartTime.addEventListener('click', function() {
        detailStartTime.classList.add('d-none');
        startTimeInput.classList.remove('d-none');
        startTimeInput.focus();
    });

    startTimeInput.addEventListener('blur', function() {
        updateStartTime(seatNumber, startTimeInput.value);
    });

    startTimeInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            updateStartTime(seatNumber, startTimeInput.value);
        }
    });

    // 结束时间编辑
    const detailEndTime = document.getElementById('detailEndTime');
    const endTimeInput = document.getElementById('endTimeInput');

    detailEndTime.addEventListener('click', function() {
        detailEndTime.classList.add('d-none');
        endTimeInput.classList.remove('d-none');
        endTimeInput.focus();
    });

    endTimeInput.addEventListener('blur', function() {
        updateEndTime(seatNumber, endTimeInput.value);
    });

    endTimeInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            updateEndTime(seatNumber, endTimeInput.value);
        }
    });

    // 垂钓时长编辑
    const detailFishingHours = document.getElementById('detailFishingHours');
    const fishingHoursInput = document.getElementById('fishingHoursInput');

    detailFishingHours.addEventListener('click', function() {
        detailFishingHours.classList.add('d-none');
        fishingHoursInput.classList.remove('d-none');
        fishingHoursInput.focus();
    });

    fishingHoursInput.addEventListener('blur', function() {
        updateFishingHours(seatNumber, fishingHoursInput.value);
    });

    fishingHoursInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            updateFishingHours(seatNumber, fishingHoursInput.value);
        }
    });
}

// 更新开始时间
function updateStartTime(seatNumber, newStartTime) {
    const records = JSON.parse(localStorage.getItem('fishingRecords')) || {};
    const record = records[seatNumber];

    if (!record) return;

    record.startTime = newStartTime;
    // 重新计算结束时间
    const start = new Date(newStartTime);
    const end = new Date(start.getTime() + record.fishingHours * 60 * 60 * 1000);
    // 使用本地时间格式而非UTC时间
    const year = end.getFullYear();
    const month = String(end.getMonth() + 1).padStart(2, '0');
    const day = String(end.getDate()).padStart(2, '0');
    const hours = String(end.getHours()).padStart(2, '0');
    const minutes = String(end.getMinutes()).padStart(2, '0');
    record.endTime = `${year}-${month}-${day}T${hours}:${minutes}`;

    saveFishingRecords(records);
    loadDetailRecord(seatNumber);
}

// 更新结束时间
function updateEndTime(seatNumber, newEndTime) {
    const records = JSON.parse(localStorage.getItem('fishingRecords')) || {};
    const record = records[seatNumber];

    if (!record) return;

    record.endTime = newEndTime;
    // 重新计算垂钓时长（按每小时计算，不足1小时按1小时计算）
    const start = new Date(record.startTime);
    const end = new Date(newEndTime);
    const hours = (end - start) / (1000 * 60 * 60);
    record.fishingHours = Math.ceil(hours); // 向上取整到整数小时

    saveFishingRecords(records);
    loadDetailRecord(seatNumber);
}

// 完成回鱼
function completeFishing(seatNumber) {
    if (confirm('确定要完成该回鱼记录吗？完成后将移至历史记录。')) {
        // 获取当前记录和历史记录
        let records = getFishingRecords();
        let historyRecords = getHistoryRecords();

        // 将当前记录移到历史记录
        if (records[seatNumber]) {
            // 添加完成时间
            records[seatNumber].completeTime = new Date().toISOString();
            historyRecords[seatNumber] = records[seatNumber];
            delete records[seatNumber];

            // 保存更新后的记录
            saveFishingRecords(records);
            saveHistoryRecords(historyRecords);

            alert('回鱼记录已完成并移至历史记录');
            window.location.href = 'index.html';
        }
    }
}

// 更新垂钓时长
function updateFishingHours(seatNumber, newHours) {
    const records = JSON.parse(localStorage.getItem('fishingRecords')) || {};
    const record = records[seatNumber];

    if (!record || isNaN(newHours) || newHours <= 0) return;

    // 确保垂钓时长按每小时计算
    record.fishingHours = Math.ceil(parseFloat(newHours));
    // 重新计算结束时间
    const start = new Date(record.startTime);
    const end = new Date(start.getTime() + record.fishingHours * 60 * 60 * 1000);
    record.endTime = end.toISOString().slice(0, 16);

    saveFishingRecords(records);
    loadDetailRecord(seatNumber);
}

// 添加回鱼重量
function addFishWeight(seatNumber) {
    const weight = parseFloat(document.getElementById('fishWeight').value);

    if (isNaN(weight) || weight <= 0) {
        alert('请输入有效的重量');
        return;
    }

    // 获取记录
    let records = JSON.parse(localStorage.getItem('fishingRecords')) || {};
    const record = records[seatNumber];

    if (!record) {
        alert('未找到该座位的记录');
        return;
    }

    // 添加重量
    record.fishWeights.push(weight);

    // 保存记录
    saveFishingRecords(records);

    // 更新显示
    loadDetailRecord(seatNumber);

    // 重置输入
    document.getElementById('fishWeight').value = '';
}

// 添加其他物品
function addOtherItem(seatNumber) {
    const itemName = document.getElementById('itemName').value;
    const itemAmount = parseFloat(document.getElementById('itemAmount').value);

    if (!itemName || isNaN(itemAmount) || itemAmount <= 0) {
        alert('请输入有效的物品名称和金额');
        return;
    }

    // 获取记录
    let records = JSON.parse(localStorage.getItem('fishingRecords')) || {};
    const record = records[seatNumber];

    if (!record) {
        alert('未找到该座位的记录');
        return;
    }

    // 添加物品
    record.otherItems.push({
        name: itemName,
        amount: itemAmount
    });

    // 保存记录
    saveFishingRecords(records);

    // 更新显示
    loadDetailRecord(seatNumber);

    // 重置输入
    document.getElementById('itemName').value = '';
    document.getElementById('itemAmount').value = '';
}

// 格式化日期时间
function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}