import Joi from "joi";

export const uservalidation = (req, res, next) => {
  const { userName, email, password, role } = req.body;
  const userInfo = {
    userName,
    email,
    password,
    role,
  };

  const schema = Joi.object({
    userName: Joi.string().alphanum().min(3).max(30).required(),

    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
      .required(),

    password: Joi.string()
      .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
      .required(),

    role: Joi.string().valid("user", "admin").default("user"),
  });

  const { error } = schema.validate(userInfo);
  if (error) {
    return res.status(501).json({ error: error.details[0].message });
  }
  next();
};
