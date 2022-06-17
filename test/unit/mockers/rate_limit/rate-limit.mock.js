const Singleton = require('../../../../singleton');
const RateLimitResources = require('../../resources/rate-limit.test.data');
jest.mock("lru-cache");
const LRU = require("lru-cache");
jest.spyOn(Singleton, 'getSingleton').mockImplementation(() => {
  let singletonMock = {
    Config : {
      'SERVICE_ID': 'logging-service',
      getExternalConf: jest.fn().mockImplementation((params) => {
        return {
          uri: 'test',
          port: 1111
        }
      })
    },
    Logger: {
      error: jest.fn(),
      info: jest.fn()
    },
    RateLimitPolicy: RateLimitResources.testRateLimitPoliciesAPILevel
  }
  return singletonMock;
});

LRU.mockImplementation((params) => {
  return {
    get: jest.fn().mockImplementation((params) => {
      switch(params) {
        case 'success':
          return {
            timestamp: Date.now(),
            tokenCount: 10
          };
        case 'zeroTokenCount': {
          return {
            timestamp: Date.now(),
            tokenCount: 0
          };
        }
        default:
          return undefined;
      }
    }),
    set: jest.fn()
  };
})

jest.spyOn(require('../../../../common/infra-util'), 'getContainerCount').mockImplementation(() => {
  return 3;
});