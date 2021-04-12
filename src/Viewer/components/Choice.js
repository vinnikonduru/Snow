import InlineComponent from './abstract/InlineComponent';

export default class Choice extends InlineComponent {
  static componentType = "choice";
  static rendererType = "container";

  static createPropertiesObject(args) {
    let properties = super.createPropertiesObject(args);
    properties.credit = { default: 0 };
    properties.feedbackCodes = { default: [] };
    properties.feedbackText = { default: null };

    return properties;
  }

  static returnChildLogic(args) {
    let childLogic = super.returnChildLogic(args);

    childLogic.newLeaf({
      name: "atLeastZeroChildren",
      componentType: '_base',
      comparison: 'atLeast',
      number: 0,
      setAsBase: true,
    });

    return childLogic;
  }


  static returnStateVariableDefinitions() {

    let stateVariableDefinitions = super.returnStateVariableDefinitions();

    stateVariableDefinitions.text = {
      public: true,
      componentType: this.componentType,
      returnDependencies: () => ({
        inlineChildren: {
          dependencyType: "child",
          childLogicName: "atLeastZeroChildren",
          variableNames: ["text"],
          variablesOptional: true
        }
      }),
      definition: function ({ dependencyValues }) {
        let text = "";
        for (let child of dependencyValues.inlineChildren) {
          if (typeof child.stateValues.text === "string") {
            text += child.stateValues.text;
          }
        }
        return { newValues: { text } }
      }
    }


    stateVariableDefinitions.selected = {
      defaultValue: false,
      public: true,
      componentType: "boolean",
      returnDependencies: () => ({
        countAmongSiblings: {
          dependencyType: "countAmongSiblingsOfSameType"
        },
        childIndicesSelected: {
          dependencyType: "parentStateVariable",
          variableName: "childIndicesSelected"
        }
      }),
      definition({ dependencyValues }) {

        let selected = dependencyValues.childIndicesSelected.includes(
          dependencyValues.countAmongSiblings - 1
        );

        return { newValues: { selected } }

      },
      inverseDefinition: function ({ desiredStateVariableValues }) {
        return {
          success: true,
          instructions: [{
            setStateVariable: "selected",
            value: desiredStateVariableValues.selected
          }]
        };
      }
    }


    stateVariableDefinitions.submitted = {
      defaultValue: false,
      public: true,
      componentType: "boolean",
      returnDependencies: () => ({}),
      definition: () => ({
        useEssentialOrDefaultValue: {
          submitted: {
            variablesToCheck: ["submitted"]
          }
        }
      }),
      inverseDefinition: function ({ desiredStateVariableValues }) {
        return {
          success: true,
          instructions: [{
            setStateVariable: "submitted",
            value: desiredStateVariableValues.submitted
          }]
        };
      }
    }


    stateVariableDefinitions.feedbacks = {
      public: true,
      componentType: "feedbacktext",
      isArray: true,
      entireArrayAtOnce: true,
      entryPrefixes: ['feedback'],
      returnDependencies: () => ({
        feedbackText: {
          dependencyType: "stateVariable",
          variableName: "feedbackText",
        },
        feedbackCodes: {
          dependencyType: "stateVariable",
          variableName: "feedbackCodes",
        },
        feedbackDefinitions: {
          dependencyType: "parentStateVariable",
          variableName: "feedbackDefinitions"
        },
        submitted: {
          dependencyType: "stateVariable",
          variableName: "submitted"
        }
      }),
      entireArrayDefinition({ dependencyValues }) {

        if (!dependencyValues.submitted) {
          return { newValues: { feedbacks: [] } }
        }

        let feedbacks = [];

        for (let feedbackCode of dependencyValues.feedbackCodes) {
          let code = feedbackCode.toLowerCase();
          for (let feedbackDefinition of dependencyValues.feedbackDefinitions) {
            if (code === feedbackDefinition.feedbackCode) {
              feedbacks.push(feedbackDefinition.feedbackText);
              break;  // just take first match
            }
          }
        }

        if (dependencyValues.feedbackText !== null) {
          feedbacks.push(dependencyValues.feedbackText);
        }

        return { newValues: { feedbacks } }

      }
    };

    stateVariableDefinitions.childrenToRender = {
      returnDependencies: () => ({
        activeChildren: {
          dependencyType: "child",
          childLogicName: "atLeastZeroChildren"
        }
      }),
      definition: function ({ dependencyValues }) {
        return {
          newValues:
            { childrenToRender: dependencyValues.activeChildren.map(x => x.componentName) }
        };
      }
    }

    return stateVariableDefinitions;
  }


  static includeBlankStringChildren = true;

  adapters = ["submitted"];

}