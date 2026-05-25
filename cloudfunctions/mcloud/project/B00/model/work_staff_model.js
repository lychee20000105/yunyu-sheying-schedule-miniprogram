/**
 * Notes: 云屿摄影内部员工
 */

const BaseProjectModel = require('./base_project_model.js');

class WorkStaffModel extends BaseProjectModel {}

WorkStaffModel.CL = 'bx_work_staff';

WorkStaffModel.DB_STRUCTURE = {
	_pid: 'string|true',
	STAFF_ID: 'string|true',

	STAFF_NAME: 'string|true|comment=员工姓名',
	STAFF_MOBILE: 'string|true|comment=登录手机号',
	STAFF_BIND_CODE: 'string|true|comment=绑定码/工号',
	STAFF_OPENID: 'string|false|comment=当前绑定微信openid',
	STAFF_ROLES: 'array|true|default=[]|comment=可担任岗位',
	STAFF_RULES: 'array|true|default=[]|comment=个人岗位提成规则',
	STAFF_IS_ADMIN: 'int|true|default=0|comment=小程序内管理员',
	STAFF_STATUS: 'int|true|default=1|comment=1正常 0停用',

	STAFF_LOGIN_TIME: 'int|true|default=0',
	STAFF_ADD_TIME: 'int|true',
	STAFF_EDIT_TIME: 'int|true',
	STAFF_ADD_IP: 'string|false',
	STAFF_EDIT_IP: 'string|false',
};

WorkStaffModel.FIELD_PREFIX = 'STAFF_';

WorkStaffModel.STATUS = {
	COMM: 1,
	STOP: 0,
};

WorkStaffModel.STATUS_DESC = {
	COMM: '正常',
	STOP: '停用',
};

module.exports = WorkStaffModel;
