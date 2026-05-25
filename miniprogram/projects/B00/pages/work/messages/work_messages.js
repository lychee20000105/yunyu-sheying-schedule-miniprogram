const cloudHelper = require('../../../../../helper/cloud_helper.js');
const ProjectBiz = require('../../../biz/project_biz.js');

Page({
	data: { list: [] },
	onLoad: function () {
		ProjectBiz.initPage(this, { isLoadSkin: true });
	},
	onShow: async function () {
		await this._loadList();
	},
	onPullDownRefresh: async function () {
		await this._loadList();
		wx.stopPullDownRefresh();
	},
	_loadList: async function () {
		let list = await cloudHelper.callCloudData('work/messages', {}, { title: 'bar' });
		this.setData({ list: list || [] });
	},
});
