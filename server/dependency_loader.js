'use strict';

const _ = require('lodash');
let DependencyController = require('../dependency');
let dependencySchema = require('../schema/service_dependency').getServiceDependencySchemas();
const jsonValidator = require('jsonschema').Validator;
let schemaValidator = new jsonValidator();
const ErrorTypes = require('../error');
var Logger = require('../logging/standard_logger');
var Error = require('../error');
const RPC_CONSTANTS = require('../constants');
const UCError = Error.UCError;
let dependencyLoader = {};
let Promise = require('bluebird');

function validateDependencySchema(dependencyConfig, dependencySchema, dependencyType) {
  let schemaValidationResult = schemaValidator.validate(dependencyConfig, dependencySchema);
  if (!schemaValidationResult.valid) {
    console.log(`Dependency type: ${dependencyType} schema validation failed with these errors ${schemaValidationResult.errors}`)
    throw new UCError({err_type: Error.RPC_INTERNAL_SERVER_ERROR, err_message: 
      `Dependency type: ${dependencyType} schema validation failed with these errors ${schemaValidationResult.errors}`
    })
  }
}

async function load(dependencyType, dependencyConfig, RPCFramework) {
  let schema = _.get(dependencySchema, dependencyType)
  if (!schema) {
    console.log(`Dependency type: ${dependencyType} does not exists in schema repo`)
    throw new UCError({err_type: Error.RPC_INTERNAL_SERVER_ERROR, err_message: 
      `Dependency type: ${dependencyType} does not exists in schema repo`
    })
  }
  validateDependencySchema(dependencyConfig, schema, dependencyType)

  if (RPC_CONSTANTS.DEPENDENCY.TYPE.OPTIONS == dependencyType) {
    if (dependencyConfig[RPC_CONSTANTS.ENABLE_ASYNC_API_QUEUE] === true) {
      await DependencyController[RPC_CONSTANTS.DEPENDENCY.TYPE.EVENT_PRODUCER]({id: RPC_CONSTANTS.DEPENDENCY.ID.event_producer}, RPCFramework);
    }
    // no need to invoke dependency controller in case of options otherwise
    return;
  }

  if (!_.get(DependencyController, dependencyType)) {
    console.log(`Dependency type: ${dependencyType} is invalid. Check spelling or get the mapping created if this is a new dependency`)
    throw new UCError({err_type: Error.RPC_INTERNAL_SERVER_ERROR, err_message: 
      `Dependency type: ${dependencyType} is invalid. Check spelling or get the mapping created if this is a new dependency`
    })
  }

  await DependencyController[dependencyType](dependencyConfig, RPCFramework)
}

dependencyLoader.init = async (RPCFramework, dependencies) => {
  for (let type of Object.keys(dependencies)) {
    let dependencyValues = dependencies[type];
    if (dependencyValues instanceof Array) {
      for (let value of dependencyValues) {
        await load(type, value, RPCFramework)
      }
    } else {
      await load(type, dependencyValues, RPCFramework)
    }
  } 
};

module.exports = dependencyLoader;
