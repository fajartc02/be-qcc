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
    getSteps: async(req, res) => {
        try {
            let { id, isForm } = req.query
            let containerQuery = ''
            if (id && id != -1 && id != 'null') {
                let step_id = await uuidToId(table.tb_m_step, 'step_id', id)
                containerQuery += ` AND step_id = ${step_id}`
            }
            let cols = ['step_id', 'uuid as id', 'step_nm', 'created_by', 'created_dt']
                // if (isForm && isForm != -1 && isForm != 'null') {
                //     cols = ['uuid as id', 'step_nm', 'plant_id']
                //     let steps = await queryGET(table.tb_m_step, `WHERE ${condDataNotDeleted}${containerQuery}`, cols)
                //     console.log(steps);
                //     steps[0].plant_id = await idToUuid(table.tb_m_plants, 'plant_id', steps[0].plant_id)
                //     response.success(res, 'Success to get steps', steps)
                //     return;
                // }
            let steps = await queryGET(table.tb_m_step, `WHERE ${condDataNotDeleted}${containerQuery} ORDER BY step_id ASC`, cols)
            response.success(res, 'Success to get steps', steps)
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to get steps')
        }
    },
    postStep: async(req, res) => {
        try {
            let idLast = await getLastIdData(table.tb_m_step, 'step_id') + 1
            req.body.step_id = idLast
            req.body.uuid = req.uuid()
            let attrsUserInsert = await attrsUserInsertData(req, req.body)
            const result = await queryPOST(table.tb_m_step, attrsUserInsert)
            response.success(res, 'Success to add step', result)
        } catch (error) {
            console.log(error);
            response.failed(res, error)
        }
    },
    editStep: async(req, res) => {
        try {
            let id = await uuidToId(table.tb_m_step, 'step_id', req.params.id)
            console.log(req.body);
            const attrsUserUpdate = await attrsUserUpdateData(req, req.body)
            const result = await queryPUT(table.tb_m_step, attrsUserUpdate, `WHERE step_id = '${id}'`)
            response.success(res, 'Success to edit step', result)
        } catch (error) {
            console.log(error);
            response.failed(res, error)
        }
    },
    deleteStep: async(req, res) => {
        try {
            let obj = {
                deleted_dt: moment().format().split('+')[0].split('T').join(' '),
                deleted_by: req.user.fullname
            }
            let attrsUserUpdate = await attrsUserUpdateData(req, obj)
            const result = await queryPUT(table.tb_m_step, attrsUserUpdate, `WHERE uuid = '${req.params.id}'`)
            response.success(res, 'Success to soft delete step', result)
        } catch (error) {
            console.log(error);
            response.failed(res, error)
        }
    }
}