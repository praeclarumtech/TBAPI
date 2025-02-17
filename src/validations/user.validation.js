const Joi = require('joi');

const skillSchema = Joi.object({
  name: Joi.string().min(3).required(),
  level: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
});

const validateSkill = (req, res, next) => {
  const { error } = skillSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = validateSkill;
