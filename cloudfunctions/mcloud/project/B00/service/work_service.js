/**
 * Notes: 云屿摄影内部档期工作台
 */

const BaseProjectService = require('./base_project_service.js');
const timeUtil = require('../../../framework/utils/time_util.js');
const dataUtil = require('../../../framework/utils/data_util.js');

const WorkStaffModel = require('../model/work_staff_model.js');
const WorkTypeModel = require('../model/work_type_model.js');
const WorkOrderModel = require('../model/work_order_model.js');
const WorkNoteModel = require('../model/work_note_model.js');
const WorkItemModel = require('../model/work_item_model.js');
const WorkRestModel = require('../model/work_rest_model.js');
const WorkMessageModel = require('../model/work_message_model.js');
const WorkPayrollModel = require('../model/work_payroll_model.js');
const WorkCustomerModel = require('../model/work_customer_model.js');

const DEFAULT_ROLES = ['销售', '摄影', '摄像', '化妆', '选片', '后期', '助理', '运营'];
const DEFAULT_SOURCES = ['直客', '合作方', '转介绍', '小红书', '抖音', '视频号', '微信', '其他'];
const DEFAULT_TYPES = [
	['跟拍', '#d9001b'],
	['生日跟拍', '#ff7a70'],
	['百日宴', '#ff8a00'],
	['婚礼跟拍', '#d9001b'],
	['订婚宴', '#bf2bd6'],
	['寿宴跟拍', '#c43ac9'],
	['乔迁跟拍', '#e85d04'],
	['活动跟拍', '#d9001b'],
	['内景写真', '#2f6f4e'],
	['外景写真', '#2f6df6'],
	['艺术肖像', '#9c27b0'],
	['商拍', '#9b6bc7'],
	['亲子照', '#c12bd4'],
	['证件照', '#a57ad1'],
	['化妆', '#92008d'],
	['摄像', '#0052cc'],
	['选片', '#00a3a3'],
	['其他', '#49cdbf', 1],
];

class WorkService extends BaseProjectService {

	getDefaultRoles() {
		return DEFAULT_ROLES;
	}

	getDefaultSources() {
		return DEFAULT_SOURCES;
	}

	async ensureDefaults() {
		let cnt = await WorkTypeModel.count({});
		if (cnt == 0) {
			for (let i = 0; i < DEFAULT_TYPES.length; i++) {
				await WorkTypeModel.insert({
					TYPE_NAME: DEFAULT_TYPES[i][0],
					TYPE_COLOR: DEFAULT_TYPES[i][1],
					TYPE_ORDER: i + 1,
					TYPE_IS_OTHER: DEFAULT_TYPES[i][2] || 0,
					TYPE_STATUS: 1,
				});
			}
		}
	}

	_money(val) {
		val = Number(val || 0);
		if (isNaN(val)) val = 0;
		return Math.round(val * 100) / 100;
	}

	_getSurname(name) {
		name = String(name || '').trim();
		return name ? name.substr(0, 1) : '';
	}

	_getRoleBase(roleName) {
		roleName = String(roleName || '');
		if (roleName.includes('选片') || roleName.includes('产品')) return 'extra';
		return 'shoot';
	}

	_monthRange(month) {
		if (!month) month = timeUtil.time('Y-M');
		let arr = month.split('-');
		let y = Number(arr[0]);
		let m = Number(arr[1]);
		let endDay = new Date(y, m, 0).getDate();
		return {
			month,
			start: month + '-01',
			end: month + '-' + String(endDay).padStart(2, '0'),
		};
	}

	_getProgressDesc(val) {
		return WorkOrderModel.getDesc('PROGRESS', Number(val || 10));
	}

	_getSettleDesc(val) {
		return WorkOrderModel.getDesc('SETTLE', Number(val || 0));
	}

	async getStaffByOpenId(openId, must = true) {
		let staff = await WorkStaffModel.getOne({
			STAFF_OPENID: openId,
		});
		if (!staff || staff.STAFF_STATUS != WorkStaffModel.STATUS.COMM) {
			if (must) this.AppError('请先在「我的」里绑定员工手机号');
			return null;
		}
		return staff;
	}

	async getMe(openId) {
		let staff = await this.getStaffByOpenId(openId, false);
		if (!staff) return { isBind: false };

		await WorkStaffModel.edit(staff._id, { STAFF_LOGIN_TIME: timeUtil.time() });
		return {
			isBind: true,
			staff: this._cleanStaff(staff, true, true),
		};
	}

	async bindStaff(openId, mobile, code) {
		let staff = await WorkStaffModel.getOne({
			STAFF_MOBILE: mobile,
			STAFF_BIND_CODE: code,
		});
		if (!staff) this.AppError('手机号或绑定码不正确');
		if (staff.STAFF_STATUS != WorkStaffModel.STATUS.COMM) this.AppError('该员工已停用，无法绑定');

		if (staff.STAFF_OPENID && staff.STAFF_OPENID != openId) this.AppError('该员工已绑定其他微信，请联系管理员');

		await WorkStaffModel.edit(staff._id, {
			STAFF_OPENID: openId,
			STAFF_LOGIN_TIME: timeUtil.time(),
		});
		staff.STAFF_OPENID = openId;
		return this._cleanStaff(staff, true, true);
	}

	_cleanStaff(staff, withRules = false, withPrivate = false) {
		if (!staff) return null;
		let node = {
			_id: staff._id,
			STAFF_ID: staff.STAFF_ID,
			STAFF_NAME: staff.STAFF_NAME,
			STAFF_ROLES: staff.STAFF_ROLES || [],
			STAFF_IS_ADMIN: staff.STAFF_IS_ADMIN || 0,
			STAFF_STATUS: staff.STAFF_STATUS,
		};
		if (withPrivate) node.STAFF_MOBILE = staff.STAFF_MOBILE;
		if (withRules) node.STAFF_RULES = staff.STAFF_RULES || [];
		return node;
	}

	async getOptions(openId) {
		await this.ensureDefaults();
		let staff = await this.getStaffByOpenId(openId, false);
		let types = await WorkTypeModel.getAll({
			TYPE_STATUS: 1,
		}, 'TYPE_NAME,TYPE_COLOR,TYPE_ORDER,TYPE_IS_OTHER', {
			TYPE_ORDER: 'asc',
			TYPE_ADD_TIME: 'asc',
		}, 1000);

		let staffList = [];
		if (staff) {
			staffList = await WorkStaffModel.getAll({
				STAFF_STATUS: WorkStaffModel.STATUS.COMM,
			}, 'STAFF_NAME,STAFF_ROLES,STAFF_STATUS', {
				STAFF_NAME: 'asc',
			}, 1000);
		}

		return {
			staff: staff ? this._cleanStaff(staff, true, true) : null,
			roles: DEFAULT_ROLES,
			sources: DEFAULT_SOURCES,
			types,
			staffList: staffList.map(item => this._cleanStaff(item, false, staff.STAFF_IS_ADMIN == 1)),
			progressOptions: [
				{ label: '已定档', value: WorkOrderModel.PROGRESS.BOOKED },
				{ label: '已拍摄', value: WorkOrderModel.PROGRESS.SHOT },
				{ label: '已选片', value: WorkOrderModel.PROGRESS.SELECTED },
				{ label: '已完成', value: WorkOrderModel.PROGRESS.DONE },
			],
			calcModes: [
				{ label: '按比例', value: 'percent' },
				{ label: '固定金额', value: 'fixed' },
				{ label: '手动金额', value: 'manual' },
				{ label: '不计提成', value: 'none' },
			],
		};
	}

	_canSeeFullOrder(order, staff) {
		if (!order || !staff) return false;
		if (staff.STAFF_IS_ADMIN == 1) return true;
		if (order.ORDER_CREATOR_STAFF_ID == staff._id || order.ORDER_CREATOR_OPENID == staff.STAFF_OPENID) return true;
		return this._isParticipant(order, staff._id);
	}

	_canEditOrder(order, staff) {
		if (!order || !staff) return false;
		if (staff.STAFF_IS_ADMIN == 1) return true;
		return order.ORDER_CREATOR_STAFF_ID == staff._id || order.ORDER_CREATOR_OPENID == staff.STAFF_OPENID;
	}

	_isParticipant(order, staffId) {
		let participants = order.ORDER_PARTICIPANTS || [];
		return participants.some(item => item.staffId == staffId);
	}

	_cleanOrderForStaff(order, staff) {
		let canFull = this._canSeeFullOrder(order, staff);
		let canEdit = this._canEditOrder(order, staff);
		let base = {
			_id: order._id,
			ORDER_DATE: order.ORDER_DATE,
			ORDER_TIME: order.ORDER_TIME,
			ORDER_END_TIME: order.ORDER_END_TIME,
			ORDER_TYPE_NAME: order.ORDER_TYPE_NAME,
			ORDER_TYPE_COLOR: order.ORDER_TYPE_COLOR,
			ORDER_PROGRESS: order.ORDER_PROGRESS,
			ORDER_PROGRESS_DESC: this._getProgressDesc(order.ORDER_PROGRESS),
			ORDER_SETTLE_STATUS: order.ORDER_SETTLE_STATUS,
			ORDER_SETTLE_STATUS_DESC: this._getSettleDesc(order.ORDER_SETTLE_STATUS),
			ORDER_STATUS: order.ORDER_STATUS,
			ORDER_CUSTOMER_SURNAME: order.ORDER_CUSTOMER_SURNAME || this._getSurname(order.ORDER_CUSTOMER_NAME),
			canFull,
			canEdit,
		};

		if (!canFull) return base;

		let node = JSON.parse(JSON.stringify(order));
		node.ORDER_PROGRESS_DESC = base.ORDER_PROGRESS_DESC;
		node.ORDER_SETTLE_STATUS_DESC = base.ORDER_SETTLE_STATUS_DESC;
		node.canFull = canFull;
		node.canEdit = canEdit;
		node.ORDER_PARTICIPANTS = (node.ORDER_PARTICIPANTS || []).map(p => {
			if (staff.STAFF_IS_ADMIN == 1 || p.staffId == staff._id) return p;
			return {
				id: p.id,
				staffId: p.staffId,
				staffName: p.staffName,
				roleName: p.roleName,
				calcMode: p.calcMode,
				isSettled: p.isSettled || 0,
			};
		});
		return node;
	}

	async getCalendar(openId, month, scope = 'all', staffId = '') {
		let staff = await this.getStaffByOpenId(openId);
		let range = this._monthRange(month);
		let where = {
			ORDER_DATE: ['between', range.start, range.end],
			ORDER_STATUS: WorkOrderModel.STATUS.COMM,
		};
		let orders = await WorkOrderModel.getAll(where, '*', {
			ORDER_DATE: 'asc',
			ORDER_TIME: 'asc',
			ORDER_ADD_TIME: 'asc',
		}, 1000);

		let items = await WorkItemModel.getAll({
			ITEM_DATE: ['between', range.start, range.end],
			ITEM_STATUS: 1,
		}, '*', {
			ITEM_DATE: 'asc',
		}, 1000);

		let rests = await WorkRestModel.getAll({
			REST_DATE: ['between', range.start, range.end],
			REST_STATUS: 1,
		}, '*', {
			REST_DATE: 'asc',
		}, 1000);

		let days = {};
		let filterStaffId = scope == 'mine' ? staff._id : staffId;

		for (let order of orders) {
			if (filterStaffId && !this._isParticipant(order, filterStaffId) && order.ORDER_CREATOR_STAFF_ID != filterStaffId) continue;
			if (!days[order.ORDER_DATE]) days[order.ORDER_DATE] = [];
			let canFull = this._canSeeFullOrder(order, staff);
			days[order.ORDER_DATE].push({
				kind: 'order',
				id: order._id,
				typeName: order.ORDER_TYPE_NAME,
				color: order.ORDER_TYPE_COLOR,
				time: order.ORDER_TIME,
				title: order.ORDER_TYPE_NAME,
				customer: canFull ? order.ORDER_CUSTOMER_NAME : (order.ORDER_CUSTOMER_SURNAME || this._getSurname(order.ORDER_CUSTOMER_NAME)),
				canFull,
			});
		}

		for (let item of items) {
			if (!days[item.ITEM_DATE]) days[item.ITEM_DATE] = [];
			days[item.ITEM_DATE].push({
				kind: 'item',
				id: item._id,
				typeName: '事项',
				color: '#1f7a8c',
				time: item.ITEM_TIME,
				title: item.ITEM_TITLE,
				customer: '',
				canFull: true,
			});
		}

		for (let rest of rests) {
			if (filterStaffId && rest.REST_STAFF_ID != filterStaffId) continue;
			if (!days[rest.REST_DATE]) days[rest.REST_DATE] = [];
			days[rest.REST_DATE].push({
				kind: 'rest',
				id: rest._id,
				typeName: '休息',
				color: '#8a8a8a',
				time: '',
				title: rest.REST_STAFF_NAME + '休息',
				customer: '',
				canFull: true,
			});
		}

		return {
			month: range.month,
			days,
		};
	}

	async getDayList(openId, day, scope = 'all') {
		let staff = await this.getStaffByOpenId(openId);
		let orders = await WorkOrderModel.getAll({
			ORDER_DATE: day,
			ORDER_STATUS: WorkOrderModel.STATUS.COMM,
		}, '*', {
			ORDER_TIME: 'asc',
			ORDER_ADD_TIME: 'asc',
		}, 1000);

		if (scope == 'mine') {
			orders = orders.filter(order => this._isParticipant(order, staff._id) || order.ORDER_CREATOR_STAFF_ID == staff._id);
		}

		let items = await WorkItemModel.getAll({
			ITEM_DATE: day,
			ITEM_STATUS: 1,
		}, '*', {
			ITEM_TIME: 'asc',
		}, 1000);

		let rests = await WorkRestModel.getAll({
			REST_DATE: day,
			REST_STATUS: 1,
		}, '*', {
			REST_STAFF_NAME: 'asc',
		}, 1000);

		return {
			orders: orders.map(order => this._cleanOrderForStaff(order, staff)),
			items,
			rests,
		};
	}

	async getOrderDetail(openId, id) {
		let staff = await this.getStaffByOpenId(openId);
		let order = await WorkOrderModel.getOne(id);
		if (!order) this.AppError('订单不存在');
		return this._cleanOrderForStaff(order, staff);
	}

	_getParticipantRule(staff, roleName) {
		let rules = staff.STAFF_RULES || [];
		let rule = rules.find(item => item.roleName == roleName);
		if (!rule) {
			return {
				mode: 'percent',
				percent: 0,
				amount: 0,
			};
		}
		return rule;
	}

	_calcParticipantAmount(participant, order, useEstimate = false) {
		let shootBase = useEstimate ? this._money(order.ORDER_AMOUNT) : this._money(order.ORDER_DEPOSIT + order.ORDER_FINAL);
		let extraBase = this._money(order.ORDER_EXTRA);
		let base = participant.baseType == 'extra' ? extraBase : shootBase;
		if (participant.calcMode == 'manual') return this._money(participant.manualAmount);
		if (participant.calcMode == 'fixed') return this._money(participant.fixedAmount);
		if (participant.calcMode == 'none') return 0;
		return this._money(base * this._money(participant.percent) / 100);
	}

	async _buildParticipants(rawParticipants, order, oldParticipants = []) {
		if (!Array.isArray(rawParticipants)) rawParticipants = [];
		let list = [];
		for (let raw of rawParticipants) {
			if (!raw || !raw.staffId || !raw.roleName) continue;

			let staff = await WorkStaffModel.getOne(raw.staffId);
			if (!staff) this.AppError('参与员工不存在');
			if (staff.STAFF_STATUS != WorkStaffModel.STATUS.COMM) continue;

			let old = oldParticipants.find(item => item.id && item.id == raw.id)
				|| oldParticipants.find(item => item.staffId == raw.staffId && item.roleName == raw.roleName && !list.find(x => x.staffId == item.staffId && x.roleName == item.roleName));

			let rule = this._getParticipantRule(staff, raw.roleName);
			let calcMode = raw.calcMode || rule.mode || 'percent';
			if (!['percent', 'fixed', 'manual', 'none'].includes(calcMode)) calcMode = 'percent';

			let node = {
				id: raw.id || (old && old.id) || dataUtil.makeID(),
				staffId: staff._id,
				staffName: staff.STAFF_NAME,
				roleName: raw.roleName,
				calcMode,
				baseType: this._getRoleBase(raw.roleName),
				percent: this._money(rule.percent),
				fixedAmount: this._money(rule.amount),
				manualAmount: this._money(raw.manualAmount),
				isSettled: old ? (old.isSettled || 0) : 0,
				settledAmount: old ? this._money(old.settledAmount) : 0,
				settledPayrollId: old ? (old.settledPayrollId || '') : '',
				settledTime: old ? (old.settledTime || 0) : 0,
				settledMonth: old ? (old.settledMonth || '') : '',
			};
			node.amount = this._calcParticipantAmount(node, order);
			list.push(node);
		}
		return list;
	}

	async _upsertCustomer(order) {
		if (!order.ORDER_CUSTOMER_NAME && !order.ORDER_CUSTOMER_MOBILE) return;
		let where = order.ORDER_CUSTOMER_MOBILE ? {
			CUSTOMER_MOBILE: order.ORDER_CUSTOMER_MOBILE,
		} : {
			CUSTOMER_NAME: order.ORDER_CUSTOMER_NAME,
		};
		let old = await WorkCustomerModel.getOne(where, 'CUSTOMER_ORDER_CNT');
		let data = {
			CUSTOMER_NAME: order.ORDER_CUSTOMER_NAME,
			CUSTOMER_SURNAME: order.ORDER_CUSTOMER_SURNAME,
			CUSTOMER_MOBILE: order.ORDER_CUSTOMER_MOBILE,
			CUSTOMER_SOURCE: order.ORDER_SOURCE,
			CUSTOMER_ORDER_CNT: old ? (old.CUSTOMER_ORDER_CNT || 0) + 1 : 1,
			CUSTOMER_LAST_ORDER_ID: order._id || '',
			CUSTOMER_LAST_ORDER_TIME: timeUtil.time(),
		};
		await WorkCustomerModel.insertOrUpdate(where, data);
	}

	async saveOrder(openId, orderInput) {
		let staff = await this.getStaffByOpenId(openId);
		orderInput = orderInput || {};
		let id = orderInput._id || orderInput.id || '';
		let old = id ? await WorkOrderModel.getOne(id) : null;
		if (id && !old) this.AppError('订单不存在');
		if (old && !this._canEditOrder(old, staff)) this.AppError('你无权修改该订单');
		if (old && old.ORDER_STATUS == WorkOrderModel.STATUS.CANCEL) this.AppError('订单已取消，请先恢复');

		let type = null;
		if (orderInput.ORDER_TYPE_ID) type = await WorkTypeModel.getOne(orderInput.ORDER_TYPE_ID);

		let order = {
			ORDER_DATE: orderInput.ORDER_DATE || (old && old.ORDER_DATE) || timeUtil.time('Y-M-D'),
			ORDER_TIME: orderInput.ORDER_TIME || '',
			ORDER_END_TIME: orderInput.ORDER_END_TIME || '',
			ORDER_TYPE_ID: type ? type._id : (orderInput.ORDER_TYPE_ID || ''),
			ORDER_TYPE_NAME: type ? type.TYPE_NAME : (orderInput.ORDER_TYPE_NAME || '其他'),
			ORDER_TYPE_COLOR: type ? type.TYPE_COLOR : (orderInput.ORDER_TYPE_COLOR || '#49cdbf'),
			ORDER_CUSTOMER_NAME: String(orderInput.ORDER_CUSTOMER_NAME || '').trim(),
			ORDER_CUSTOMER_MOBILE: String(orderInput.ORDER_CUSTOMER_MOBILE || '').trim(),
			ORDER_SOURCE: orderInput.ORDER_SOURCE || '',
			ORDER_CONTENT: orderInput.ORDER_CONTENT || '',
			ORDER_PLACE: orderInput.ORDER_PLACE || '',
			ORDER_IS_OLD_CUSTOMER: Number(orderInput.ORDER_IS_OLD_CUSTOMER || 0),
			ORDER_AMOUNT: this._money(orderInput.ORDER_AMOUNT),
			ORDER_DEPOSIT: this._money(orderInput.ORDER_DEPOSIT),
			ORDER_FINAL: this._money(orderInput.ORDER_FINAL),
			ORDER_EXTRA: this._money(orderInput.ORDER_EXTRA),
			ORDER_PROGRESS: Number(orderInput.ORDER_PROGRESS || (old && old.ORDER_PROGRESS) || WorkOrderModel.PROGRESS.BOOKED),
			ORDER_ATTACHMENTS: Array.isArray(orderInput.ORDER_ATTACHMENTS) ? orderInput.ORDER_ATTACHMENTS : ((old && old.ORDER_ATTACHMENTS) || []),
		};

		if (!order.ORDER_CUSTOMER_NAME) this.AppError('请填写客户名称');
		if (!order.ORDER_DATE) this.AppError('请选择日期');

		order.ORDER_CUSTOMER_SURNAME = this._getSurname(order.ORDER_CUSTOMER_NAME);
		order.ORDER_ACTUAL_AMOUNT = this._money(order.ORDER_DEPOSIT + order.ORDER_FINAL + order.ORDER_EXTRA);
		order.ORDER_PARTICIPANTS = await this._buildParticipants(orderInput.ORDER_PARTICIPANTS || [], order, old ? old.ORDER_PARTICIPANTS : []);

		if (old) {
			if (old.ORDER_SETTLE_STATUS == WorkOrderModel.SETTLE.WAIT_AUDIT && order.ORDER_PROGRESS == WorkOrderModel.PROGRESS.DONE) {
				order.ORDER_SETTLE_STATUS = WorkOrderModel.SETTLE.WAIT_AUDIT;
			} else if (old.ORDER_SETTLE_STATUS == WorkOrderModel.SETTLE.PAID) {
				order.ORDER_SETTLE_STATUS = WorkOrderModel.SETTLE.PAID;
			} else if (order.ORDER_PROGRESS < WorkOrderModel.PROGRESS.DONE) {
				order.ORDER_SETTLE_STATUS = WorkOrderModel.SETTLE.NONE;
			} else {
				order.ORDER_SETTLE_STATUS = old.ORDER_SETTLE_STATUS || WorkOrderModel.SETTLE.NONE;
			}
			await WorkOrderModel.edit(id, order);
			order._id = id;
		} else {
			order.ORDER_CREATOR_OPENID = openId;
			order.ORDER_CREATOR_STAFF_ID = staff._id;
			order.ORDER_CREATOR_NAME = staff.STAFF_NAME;
			order.ORDER_STATUS = WorkOrderModel.STATUS.COMM;
			order.ORDER_SETTLE_STATUS = WorkOrderModel.SETTLE.NONE;
			id = await WorkOrderModel.insert(order);
			order._id = id;
		}

		await this._upsertCustomer(order);
		return { id };
	}

	async completeOrder(openId, id) {
		let staff = await this.getStaffByOpenId(openId);
		let order = await WorkOrderModel.getOne(id);
		if (!order) this.AppError('订单不存在');
		if (!this._canEditOrder(order, staff)) this.AppError('你无权完成该订单');
		if (order.ORDER_STATUS == WorkOrderModel.STATUS.CANCEL) this.AppError('订单已取消');

		order.ORDER_ACTUAL_AMOUNT = this._money(order.ORDER_DEPOSIT + order.ORDER_FINAL + order.ORDER_EXTRA);
		order.ORDER_PARTICIPANTS = await this._buildParticipants(order.ORDER_PARTICIPANTS, order, order.ORDER_PARTICIPANTS);

		await WorkOrderModel.edit(id, {
			ORDER_PROGRESS: WorkOrderModel.PROGRESS.DONE,
			ORDER_SETTLE_STATUS: WorkOrderModel.SETTLE.WAIT_AUDIT,
			ORDER_COMPLETE_TIME: timeUtil.time(),
			ORDER_COMPLETE_MONTH: timeUtil.time('Y-M'),
			ORDER_ACTUAL_AMOUNT: order.ORDER_ACTUAL_AMOUNT,
			ORDER_PARTICIPANTS: order.ORDER_PARTICIPANTS,
			ORDER_AUDIT_REASON: '',
		});

		return { id };
	}

	async cancelOrder(openId, id, reason = '') {
		let staff = await this.getStaffByOpenId(openId);
		let order = await WorkOrderModel.getOne(id);
		if (!order) this.AppError('订单不存在');
		if (!this._canEditOrder(order, staff)) this.AppError('你无权取消该订单');
		await WorkOrderModel.edit(id, {
			ORDER_STATUS: WorkOrderModel.STATUS.CANCEL,
			ORDER_CANCEL_REASON: reason || '',
		});
	}

	async restoreOrder(openId, id) {
		let staff = await this.getStaffByOpenId(openId);
		let order = await WorkOrderModel.getOne(id);
		if (!order) this.AppError('订单不存在');
		if (!this._canEditOrder(order, staff)) this.AppError('你无权恢复该订单');
		await WorkOrderModel.edit(id, {
			ORDER_STATUS: WorkOrderModel.STATUS.COMM,
			ORDER_CANCEL_REASON: '',
		});
	}

	async saveNote(openId, input) {
		let staff = await this.getStaffByOpenId(openId);
		let id = input._id || input.id || '';
		let old = id ? await WorkNoteModel.getOne(id) : null;
		if (old && old.NOTE_TYPE == 'personal' && old.NOTE_CREATOR_STAFF_ID != staff._id) this.AppError('你无权修改该小记');

		let data = {
			NOTE_TYPE: input.NOTE_TYPE == 'team' ? 'team' : 'personal',
			NOTE_TITLE: input.NOTE_TITLE || '未命名小记',
			NOTE_CONTENT: input.NOTE_CONTENT || '',
			NOTE_DATE: input.NOTE_DATE || timeUtil.time('Y-M-D'),
			NOTE_STATUS: 1,
		};

		if (old) {
			await WorkNoteModel.edit(id, data);
		} else {
			data.NOTE_CREATOR_OPENID = openId;
			data.NOTE_CREATOR_STAFF_ID = staff._id;
			data.NOTE_CREATOR_NAME = staff.STAFF_NAME;
			id = await WorkNoteModel.insert(data);
		}
		return { id };
	}

	async getNoteList(openId, type = 'all') {
		let staff = await this.getStaffByOpenId(openId);
		let where = {
			NOTE_STATUS: 1,
		};
		if (type == 'personal') {
			where.NOTE_TYPE = 'personal';
			where.NOTE_CREATOR_STAFF_ID = staff._id;
		} else if (type == 'team') {
			where.NOTE_TYPE = 'team';
		} else {
			where.or = [
				{ NOTE_TYPE: 'team' },
				{ NOTE_TYPE: 'personal', NOTE_CREATOR_STAFF_ID: staff._id },
			];
			delete where.NOTE_STATUS;
			where.and = { NOTE_STATUS: 1 };
		}
		return await WorkNoteModel.getAllBig(where, '*', {
			NOTE_EDIT_TIME: 'desc',
		}, 1000);
	}

	async getNoteDetail(openId, id) {
		let staff = await this.getStaffByOpenId(openId);
		let note = await WorkNoteModel.getOne(id);
		if (!note) this.AppError('小记不存在');
		if (note.NOTE_TYPE == 'personal' && note.NOTE_CREATOR_STAFF_ID != staff._id) this.AppError('你无权查看该小记');
		return note;
	}

	async saveItem(openId, input) {
		let staff = await this.getStaffByOpenId(openId);
		let id = input._id || input.id || '';
		let old = id ? await WorkItemModel.getOne(id) : null;
		if (old && old.ITEM_CREATOR_STAFF_ID != staff._id && staff.STAFF_IS_ADMIN != 1) this.AppError('你无权修改该事项');
		let data = {
			ITEM_TITLE: input.ITEM_TITLE || '未命名事项',
			ITEM_CONTENT: input.ITEM_CONTENT || '',
			ITEM_DATE: input.ITEM_DATE || timeUtil.time('Y-M-D'),
			ITEM_TIME: input.ITEM_TIME || '',
			ITEM_END_TIME: input.ITEM_END_TIME || '',
			ITEM_STATUS: staff.STAFF_IS_ADMIN == 1 ? 1 : 0,
		};
		if (old) {
			await WorkItemModel.edit(id, data);
		} else {
			data.ITEM_CREATOR_OPENID = openId;
			data.ITEM_CREATOR_STAFF_ID = staff._id;
			data.ITEM_CREATOR_NAME = staff.STAFF_NAME;
			id = await WorkItemModel.insert(data);
		}
		return { id };
	}

	async saveRest(openId, input) {
		let staff = await this.getStaffByOpenId(openId);
		let data = {
			REST_STAFF_ID: staff._id,
			REST_STAFF_NAME: staff.STAFF_NAME,
			REST_DATE: input.REST_DATE || timeUtil.time('Y-M-D'),
			REST_TYPE: input.REST_TYPE || '休息',
			REST_REASON: input.REST_REASON || '',
			REST_STATUS: 0,
		};
		let id = await WorkRestModel.insert(data);
		return { id };
	}

	async getMessages(openId) {
		let staff = await this.getStaffByOpenId(openId);
		return await WorkMessageModel.getAll({
			MSG_STAFF_ID: staff._id,
		}, '*', {
			MSG_ADD_TIME: 'desc',
		}, 1000);
	}

	async readMessage(openId, id) {
		let staff = await this.getStaffByOpenId(openId);
		await WorkMessageModel.edit({
			_id: id,
			MSG_STAFF_ID: staff._id,
		}, {
			MSG_IS_READ: 1,
		});
	}

	async _notifyStaff(staffId, title, content, refType = '', refId = '') {
		if (!staffId) return;
		await WorkMessageModel.insert({
			MSG_STAFF_ID: staffId,
			MSG_TITLE: title,
			MSG_CONTENT: content || '',
			MSG_REF_TYPE: refType,
			MSG_REF_ID: refId,
			MSG_IS_READ: 0,
		});
	}

	_estimateParticipant(participant, order) {
		let node = Object.assign({}, participant);
		node.amount = this._calcParticipantAmount(node, order, true);
		return node;
	}

	async getPayrollForStaff(staffId, month = '') {
		let staff = await WorkStaffModel.getOne(staffId);
		if (!staff) this.AppError('员工不存在');
		month = month || timeUtil.time('Y-M');

		let doneOrders = await WorkOrderModel.getAll({
			ORDER_STATUS: WorkOrderModel.STATUS.COMM,
			ORDER_COMPLETE_MONTH: month,
			ORDER_SETTLE_STATUS: WorkOrderModel.SETTLE.WAIT_PAY,
		}, '*', {
			ORDER_DATE: 'asc',
		}, 1000);

		let payable = [];
		let payableTotal = 0;
		let adjustments = [];
		let adjustmentTotal = 0;

		for (let order of doneOrders) {
			for (let p of (order.ORDER_PARTICIPANTS || [])) {
				if (p.staffId == staffId && !p.isSettled) {
					let amount = this._money(p.amount);
					payableTotal = this._money(payableTotal + amount);
					payable.push({
						orderId: order._id,
						orderNo: order.ORDER_ID,
						customerName: order.ORDER_CUSTOMER_NAME,
						typeName: order.ORDER_TYPE_NAME,
						date: order.ORDER_DATE,
						roleName: p.roleName,
						amount,
					});
				}
			}
		}

		let allOrders = await WorkOrderModel.getAll({
			ORDER_STATUS: WorkOrderModel.STATUS.COMM,
		}, '*', {
			ORDER_DATE: 'desc',
		}, 1000);

		let estimated = [];
		let estimatedTotal = 0;
		for (let order of allOrders) {
			if (order.ORDER_PROGRESS == WorkOrderModel.PROGRESS.DONE && order.ORDER_SETTLE_STATUS != WorkOrderModel.SETTLE.REJECT) {
				let adjs = order.ORDER_ADJUSTMENTS || [];
				for (let adj of adjs) {
					if (adj.staffId == staffId && !adj.isSettled && (adj.month || order.ORDER_COMPLETE_MONTH) == month) {
						let amount = this._money(adj.amount);
						adjustmentTotal = this._money(adjustmentTotal + amount);
						adjustments.push(Object.assign({
							orderId: order._id,
							customerName: order.ORDER_CUSTOMER_NAME,
							typeName: order.ORDER_TYPE_NAME,
						}, adj, { amount }));
					}
				}
				continue;
			}

			for (let p of (order.ORDER_PARTICIPANTS || [])) {
				if (p.staffId == staffId) {
					let ep = this._estimateParticipant(p, order);
					estimatedTotal = this._money(estimatedTotal + ep.amount);
					estimated.push({
						orderId: order._id,
						customerName: order.ORDER_CUSTOMER_NAME,
						typeName: order.ORDER_TYPE_NAME,
						date: order.ORDER_DATE,
						roleName: ep.roleName,
						amount: ep.amount,
						progressDesc: this._getProgressDesc(order.ORDER_PROGRESS),
					});
				}
			}
		}

		let settled = await WorkPayrollModel.getAll({
			PAYROLL_STAFF_ID: staffId,
			PAYROLL_MONTH: month,
		}, '*', {
			PAYROLL_PAY_TIME: 'desc',
		}, 1000);
		let settledTotal = 0;
		for (let item of settled) settledTotal = this._money(settledTotal + item.PAYROLL_ACTUAL_AMOUNT);

		return {
			staff: this._cleanStaff(staff, true),
			month,
			payable,
			payableTotal,
			adjustments,
			adjustmentTotal,
			estimated,
			estimatedTotal,
			settled,
			settledTotal,
			total: this._money(payableTotal + adjustmentTotal),
		};
	}

	async getMyPayroll(openId, month = '') {
		let staff = await this.getStaffByOpenId(openId);
		return await this.getPayrollForStaff(staff._id, month);
	}
}

module.exports = WorkService;
