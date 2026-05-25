/**
 * Notes: 云屿摄影内部订单档期
 */

const BaseProjectModel = require('./base_project_model.js');

class WorkOrderModel extends BaseProjectModel {}

WorkOrderModel.CL = 'bx_work_order';

WorkOrderModel.DB_STRUCTURE = {
	_pid: 'string|true',
	ORDER_ID: 'string|true',

	ORDER_DATE: 'string|true|comment=拍摄/档期日期',
	ORDER_TIME: 'string|false|comment=开始时间或文字时间',
	ORDER_END_TIME: 'string|false|comment=结束时间',
	ORDER_TYPE_ID: 'string|false',
	ORDER_TYPE_NAME: 'string|true',
	ORDER_TYPE_COLOR: 'string|true|default=#e60012',

	ORDER_CUSTOMER_NAME: 'string|true',
	ORDER_CUSTOMER_SURNAME: 'string|false',
	ORDER_CUSTOMER_MOBILE: 'string|false',
	ORDER_SOURCE: 'string|false',
	ORDER_CONTENT: 'string|false',
	ORDER_PLACE: 'string|false',
	ORDER_IS_OLD_CUSTOMER: 'int|true|default=0',

	ORDER_AMOUNT: 'float|true|default=0|comment=登记订单金额',
	ORDER_DEPOSIT: 'float|true|default=0|comment=定金',
	ORDER_FINAL: 'float|true|default=0|comment=尾款',
	ORDER_EXTRA: 'float|true|default=0|comment=后期加选/产品金额',
	ORDER_ACTUAL_AMOUNT: 'float|true|default=0|comment=实际总收款',

	ORDER_PARTICIPANTS: 'array|true|default=[]|comment=参与人和提成',
	ORDER_ATTACHMENTS: 'array|true|default=[]|comment=订单附件图片',
	ORDER_ADJUSTMENTS: 'array|true|default=[]|comment=已结算后调整记录',

	ORDER_PROGRESS: 'int|true|default=10|comment=10已定档 20已拍摄 30已选片 40已完成',
	ORDER_SETTLE_STATUS: 'int|true|default=0|comment=0未提交 10待审核 20驳回 30待结算 40已结算',
	ORDER_STATUS: 'int|true|default=1|comment=1有效 10取消',
	ORDER_CANCEL_REASON: 'string|false',
	ORDER_AUDIT_REASON: 'string|false',

	ORDER_CREATOR_OPENID: 'string|true',
	ORDER_CREATOR_STAFF_ID: 'string|false',
	ORDER_CREATOR_NAME: 'string|false',
	ORDER_COMPLETE_TIME: 'int|true|default=0',
	ORDER_COMPLETE_MONTH: 'string|false',
	ORDER_AUDIT_ADMIN_ID: 'string|false',
	ORDER_AUDIT_ADMIN_NAME: 'string|false',
	ORDER_AUDIT_TIME: 'int|true|default=0',

	ORDER_ADD_TIME: 'int|true',
	ORDER_EDIT_TIME: 'int|true',
	ORDER_ADD_IP: 'string|false',
	ORDER_EDIT_IP: 'string|false',
};

WorkOrderModel.FIELD_PREFIX = 'ORDER_';

WorkOrderModel.PROGRESS = {
	BOOKED: 10,
	SHOT: 20,
	SELECTED: 30,
	DONE: 40,
};

WorkOrderModel.PROGRESS_DESC = {
	BOOKED: '已定档',
	SHOT: '已拍摄',
	SELECTED: '已选片',
	DONE: '已完成',
};

WorkOrderModel.SETTLE = {
	NONE: 0,
	WAIT_AUDIT: 10,
	REJECT: 20,
	WAIT_PAY: 30,
	PAID: 40,
};

WorkOrderModel.SETTLE_DESC = {
	NONE: '未提交结算',
	WAIT_AUDIT: '待审核',
	REJECT: '审核驳回',
	WAIT_PAY: '待结算',
	PAID: '已结算',
};

WorkOrderModel.STATUS = {
	COMM: 1,
	CANCEL: 10,
};

module.exports = WorkOrderModel;
