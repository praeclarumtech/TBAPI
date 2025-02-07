const createValidator = require("express-joi-validation").createValidator; 

const validator = createValidator({ passError: true });

module.exports = validator; 
