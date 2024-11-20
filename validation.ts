import { Context, Next } from "@oak/oak";
import Joi, { ObjectSchema } from 'npm:joi';

export const createBookSchema = Joi.object({
    title: Joi.string().required(),
    author: Joi.string().required(),
    description: Joi.string().required()
});

export const updateBookSchema = Joi.object({
    title: Joi.string().optional(),
    author: Joi.string().optional(),
    description: Joi.string().optional()
}).or('title', 'author', 'description');

export const validate = (schema: ObjectSchema) =>
    async (context: Context, next: Next) => {
        const body = await context.request.body.json();
        const { error } = schema.validate(body, { abortEarly: false });

        if (error) {
            context.response.status = 400;
            context.response.body = {
                errors: error.details.map(d => d.message)
            };
        } else {
            await next();
        }
    };