const router = require('express')()
const { getActivities, postActivity, editActivity, deleteActivity } = require('../../../controllers/operational/qccActivity.controllers')
const auth = require('../../../helpers/auth')

router.put('/edit/:id', auth.verifyToken, editActivity)
router.delete('/delete/:id', auth.verifyToken, deleteActivity)
router.post('/add', auth.verifyToken, postActivity)
router.get('/get', auth.verifyToken, getActivities)

module.exports = router