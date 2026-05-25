const cloudHelper = require('../../../../../helper/cloud_helper.js');
const pageHelper = require('../../../../../helper/page_helper.js');
const ProjectBiz = require('../../../biz/project_biz.js');

Page({
	data: {
		type: 'all',
		list: [],
	},
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
		let list = await cloudHelper.callCloudData('work/note_list', { type: this.data.type }, { title: 'bar' });
		this.setData({ list: list || [] });
	},
	bindTypeTap: async function (e) {
		this.setData({ type: e.currentTarget.dataset.type });
		await this._loadList();
	},
	url: function (e) {
		pageHelper.url(e, this);
	},
});
