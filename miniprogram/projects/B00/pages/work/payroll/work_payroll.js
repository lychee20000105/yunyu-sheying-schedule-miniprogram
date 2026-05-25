const cloudHelper = require('../../../../../helper/cloud_helper.js');
const ProjectBiz = require('../../../biz/project_biz.js');

Page({
	data: {
		month: '',
		data: null,
	},
	onLoad: function () {
		ProjectBiz.initPage(this, { isLoadSkin: true });
		let d = new Date();
		this.setData({ month: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` });
	},
	onShow: async function () {
		await this._loadData();
	},
	onPullDownRefresh: async function () {
		await this._loadData();
		wx.stopPullDownRefresh();
	},
	bindMonthChange: async function (e) {
		this.setData({ month: e.detail.value });
		await this._loadData();
	},
	_loadData: async function () {
		let data = await cloudHelper.callCloudData('work/my_payroll', { month: this.data.month }, { title: 'bar' });
		this.setData({ data });
	},
});
