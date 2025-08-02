const { getFishingRecords, getHistoryRecords, saveFishingRecords, saveHistoryRecords, loadDetailRecord } = require("./script");

// 完成回鱼
export function completeFishing(seatNumber) {
    wx.showModal({
        title: '确认',
        content: '确定要完成该回鱼记录吗？完成后将移至历史记录。',
        success: res => {
            if (res.confirm) {
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

                    wx.showToast({
                        title: '回鱼记录已完成并移至历史记录',
                        icon: 'success'
                    });
                    wx.navigateTo({
                        url: '/pages/index/index'
                    });
                }
            }
        }
    });



    // 更新垂钓时长
    function updateFishingHours(seatNumber, newHours) {


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
        // 在微信小程序中，应通过this.data获取输入值
        // const weight = parseFloat(this.data.fishWeight);
        const weight = parseFloat(document.getElementById('fishWeight').value);

        if (isNaN(weight) || weight <= 0) {
            wx.showToast({
                title: '请输入有效的重量',
                icon: 'none'
            });
            return;
        }

        // 获取记录
        let records = JSON.parse(wx.getStorageSync('fishingRecords')) || {};
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
        // 在微信小程序中，应通过this.data获取输入值
        // const itemName = this.data.itemName;
        // const itemAmount = parseFloat(this.data.itemAmount);
        const itemName = document.getElementById('itemName').value;
        const itemAmount = parseFloat(document.getElementById('itemAmount').value);

        if (!itemName || isNaN(itemAmount) || itemAmount <= 0) {
            wx.showToast({
                title: '请输入有效的物品名称和金额',
                icon: 'none'
            });
            return;
        }

        // 获取记录
        let records = JSON.parse(wx.getStorageSync('fishingRecords')) || {};
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
}
