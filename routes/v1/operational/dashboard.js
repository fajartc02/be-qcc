const router = require('express')()
const { getDashboard } = require('../../../controllers/operational/qccActivity.controllers')
const auth = require('../../../helpers/auth')

router.get('/get', auth.verifyToken, getDashboard)

module.exports = router