const router = require('express')()
const { getSteps, postStep, editStep, deleteStep } = require('../../../controllers/master/steps.controllers')
const auth = require('../../../helpers/auth')

router.put('/edit/:id', auth.verifyToken, editStep)
router.delete('/delete/:id', auth.verifyToken, deleteStep)
router.post('/add', auth.verifyToken, postStep)
router.get('/get', auth.verifyToken, getSteps)

module.exports = router