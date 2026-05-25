const cloudHelper = require('../../../../../helper/cloud_helper.js');
const pageHelper = require('../../../../../helper/page_helper.js');
const lunarLib = require('../../../../../lib/tools/lunar_lib.js');
const ProjectBiz = require('../../../biz/project_biz.js');

Page({
	data: {
		isLoad: false,
		month: '',
		day: '',
		scope: 'all',
		days: [],
		dayMap: {},
		dayData: null,
		options: null,
	},

	onLoad: async function () {
		ProjectBiz.initPage(this, { isLoadSkin: true });
		let today = this._today();
		this.setData({
			month: today.substr(0, 7),
			day: today,
		});
	},

	onShow: async function () {
		let ok = await this._loadOptions();
		if (!ok) return;
		await this._loadCalendar();
		await this._loadDay();
	},

	onPullDownRefresh: async function () {
		await this._loadCalendar();
		await this._loadDay();
		wx.stopPullDownRefresh();
	},

	_today() {
		let d = new Date();
		return this._fmtDate(d);
	},

	_fmtDate(d) {
		let y = d.getFullYear();
		let m = String(d.getMonth() + 1).padStart(2, '0');
		let day = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	},

	_loadOptions: async function () {
		let opts = { title: 'bar' };
		let options = await cloudHelper.callCloudData('work/options', {}, opts);
		if (options) {
			options.staffInitial = options.staff && options.staff.STAFF_NAME ? options.staff.STAFF_NAME.substr(0, 1) : '云';
			this.setData({ options });
			if (!options.staff) {
				wx.switchTab({ url: '/projects/B00/pages/work/my/work_my' });
				return false;
			}
		}
		return true;
	},

	_loadCalendar: async function () {
		let opts = { title: this.data.isLoad ? 'bar' : '加载中' };
		let params = {
			month: this.data.month,
			scope: this.data.scope,
		};
		try {
			let data = await cloudHelper.callCloudData('work/calendar', params, opts);
			if (!data) return;
			this.setData({
				dayMap: data.days || {},
				days: this._buildDays(this.data.month, data.days || {}),
				isLoad: true,
			});
		} catch (err) {
			console.error(err);
		}
	},

	_loadDay: async function () {
		let opts = { title: 'bar' };
		let params = {
			day: this.data.day,
			scope: this.data.scope,
		};
		let data = await cloudHelper.callCloudData('work/day_list', params, opts);
		this.setData({
			dayData: data || { orders: [], items: [], rests: [] },
		});
	},

	_buildDays(month, dayMap) {
		let arr = month.split('-');
		let y = Number(arr[0]);
		let m = Number(arr[1]);
		let first = new Date(y, m - 1, 1);
		let startOffset = first.getDay();
		let start = new Date(y, m - 1, 1 - startOffset);
		let today = this._today();
		let list = [];
		for (let i = 0; i < 42; i++) {
			let d = new Date(start);
			d.setDate(start.getDate() + i);
			let date = this._fmtDate(d);
			let lunar = '';
			try {
				lunar = lunarLib.sloarToLunar(d.getFullYear(), d.getMonth() + 1, d.getDate());
			} catch (e) {}
			list.push({
				date,
				day: d.getDate(),
				lunar,
				isCurMonth: d.getMonth() + 1 == m,
				isToday: date == today,
				isSelect: date == this.data.day,
				tags: dayMap[date] || [],
			});
		}
		return list;
	},

	bindDayTap: async function (e) {
		let day = e.currentTarget.dataset.day;
		this.setData({
			day,
			days: this.data.days.map(item => Object.assign(item, { isSelect: item.date == day })),
		});
		await this._loadDay();
	},

	bindPrevMonthTap: async function () {
		await this._changeMonth(-1);
	},

	bindNextMonthTap: async function () {
		await this._changeMonth(1);
	},

	bindTodayTap: async function () {
		let today = this._today();
		this.setData({
			month: today.substr(0, 7),
			day: today,
		});
		await this._loadCalendar();
		await this._loadDay();
	},

	_changeMonth: async function (step) {
		let arr = this.data.month.split('-');
		let d = new Date(Number(arr[0]), Number(arr[1]) - 1 + step, 1);
		let month = this._fmtDate(d).substr(0, 7);
		this.setData({
			month,
			day: month + '-01',
		});
		await this._loadCalendar();
		await this._loadDay();
	},

	bindScopeTap: async function (e) {
		let scope = e.currentTarget.dataset.scope;
		this.setData({ scope });
		await this._loadCalendar();
		await this._loadDay();
	},

	bindOrderTap: function (e) {
		let id = e.currentTarget.dataset.id;
		let full = e.currentTarget.dataset.full === true || e.currentTarget.dataset.full === 'true';
		if (!full) return pageHelper.showModal('你不是该订单参与人，仅可查看脱敏档期');
		wx.navigateTo({
			url: '../order_edit/work_order_edit?id=' + id,
		});
	},

	bindAddTap: function () {
		wx.setStorageSync('WORK_ADD_DAY', this.data.day || '');
		wx.switchTab({
			url: '/projects/B00/pages/work/add/work_add',
			fail: err => {
				console.error(err);
				pageHelper.showModal((err && err.errMsg) || '打开新增页面失败');
			},
		});
	},

	url: function (e) {
		pageHelper.url(e, this);
	},
});
