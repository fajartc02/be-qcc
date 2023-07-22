const table = require('../../config/table')
const { queryPOST, queryBulkPOST, queryGET, queryPUT, queryCustom } = require('../../helpers/query')

const moment = require('moment')
const response = require('../../helpers/response')
const getLastIdData = require('../../helpers/getLastIdData')
const uuidToId = require('../../helpers/uuidToId')
const idToUuid = require('../../helpers/idToUuid')
const attrsUserInsertData = require('../../helpers/addAttrsUserInsertData')
const attrsUserUpdateData = require('../../helpers/addAttrsUserUpdateData')
const condDataNotDeleted = `deleted_dt IS NULL`


module.exports = {
    getDashboard: async(req, res) => {
        try {
            let whereCond = `WHERE trqg.${condDataNotDeleted}`
            let { id, activity_id, line_id } = req.query
            activity_id && activity_id != "-1" && activity_id != 'null' ?
                whereCond += ` AND header_activity_id = ${await uuidToId(table.tb_r_header_activities, 'header_activity_id', activity_id)}` :
                null;
            line_id && line_id != "-1" && line_id != 'null' ?
                whereCond += ` AND tml.line_id = ${line_id.length < 20 ? line_id : await uuidToId(table.tb_m_lines, 'line_id', line_id)}` : null;
            let q = `SELECT 
            trqg.*,
            trgt.group_theme_id,
            trgt.theme_nm,
            tml.line_nm,
            trqg.qcc_group_nm as group_nm
        FROM tb_r_qcc_groups trqg
        JOIN tb_m_lines tml
            ON tml.line_id = trqg.line_id
        JOIN tb_m_groups tmg
            ON tmg.group_id = trqg.group_id
        JOIN tb_r_group_themes trgt
            ON trgt.qcc_group_id = trqg.qcc_group_id
        ${whereCond}
        `
            let qccGroups = await queryCustom(q);
            const mapQccGroupActivities = await qccGroups.rows.map(async qccGroup => {
                // qccGroup.activities = await queryGET(table.tb_r_sub_group_activities, `WHERE group_theme_id = ${qccGroup.group_theme_id}`)
                let qQccGroup = `
                    SELECT * FROM tb_r_sub_group_activities trsga
                    JOIN tb_r_sub_activities trsa
                        ON trsa.sub_activity_id = trsga.sub_activity_id
                    WHERE group_theme_id = ${qccGroup.group_theme_id}
                    AND trsga.${condDataNotDeleted}
                    ORDER BY trsa.step_id ASC
                `
                let qccGroupRaw = await queryCustom(qQccGroup)
                qccGroup.activities = await qccGroupRaw.rows
                let count = 0
                await qccGroup.activities.map((activity) => {
                    activity.is_submitted ? count++ : null
                })
                qccGroup.progress = `${count ? count: 0}/${qccGroup.activities.length}`
                return qccGroup
            })
            let result = await Promise.all(mapQccGroupActivities)
            response.success(res, 'Success to get Dashboard', result)
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to get Dashboard')
        }
    },
    getActivities: async(req, res) => {
        try {
            let whereCond = `WHERE ${condDataNotDeleted}`
            let { id } = req.query
            id && id != -1 && id != 'null' ?
                whereCond += ` AND header_activity_id = ${await uuidToId(table.tb_r_header_activities, 'header_activity_id', id)}` :
                null;
            whereCond += ` AND is_finished = FALSE`
            const headerCols = ['header_activity_id', 'uuid', 'activity_nm', 'start_time', 'end_time', 'created_dt', 'created_by', 'is_finished']
            let headerActivities = await queryGET(table.tb_r_header_activities, whereCond, headerCols)
            let mapHeaderSub = await headerActivities.map(async headerActivity => {
                headerActivity.sub_activities = await queryGET(table.tb_r_sub_activities, `WHERE header_activity_id = ${headerActivity.header_activity_id}`);
                let sortsub = await headerActivity.sub_activities.sort((a, b) => {
                    return a.step_id - b.step_id;
                });
                headerActivity.sub_activities = sortsub
                return headerActivity
            })
            let result = await Promise.all(mapHeaderSub)
            response.success(res, 'Success to get activities', result)
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to get activities')
        }
    },
    postActivity: async(req, res) => {
        try {
            let idLast = await getLastIdData(table.tb_r_header_activities, 'header_activity_id') + 1
            req.body.header_activity_id = idLast
            req.body.uuid = req.uuid()
            let subActivities = req.body.sub_activities
            let attrsUserInsert = await attrsUserInsertData(req, req.body)
            delete req.body.sub_activities;
            const headerActivityRes = await queryPOST(table.tb_r_header_activities, attrsUserInsert)
            let headerActivityId;
            headerActivityRes.rows.length > 0 ? headerActivityId = headerActivityRes.rows[0].header_activity_id : null;

            if (headerActivityId) {
                let mapDataSubWithHeaderId = await subActivities.map(async(subActivity, i) => {
                    let idLastSub = await getLastIdData(table.tb_r_sub_activities, 'sub_activity_id') + i + 1
                    let stepID = await uuidToId(table.tb_m_step, 'step_id', subActivity.step_id)
                    subActivity.step_id = stepID
                    subActivity.sub_activity_id = idLastSub
                    subActivity.uuid = req.uuid()
                    subActivity.header_activity_id = headerActivityId
                    return subActivity
                })

                let attrsUserSub = await attrsUserInsertData(req, Promise.all(mapDataSubWithHeaderId))
                const subData = await queryBulkPOST(table.tb_r_sub_activities, attrsUserSub)
                response.success(res, 'Success to add activity and sub', subData);
            }
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to add activity')
        }
    },
    editActivity: async(req, res) => {
        // cooming soon
    },
    deleteActivity: async(req, res) => {
        try {
            let obj = {
                deleted_dt: moment().format().split('+')[0].split('T').join(' '),
                deleted_by: req.user.fullname
            }
            let attrsUserUpdate = await attrsUserUpdateData(req, obj)
            const result = await queryPUT(table.tb_r_header_activities, attrsUserUpdate, `WHERE uuid = '${req.params.id}'`)
            response.success(res, 'Success to soft delete activity', result)
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to delete activity')
        }
    }
}