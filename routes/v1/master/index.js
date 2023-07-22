const router = require('express')()

const users = require('./users')

const companies = require('./companies')
const plants = require('./plants')

const shops = require('./shops')
const sections = require('./sections')
const lines = require('./lines')
const machines = require('./machines')

const groups = require('./groups')
const steps = require('./steps')

router.use('/companies', companies)
router.use('/plants', plants)

router.use('/shops', shops)
router.use('/sections', sections)
router.use('/lines', lines)
router.use('/machines', machines)

router.use('/users', users)

router.use('/groups', groups)

router.use('/steps', steps)


module.exports = router