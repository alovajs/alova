import { Mock, MockWrapper } from '~/typings';

/**
 * Define simulation data
 * @param mock Simulated data collection, which can be a function or data. If it is a function, it will receive a parameter containing three attributes: query, params, and data, which represent query parameters, path parameters, and request body data respectively.
 * @param enable Whether to use this simulation data collection, the default is true
 */
export default (mock: Mock, enable = true): MockWrapper => ({
  enable,
  data: mock
});
