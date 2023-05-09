import { createHmac } from 'crypto'
import {check} from 'express-validator'

// password encryption
export const encryptPassword = (req,_,next) => {
    const hmac = createHmac('sha512', req.body.password)
    req.body.password = hmac.digest('hex')
    next()
}

