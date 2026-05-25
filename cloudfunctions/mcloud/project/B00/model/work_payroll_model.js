/**
 * Notes: 云屿摄影工资发放记录
 */

const BaseProjectModel = require('./base_project_model.js');

class WorkPayrollModel extends BaseProjectModel {}

WorkPayrollModel.CL = 'bx_work_payroll';

WorkPayrollModel.DB_STRUCTURE = {
	_pid: 'string|true',
	PAYROLL_ID: 'string|true',
	PAYROLL_STAFF_ID: 'string|true',
	PAYROLL_STAFF_NAME: 'string|true',
	PAYROLL_MONTH: 'string|true',
	PAYROLL_ITEMS: 'array|true|default=[]',
	PAYROLL_ADJUSTMENTS: 'array|true|default=[]',
	PAYROLL_AMOUNT: 'float|true|default=0',
	PAYROLL_ACTUAL_AMOUNT: 'float|true|default=0',
	PAYROLL_STATUS: 'int|true|default=0',
	PAYROLL_NOTE: 'string|false',
	PAYROLL_ADMIN_ID: 'string|false',
	PAYROLL_ADMIN_NAME: 'string|false',
	PAYROLL_PAY_TIME: 'int|true|default=0',
	PAYROLL_ADD_TIME: 'int|true',
	PAYROLL_EDIT_TIME: 'int|true',
	PAYROLL_ADD_IP: 'string|false',
	PAYROLL_EDIT_IP: 'string|false',
};

WorkPayrollModel.FIELD_PREFIX = 'PAYROLL_';

WorkPayrollModel.STATUS = {
	PAYING: 10,
	PAID: 20,
	FAIL: 30,
};

module.exports = WorkPayrollModel;
