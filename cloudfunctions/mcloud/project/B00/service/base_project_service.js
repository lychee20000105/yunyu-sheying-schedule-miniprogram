/**
 * Notes: 业务基类 
 * Date: 2025-03-15 04:00:00 
 */

const dbUtil = require('../../../framework/database/db_util.js');
const util = require('../../../framework/utils/util.js');
const AdminModel = require('../../../framework/platform/model/admin_model.js');
const NewsModel = require('../model/news_model.js');
const MeetModel = require('../model/meet_model.js');
const AlbumModel = require('../model/album_model.js');
const ProductModel = require('../model/product_model.js');
const BaseService = require('../../../framework/platform/service/base_service.js');
const setupUtil = require('../../../framework/utils/setup/setup_util.js');

class BaseProjectService extends BaseService {
	getProjectId() {
		return util.getProjectId();
	}

	async initSetup() {

		const COLLECTIONS = 'bx_admin|bx_day|bx_join|bx_log|bx_meet|bx_news|bx_product|bx_album|bx_fav|bx_user';
		const CONST_PIC = '/images/cover.gif';

		const NEWS_CATE = '1=本店动态,2=拍摄小贴士';
		const MEET_TYPE = '1=生日跟拍,2=百日宴,3=婚礼跟拍,4=订婚宴,5=寿宴,6=乔迁跟拍,7=写真,8=外景约拍,9=活动商拍,10=艺术肖像,11=其他拍摄';
		const ALBUM_CATE = '1=跟拍纪实,2=艺术肖像,3=写真作品,4=外景约拍,5=活动商拍';
		const PRODUCT_CATE = '1=拍摄服务';


		if (await dbUtil.isExistCollection('bx_setup_b00')) {
			return;
		}

		console.log('### initSetup...');

		let arr = COLLECTIONS.split('|');
		for (let k in arr) {
			if (!await dbUtil.isExistCollection(arr[k])) {
				await dbUtil.createCollection(arr[k]);
			}
		}

		if (await dbUtil.isExistCollection('bx_admin')) {
			let adminCnt = await AdminModel.count({});
			if (adminCnt == 0) {
				let data = {};
				data.ADMIN_NAME = 'admin';
				data.ADMIN_PASSWORD = 'e10adc3949ba59abbe56e057f20f883e';
				data.ADMIN_DESC = '超管';
				data.ADMIN_TYPE = 1;
				await AdminModel.insert(data);
			}
		}


		if (await dbUtil.isExistCollection('bx_news')) {
			let newsCnt = await NewsModel.count({});
			if (newsCnt == 0) {
				let newsArr = NEWS_CATE.split(',');
				for (let j in newsArr) {
					let title = newsArr[j].split('=')[1];
					let cateId = newsArr[j].split('=')[0];

					let data = {};
					data.NEWS_TITLE = title + '示例';
					data.NEWS_DESC = '云屿摄影' + title + '内容示例';
					data.NEWS_CATE_ID = cateId;
					data.NEWS_CATE_NAME = title;
					data.NEWS_CONTENT = [{ type: 'text', val: '这里可以发布云屿摄影的' + title + '。' }];
					data.NEWS_PIC = [CONST_PIC];

					await NewsModel.insert(data);
				}
			}
		}

		if (await dbUtil.isExistCollection('bx_meet')) {
			let meetCnt = await MeetModel.count({});
			if (meetCnt == 0) {
				let meetArr = MEET_TYPE.split(',');
				for (let j in meetArr) {
					let title = meetArr[j].split('=')[1];
					let typeId = meetArr[j].split('=')[0];

					let data = {};
					data.MEET_TITLE = title;
					data.MEET_STYLE_SET = {
						desc: '云屿摄影' + title + '档期',
						pic: CONST_PIC
					};
					data.MEET_ADMIN_ID = '1';
					data.MEET_TYPE_ID = typeId;
					data.MEET_TYPE_NAME = title;
					data.MEET_CONTENT = [{ type: 'text', val: '记录' + title + '客户、时间、地点、金额和后期进度。' }];
					data.MEET_DAYS = [];
					data.MEET_FORM_SET = [
						{ type: 'text', title: '客户姓名', must: true },
						{ type: 'mobile', title: '联系电话', must: true },
						{ type: 'text', title: '拍摄地点', must: true },
						{ type: 'digit', title: '订单金额', must: false },
						{ type: 'digit', title: '已收定金', must: false },
						{ type: 'select', title: '后期进度', must: true, selectOptions: ['待拍摄', '已拍摄待修图', '修图中', '已修图待交付', '已交付'] },
						{ type: 'textarea', title: '备注', must: false }
					];

					await MeetModel.insert(data);
				}
			}
		}

		if (await dbUtil.isExistCollection('bx_album')) {
			let albumCnt = await AlbumModel.count({});
			if (albumCnt == 0) {
				let albumArr = ALBUM_CATE.split(',');
				for (let j in albumArr) {
					let title = albumArr[j].split('=')[1];
					let cateId = albumArr[j].split('=')[0];

					let data = {};
					data.ALBUM_TITLE = title + '作品示例';
					data.ALBUM_CATE_ID = cateId;
					data.ALBUM_CATE_NAME = title;
					data.ALBUM_OBJ = { cover: [CONST_PIC], detail: [{ type: 'text', val: '云屿摄影' + title + '作品展示。' }] };
					await AlbumModel.insert(data);
				}
			}

		}

		if (await dbUtil.isExistCollection('bx_product')) {
			let productCnt = await ProductModel.count({});
			if (productCnt == 0) {
				let productArr = PRODUCT_CATE.split(',');
				for (let j in productArr) {
					let title = productArr[j].split('=')[1];
					let cateId = productArr[j].split('=')[0];

					let data = {};
					data.PRODUCT_TITLE = title + '示例';
					data.PRODUCT_CATE_ID = cateId;
					data.PRODUCT_CATE_NAME = title;
					data.PRODUCT_OBJ = {
						cover: [CONST_PIC],
						price: 999,
						origPrice: 1299,
						adv: '适合县城多场景拍摄',
						service: '生日宴、百日宴、婚礼、订婚宴、寿宴、乔迁、写真、外景约拍、活动商拍等。',
						item: '根据客户时间、地点和流程安排拍摄人员及到场时间。',
						product: '精修照片、全部底片、短视频或相册等交付内容可按订单约定。',
						desc: '云屿摄影提供灵活的跟拍与艺术肖像服务。',
						album: [CONST_PIC]
					};
					await ProductModel.insert(data);
				}
			}
		}

		if (!await dbUtil.isExistCollection('bx_setup')) {
			await dbUtil.createCollection('bx_setup');
		}

		const aboutContent = [
			{ type: 'text', val: '云屿摄影，专注县城多场景拍摄服务。' },
			{ type: 'text', val: '我们主要承接生日跟拍、百日宴、婚礼跟拍、订婚宴、寿宴、乔迁跟拍、写真、外景约拍、活动商拍和艺术肖像等拍摄。' },
			{ type: 'text', val: '小程序用于团队档期查看、客户预约记录和订单进度协同。' },
			{ type: 'text', val: '技术由云屿科技支撑。' }
		];
		await setupUtil.set('SETUP_ABOUT_KEY', aboutContent);
	}

}

module.exports = BaseProjectService;
