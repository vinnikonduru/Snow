import Text from '../Text';

export default class TextFromSingleStringChild extends Text {
  static componentType = "_textfromsinglestringchild";

  static returnChildLogic(args) {
    let childLogic = super.returnChildLogic(args);

    childLogic.deleteAllLogic();

    childLogic.newLeaf({
      name: "atMostOneString",
      componentType: 'string',
      comparison: 'atMost',
      number: 1,
      excludeCompositeReplacements: true,
      setAsBase: true,
    });

    return childLogic;
  }


  static returnStateVariableDefinitions() {

    let stateVariableDefinitions = super.returnStateVariableDefinitions();

    stateVariableDefinitions.value = {
      public: true,
      componentType: this.componentType,
      returnDependencies: () => ({
        stringChild: {
          dependencyType: "child",
          childLogicName: "atMostOneString",
          variableNames: ["value"],
        },
      }),
      defaultValue: "",
      definition: function ({ dependencyValues }) {
        if (dependencyValues.stringChild.length === 0) {
          return {
            useEssentialOrDefaultValue: {
              value: { variablesToCheck: "value" }
            }
          }
        }
        let value = dependencyValues.stringChild[0].stateValues.value
        return { newValues: { value } };
      },
      inverseDefinition: function ({ desiredStateVariableValues, dependencyValues }) {
        if (dependencyValues.stringChild.length === 1) {
          return {
            success: true,
            instructions: [{
              setDependency: "stringChild",
              desiredValue: desiredStateVariableValues.value,
              childIndex: 0,
              variableIndex: 0,
            }]
          };
        }
        // no children, so value is essential and give it the desired value
        return {
          success: true,
          instructions: [{
            setStateVariable: "value",
            value: desiredStateVariableValues.value
          }]
        };
      }
    }

    return stateVariableDefinitions;

  }

}