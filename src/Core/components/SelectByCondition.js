import CompositeComponent from './abstract/CompositeComponent';
import { deepClone } from '../utils/deepFunctions';
import { processAssignNames } from '../utils/serializedStateProcessing';

export default class SelectByCondition extends CompositeComponent {
  static componentType = "selectByCondition";

  // assign name to else child
  // static assignNewNamespaceToAllChildrenExcept = ["case", ...Object.keys(this.createPropertiesObject({})).map(x => x.toLowerCase())];
  // static preserveOriginalNamesWhenAssignChildrenNewNamespace = true;
  // static passArrayAssignNamesToChildren = [["case", "else"]];

  static assignNamesToReplacements = true;

  // used when referencing this component without prop
  // static useChildrenForReference = false;
  // static get stateVariablesShadowedForReference() { return ["selectedIndices"] };

  static createPropertiesObject(args) {
    let properties = super.createPropertiesObject(args);
    properties.maximumNumberToSelect = { default: null };
    return properties;
  }

  static returnChildLogic(args) {
    let childLogic = super.returnChildLogic(args);

    let atLeastOneCase = childLogic.newLeaf({
      name: "atLeastOneCase",
      componentType: 'case',
      comparison: 'atLeast',
      number: 1,
    });

    let atMostOneElse = childLogic.newLeaf({
      name: "atMostOneElse",
      componentType: 'else',
      comparison: 'atMost',
      number: 1,
    });

    childLogic.newOperator({
      name: "casesAndElse",
      operator: "and",
      propositions: [atLeastOneCase, atMostOneElse],
      setAsBase: true,
    });

    return childLogic;
  }



  static returnStateVariableDefinitions() {

    let stateVariableDefinitions = super.returnStateVariableDefinitions();

    stateVariableDefinitions.nCases = {
      additionalStateVariablesDefined: ["caseChildren"],
      returnDependencies: () => ({
        caseChildren: {
          dependencyType: "child",
          childLogicName: "atLeastOneCase",
        },
      }),
      definition({ dependencyValues }) {
        return {
          newValues: {
            caseChildren: dependencyValues.caseChildren,
            nCases: dependencyValues.caseChildren.length
          }
        }
      }
    }

    stateVariableDefinitions.elseChild = {
      returnDependencies: () => ({
        elseChild: {
          dependencyType: "child",
          childLogicName: "atMostOneElse"
        },
      }),
      definition({ dependencyValues }) {
        let elseChild = null;
        if (dependencyValues.elseChild.length === 1) {
          elseChild = dependencyValues.elseChild[0]
        }
        return { newValues: { elseChild } };
      }
    }


    stateVariableDefinitions.selectedIndices = {
      returnDependencies: () => ({
        caseChildren: {
          dependencyType: "child",
          childLogicName: "atLeastOneCase",
          variableNames: ["conditionSatisfied"]
        },
        elseChild: {
          dependencyType: "stateVariable",
          variableName: "elseChild"
        },
        maximumNumberToSelect: {
          dependencyType: "stateVariable",
          variableName: "maximumNumberToSelect"
        }
      }),
      definition({ dependencyValues }) {
        let selectedIndices = [];
        for (let [ind, child] of dependencyValues.caseChildren.entries()) {
          if (child.stateValues.conditionSatisfied) {
            selectedIndices.push(ind);
          }
        }
        if (selectedIndices.length === 0 && dependencyValues.elseChild) {
          selectedIndices.push(dependencyValues.caseChildren.length);
        }

        if (dependencyValues.maximumNumberToSelect !== null && selectedIndices.length > dependencyValues.maximumNumberToSelect) {
          let maxnum = Math.max(0, Math.floor(dependencyValues.maximumNumberToSelect));
          selectedIndices = selectedIndices.slice(0, maxnum)
        }

        return {
          newValues: {
            selectedIndices,
          }
        };
      }
    }

    stateVariableDefinitions.readyToExpand = {
      returnDependencies: () => ({
        selectedIndices: {
          dependencyType: "stateVariable",
          variableName: "selectedIndices"
        }
      }),
      definition() {
        return {
          newValues: { readyToExpand: true }
        }
      }
    }

    stateVariableDefinitions.needsReplacementsUpdatedWhenStale = {
      returnDependencies: () => ({
        selectedIndices: {
          dependencyType: "stateVariable",
          variableName: "selectedIndices"
        }
      }),
      // the whole point of this state variable is to return updateReplacements
      // on mark stale
      markStale: () => ({ updateReplacements: true }),
      definition: () => ({ newValues: { needsReplacementsUpdatedWhenStale: true } })
    }



    return stateVariableDefinitions;
  }

  static createSerializedReplacements({ component, components, workspace, componentInfoObjects }) {

    let replacements = this.getReplacements(component, components, componentInfoObjects);

    // evaluate needsReplacementsUpdatedWhenStale to make it fresh
    component.stateValues.needsReplacementsUpdatedWhenStale;

    workspace.previousSelectedIndices = [...component.stateValues.selectedIndices];

    // console.log(`replacements for ${component.componentName}`)
    // console.log(JSON.parse(JSON.stringify(replacements)));
    // console.log(replacements);

    return { replacements };

  }

  static getReplacements(component, components, componentInfoObjects) {

    let replacements = [];

    for (let selectedIndex of component.stateValues.selectedIndices) {

      let selectedChildName, selectedGroupIdentity = {};
      if (selectedIndex < component.stateValues.nCases) {
        selectedChildName = component.stateValues.caseChildren[selectedIndex].componentName;
        selectedGroupIdentity.componentType = "result";
        selectedGroupIdentity.componentName = components[selectedChildName].stateValues.resultChild.componentName;

      } else {
        selectedChildName = selectedGroupIdentity.componentName = component.stateValues.elseChild.componentName;
        selectedGroupIdentity.componentType = "else";
      }
      // use state, not stateValues, as read only proxy messes up internal
      // links between descendant variant components and the components themselves

      let serializedGrandchildren = deepClone(components[selectedChildName].state.serializedChildren.value);
      let serializedChild = {
        componentType: selectedGroupIdentity.componentType,
        state: { rendered: true },
        doenetAttributes: Object.assign({}, components[selectedGroupIdentity.componentName].doenetAttributes),
        children: serializedGrandchildren,
        originalName: selectedGroupIdentity.componentName,
      }


      if (component.stateValues.hide) {
        // if select is hidden, then make each of its replacements hidden
        if (!serializedChild.state) {
          serializedChild.state = {};
        }

        serializedChild.state.hide = true;

        // // if assigning names to grandchild, then hide those as well
        // // so that refs of those will be hidden, for consistency
        // if (Array.isArray(name)) {
        //   if (serializedChild.children) {
        //     for (let grandchild of serializedChild.children) {
        //       if (!grandchild.state) {
        //         grandchild.state = {};
        //       }
        //       grandchild.state.hide = true;
        //     }
        //   }
        // }
      }

      replacements.push(serializedChild);
    }

    let processResult = processAssignNames({
      assignNames: component.doenetAttributes.assignNames,
      serializedComponents: replacements,
      parentName: component.componentName,
      parentCreatesNewNamespace: component.doenetAttributes.newNamespace,
      componentInfoObjects,
    });


    return processResult.serializedComponents;

  }

  static calculateReplacementChanges({ component, componentChanges, components, workspace, componentInfoObjects }) {

    // console.log(`calculate replacement changes for selectByCondition`)
    // console.log(workspace.previousSelectedIndices);
    // console.log(component.stateValues.selectedIndices);

    // evaluate needsReplacementsUpdatedWhenStale to make it fresh
    component.stateValues.needsReplacementsUpdatedWhenStale;

    if (workspace.previousSelectedIndices.length === component.stateValues.selectedIndices.length
      && workspace.previousSelectedIndices.every((v, i) => v === component.stateValues.selectedIndices[i])
    ) {
      return [];
    }


    // delete previous replacements and create new ones
    // TODO: could we find a way to withhold old ones?
    // Either change order of replacements or allow to withhold latter replacements

    let replacementChanges = [];

    let replacements = this.getReplacements(component, components, componentInfoObjects);

    let replacementInstruction = {
      changeType: "add",
      changeTopLevelReplacements: true,
      firstReplacementInd: 0,
      numberReplacementsToReplace: component.replacements.length,
      serializedReplacements: replacements,
      replacementsToWithhold: 0,
    };

    replacementChanges.push(replacementInstruction);

    workspace.previousSelectedIndices = [...component.stateValues.selectedIndices];

    console.log(`replacementChanges for if ${component.componentName}`);
    console.log(replacementChanges);
    return replacementChanges;

    // let replacementChanges = processChangesForReplacements({
    //   componentChanges: componentChanges,
    //   componentName: component.componentName,
    //   downstreamDependencies: component.downstreamDependencies,
    //   components
    // })
    // // console.log(`replacementChanges for group ${component.componentName}`);
    // // console.log(replacementChanges);
    // return replacementChanges;
  }

}
