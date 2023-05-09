import { createHmac } from 'crypto'
import {check} from 'express-validator'

// password encryption
export const encryptPassword = (req,_,next) => {
    const hmac = createHmac('sha512', req.body.password)
    req.body.password = hmac.digest('hex')
    next()
}

export const validateUserEmail = 
    check('mail')
    .isEmail()
    .withMessage('Invalid email address')


    export const validateUserPassword = check('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:<,.>]).+$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
