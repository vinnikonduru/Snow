import { processAssignNames } from '../utils/serializedStateProcessing';
import CompositeComponent from './abstract/CompositeComponent';

export default class Empty extends CompositeComponent {
  static componentType = "empty";

  static assignNamesToReplacements = true;

  static createPropertiesObject() {
    return {};
  }

  static returnChildLogic(args) {
    let childLogic = super.returnChildLogic(args);

    childLogic.newLeaf({
      name: "anything",
      componentType: '_base',
      comparison: "atLeast",
      number: 0,
      setAsBase: true,
    });

    return childLogic;

  }


  static createSerializedReplacements({ component, componentInfoObjects }) {

    let assignNames = component.doenetAttributes.assignNames;

    if (assignNames === undefined) {
      return { replacements: [] };
    }

    // if empty has assignNames, then processAssignNames
    // will create additional empties for each name that must be assigned
    let processResult = processAssignNames({
      assignNames,
      serializedComponents: [],
      parentName: component.componentName,
      parentCreatesNewNamespace: component.doenetAttributes.newNamespace,
      componentInfoObjects,
    })

    return { replacements: processResult.serializedComponents };

  }


  static returnStateVariableDefinitions() {

    let stateVariableDefinitions = super.returnStateVariableDefinitions();

    stateVariableDefinitions.readyToExpand = {
      returnDependencies: () => ({}),
      definition: () => ({ newValues: { readyToExpand: true } }),
    };

    return stateVariableDefinitions;

  }

}
