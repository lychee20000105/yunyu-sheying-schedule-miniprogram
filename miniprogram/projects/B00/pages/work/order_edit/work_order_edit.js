const cloudHelper = require('../../../../../helper/cloud_helper.js');
const pageHelper = require('../../../../../helper/page_helper.js');
const contentCheckHelper = require('../../../../../helper/content_check_helper.js');
const ProjectBiz = require('../../../biz/project_biz.js');

Page({
	data: {
		id: '',
		isSaving: false,
		options: null,
		imgList: [],
		order: {
			ORDER_DATE: '',
			ORDER_TIME: '',
			ORDER_END_TIME: '',
			ORDER_TYPE_ID: '',
			ORDER_TYPE_NAME: '其他',
			ORDER_TYPE_COLOR: '#49cdbf',
			ORDER_PROGRESS: 10,
			ORDER_CUSTOMER_NAME: '',
			ORDER_CUSTOMER_MOBILE: '',
			ORDER_SOURCE: '',
			ORDER_CONTENT: '',
			ORDER_PLACE: '',
			ORDER_IS_OLD_CUSTOMER: 0,
			ORDER_AMOUNT: '',
			ORDER_DEPOSIT: '',
			ORDER_FINAL: '',
			ORDER_EXTRA: '',
			ORDER_PARTICIPANTS: [],
			ORDER_ATTACHMENTS: [],
		},
	},

	onLoad: async function (options) {
		ProjectBiz.initPage(this, { isLoadSkin: true });
		let id = options.id || '';
		this.setData({ id });
		await this._loadOptions();
		if (id) await this._loadDetail();
		else {
			let today = this._today();
			this.setData({
				'order.ORDER_DATE': options.day || today,
			});
		}
	},

	_today() {
		let d = new Date();
		let y = d.getFullYear();
		let m = String(d.getMonth() + 1).padStart(2, '0');
		let day = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	},

	_loadOptions: async function () {
		let data = await cloudHelper.callCloudData('work/options', {}, { title: 'bar' });
		if (data) this.setData({ options: data });
	},

	_loadDetail: async function () {
		let order = await cloudHelper.callCloudData('work/order_detail', { id: this.data.id }, { title: '加载中' });
		if (!order) return;
		this.setData({
			order,
			imgList: order.ORDER_ATTACHMENTS || [],
		});
	},

	bindInput: function (e) {
		let field = e.currentTarget.dataset.field;
		this.setData({
			['order.' + field]: e.detail.value,
		});
	},

	bindDateChange: function (e) {
		this.setData({ 'order.ORDER_DATE': e.detail.value });
	},

	bindTypeChange: function (e) {
		let type = this.data.options.types[e.detail.value];
		this.setData({
			'order.ORDER_TYPE_ID': type._id,
			'order.ORDER_TYPE_NAME': type.TYPE_NAME,
			'order.ORDER_TYPE_COLOR': type.TYPE_COLOR,
		});
	},

	bindProgressChange: function (e) {
		let item = this.data.options.progressOptions[e.detail.value];
		this.setData({ 'order.ORDER_PROGRESS': item.value });
	},

	bindSourceChange: function (e) {
		this.setData({ 'order.ORDER_SOURCE': this.data.options.sources[e.detail.value] });
	},

	bindOldChange: function (e) {
		this.setData({ 'order.ORDER_IS_OLD_CUSTOMER': e.detail.value ? 1 : 0 });
	},

	bindAddParticipantTap: function () {
		let list = this.data.order.ORDER_PARTICIPANTS || [];
		list.push({
			staffId: '',
			staffName: '请选择员工',
			roleName: this.data.options.roles[0],
			calcMode: 'percent',
			manualAmount: 0,
		});
		this.setData({ 'order.ORDER_PARTICIPANTS': list });
	},

	bindDelParticipantTap: function (e) {
		let idx = e.currentTarget.dataset.idx;
		let list = this.data.order.ORDER_PARTICIPANTS || [];
		list.splice(idx, 1);
		this.setData({ 'order.ORDER_PARTICIPANTS': list });
	},

	bindPartStaffChange: function (e) {
		let idx = e.currentTarget.dataset.idx;
		let staff = this.data.options.staffList[e.detail.value];
		let list = this.data.order.ORDER_PARTICIPANTS || [];
		list[idx].staffId = staff._id;
		list[idx].staffName = staff.STAFF_NAME;
		if (staff.STAFF_ROLES && staff.STAFF_ROLES.length && !staff.STAFF_ROLES.includes(list[idx].roleName)) {
			list[idx].roleName = staff.STAFF_ROLES[0];
		}
		this.setData({ 'order.ORDER_PARTICIPANTS': list });
	},

	bindPartRoleChange: function (e) {
		let idx = e.currentTarget.dataset.idx;
		let list = this.data.order.ORDER_PARTICIPANTS || [];
		list[idx].roleName = this.data.options.roles[e.detail.value];
		this.setData({ 'order.ORDER_PARTICIPANTS': list });
	},

	bindPartModeChange: function (e) {
		let idx = e.currentTarget.dataset.idx;
		let list = this.data.order.ORDER_PARTICIPANTS || [];
		list[idx].calcMode = this.data.options.calcModes[e.detail.value].value;
		this.setData({ 'order.ORDER_PARTICIPANTS': list });
	},

	bindPartManualInput: function (e) {
		let idx = e.currentTarget.dataset.idx;
		let list = this.data.order.ORDER_PARTICIPANTS || [];
		list[idx].manualAmount = e.detail.value;
		this.setData({ 'order.ORDER_PARTICIPANTS': list });
	},

	bindChooseImageTap: function () {
		wx.chooseImage({
			count: 9,
			success: async res => {
				let addImgs = [];
				wx.showLoading({
					title: '图片校验中',
					mask: true
				});

				for (let k = 0; k < res.tempFiles.length; k++) {
					let path = res.tempFiles[k].path || res.tempFilePaths[k];
					let size = res.tempFiles[k].size;

					if (!contentCheckHelper.imgTypeCheck(path)) {
						wx.hideLoading();
						return pageHelper.showNoneToast('只能上传png、jpg、jpeg格式', 3000);
					}

					let maxSize = 20;
					let imageMaxSize = 1024 * 1000 * maxSize;
					if (!contentCheckHelper.imgSizeCheck(size, imageMaxSize)) {
						wx.hideLoading();
						return pageHelper.showModal('图片大小不能超过 ' + maxSize + '兆');
					}

					let check = await contentCheckHelper.imgCheck(path);
					if (!check) {
						wx.hideLoading();
						return pageHelper.showNoneToast('存在不合适的图片, 已屏蔽', 3000);
					}

					addImgs.push(path);
				}

				wx.hideLoading();
				this.setData({ imgList: this.data.imgList.concat(addImgs) });
			},
		});
	},

	bindDelImageTap: function (e) {
		let idx = e.currentTarget.dataset.idx;
		let imgList = this.data.imgList;
		imgList.splice(idx, 1);
		this.setData({ imgList });
	},

	_prepareOrder: async function () {
		let order = Object.assign({}, this.data.order);
		order._id = this.data.id;
		let imgList = this.data.imgList || [];
		order.ORDER_ATTACHMENTS = await cloudHelper.transTempPics(imgList, 'work/order/', this.data.id || '');
		return order;
	},

	_validateOrder: function (order) {
		if (!order.ORDER_DATE) {
			pageHelper.showModal('请选择日期');
			return false;
		}
		if (!String(order.ORDER_CUSTOMER_NAME || '').trim()) {
			pageHelper.showModal('请填写客户名称');
			return false;
		}
		return true;
	},

	bindSubmitTap: async function () {
		if (this.data.isSaving) return;
		if (!this._validateOrder(this.data.order)) return;

		this.setData({ isSaving: true });
		try {
			let order = await this._prepareOrder();
			let res = await cloudHelper.callCloudSumbit('work/order_save', { order }, { title: '保存中' });
			let id = res.data.id;
			this.setData({ id });
			pageHelper.showSuccToastReturn('已保存');
		} catch (err) {
			console.error(err);
		} finally {
			this.setData({ isSaving: false });
		}
	},

	bindCompleteTap: async function () {
		if (!this.data.id) {
			let order = await this._prepareOrder();
			let res = await cloudHelper.callCloudSumbit('work/order_save', { order }, { title: '保存中' });
			this.setData({ id: res.data.id });
		}
		await cloudHelper.callCloudSumbit('work/order_complete', { id: this.data.id }, { title: '提交审核' });
		pageHelper.showSuccToast('已提交审核');
		await this._loadDetail();
	},

	bindCancelTap: function () {
		wx.showModal({
			title: '取消订单',
			content: '确认取消该订单吗？',
			success: async res => {
				if (!res.confirm) return;
				await cloudHelper.callCloudSumbit('work/order_cancel', { id: this.data.id, reason: '取消订单' }, { title: '处理中' });
				pageHelper.showSuccToastReturn('已取消');
			},
		});
	},

	bindRestoreTap: async function () {
		await cloudHelper.callCloudSumbit('work/order_restore', { id: this.data.id }, { title: '处理中' });
		pageHelper.showSuccToast('已恢复');
		await this._loadDetail();
	},

	url: function (e) {
		pageHelper.url(e, this);
	},
});
