import User from '../models/user.model.js';

export const getUser = async (body) => {
    return User.findOne({ ...body})
};

export const createUser = async (body) => {
    const user = new User({...body});
    await user.save();
};
