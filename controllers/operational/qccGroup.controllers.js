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
    getQccGroups: async(req, res) => {
        try {
            let whereCond = `WHERE trqg.${condDataNotDeleted}`
            let { id, activity_id, line_id } = req.query
            id && id != "-1" && id != 'null' ?
                whereCond += ` AND header_activity_id = ${await uuidToId(table.tb_r_header_activities, 'header_activity_id', activity_id)}` :
                null;
            console.log(req.query);
            line_id && line_id != "-1" && line_id != 'null' ?
                whereCond += ` AND tml.line_id = ${line_id.length < 20 ? line_id : await uuidToId(table.tb_m_lines, 'line_id', line_id)}` : null;
            let q = `SELECT 
            trqg.*,
            trgt.group_theme_id,
            trgt.theme_nm,
            tml.line_nm,
            tmg.group_nm
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
            console.log(qccGroups.rows);
            const mapQccGroupMembers = await qccGroups.rows.map(async gccGroup => {
                gccGroup.members = await queryGET(table.tb_r_group_members, `WHERE qcc_group_id = ${gccGroup.qcc_group_id}`)
                return gccGroup
            })
            const result = await Promise.all(mapQccGroupMembers)
            response.success(res, 'Success to get qcc groups', result)
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to get qcc groups')
        }
    },
    getQccGroupsSubActivities: async(req, res) => {
        try {
            let q = `
            SELECT 
                trsga.*,
                trsa.step_id,
                tms.step_nm
            FROM tb_r_sub_group_activities trsga
            JOIN tb_r_sub_activities trsa
                ON trsa.sub_activity_id = trsga.sub_activity_id
            JOIN tb_m_step tms
                ON tms.step_id = trsa.step_id
            WHERE trsga.group_theme_id = ${req.query.group_theme_id}
            AND trsga.${condDataNotDeleted}
            `
            let groupSubActivities = await queryCustom(q)
            let mapDocsActivities = await groupSubActivities.rows.map(async item => {
                let docsFilesActivity = await queryGET(table.tb_r_sub_activity_docs, `WHERE sub_group_activity_id = ${item.sub_group_activity_id}`)
                    // item.docs_file = process.env.APP_HOST + '/file?path=' + docsFilesActivity.docs_path
                item.docs_file = await docsFilesActivity.map(itm => {
                    itm.docs_path = process.env.APP_HOST + '/file?path=' + itm.docs_path
                    return itm
                })
                return item;
            })
            const waitingFetchFile = await Promise.all(mapDocsActivities)
            console.log(waitingFetchFile);
            response.success(res, 'Success to get qcc groups sub activities', waitingFetchFile)
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to get qcc groups sub activities')
        }
    },
    postGroupActivity: async(req, res) => {
        try {
            console.log('REQ FILESSSS');
            console.log(req.files);
            let { is_edit } = req.query
            let { sub_group_activity_id, step_id } = req.body
            if (req.files.length > 0) {
                let idLastDoc = await getLastIdData(table.tb_r_sub_activity_docs, 'doc_id') + 1
                let mapDocs = await req.files.map((file, i) => {
                        return {
                            doc_id: idLastDoc + i,
                            uuid: req.uuid(),
                            step_id,
                            sub_group_activity_id,
                            docs_path: file.path
                        }
                    })
                    // ADD FILE
                const subActivityDocs = await queryBulkPOST(table.tb_r_sub_activity_docs, mapDocs)
                let updateAttrsUpdate = await attrsUserUpdateData(req, { is_submitted: true })
                await queryPUT(table.tb_r_sub_group_activities, updateAttrsUpdate, `WHERE sub_group_activity_id = ${sub_group_activity_id}`)
                response.success(res, 'Success to post Group Docs Activity', subActivityDocs)
                    // let isFileExist = docs.length > 0
                    // if (isFileExist) {
                    //     // for (let i = 0; i < isFileExist.length; i++) {
                    //         // const element = isFileExist[i].docs_path;
                    //         // fs.unlink(element, function(err) {
                    //         //     console.log(err);
                    //         // })
                    //     // }
                    // }
                    // console.log(req.file);
                    // req.body.docs_file = `./${req.file.path}`
            }
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to post Group Docs Activity')
        }
    },
    postQccGroup: async(req, res) => {
        try {
            let idLastQccGroup = await getLastIdData(table.tb_r_qcc_groups, 'qcc_group_id') + 1
            req.body.qcc_group_id = idLastQccGroup
            let header_activity_id = await uuidToId(table.tb_r_header_activities, 'header_activity_id', req.query.activity_id)
            let line_id = await uuidToId(table.tb_m_lines, 'line_id', req.body.line_id)
            req.body.line_id = line_id
            let group_id = await uuidToId(table.tb_m_groups, 'group_id', req.body.group_id)
            req.body.group_id = group_id
            let theme_nm = req.body.theme_nm
            let members = req.body.members

            delete req.body.theme_nm
            delete req.body.members
            req.body.uuid = req.uuid()

            // INSERT TO TB QCC GROUPS
            const attrsUserInsertGroup = await attrsUserInsertData(req, req.body)
            const qccGroup = await queryPOST(table.tb_r_qcc_groups, attrsUserInsertGroup)


            // GET qcc_group_id AND INSERT TO TB GROUP MEMBERS
            let idLastMember = await getLastIdData(table.tb_r_group_members, 'member_group_id') + 1
            let mapMemberGroup = await members.map((member, i) => {
                return {
                    member_group_id: idLastMember + i,
                    uuid: req.uuid(),
                    qcc_group_id: idLastQccGroup,
                    member_nm: member
                }
            })
            const attrsUserInsertMember = await attrsUserInsertData(req, mapMemberGroup);
            const qccMemberGroup = await queryBulkPOST(table.tb_r_group_members, attrsUserInsertMember);
            // console.log(qccMemberGroup);

            // GET header_activity_id AND INSERT TO TB GROUP THEMES
            let idLastGroupTheme = await getLastIdData(table.tb_r_group_themes, 'group_theme_id') + 1
            let objGroupTheme = {
                group_theme_id: idLastGroupTheme,
                header_activity_id,
                qcc_group_id: idLastQccGroup,
                uuid: req.uuid(),
                theme_nm
            }
            const attrsUserInsertTheme = await attrsUserInsertData(req, objGroupTheme)
            const groupTheme = await queryPOST(table.tb_r_group_themes, attrsUserInsertTheme)
                // console.log(groupTheme);

            // GET header_activity_id AND GET sub_activities WHERE header_activity_id AND INSERT TB SUB GROUPS ACTIVITIES
            const subQccGroups = await queryGET(table.tb_r_sub_activities, `WHERE header_activity_id = '${header_activity_id}' AND ${condDataNotDeleted}`)
                // console.log(subQccGroups);
            const idLastSubQccGroups = await getLastIdData(table.tb_r_sub_group_activities, 'sub_group_activity_id') + 1
            let mapSubQccGroup = await subQccGroups.map((subActivityGroup, i) => {
                return {
                    sub_group_activity_id: idLastSubQccGroups + i,
                    group_theme_id: idLastGroupTheme,
                    uuid: req.uuid(),
                    sub_activity_id: subActivityGroup.sub_activity_id
                }
            })
            const attrsUserInsertSubQccGroup = await attrsUserInsertData(req, mapSubQccGroup);
            const subQccGroup = await queryBulkPOST(table.tb_r_sub_group_activities, attrsUserInsertSubQccGroup)
            response.success(res, 'Success to add group QCC', subQccGroup)
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to add group QCC')
        }
    },
    editQccGroup: async(req, res) => {
        // cooming soon
    },
    deleteQccGroup: async(req, res) => {
        try {
            let obj = {
                deleted_dt: moment().format().split('+')[0].split('T').join(' '),
                deleted_by: req.user.fullname
            }
            let attrsUserUpdate = await attrsUserUpdateData(req, obj)
            const result = await queryPUT(table.tb_r_qcc_groups, attrsUserUpdate, `WHERE uuid = '${req.params.id}'`)
            response.success(res, 'Success to soft delete group QCC', result)
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to delete group QCC')
        }
    }
}