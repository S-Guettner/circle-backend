import Joi from 'joi'

export async function validateRegisterData(req, res, next) {
    const schema = Joi.object({
        email: Joi.string()
            .email({ minDomainSegments: 2 }),
        password: Joi.string()
            .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
        repeat_password: Joi.ref('password')
    })
    try {
        const value = await schema.validateAsync({ email: req.body.mail, password: req.body.password, repeat_password: req.body.confirmPassword })
        next()
    } catch (err) {
        if (err.details[0].type === 'string.empty' && err.details[0].context.key === 'email') {
            res.status(400).json({ msg: 'Email is required', key: 'email' })
        } else if (err.details[0].type === 'string.email' && err.details[0].context.key === 'email') {
            res.status(400).json({ msg: 'Invalid email format', key: 'email' })
        } else if (err.details[0].type === 'string.empty' && err.details[0].context.key === 'password') {
            res.status(400).json({ msg: 'Password is required', key: 'password' })
        } else if (err.details[0].type === 'string.pattern.base' && err.details[0].context.key === 'password') {
            res.status(400).json({ msg: 'Password do not match the required pattern. /^[a-zA-Z0-9]{3,30}$/', key: 'password' })
        } else if (err.details[0].context.value === '' && err.details[0].context.key === 'repeat_password') {
            res.status(400).json({ msg: 'Confirm password', key: 'confirmPassword' })
        } else if (err.details[0].type === 'any.only' && err.details[0].context.key === 'repeat_password') {
            res.status(400).json({ msg: 'Passwords do not match', key: 'noMatch' })
        } else {
            res.status(400).json({ msg: 'Something went wrong', key: 'Unexpected error' })
        }
    }
}