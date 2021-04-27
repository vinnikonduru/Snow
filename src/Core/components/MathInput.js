import Input from './abstract/Input';
import me from 'math-expressions';
import { convertValueToMathExpression, latexToAst, textToAst } from '../utils/math';

export default class MathInput extends Input {
  constructor(args) {
    super(args);

    this.actions = {
      updateImmediateValue: this.updateImmediateValue.bind(
        new Proxy(this, this.readOnlyProxyHandler)
      ),
      updateValue: this.updateValue.bind(
        new Proxy(this, this.readOnlyProxyHandler)
      )
    };

    //Complex because the stateValues isn't defined until later
    Object.defineProperty(this.actions, 'submitAnswer', {
      get: function () {
        if (this.stateValues.answerAncestor !== null) {
          if (this.stateValues.answerAncestor.stateValues.submitAllAnswersAtAncestor !== null) {
            return () => this.coreFunctions.requestAction({
              componentName: this.stateValues.answerAncestor.stateValues.submitAllAnswersAtAncestor,
              actionName: "submitAllAnswers"
            })
          } else {
            return () => this.coreFunctions.requestAction({
              componentName: this.stateValues.answerAncestor.componentName,
              actionName: "submitAnswer"
            })
          }
        } else {
          return () => null
        }
      }.bind(this)
    });

  }
  static componentType = "mathInput";

  static variableForPlainMacro = "value";

  static get stateVariablesShadowedForReference() {
    return ["value"]
  };

  static createAttributesObject(args) {
    let attributes = super.createAttributesObject(args);
    attributes.prefill = {
      createComponentOfType: "text",
      createStateVariable: "prefill",
      defaultValue: "",
      public: true,
    };
    attributes.format = {
      createComponentOfType: "text",
      createStateVariable: "format",
      defaultValue: "text",
      public: true,
    };
    attributes.size = {
      createComponentOfType: "number",
      createStateVariable: "size",
      defaultValue: 10,
      forRenderer: true,
      public: true,
    };
    attributes.bindValueTo = {
      createComponentOfType: "math"
    };
    return attributes;
  }


  static returnStateVariableDefinitions() {

    let stateVariableDefinitions = super.returnStateVariableDefinitions();

    stateVariableDefinitions.value = {
      public: true,
      componentType: "math",
      forRenderer: true,
      returnDependencies: () => ({
        bindValueTo: {
          dependencyType: "attributeComponent",
          attributeName: "bindValueTo",
          variableNames: ["value", "valueForDisplay"],
        },
        prefill: {
          dependencyType: "stateVariable",
          variableName: "prefill"
        },
        format: {
          dependencyType: "stateVariable",
          variableName: "format"
        },
      }),
      definition: function ({ dependencyValues }) {
        if (!dependencyValues.bindValueTo) {
          return {
            useEssentialOrDefaultValue: {
              value: {
                variablesToCheck: "value",
                get defaultValue() {
                  return parseValueIntoMath({
                    inputString: dependencyValues.prefill,
                    format: dependencyValues.format
                  })
                }
              }
            }
          }
        }

        return { newValues: { value: dependencyValues.bindValueTo.stateValues.valueForDisplay } };
      },
      inverseDefinition: function ({ desiredStateVariableValues, dependencyValues }) {

        // console.log(`inverse definition of value for mathInput`)
        // console.log(desiredStateVariableValues)

        if (dependencyValues.bindValueTo) {
          return {
            success: true,
            instructions: [{
              setDependency: "bindValueTo",
              desiredValue: desiredStateVariableValues.value,
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

    stateVariableDefinitions.immediateValue = {
      public: true,
      componentType: "math",
      forRenderer: true,
      returnDependencies: () => ({
        value: {
          dependencyType: "stateVariable",
          variableName: "value"
        }
      }),
      definition: function ({ dependencyValues, changes }) {
        // console.log(`definition of immediateValue`)
        // console.log(dependencyValues)
        // console.log(changes);

        if (changes.value) {
          // only update to value when it changes
          // (otherwise, let its essential value change)
          return {
            newValues: { immediateValue: dependencyValues.value },
            makeEssential: ["immediateValue"]
          };


        } else {
          return {
            useEssentialOrDefaultValue: {
              immediateValue: {
                variablesToCheck: "immediateValue",
                defaultValue: dependencyValues.value
              }
            }
          }
        }

      },
      inverseDefinition: function ({ desiredStateVariableValues, initialChange, shadowedVariable }) {

        // value is essential; give it the desired value
        let instructions = [{
          setStateVariable: "immediateValue",
          value: desiredStateVariableValues.immediateValue
        }]


        // if from outside sources, also set value
        if (!(initialChange || shadowedVariable)) {
          instructions.push({
            setDependency: "value",
            desiredValue: desiredStateVariableValues.immediateValue
          })
        }

        return {
          success: true,
          instructions
        };
      }
    }

    stateVariableDefinitions.text = {
      public: true,
      componentType: "text",
      returnDependencies: () => ({
        value: {
          dependencyType: "stateVariable",
          variableName: "value"
        }
      }),
      definition: function ({ dependencyValues }) {
        return { newValues: { text: dependencyValues.value.toString() } }
      }
    }

    stateVariableDefinitions.componentType = {
      returnDependencies: () => ({}),
      definition: () => ({ newValues: { componentType: "math" } })
    }


    // stateVariableDefinitions.submittedValue = {
    //   defaultValue: me.fromAst('\uFF3F'),
    //   public: true,
    //   componentType: "math",
    //   returnDependencies: () => ({}),
    //   definition: () => ({
    //     useEssentialOrDefaultValue: {
    //       submittedValue: {
    //         variablesToCheck: ["submittedValue"]
    //       }
    //     }
    //   }),
    //   inverseDefinition: function ({ desiredStateVariableValues }) {
    //     return {
    //       success: true,
    //       instructions: [{
    //         setStateVariable: "submittedValue",
    //         value: desiredStateVariableValues.submittedValue
    //       }]
    //     };
    //   }
    // }


    return stateVariableDefinitions;

  }


  updateImmediateValue({ mathExpression }) {
    if (!this.stateValues.disabled) {
      // we set transient to true so that each keystroke does not
      // add a row to the database
      this.coreFunctions.requestUpdate({
        updateInstructions: [{
          updateType: "updateValue",
          componentName: this.componentName,
          stateVariable: "immediateValue",
          value: mathExpression,
        }],
        transient: true
      })
    }
  }

  updateValue() {
    if (!this.stateValues.disabled) {
      let updateInstructions = [{
        updateType: "updateValue",
        componentName: this.componentName,
        stateVariable: "value",
        value: this.stateValues.immediateValue,
      },
      // in case value ended up being a different value than requested
      // we set immediate value to whatever was the result
      // (hence the need to execute update first)
      // Also, this makes sure immediateValue is saved to the database,
      // since in updateImmediateValue, immediateValue is not saved to database
      {
        updateType: "executeUpdate"
      },
      {
        updateType: "updateValue",
        componentName: this.componentName,
        stateVariable: "immediateValue",
        valueOfStateVariable: "value",
      }];

      let event = {
        verb: "answered",
        object: {
          componentName: this.componentName,
          componentType: this.componentType,
        },
        result: {
          response: this.stateValues.immediateValue,
          responseText: this.stateValues.immediateValue.toString(),
        }
      }

      if (this.stateValues.answerAncestor) {
        event.context = {
          answerAncestor: this.stateValues.answerAncestor.componentName
        }
      }

      this.coreFunctions.requestUpdate({
        updateInstructions,
        event
      })

    }
  }

}


function parseValueIntoMath({ inputString, format }) {

  if (!inputString) {
    return me.fromAst('\uFF3F');
  }

  let expression;
  if (format === "latex") {
    try {
      expression = me.fromAst(latexToAst.convert(inputString));
    } catch (e) {
      console.warn(`Invalid latex for mathInput: ${inputString}`)
      expression = me.fromAst('\uFF3F');
    }
  } else if (format === "text") {
    try {
      expression = me.fromAst(textToAst.convert(inputString));
    } catch (e) {
      console.warn(`Invalid text for mathInput: ${inputString}`)
      expression = me.fromAst('\uFF3F');
    }
  }
  return expression;
}
