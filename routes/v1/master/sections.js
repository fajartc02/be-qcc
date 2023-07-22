const router = require('express')()
const { getSections, postSection, editSection, deleteSection } = require('../../../controllers/master/sections.controllers')
const auth = require('../../../helpers/auth')

router.put('/edit/:id', auth.verifyToken, editSection)
router.delete('/delete/:id', auth.verifyToken, deleteSection)
router.post('/', auth.verifyToken, postSection)
router.get('/', auth.verifyToken, getSections)

module.exports = router