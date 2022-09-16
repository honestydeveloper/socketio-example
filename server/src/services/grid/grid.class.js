const { Service } = require('feathers-sequelize');

exports.Grid = class Grid extends Service {
    async find() {
        return await this.Model.findAll({
            raw: true
        });
    }
};
