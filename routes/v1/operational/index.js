const router = require('express')()
const qccActivity = require('./qccActivity')
const qccGroup = require('./qccGroup')
const dashboard = require('./dashboard')

router.use('/dashboard', dashboard);
router.use('/qccActivity', qccActivity);
router.use('/qccGroup', qccGroup);

module.exports = router