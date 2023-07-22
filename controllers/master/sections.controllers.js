const table = require('../../config/table')
const { queryPOST, queryPUT, queryGET } = require('../../helpers/query')

const response = require('../../helpers/response')
const getLastIdData = require('../../helpers/getLastIdData')
const uuidToId = require('../../helpers/uuidToId')
const idToUuid = require('../../helpers/idToUuid')
const attrsUserInsertData = require('../../helpers/addAttrsUserInsertData')
const attrsUserUpdateData = require('../../helpers/addAttrsUserUpdateData')
const condDataNotDeleted = `deleted_dt IS NULL`

const moment = require('moment')


module.exports = {
    getSections: async(req, res) => {
        try {
            let { id, isForm } = req.query
            let containerQuery = ''
            if (id && id != -1 && id != 'null') {
                let section_id = await uuidToId(table.tb_m_section, 'section_id', id)
                containerQuery += ` AND section_id = ${section_id}`
            }
            let cols = ['uuid as id', 'section_nm', 'created_by', 'created_dt']
                // if (isForm && isForm != -1 && isForm != 'null') {
                //     cols = ['uuid as id', 'section_nm', 'plant_id']
                //     let sections = await queryGET(table.tb_m_section, `WHERE ${condDataNotDeleted}${containerQuery}`, cols)
                //     console.log(sections);
                //     sections[0].plant_id = await idToUuid(table.tb_m_plants, 'plant_id', sections[0].plant_id)
                //     response.success(res, 'Success to get sections', sections)
                //     return;
                // }
            let sections = await queryGET(table.tb_m_section, `WHERE ${condDataNotDeleted}${containerQuery}`, cols)
            response.success(res, 'Success to get sections', sections)
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to get sections')
        }
    },
    postSection: async(req, res) => {
        try {
            let idLast = await getLastIdData(table.tb_m_section, 'section_id') + 1
            req.body.section_id = idLast
            req.body.uuid = req.uuid()
            let attrsUserInsert = await attrsUserInsertData(req, req.body)
            const result = await queryPOST(table.tb_m_section, attrsUserInsert)
            response.success(res, 'Success to add section', result)
        } catch (error) {
            console.log(error);
            response.failed(res, error)
        }
    },
    editSection: async(req, res) => {
        try {
            let id = await uuidToId(table.tb_m_section, 'section_id', req.params.id)
            console.log(req.body);
            const attrsUserUpdate = await attrsUserUpdateData(req, req.body)
            const result = await queryPUT(table.tb_m_section, attrsUserUpdate, `WHERE section_id = '${id}'`)
            response.success(res, 'Success to edit section', result)
        } catch (error) {
            console.log(error);
            response.failed(res, error)
        }
    },
    deleteSection: async(req, res) => {
        try {
            let obj = {
                deleted_dt: moment().format().split('+')[0].split('T').join(' '),
                deleted_by: req.user.fullname
            }
            let attrsUserUpdate = await attrsUserUpdateData(req, obj)
            const result = await queryPUT(table.tb_m_section, attrsUserUpdate, `WHERE uuid = '${req.params.id}'`)
            response.success(res, 'Success to soft delete section', result)
        } catch (error) {
            console.log(error);
            response.failed(res, error)
        }
    }

}