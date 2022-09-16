// Initializes the `grid` service on path `/grid`
const { Grid } = require('./grid.class');
const createModel = require('../../models/grid.model');
const hooks = require('./grid.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/grid', new Grid(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('grid');

  service.hooks(hooks);
};
