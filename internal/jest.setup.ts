import './jest.setup.mock';

import mockServer, { baseURL } from './mockServer';
process.env.NODE_BASE_URL = baseURL;
beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());
