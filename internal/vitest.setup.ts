import '@testing-library/jest-dom/vitest';
import mockServer, { baseURL } from './mockServer';
import './vitest.setup.mock';

process.env.NODE_BASE_URL = baseURL;
beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());
