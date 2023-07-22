const router = require('express')()
const { getQccGroups, getQccGroupsSubActivities, postGroupActivity, postQccGroup, editQccGroup, deleteQccGroup } = require('../../../controllers/operational/qccGroup.controllers')
const auth = require('../../../helpers/auth')
const upload = require('../../../helpers/upload')

router.put('/edit/:id', auth.verifyToken, editQccGroup)
router.delete('/delete/:id', auth.verifyToken, deleteQccGroup)
router.post('/add', auth.verifyToken, postQccGroup)
router.get('/get', auth.verifyToken, getQccGroups)
router.get('/subActivities/get', auth.verifyToken, getQccGroupsSubActivities)
router.post('/subActivities/add', auth.verifyToken, upload.array('docs'), postGroupActivity);

module.exports = router