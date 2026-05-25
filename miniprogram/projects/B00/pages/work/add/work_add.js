const pageHelper = require('../../../../../helper/page_helper.js');
const ProjectBiz = require('../../../biz/project_biz.js');

Page({
	data: {
		day: '',
	},
	onLoad: function (options) {
		ProjectBiz.initPage(this, { isLoadSkin: true });
		this.setData({ day: options.day || '' });
	},
	onShow: function () {
		let day = wx.getStorageSync('WORK_ADD_DAY') || '';
		if (day) this.setData({ day });
	},
	url: function (e) {
		pageHelper.url(e, this);
	},
});
